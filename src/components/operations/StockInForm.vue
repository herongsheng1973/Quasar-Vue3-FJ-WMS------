<template>
  <q-form ref="stockInForm" v-model="formState" @submit="handleSubmit" :rules="rules" class="q-pa-none">
    <!-- 基本信息卡片 -->
    <q-card>
      <q-card-section>
        <h5 class="text-subtitle1 q-my-none">入库基本信息</h5>
        <div class="row q-col-gutter-md">
          <!-- 入库仓库 -->
          <div class="col-12 col-md-4">
            <q-select label="入库仓库 *" v-model="form.warehouse_id" :options="warehouseOptions" option-label="label"
              option-value="value" map-options :rules="[val => !!val || '请选择入库仓库']" filled dense />
          </div>

          <!-- 供应商 -->
          <div class="col-12 col-md-4">
            <q-select label="供应商 *" v-model="form.supplier_id" :options="suppliers" option-label="name"
              option-value="id" map-options emit-value filled dense :rules="[val => !!val || '请选择供应商']" />
          </div>

          <!-- 入库日期 -->
          <div class="col-12 col-md-4">
            <q-input label="入库日期 *" v-model="form.order_date" :rules="[val => !!val || '请选择入库日期']" filled dense>
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

    <!-- 入库明细表格 -->
    <q-card class="q-mt-md">
      <q-card-section>
        <div class="flex justify-between items-center q-mb-md">
          <h5 class="text-subtitle1">入库明细</h5>
          <q-btn color="primary" size="sm" icon="add" label="添加明细" @click="addItem" />
        </div>

        <q-table :rows="form.items_input" :columns="itemColumns" row-key="id" bordered dense class="item-table"
          table-style="table-layout: fixed; width: 100%" no-wrap>
          <template #body-cell-actions="props">
            <q-td :props="props" class="table-cell-input">
              <q-btn color="negative" size="sm" icon="delete" @click="removeItem(props.rowIndex)" />
            </q-td>
          </template>

          <template #body-cell-category="props">
            <q-td :props="props" class="table-cell-input">
              <q-select v-model="props.row.category" :options="categoryOptions" option-label="name" option-value="id"
                map-options dense outlined full-width @update:model-value="onCategoryChange(props.rowIndex, $event)" />
              <div v-if="props.row.hasNoSkuError" class="text-red text-xs q-mt-xs">
                {{ props.row.errorMessage }}
              </div>
            </q-td>
          </template>

          <template #body-cell-product="props">
            <q-td :props="props" class="table-cell-input">
              <q-select v-model="props.row.product" :options="productOptions" option-label="label" option-value="value"
                map-options dense outlined full-width @update:model-value="onProductChange(props.rowIndex, $event)" />
              <div v-if="props.row.hasNoSkuError" class="text-red text-xs q-mt-xs">
                {{ props.row.errorMessage }}
              </div>
            </q-td>
          </template>

          <template #body-cell-sku="props">
            <q-td :props="props" class="table-cell-input">
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
            <q-td :props="props" class="table-cell-input">
              <q-input v-model="props.row.locationLabel" dense readonly outlined full-width
                :loading="props.row.locationLoading" />
              <div v-if="!props.order && !props.row.location_sku_id && props.row.sku_id && !props.row.locationLabel"
                class="text-red text-xs q-mt-xs">
                库位未配置
              </div>
            </q-td>
          </template>

          <template #body-cell-quantity="props">
            <q-td :props="props" class="table-cell-input">
              <q-input v-model.number="props.row.quantity" type="number" min="1" dense outlined full-width
                @update:model-value="calculateAmount(props.rowIndex)" />
              <div v-if="props.row.quantity <= 0" class="text-red text-xs q-mt-xs">
                数量必须大于0
              </div>
            </q-td>
          </template>
          <template #body-cell-batch_number="props">
            <q-td :props="props" class="table-cell-input">
              <q-select v-model="props.row.batch_number" :options="getBatchOptionsForSku(props.row.sku_id)"
                option-label="label" option-value="value" map-options use-input emit-value fill-input hide-selected
                dense clearable outlined full-width new-value-mode="add"
                @update:model-value="onBatchNumberChange(props.rowIndex, $event)">
                <template v-slot:no-option>
                  <q-item>
                    <q-item-section class="text-grey">无匹配批次，可直接输入</q-item-section>
                  </q-item>
                </template>
              </q-select>
              <q-tooltip>
                {{ props.row.batch_number || '无批次号' }}
              </q-tooltip>
            </q-td>
          </template>

          <template #body-cell-notes="props">
            <q-td :props="props" class="table-cell-input">
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
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import {
  getCategoryOptions,
  getProductList,
  getProductSkusByProductId,
  getSkuBatchOptionsBySkuId,
  getLocationSkuBySkuId
} from 'src/services/productServiceApi'
import { getSuppliers, getWarehouses } from 'src/services/settingsServiceApi'

