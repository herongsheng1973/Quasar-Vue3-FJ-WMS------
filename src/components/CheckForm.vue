<template>
  <q-form ref="checkForm" v-model="formState" @submit="handleSubmit" class="q-pa-md">
    <q-card>
      <q-card-section>
        <h5 class="text-subtitle1 q-mb-md">盘库信息</h5>

        <!-- 选择方式 -->
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-12">
            <q-option-group :model-value="searchType" :options="[
              { label: '按商品查询', value: 'product' },
              { label: '按库位查询', value: 'location' }
            ]" type="radio" inline @update:model-value="changeSearchType" />
          </div>
        </div>

        <!-- 查询条件 -->
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-12 col-md-6" v-if="searchType === 'product'">
            <q-select label="商品 *" v-model="queryCondition.product" :options="props.products" option-label="name"
              option-value="id" :rules="[val => !!val || '请选择商品']" @update:model-value="fetchInventoryData" />
          </div>

          <div class="col-11 col-md-5" v-if="searchType === 'location'">
            <q-select label="库位 *" v-model="queryCondition.location" :options="props.locations" option-label="code"
              option-value="id" :rules="[val => !!val || '请选择库位']" @update:model-value="fetchInventoryData" />
          </div>

          <div class="col-1" v-if="searchType === 'location'">
            <q-btn round flat icon="refresh" @click="fetchInventoryData" class="self-end q-mb-sm" />
          </div>
        </div>

        <!-- 结果表格 -->
        <div v-if="inventoryItems.length > 0">
          <q-table title="待盘库商品" :rows="inventoryItems" :columns="tableColumns" row-key="id" dense
            :pagination="{ rowsPerPage: 0 }">
            <template v-slot:body="props">
              <q-tr :props="props">
                <q-td key="product_name" :props="props">
                  {{ props.row.product_name }}
                </q-td>
                <q-td key="location_name" :props="props">
                  {{ props.row.location_name }}
                </q-td>
                <q-td key="sku_code" :props="props">
                  {{ props.row.sku_code }}
                </q-td>
                <q-td key="batch_number" :props="props">
                  {{ props.row.batch_number }}
                </q-td>
                <q-td key="quantity" :props="props">
                  {{ props.row.quantity }}
                </q-td>
                <q-td key="actual_quantity" :props="props">
                  <q-input v-model.number="props.row.actual_quantity" type="number" min="0" dense disable
                    @update:model-value="calculateDifference(props.row)" />
                </q-td>
                <q-td key="difference" :props="props">
                  <span :class="{
                    'text-negative': props.row.difference !== 0,
                    'text-positive': props.row.difference === 0
                  }">
                    {{ props.row.difference }}
                  </span>
                </q-td>
                <q-td key="notes" :props="props">
                  <q-input v-model="props.row.notes" dense placeholder="备注" />
                </q-td>
              </q-tr>
            </template>
          </q-table>
        </div>

        <!-- 无结果提示 -->
        <div v-else-if="queryCondition.product || queryCondition.location" class="text-center text-grey q-py-md">
          未找到相关库存信息
        </div>
      </q-card-section>
    </q-card>

    <!-- 操作按钮 -->
    <div class="flex justify-center q-mt-md gap-3">
      <q-btn label="取消" type="button" color="grey" @click="$emit('cancel')" />
      <q-btn label="提交" type="submit" color="primary" :disable="!isSubmittable" />
    </div>
  </q-form>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { getInventoryByProductName, getInventoryByLocationId } from 'src/services/productServiceApi'
// 定义 emits
const emit = defineEmits(['cancel', 'saved'])
// 定义 props
const props = defineProps({
  order: {
    type: Object,
    default: null
  },
  warehouses: {
    type: Array,
    default: () => []
  },
  products: {
    type: Array,
    default: () => []
  },
  locations: {
    type: Array,
    default: () => []
  }
})

// 表单状态
const formState = ref(false)
const checkForm = ref(null)
const searchType = ref('product') // 'product' 或 'location'

// 查询条件
const queryCondition = reactive({
  product: null,
  location: null
})

// 盘库项目列表
const inventoryItems = ref([])

// 表格列定义
const tableColumns = [
  {
    name: 'product_name',
    label: '商品名称',
    field: 'product_name',
    align: 'left'
  },

  {
    name: 'location_name',
    label: '库位',
    field: 'location_name',
    align: 'left'
  },
  {
    name: 'sku_code',
    label: 'SKU',
    field: 'sku_code',
    style: 'width: 120px',
    align: 'right'
  },
  {
    name: 'batch_number',
    label: '批次号',
    field: 'batch_number',
    align: 'left'
  },
  {
    name: 'quantity',
    label: '库存',
    field: 'quantity',
    style: 'width: 120px',
    align: 'right'
  },
  {
    name: 'actual_quantity',
    label: '实际库存',
    field: 'actual_quantity',
    style: 'width: 120px',
    align: 'right'
  },
  {
    name: 'difference',
    label: '差异量',
    field: 'difference',
    align: 'right'
  },
  {
    name: 'notes',
    label: '备注',
    field: 'notes',
    align: 'left'
  }
]

// 是否可提交（至少有一条记录且都填写了实际库存）
const isSubmittable = computed(() => {
  return inventoryItems.value.length > 0
})

// 切换搜索类型
const changeSearchType = (newType) => {
  searchType.value = newType
  queryCondition.product = null
  queryCondition.location = null
  inventoryItems.value = []
}

// 计算差异量
const calculateDifference = (item) => {
  if (item.actual_quantity !== null) {
    item.difference = item.actual_quantity - (item.system_quantity || 0)
  } else {
    item.difference = 0
  }
}

// 获取库存数据
const fetchInventoryData = async () => {
  // 清空之前的数据
  inventoryItems.value = []
  try {
    if (searchType.value === 'product' && queryCondition.product) {
      // 按商品查询，返回该商品的所有批次
      const params = {
        product_name: queryCondition.product.name,
      }
      // 按商品查询，可能返回多个批次
      const response = await getInventoryByProductName(
        params
      )
      inventoryItems.value = response.data || []
    }
    else if (searchType.value === 'location' && queryCondition.location) {
      // 按库位查询，返回该库位下的所有商品

      const params = {
        page: 1,
        page_size: 1000,
        location_id: queryCondition.location.id
      }
      const response = await getInventoryByLocationId(
        params
      )
      inventoryItems.value = response.data || []
    }
  } catch (error) {
    console.error('获取库存数据失败:', error)
    inventoryItems.value = []
  }

}

// 提交表单
const handleSubmit = () => {
  if (!isSubmittable.value) return

  console.log('提交盘库单:', inventoryItems.value)
  emit('saved', inventoryItems.value)

  // 重置表单
  queryCondition.product = null
  queryCondition.location = null
  inventoryItems.value = []
}
</script>

<style scoped>
.gap-3 {
  gap: 12px;
}
</style>
