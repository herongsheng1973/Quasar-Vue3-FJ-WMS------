<template>
  <q-form ref="stockOutForm" v-model="formState" @submit="handleSubmit" class="q-pa-none">
    <!-- 基本信息卡片 -->
    <q-card>
      <q-card-section>
        <h5 class="text-subtitle1 q-my-none">出库基本信息</h5>
        <div class="row q-col-gutter-md">
          <!-- 出库仓库 -->
          <div class="col-12 col-md-4">
            <q-select label="出库仓库 *" v-model="form.warehouse_id" :options="warehouseOptions" option-label="label"
              option-value="value" map-options :rules="[val => !!val || '请选择出库仓库']" filled dense />
          </div>

          <!-- 客户 -->
          <div class="col-12 col-md-4">
            <q-select label="客户" v-model="form.customer_id" :options="customerOptions" option-label="label"
              option-value="value" map-options emit-value filled dense />
          </div>

          <!-- 出库日期 -->
          <div class="col-12 col-md-4">
            <q-input label="出库日期 *" v-model="form.order_date" :rules="[
              val => !!val || '请选择出库日期'
            ]" filled dense>
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date v-model="form.order_date" mask="YYYY-MM-DD" :max="new Date()">
                      <div class="row items-center justify-end">
                        <q-btn v-close-popup label="关闭" color="primary" flat />
                      </div>
                    </q-date>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>

          <!-- 备注 -->
          <div class="col-12">
            <q-input label="备注" v-model="form.notes" type="textarea" rows="2" filled dense />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- 出库明细表格 -->
    <q-card class="q-mt-md">
      <q-card-section>
        <div class="flex justify-between items-center q-mb-md">
          <h5 class="text-subtitle1">出库明细</h5>
          <q-btn color="primary" size="sm" icon="add" label="添加明细" @click="addItem" />
        </div>

        <q-table :rows="form.items_input" :columns="itemColumns" row-key="id" bordered dense
          class="table-input-align-fix item-table">
          <template #body-cell-category="props">
            <q-td :props="props" class="table-cell-input">
              <q-select v-model="props.row.category" :options="categoryOptions" option-label="name" option-value="id"
                map-options dense outlined full-width @update:model-value="onCategoryChange(props.rowIndex, $event)" />
            </q-td>
          </template>
          <template #body-cell-actions="props">
            <q-td :props="props">
              <q-btn color="negative" size="sm" icon="delete" @click="removeItem(props.rowIndex)" />
            </q-td>
          </template>

          <template #body-cell-product="props">
            <q-td :props="props">
              <q-select v-model="props.row.product" :options="productOptions" option-label="label" option-value="value"
                map-options dense outlined full-width @update:model-value="onProductChange(props.rowIndex, $event)" />
              <div v-if="props.row.hasNoSkuError" class="text-red text-xs q-mt-xs">
                {{ props.row.errorMessage }}
              </div>
            </q-td>
          </template>

          <template #body-cell-sku="props">
            <q-td :props="props">
              <q-select v-model="props.row.sku_id"
                :options="props.row.product ? (productSkuOptions[props.row.product.value] || []) : []"
                option-label="label" option-value="value" map-options dense outlined full-width
                :loading="props.row.skuLoading" :disabled="!props.row.product"
                @update:model-value="onSkuChange(props.rowIndex, $event)" />
              <div v-if="!props.row.sku_id && props.row.product" class="text-red text-xs q-mt-xs">
                SKU不能为空
              </div>
            </q-td>
          </template>

          <template #body-cell-location="props">
            <q-td :props="props">
              <q-input v-model="props.row.locationLabel" dense readonly outlined full-width
                :loading="props.row.locationLoading" />
              <div v-if="!props.order && !props.row.location_sku_id && props.row.sku_id"
                class="text-red text-xs q-mt-xs">
                库位未配置
              </div>
            </q-td>
          </template>

          <template #body-cell-batch_number="props">
            <q-td :props="props">
              <q-select v-model="props.row.batch_number" :options="getBatchOptionsForSku(props.row.sku_id)"
                @update:model-value="onBatchNumberChange(props.rowIndex, $event)" option-label="label"
                option-value="value" map-options use-input emit-value fill-input hide-selected dense clearable outlined
                full-width new-value-mode="add">
                <template v-slot:no-option>
                  <q-item>
                    <q-item-section class="text-grey">无匹配批次</q-item-section>
                  </q-item>
                </template>
              </q-select>
              <q-tooltip>{{ props.row.batch_number || '无批次号' }}</q-tooltip>
            </q-td>
          </template>

          <template #body-cell-balance="props">
            <q-td :props="props">
              <q-input v-model="props.row.balance" dense readonly outlined full-width />
            </q-td>
          </template>
          <template #body-cell-quantity="props">
            <q-td :props="props" class="table-cell-input">
              <q-input v-model.number="props.row.quantity" type="number" min="1" dense outlined full-width
                @update:model-value="calculateAmount(props.rowIndex)" />
            </q-td>
          </template>
          <template #body-cell-notes="props">
            <q-td :props="props">
              <q-input v-model="props.row.notes" dense outlined full-width />
            </q-td>
          </template>
        </q-table>

        <div v-if="form.items_input.length === 0" class="text-red text-center q-mt-md">
          请至少添加一条明细
        </div>
      </q-card-section>
    </q-card>

    <div class="flex justify-end q-mt-md gap-2">
      <q-btn label="取消" type="button" color="grey" @click="emit('close')" />
      <q-btn label="重置" type="reset" color="grey" @click="handleReset" />
      <q-btn label="提交" type="submit" color="primary" :disabled="form.items_input.length === 0" />
    </div>
  </q-form>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { useQuasar } from 'quasar'
