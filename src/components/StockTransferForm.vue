<template>
  <q-dialog v-model="dialogVisible" @close="handleClose"><!-- 关闭时重置 -->
    <q-card style="width: 780px; max-width: 95vw;">
      <q-card-section>
        <h5 class="text-h5">{{ isEdit ? '编辑移库单' : '新增移库单' }}</h5>

        <q-form class="q-gutter-md mt-4" @submit="onSubmit">
          <!-- 仓库 -->
          <div class="row q-mb-sm">
            <q-select v-model="form.source_warehouse" label="源仓库" :options="warehouseOptions" option-label="name"
              option-value="id" class="col-6 q-px-md" required />
            <q-select v-model="form.target_warehouse" label="目标仓库" :options="warehouseOptions" option-label="name"
              option-value="id" class="col-6 q-px-md" required />
          </div>

          <!-- 产品 + SKU 联动 -->
          <div class="row q-mb-sm">
            <q-select v-model="form.product" label="产品" :options="productOptions" option-label="name" option-value="id"
              class="col-6 q-px-md" required @update:modelValue="onProductSelect(form.product)" />
            <q-select v-model="form.sku" label="SKU 规格" :options="skuOptions" :disable="!form.product"
              option-label="label" option-value="id" class="col-6 q-px-md" required
              @update:modelValue="onSkuSelect({ warehouse_id: form.source_warehouse.id, sku_id: form.sku.id })" />
          </div>

          <div class="row q-mb-sm">
            <q-select v-model="form.batch_number" label="批次号*" :options="batchOptions" option-label="batch_number"
              option-value="batch_number" class="col-6 q-px-md" required />
            <q-input v-model.number="form.quantity" label="移库数量" type="number" min="1" class="col-6 q-px-md" required />
          </div>

          <q-input v-model="form.notes" label="备注" type="textarea" class="col-12" />

          <div class="row justify-end q-mt-md gap-2">
            <q-btn label="取消" @click="handleClose" />
            <q-btn label="保存" color="primary" type="submit" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import { useQuasar } from 'quasar'
import {
  createStockTransfer,
  updateStockTransfer
} from 'src/services/inventoryServiceApi'
import { getWarehouses } from 'src/services/settingsServiceApi'
import { getProductOptions, getSkuOptionsbyProductId, getSkuBatchOptionsBySkuId } from 'src/services/productServiceApi'

const props = defineProps({
  dialogVisible: Boolean,
  transfer: Object
})

const emit = defineEmits(['close', 'saved', 'update:dialogVisible'])
const $q = useQuasar()

const isEdit = ref(false)

// 初始表单（重置用）
const initialForm = {
  source_warehouse: null,
  target_warehouse: null,
  product: null,
  sku: null,
  batch_number: '',
  quantity: 1,
  notes: ''
}

const form = ref({ ...initialForm })

const warehouseOptions = ref([])
const productOptions = ref([])
const skuOptions = ref([])
const batchOptions = ref([])


// 弹窗双向绑定
const dialogVisible = computed({
  get: () => props.dialogVisible,
  set: (val) => emit('update:dialogVisible', val)
})

// 重置表单
const resetForm = () => {
  form.value = { ...initialForm }
  skuOptions.value = []
  isEdit.value = false
}

// 关闭弹窗 → 重置
const handleClose = () => {
  resetForm()
  emit('close')
}

// 打开时加载
onMounted(async () => {
  await loadWarehouses()
  await loadProducts()
})

// 监听编辑数据
watch(
  () => props.transfer,
  (val) => {
    if (!val) {
      resetForm()
      return
    }

    isEdit.value = true
    form.value = {
      source_warehouse: val.source_warehouse,
      target_warehouse: val.target_warehouse,
      product: val.product,
      sku: val.sku,
      batch_number: val.batch_number || '',
      quantity: val.quantity || 1,
      notes: val.notes || ''
    }

    // 自动加载SKU
    if (val.product) onProductSelect(val.product)
  },
  { immediate: true }
)

// 加载仓库
const loadWarehouses = async () => {
  const res = await getWarehouses()
  warehouseOptions.value = res.data?.results || res.data || []
}

// 加载产品
const loadProducts = async () => {
  const res = await getProductOptions()
  productOptions.value = res.data?.results || res.data || []
}

// ✅ 选择产品加载 SKU（完全正确）
const onProductSelect = async (productId) => {
  console.log('Selected product ID:', productId.id) // ✅ 调试输出
  if (!productId.id) {
    skuOptions.value = []
    form.value.sku = null
    return
  }

  try {
    const res = await getSkuOptionsbyProductId(productId.id) // ✅ 传递正确的 productId
    skuOptions.value = res.data.map(s => ({
      id: s.id,
      label: s.sku_code
    }))
  } catch (e) {
    $q.notify({ color: 'negative', message: '获取SKU失败' + e.message })
  }
}

const onSkuSelect = async (params) => {
  try {
    const res = await getSkuBatchOptionsBySkuId(params) // 传递 SKU ID 获取批次列表
    batchOptions.value = res.data || []
    form.value.batch_number = batchOptions.value[0]?.batch_number || '无批次号' // 默认选中第一个批次
    form.value.quantity = batchOptions.value[0]?.quantity || 1 // 默认选中第一个批次的数量
  } catch (e) {
    $q.notify({ color: 'negative', message: '获取批次失败' + e.message })
  }
}

// 提交
const onSubmit = async () => {
  try {
    const params = {
      source_warehouse: form.value.source_warehouse.id,
      target_warehouse: form.value.target_warehouse.id,
      sku_id: form.value.sku.id,
      batch_number: form.value.batch_number,
      quantity: form.value.quantity,
      notes: form.value.notes
    }

    if (isEdit.value) {
      await updateStockTransfer(props.transfer.id, params)
    } else {
      await createStockTransfer(params)
    }

    $q.notify({ color: 'positive', message: '保存成功' })
    handleClose()
    emit('saved')
  } catch (e) {
    $q.notify({
      color: 'negative',
      message: e.response?.data?.error || '保存失败'
    })
  }
}
</script>
