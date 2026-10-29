<!-- src/components/ProductPreviewDialog.vue -->
<template>
  <q-dialog v-model="isVisible" persistent>
    <q-card>
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">产品详情预览</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup @click="closeDialog" />
      </q-card-section>

      <q-separator />

      <q-card-section class="scroll" style="height: calc(95vh - 120px);">
        <q-inner-loading :showing="loading">
          <q-spinner size="50px" color="primary" />
        </q-inner-loading>

        <div v-if="!loading && productData" class="row q-col-gutter-md">
          <!-- 基本信息部分 -->
          <div class="col-12">
            <div class="text-subtitle1 text-weight-bold">基本信息</div>
            <q-separator class="q-mb-sm" />
          </div>

          <!-- 产品主图 -->
          <div class="col-12 col-md-4">
            <q-img :src="productData.main_image" :alt="productData.name" spinner-color="primary" fit="contain"
              style="max-height: 300px">
              <template v-slot:error>
                <div class="absolute-full flex flex-center bg-grey-3 text-grey-7">
                  无图片
                </div>
              </template>
            </q-img>
          </div>

          <!-- 产品信息 -->
          <div class="col-12 col-md-8 q-pt-xl">
            <div class="row q-col-gutter-sm q-mb-sm">
              <div class="col-4 text-right text-weight-bold">产品名称:</div>
              <div class="col-8">{{ productData.name }}</div>
            </div>

            <div class="row q-col-gutter-sm q-mb-sm">
              <div class="col-4 text-right text-weight-bold">产品编码:</div>
              <div class="col-8">{{ productData.code }}</div>
            </div>

            <div class="row q-col-gutter-sm q-mb-sm">
              <div class="col-4 text-right text-weight-bold">所属分类:</div>
              <div class="col-8">{{ productData.category_name }}</div>
            </div>

            <div class="row q-col-gutter-sm q-mb-sm">
              <div class="col-4 text-right text-weight-bold">状态:</div>
              <div class="col-8">
                <q-badge :color="productData.is_active ? 'positive' : 'negative'">
                  {{ productData.is_active ? '激活' : '未激活' }}
                </q-badge>
              </div>
            </div>

            <div class="row q-col-gutter-sm q-mb-sm">
              <div class="col-4 text-right text-weight-bold">创建时间:</div>
              <div class="col-8">{{ formatDate(productData.created_at) }}</div>
            </div>

            <div class="row q-col-gutter-sm q-mb-sm">
              <div class="col-4 text-right text-weight-bold">更新时间:</div>
              <div class="col-8">{{ formatDate(productData.updated_at) }}</div>
            </div>

            <div class="row q-col-gutter-sm q-mb-sm">
              <div class="col-4 text-right text-weight-bold">产品描述:</div>
              <div class="col-8">{{ productData.description || '-' }}</div>
            </div>
          </div>

          <!-- SKU信息部分 -->
          <div class="col-12 q-mt-lg">
            <div class="text-subtitle1 text-weight-bold">SKU信息</div>
            <q-separator class="q-mb-sm" />
          </div>

          <div class="col-12">
            <q-table :rows="productData.skus" :columns="skuColumns" row-key="id" flat bordered wrap-cells
              :pagination="{ rowsPerPage: 0 }">
              <template v-slot:body-cell-image="props">
                <q-td :props="props">
                  <q-img :src="props.row.image" spinner-color="primary" style="max-height: 50px; max-width: 50px">
                    <template v-slot:error>
                      <div class="flex flex-center bg-grey-3 text-grey-7" style="width: 50px; height: 50px">
                        无图片
                      </div>
                    </template>
                  </q-img>
                </q-td>
              </template>

              <template v-slot:body-cell-location_mapping="props">
                <q-td :props="props">
                  <div v-if="props.row.location_mapping && props.row.location_mapping.length">
                    <div v-for="mapping in props.row.location_mapping" :key="mapping.id" class="q-mb-xs">
                      <div>{{ mapping.warehouse }}</div>
                      <div>{{ mapping.name }} ({{ mapping.code }}) — 数量: {{ mapping.quantity }}</div>
                    </div>
                  </div>
                  <div v-else>-</div>
                </q-td>
              </template>

              <template v-slot:body-cell-is_low_stock="props">
                <q-td :props="props">
                  <q-badge :color="props.row.is_low_stock ? 'negative' : 'positive'">
                    {{ props.row.is_low_stock ? '库存不足' : '库存充足' }}
                  </q-badge>
                </q-td>
              </template>
            </q-table>
          </div>
        </div>

        <div v-else-if="!loading && !productData" class="text-center text-grey">
          暂无产品数据
        </div>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn label="关闭" color="primary" v-close-popup @click="closeDialog" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: Boolean,
  previewProduct: Object,
  loading: Boolean
})

const emit = defineEmits(['update:modelValue', 'close'])

const isVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const productData = ref(null)

watch(() => props.previewProduct, (newVal) => {
  productData.value = newVal
}, { immediate: true })

const closeDialog = () => {
  emit('close')
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('zh-CN')
}

const skuColumns = [
  {
    name: 'sku_code',
    label: 'SKU编码',
    field: 'sku_code',
    align: 'left'
  },
  {
    name: 'barcode',
    label: '条形码',
    field: 'barcode',
    align: 'left'
  },
  {
    name: 'specification',
    label: '规格',
    field: 'specification',
    align: 'left'
  },
  {
    name: 'unit',
    label: '单位',
    field: 'unit',
    align: 'center'
  },
  {
    name: 'purchase_price',
    label: '采购价',
    field: 'purchase_price',
    align: 'right'
  },
  {
    name: 'selling_price',
    label: '销售价',
    field: 'selling_price',
    align: 'right'
  },
  {
    name: 'total_stock',
    label: '总库存',
    field: 'total_stock',
    align: 'center'
  },
  {
    name: 'min_stock',
    label: '最低库存',
    field: 'min_stock',
    align: 'center'
  },
  {
    name: 'max_stock',
    label: '最高库存',
    field: 'max_stock',
    align: 'center'
  },
  {
    name: 'is_low_stock',
    label: '库存状态',
    field: 'is_low_stock',
    align: 'center'
  },
  {
    name: 'location_mapping',
    label: '库位信息',
    field: 'location_mapping',
    align: 'left'
  }
]
</script>

<style scoped>
.text-weight-bold {
  font-weight: bold;
}
</style>