import {
  getWarehouseOptions,
  getCustomerOptions
} from 'src/services/settingsServiceApi'
import {
  getCategoryOptions,
  getProductOptions,
  getProductSkusByProductId,
  getLocationSkuBySkuId,
  getSkuBatchOptionsBySkuId
} from 'src/services/productServiceApi'

const $q = useQuasar()
const props = defineProps({
  order: { type: Object, default: null }
})

const emit = defineEmits(['close', 'saved'])
const stockOutForm = ref(null)
const formState = ref(false)

const itemColumns = [
  { name: 'category', label: '商品类别', field: 'category', width: '140px' },
  { name: 'product', label: '商品 *', field: 'product', width: '180px' },
  { name: 'sku', label: 'SKU *', field: 'sku_id', width: '160px' },
  { name: 'location', label: '库位', field: 'location_sku_id', width: '130px' },
  { name: 'batch_number', label: '批次号', field: 'batch_number', width: '160px' },
  { name: 'balance', label: '可用库存', field: 'balance', align: 'right', width: '110px' },
  { name: 'quantity', label: '数量 *', field: 'quantity', width: '100px' },
  { name: 'notes', label: '备注', field: 'notes', width: '140px' },
  { name: 'actions', label: '操作', field: 'actions', align: 'center', width: '80px' }
]
const form = reactive({
  warehouse_id: null,
  customer_id: null,
  order_date: new Date().toISOString().split('T')[0],
  notes: '',
  items_input: []
})

const warehouses = ref([])
const customers = ref([])
const products = ref([])
const productSkuOptions = ref({})
const batchOptionsCache = ref({})
const categoryOptions = ref([])
const warehouseOptions = computed(() => warehouses.value.map(w => ({ label: w.name, value: w.id })))
const customerOptions = computed(() => customers.value.map(c => ({ label: c.name, value: c.id })))
const productOptions = computed(() => products.value.map(p => ({ label: p.name, value: p.id })))