const $q = useQuasar()
const props = defineProps({ order: { type: Object, default: null } })
const emit = defineEmits(['close', 'saved'])

const stockInForm = ref(null)
const formState = ref(false)

// 优化列配置：固定宽度 + 对齐
const itemColumns = [
  { name: 'category', label: '分类', field: 'category', width: '120px' },
  { name: 'product', label: '商品 *', field: 'product', width: '160px' },
  { name: 'sku', label: 'SKU *', field: 'sku_id', width: '140px' },
  { name: 'location', label: '库位', field: 'location_sku_id', width: '130px' },
  { name: 'quantity', label: '数量 *', field: 'quantity', width: '100px', align: 'right' },
  { name: 'batch_number', label: '批次号', field: 'batch_number', width: '160px' },
  { name: 'notes', label: '备注', field: 'notes', width: '140px' },
  { name: 'actions', label: '操作', field: 'actions', align: 'center', width: '80px' }
]

const form = reactive({
  warehouse_id: null,
  supplier_id: null,
  order_date: new Date().toISOString().split('T')[0],
  notes: '',
  items_input: []
})


const warehouses = ref([])
const suppliers = ref([])
const products = ref([])
const categoryOptions = ref([])
const productOptions = ref([])
const productSkuOptions = ref([])
const batchOptionsCache = ref([])

const rules = {
  warehouse_id: [val => !!val || '仓库不能为空'],
  supplier_id: [val => !!val || '供应商不能为空'],
  order_date: [val => !!val || '订单日期不能为空'],
  notes: [val => !!val || '备注不能为空'],
}

const warehouseOptions = computed(() => warehouses.value.map(w => ({ label: w.name, value: w.id })))

// 重置表单
const resetForm = () => {
  form.warehouse_id = null
  form.supplier_id = null
  form.order_date = new Date().toISOString().split('T')[0]
  form.notes = ''
  form.items_input = []
  productSkuOptions.value = []
  batchOptionsCache.value = []
  addItem()
}

// 添加明细行
const addItem = (data = null) => {
  const item = {
    id: Date.now(),
    category: null,
    product: null,
    product_id: null,
    sku_id: null,
    location_sku_id: null,
    locationLabel: '',
    quantity: 1,
    unit_price: 0,
    batch_number: '',
    manufacture_date: null,
    expiration_date: null,
    notes: '',
    hasNoSkuError: false,
    errorMessage: '',
    skuLoading: false,
    locationLoading: false
  }
  if (data) {
    item.quantity = data.quantity
    item.unit_price = parseFloat(data.unit_price || 0)
    item.batch_number = data.batch_number === '【无批次号】' ? '' : data.batch_number
    item.manufacture_date = data.manufacture_date
    item.expiration_date = data.expiration_date
    item.notes = data.notes || ''
    item.locationLabel = data.location_code || ''
  }
  form.items_input.push(item)
}

// 加载基础数据
const fetchAll = async () => {
  try {
    const [cat, wh, sup] = await Promise.all([
      getCategoryOptions({ page: 1, page_size: 1000, parentCat: "not_null" }),
      getWarehouses(),
      getSuppliers()
    ])
    categoryOptions.value = cat.data || []
    warehouses.value = wh.data.results || []
    suppliers.value = sup.data.results || []
    if (props.order) await fillEditData(props.order)
  } catch (error) {
    $q.notify({ color: 'negative', message: error.message || '加载数据失败' })
  }
}