const resetForm = () => {
  form.warehouse_id = null
  form.customer_id = null
  form.order_date = new Date().toISOString().split('T')[0]
  form.notes = ''
  form.items_input = []
  productSkuOptions.value = {}
  batchOptionsCache.value = {}
  addItem()
}

const addItem = (data = null) => {
  const item = {
    id: Date.now(), product: null, sku_id: null, location_sku_id: null, locationLabel: '',
    batch_number: '', balance: 0, quantity: 1, unit_price: 0, notes: '',
    hasNoSkuError: false, errorMessage: '', skuLoading: false, locationLoading: false
  }
  if (data) Object.assign(item, data)
  form.items_input.push(item)
}

const fetchAll = async () => {
  try {
    const [cat, wh, cus, prods] = await Promise.all([
      getCategoryOptions(), getWarehouseOptions(), getCustomerOptions(), getProductOptions()
    ])
    categoryOptions.value = cat.data || []
    warehouses.value = wh.data || []
    customers.value = cus.data || []
    products.value = prods.data || []

    if (props.order) await fillEditData(props.order)
  } catch (error) {
    $q.notify({ color: 'negative', message: error.response?.data?.error || '加载数据失败' })
  }
}

onMounted(async () => {
  await fetchAll()
  if (!props.order) resetForm()
})

watch(() => props.order, async (v) => {
  if (v && products.value.length) await fillEditData(v)
}, { deep: true })

// ==============================================
// ✅ 【核心修复】fillEditData 增加：加载批次并回填 balance
// ==============================================
const fillEditData = async (data) => {
  // 1) 仓库匹配
  const whName = data.warehouse.replace(/\s*\(.*?\)\s*/g, '').trim()
  const wh = warehouses.value.find(w => w.name === whName)
  form.warehouse_id = wh ? { label: wh.name, value: wh.id } : null

  // 2) 客户匹配
  const cusName = data.customer.replace(/\s*\(.*?\)\s*/g, '').trim()
  const cus = customers.value.find(c => c.name === cusName)
  form.customer_id = cus ? cus.id : null

  form.order_date = data.order_date
  form.notes = data.notes || ''
  form.items_input = []

  // 3) 预加载所有商品的 SKU
  for (const item of data.items) {
    const product = products.value.find(x => x.id === item.product_id)
    if (product && !productSkuOptions.value[product.id]) {
      try {
        const res = await getProductSkusByProductId(product.id)
        productSkuOptions.value[product.id] = res.data.map(s => ({
          label: s.sku_code,
          value: s.id,
          price: parseFloat(s.selling_price || 0)
        }))
      } catch (error) {
        $q.notify({ color: 'negative', message: error.response?.data?.error || '加载SKU失败' })
      }
    }
  }

  // 4) 回填明细 + 加载批次 + 回填 balance
  for (const item of data.items) {
    const product = products.value.find(x => x.id === item.product_id)
    const skuList = product ? productSkuOptions.value[product.id] || [] : []
    const skuItem = skuList.find(s => s.label === item.sku_code)

    let location_sku_id = null
    if (skuItem?.value && form.warehouse_id?.value) {
      try {
        const res = await getLocationSkuBySkuId({
          warehouse_id: form.warehouse_id.value,
          sku_id: skuItem.value
        })
        location_sku_id = res.data?.id || null
      } catch (error) {
        $q.notify({ color: 'negative', message: error.response?.data?.error || '加载库位失败' })
      }
    }

    // 构建行
    const newRow = {
      id: Date.now(),
      product: product ? { label: product.name, value: product.id } : null,
      sku_id: skuItem?.value || null,
      location_sku_id,
      locationLabel: item.location_code || '',
      batch_number: item.batch_number || '无批次号',
      balance: 0, // 先清空，下面异步加载批次后再赋值
      quantity: item.quantity || 1,
      unit_price: parseFloat(item.unit_price || 0),
      notes: item.notes || '',
      hasNoSkuError: false,
      errorMessage: '',
      skuLoading: false,
      locationLoading: false
    }
    form.items_input.push(newRow)

    // ==============================================
    // ✅ 关键：编辑模式下，加载该SKU的批次并回填 balance
    // ==============================================
    if (skuItem?.value && form.warehouse_id?.value) {
      try {
        const res = await getSkuBatchOptionsBySkuId({
          warehouse_id: form.warehouse_id.value,
          sku_id: skuItem.value
        })
        const batches = res.data || []
        let mapped = batches.map(b => ({
          label: b.batch_number || '无批次号',
          value: b.batch_number || '无批次号',
          balance: b.quantity || 0
        }))
        const seen = new Set()
        mapped = mapped.filter(i => !seen.has(i.value) && seen.add(i.value))
        if (!mapped.some(x => x.value === '无批次号')) {
          mapped.unshift({ label: '无批次号', value: '无批次号', balance: 0 })
        }
        batchOptionsCache.value[skuItem.value] = mapped

        // 根据当前批次号，设置 balance
        const opt = mapped.find(x => x.value === newRow.batch_number)
        if (opt) {
          newRow.balance = opt.balance
        }
      } catch (err) {
        console.warn('加载批次库存失败', err)
      }
    }
  }

  // 确保DOM更新后再触发校验（可选）
  await nextTick()
}

const checkDuplicateItem = (index, sku_id, batch_number) => {
  return form.items_input.some((it, i) => i !== index && it.sku_id === sku_id && it.batch_number === batch_number)
}
const onCategoryChange = async (index, val) => {
  const item = form.items_input[index]
  item.category = val
  item.product = null
  item.sku_id = null

  try {
    const res = await getProductOptions({
      page: 1,
      page_size: 1000,
      category: val ? val.id : null
    })
    products.value = res.data || []
  } catch (err) {
    productOptions.value = []
    $q.notify({ color: 'negative', message: err.response?.data?.error || '加载商品失败' })
  }
}
const onProductChange = async (index, val) => {
  const item = form.items_input[index]
  item.product = val
  item.sku_id = null
  item.location_sku_id = null
  item.locationLabel = ''
  item.unit_price = 0
  item.hasNoSkuError = false
  item.errorMessage = ''
  item.batch_number = ''
  item.balance = 0

  if (!val) return
  item.skuLoading = true

  try {
    const res = await getProductSkusByProductId(val.value)
    const skus = res.data || []
    if (!skus.length) {
      item.hasNoSkuError = true
      item.errorMessage = '无SKU'
      return
    }
    productSkuOptions.value[val.value] = skus.map(s => ({
      label: s.sku_code,
      value: s.id,
      price: parseFloat(s.selling_price || 0)
    }))
    const first = productSkuOptions.value[val.value][0]
    if (first) {
      item.sku_id = first.value
      await onSkuChange(index, first)
    }
  } catch {
    item.hasNoSkuError = true
    item.errorMessage = '加载SKU失败'
  } finally {
    item.skuLoading = false
  }
}