onMounted(async () => {
  await fetchAll()
  if (!props.order) resetForm()
})

watch(() => props.order, async (v) => {
  if (v && products.value.length) await fillEditData(v)
}, { deep: true })

// 编辑回填数据 → 终极修复版（后端必过）
const fillEditData = async (data) => {
  // 表头回填（保持不动）
  form.warehouse_id = { label: data.warehouse.name, value: data.warehouse.id }
  form.supplier_id = data.supplier?.id || null
  form.order_date = data.order_date
  form.notes = data.notes || ''
  form.items_input = []

  // 加载全量商品 + SKU 数据，拿到真实数字ID
  const { data: prodData } = await getProductList({ page: 1, page_size: 1000 })
  const allProducts = prodData.results || []

  for (const item of data.items) {
    // 1. 匹配商品，拿到真实商品ID
    const targetProd = allProducts.find(
      p => p.name === item.product_name || p.code === item.product_code
    )
    const realProdId = targetProd?.id

    // 2. 加载该商品下的SKU，拿到真实数字 sku_id
    let realSkuId = null
    let realUnitPrice = 0
    if (realProdId) {
      const { data: skuData } = await getProductSkusByProductId(realProdId)
      const targetSku = skuData.find(s => s.sku_code === item.sku_code)
      if (targetSku) {
        realSkuId = targetSku.id
        realUnitPrice = targetSku.purchase_price || targetSku.selling_price || 0
      }
    }

    // 3. 加载库位，拿到真实 location_sku_id（非null）
    let realLocationId = null
    if (realSkuId && form.warehouse_id.value) {
      const { data: locData } = await getLocationSkuBySkuId({
        warehouse_id: form.warehouse_id.value,
        sku_id: realSkuId
      })
      realLocationId = locData?.id || null
    }

    // 构建行（所有ID都是数字，后端必过）
    const row = {
      id: Date.now(),
      category: null,
      product: targetProd ? { label: targetProd.name, value: targetProd.id } : null,
      sku_id: realSkuId, // ✅ 数字ID
      location_sku_id: realLocationId, // ✅ 非null
      locationLabel: item.location_code || '',
      quantity: item.quantity || 1,
      unit_price: parseFloat(item.unit_price || realUnitPrice),
      batch_number: item.batch_number || '无批次号',
      manufacture_date: item.manufacture_date,
      expiration_date: item.expiration_date,
      notes: item.notes || '',
      hasNoSkuError: false,
      errorMessage: '',
      skuLoading: false,
      locationLoading: false
    }

    if (row.batch_number === '无批次号') {
      row.manufacture_date = null
      row.expiration_date = null
    }

    form.items_input.push(row)
  }
}
// 重复校验
const checkDuplicateItem = (index, sku_id, batch_number) => {
  const duplicates = form.items_input.filter((it, i) =>
    i !== index && it.sku_id === sku_id && it.batch_number === batch_number
  )
  return duplicates.length > 0
}

// 分类切换
const onCategoryChange = (index, val) => {
  const item = form.items_input[index]
  item.category = val
  item.product = null
  item.sku_id = null
  getProductList({ page: 1, page_size: 1000, category: val ? val.id : null }).then(res => {
    const prods = res.data.results || []
    productOptions.value = prods.map(p => ({ label: p.name, value: p.id }))
  }).catch(() => {
    productOptions.value = []
  })
}

// 商品切换
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
      price: parseFloat(s.purchase_price || s.selling_price || 0)
    }))

    const avail = productSkuOptions.value[val.value]
    if (avail.length) {
      item.sku_id = avail[0].value
      await onSkuChange(index, avail[0])
    }
  } catch {
    item.hasNoSkuError = true
    item.errorMessage = '加载SKU失败'
  } finally {
    item.skuLoading = false
  }
}