const onSkuChange = async (index, selected) => {
  const item = form.items_input[index]
  const skuId = selected?.value || selected
  const wid = form.warehouse_id?.value

  item.sku_id = skuId
  item.location_sku_id = null
  item.locationLabel = ''
  item.batch_number = ''
  item.balance = 0

  if (!skuId || !wid) return
  if (checkDuplicateItem(index, skuId, item.batch_number)) {
    $q.notify({ color: 'warning', message: '重复SKU+批次' })
    return
  }

  const pid = item.product.value
  const skuInfo = productSkuOptions.value[pid]?.find(s => s.value === skuId)
  if (skuInfo) item.unit_price = skuInfo.price

  item.locationLoading = true
  try {
    const res = await getLocationSkuBySkuId({ warehouse_id: wid, sku_id: skuId })
    const d = res.data
    if (d?.id) {
      item.location_sku_id = d.id
      item.locationLabel = d.location_code || ''
    } else {
      item.hasNoSkuError = true
      item.errorMessage = '无库位'
    }
  } catch {
    item.hasNoSkuError = true
    item.errorMessage = '加载库位失败'
  } finally {
    item.locationLoading = false
  }

  try {
    const res = await getSkuBatchOptionsBySkuId({ warehouse_id: wid, sku_id: skuId })
    const batches = res.data || []
    let mapped = batches.map(b => ({
      label: b.batch_number || '无批次号',
      value: b.batch_number || '无批次号',
      balance: b.quantity || 0
    }))
    const seen = new Set()
    mapped = mapped.filter(i => !seen.has(i.value) && seen.add(i.value))
    if (!mapped.some(x => x.value === '无批次号')) {
      mapped.unshift({ label: '无批次号', value: '无批次号', balance: 0 })
    }
    batchOptionsCache.value[skuId] = mapped
  } catch {
    batchOptionsCache.value[skuId] = [{ label: '无批次号', value: '无批次号', balance: 0 }]
  }
}

const onBatchNumberChange = (index, val) => {
  const item = form.items_input[index]
  if (checkDuplicateItem(index, item.sku_id, val)) {
    $q.notify({ color: 'warning', message: '重复SKU+批次' })
    item.batch_number = ''
    return
  }
  item.batch_number = val
  const opt = batchOptionsCache.value[item.sku_id]?.find(x => x.value === val)
  if (opt) item.balance = opt.balance || 0
}

const getBatchOptionsForSku = (sid) => batchOptionsCache.value[sid] || []
const removeItem = (index) => form.items_input.length > 1 && form.items_input.splice(index, 1)
const calculateAmount = (index) => {
  const it = form.items_input[index]
  it.amount = (it.quantity || 0) * (it.unit_price || 0)
}
const validateForm = () => {
  if (!form.warehouse_id) return false
  const seen = new Set()
  for (const it of form.items_input) {
    if (!it.sku_id || !it.location_sku_id || it.quantity <= 0) return false
    const key = `${it.sku_id}|${it.batch_number}`
    if (seen.has(key)) {
      $q.notify({ color: 'negative', message: '重复SKU+批次' })
      return false
    }
    seen.add(key)
  }
  return true
}

const handleReset = () => resetForm()

const handleSubmit = async () => {
  const valid = await stockOutForm.value.validate()
  if (!valid || !validateForm()) return

  emit('saved', {
    id: props.order?.id,
    warehouse_id: form.warehouse_id.value,
    customer_id: form.customer_id,
    order_date: form.order_date,
    notes: form.notes,
    items_input: form.items_input.map(it => ({
      sku_id: it.sku_id,
      location_sku_id: it.location_sku_id,
      quantity: it.quantity,
      unit_price: it.unit_price,
      batch_number: it.batch_number === '无批次号' ? '' : it.batch_number || '',
      notes: it.notes
    }))
  })
}
</script>

<style lang="scss" scoped>
/* 表格统一优化样式 —— 完全和入库单保持一致 */
:deep(.item-table) table {
  table-layout: fixed !important;
  width: 100%;
}

:deep(.item-table td),
:deep(.item-table th) {
  padding: 4px 8px !important;
  vertical-align: middle !important;
  white-space: nowrap !important;
}

.table-cell-input {
  :deep(.q-field) {
    width: 100% !important;
    min-height: 32px !important;
  }

  :deep(.q-field__content) {
    min-height: 32px !important;
  }
}

:deep(.item-table th) {
  text-align: left !important;
  font-weight: 500 !important;
}

:deep(.item-table th.text-center) {
  text-align: center !important;
}

:deep(.item-table td:last-child) {
  justify-content: center !important;
  text-align: center !important;
}

:deep(.item-table .text-red) {
  height: 16px;
  line-height: 16px;
  font-size: 12px;
}
</style>