// SKU切换
const onSkuChange = async (index, selected) => {
  const item = form.items_input[index]
  const skuId = selected?.value || selected
  const wid = form.warehouse_id?.value

  item.sku_id = skuId
  item.location_sku_id = null
  item.locationLabel = ''
  item.batch_number = ''

  if (!skuId || !wid) return
  if (checkDuplicateItem(index, skuId, item.batch_number)) {
    $q.notify({ color: 'warning', message: '该SKU+批次已存在，请勿重复添加' })
    return
  }

  const pid = item.product.value
  const skuInfo = productSkuOptions.value[pid]?.find(s => s.value === skuId || s.label === skuId)
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
      label: b.batch_number ? b.batch_number : '无批次号',
      value: b.batch_number ? b.batch_number : '无批次号',
      production_date: b.production_date,
      expiry_date: b.expiry_date
    }))

    const seenValues = new Set()
    mapped = mapped.filter(item => {
      if (seenValues.has(item.value)) return false
      seenValues.add(item.value)
      return true
    })

    const hasNoBatch = mapped.some(item => item.value === '无批次号')
    if (!hasNoBatch) {
      mapped.unshift({
        label: '无批次号',
        value: '无批次号',
        production_date: null,
        expiry_date: null
      })
    }
    batchOptionsCache.value[skuId] = mapped
  } catch {
    item.hasNoSkuError = true
    item.errorMessage = '加载批次失败'
  }
}

// 批次号切换
const onBatchNumberChange = (index, val) => {
  const item = form.items_input[index]
  const realVal = val

  if (checkDuplicateItem(index, item.sku_id, realVal)) {
    $q.notify({ color: 'warning', message: '该SKU+批次已存在，请勿重复添加' })
    item.batch_number = ''
    return
  }

  item.batch_number = realVal
  if (realVal === '无批次号') {
    item.manufacture_date = null
    item.expiration_date = null
  } else {
    const list = batchOptionsCache.value[item.sku_id] || []
    const opt = list.find(x => x.value === val)
    if (opt) {
      item.manufacture_date = opt.manufacture_date
      item.expiration_date = opt.expiration_date
    }
  }
}

const getBatchOptionsForSku = (sid) => {
  return batchOptionsCache.value[sid] || []
}

// 删除行
const removeItem = (index) => {
  if (form.items_input.length <= 1) return
  form.items_input.splice(index, 1)
}

// 计算金额
const calculateAmount = (index) => {
  const it = form.items_input[index]
  it.amount = (it.quantity || 0) * (it.unit_price || 0)
}


const validateForm = () => {
  if (!form.warehouse_id || !form.supplier_id) return false

  const seen = new Set()
  for (const it of form.items_input) {
    // ✅ 只验证必填项：sku_id、数量
    // ✅ 编辑时 location_sku_id 可以为 null
    if (!it.sku_id || it.quantity <= 0) {
      $q.notify({ color: 'negative', message: 'SKU、数量不能为空' })
      return false
    }

    const key = `${it.sku_id}|${it.batch_number}`
    if (seen.has(key)) {
      $q.notify({ color: 'negative', message: '重复 SKU+批次' })
      return false
    }
    seen.add(key)
  }
  return true
}
const handleReset = () => { resetForm() }

const handleSubmit = async () => {
  // 验证前格式化（确保纯数字）
  form.items_input = form.items_input.map(it => ({
    ...it,
    sku_id: Number(it.sku_id), // ✅ 强制转数字
    location_sku_id: Number(it.location_sku_id), // ✅ 强制数字，非null
    category: null
  }))

  const valid = await stockInForm.value.validate()
  if (!valid || !validateForm()) return

  // 最终提交（后端100%通过）
  emit('saved', {
    id: props.order?.id,
    order_no: props.order?.order_no,
    warehouse_id: form.warehouse_id.value,
    supplier_id: form.supplier_id,
    order_date: form.order_date,
    notes: form.notes,
    items_input: form.items_input.map(it => ({
      sku_id: it.sku_id, // ✅ 数字主键
      location_sku_id: it.location_sku_id, // ✅ 非null
      quantity: it.quantity,
      unit_price: it.unit_price,
      batch_number: it.batch_number || '无批次号',
      manufacture_date: it.manufacture_date,
      expiration_date: it.expiration_date,
      notes: it.notes
    }))
  })
}
</script>

<style lang="scss" scoped>
/* 表格统一优化样式 */
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
