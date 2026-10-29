<template>
  <q-page class="row q-pa-md">
    <q-card class="col-12">
      <q-card-section class="q-py-xs">
        <div class="row items-center justify-between">
          <h5 class="text-weight-bold text-primary">订单管理</h5>
          <div class="row gap-6">
            <q-btn label="刷新" color="primary" icon="refresh" @click="handleGetOrderList" />
            <q-btn label="新增订单" color="positive" icon="add" @click="openAddDialog" />
            <q-btn label="导出" color="brown" icon="download" @click="handleExportOrder" />
          </div>
        </div>
      </q-card-section>

      <!-- 搜索栏 -->
      <q-card-section class="q-py-sm">
        <div class="row q-col-gutter-md items-center">
          <q-input class="col-12 col-md-2" v-model="search.keyword" placeholder="订单号/客户/手机号"
            @keyup.enter="handleGetOrderList" />

          <q-select class="col-12 col-md-2" v-model="search.status" label="订单状态" :options="statusOptions" emit-value
            map-options />

          <q-input class="col-12 col-md-2" v-model="search.startDate" label="开始日期" type="date" outlined dense />

          <q-input class="col-12 col-md-2" v-model="search.endDate" label="结束日期" type="date" outlined dense />

          <div class="col-12 col-md-4 flex items-center">
            <q-btn label="搜索" color="primary" @click="handleGetOrderList" style="width: 160px;margin-right: 12px;" />
            <q-btn label="重置" color="grey" @click="resetSearch" style="width: 160px" />
          </div>
        </div>
      </q-card-section>

      <!-- 表格 -->
      <q-table :rows="orderList" :loading="loading" :columns="columns" row-key="id" v-model:pagination="pagination"
        @request="handleGetOrderList">
        <template v-slot:body-cell-actions="props">
          <q-btn-group>
            <q-btn size="sm" label="详情" color="info" @click="openDetailDialog(props.row)" />
            <q-btn size="sm" label="编辑" color="warning" @click="openEditDialog(props.row)" />
            <q-btn size="sm" label="删除" color="negative" @click="handleDelete(props.row)" />
          </q-btn-group>
        </template>

        <template v-slot:body-cell-status="props">
          <q-chip :color="props.row.status === 0 ? 'grey'
            : props.row.status === 1 ? 'primary'
              : props.row.status === 2 ? 'positive'
                : 'negative'
            " text-color="white">
            {{ statusLabel[props.row.status] }}
          </q-chip>
        </template>
      </q-table>

      <!-- 新增/编辑弹窗 -->
      <q-dialog v-model="dialogVisible" maximized closeable>
        <q-card>
          <q-card-section class="row justify-between items-center q-py-sm">
            <h5 class="text-weight-bold">{{ isEdit ? '编辑订单' : '新增订单' }}</h5>
            <q-space />
            <q-btn icon="close" flat round dense v-close-popup />
          </q-card-section>
          <q-card-section class="q-py-sm">
            <div class="row q-col-gutter-md q-py-sm">
              <q-input v-model="form.order_no" label="订单号" readonly class="col-12 col-md-3 q-mb-sm" />
              <q-input v-model="form.customer_name" label="客户姓名" class="col-12 col-md-3 q-mb-sm" />
              <q-input v-model="form.customer_phone" label="客户电话" class="col-12 col-md-3 q-mb-sm" />
              <q-select v-model="form.status" label="订单状态" :options="statusOptions" emit-value map-options
                class="col-12 col-md-3 q-mb-sm" />
            </div>

            <q-input v-model="form.remark" label="备注" type="textarea" rows="2" class="q-mb-sm" />

            <!-- 商品SKU区域 -->
            <div class="row justify-between items-center q-my-none q-py-none">
              <h6 class="q-my-none q-py-none text-weight-bold">商品明细</h6>
              <q-btn label="添加商品" size="sm" color="primary" @click="addGoodsItem" />
            </div>

            <q-table :rows="goodsItems" row-key="key" :columns="goodsColumns" dense class="q-my-sm">
              <template v-slot:body-cell-sku="props">

                <q-td :props="props">
                  <q-select v-model="props.row.sku_id" :options="skuList" label="选择商品SKU" outlined dense
                    @update:model-value="onSelectSku(props.row)" class="q-mt-md" />
                </q-td>

              </template>
              <template v-slot:body-cell-quantity="props">
                <q-td :props="props" class="text-center">
                  <q-input class="q-mt-md" v-model.number="props.row.quantity" label="商品数量" type="number" min="1" dense
                    outlined @update:model-value="calcItem(props.row)" :rules="[val => val > 0 || '商品数量必须大于0']" />
                </q-td>
              </template>
              <template v-slot:body-cell-actions="props">
                <q-td :props="props">
                  <q-btn size="sm" color="negative" icon="delete" @click="removeGoodsItem(props.row.key)" />
                </q-td>
              </template>
            </q-table>

            <div class="text-right text-weight-bold text-lg q-mt-md">
              订单总金额：¥{{ form.total_amount }}
            </div>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn label="取消" color="grey" @click="dialogVisible = false" />
            <q-btn label="确认提交" color="primary" @click="submitForm" />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <!-- 详情弹窗 -->
      <q-dialog v-model="detailVisible" maximized clearable>
        <q-card>
          <q-card-section class="row justify-between items-center q-py-sm">
            <h5 class="text-weight-bold">订单详情</h5>
            <q-space />
            <q-btn icon="close" flat round dense v-close-popup />
          </q-card-section>
          <q-card-section class="q-py-sm">
            <div class="text-body1 q-mb-sm">订单号：{{ detailInfo.order_no }}</div>
            <div class="text-body1 q-mb-sm">客户：{{ detailInfo.customer_name }}</div>
            <div class="text-body1 q-mb-sm">电话：{{ detailInfo.customer_phone }}</div>
            <div class="text-body1 q-mb-sm">金额：{{ detailInfo.total_amount }} 元</div>
            <div class="text-body1 q-mb-sm">
              状态：
              <q-chip :color="detailInfo.status === 2 ? 'positive' : 'primary'">
                {{ statusLabel[detailInfo.status] }}
              </q-chip>
            </div>
            <div class="text-body1 q-mb-sm">创建时间：{{ detailInfo.created_at }}</div>
            <div class="text-body1 q-mb-sm">备注：{{ detailInfo.remark || '无' }}</div>

            <div class="q-mt-md">
              <h6 class="text-weight-bold">商品明细</h6>
              <q-table :rows="detailGoodsItems" :columns="detailGoodsColumns" dense hide-pagination />
            </div>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn label="关闭" color="primary" @click="detailVisible = false" />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Notify } from 'quasar'
import {
  getOrderList,
  createOrder,
  updateOrder,
  deleteOrder,
  exportOrder,
  getSkuList,
  getOrderDetail
} from 'src/services/orderApi'


const loading = ref(false)
const orderList = ref([])
const pagination = ref({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0
})

const skuList = ref([])
const goodsItems = ref([])
const detailGoodsItems = ref([])

const columns = [
  { name: 'id', label: 'ID', field: 'id', align: 'center' },
  { name: 'order_no', label: '订单号', field: 'order_no', align: 'center' },
  { name: 'customer_name', label: '客户姓名', field: 'customer_name', align: 'center' },
  { name: 'customer_phone', label: '客户电话', field: 'customer_phone', align: 'center' },
  { name: 'total_amount', label: '订单金额', field: 'total_amount', align: 'center' },
  { name: 'status', label: '订单状态', field: 'status', align: 'center' },
  { name: 'created_at', label: '创建时间', field: 'created_at', align: 'center' },
  { name: 'actions', label: '操作', align: 'center' },
]

const goodsColumns = [
  { name: 'sku', label: '商品SKU', field: 'sku', align: 'center' },
  { name: 'sku_name', label: '商品名称', field: 'sku_name', align: 'center' },
  { name: 'spec', label: '规格', field: 'spec', align: 'center' },
  { name: 'price', label: '单价', field: 'price', align: 'center' },
  { name: 'quantity', label: '数量', field: 'quantity', align: 'center' },
  { name: 'subtotal', label: '小计', field: 'subtotal', align: 'center' },
  { name: 'actions', label: '操作', align: 'center' },
]

const detailGoodsColumns = [
  { name: 'product_name', label: '商品名称', field: 'product_name', align: 'center' },
  { name: 'sku_spec', label: '商品规格', field: 'sku_spec', align: 'center' },
  { name: 'sku_code', label: '商品SKU', field: 'sku_code', align: 'center' },
  { name: 'price', label: '单价', field: 'price', align: 'center' },
  { name: 'quantity', label: '数量', field: 'quantity', align: 'center' },
  { name: 'subtotal', label: '小计', field: 'subtotal', align: 'center' },
]

const statusOptions = [
  { label: '全部', value: '' },
  { label: '待审批', value: 0 },
  { label: '待发货', value: 1 },
  { label: '已发货', value: 2 },
  { label: '已完成', value: 3 },
  { label: '已取消', value: 4 },
]
const statusLabel = {
  0: '待审批',
  1: '待发货',
  2: '已发货',
  3: '已完成',
  4: '已取消',
}

const search = reactive({
  keyword: '',
  status: '',
  startDate: '',
  endDate: '',
})

const dialogVisible = ref(false)
const detailVisible = ref(false)
const isEdit = ref(false)
const form = ref({})
const detailInfo = ref({})

const loadSkuData = async () => {
  try {
    const res = await getSkuList()
    skuList.value = res.data.map(item => ({
      label: `${item.sku_code}｜${item.spec}`,
      id: item.id,
      name: item.name,
      spec: item.spec,
      price: item.price
    }))
  } catch (err) {
    Notify.create({ type: 'negative', message: '加载商品失败' + err.message })
  }
}

const addGoodsItem = () => {
  goodsItems.value.push({
    key: Date.now() + Math.random(), // 这里不用 uuid
    sku_id: null,
    sku_name: '',
    spec: '',
    price: 0,
    quantity: 1,
    subtotal: 0
  })
}

const removeGoodsItem = (key) => {
  goodsItems.value = goodsItems.value.filter(i => i.key !== key)
  calcTotalAmount()
}

const onSelectSku = (row) => {
  console.log(row)
  const sku = skuList.value.find(s => s.id === row.sku_id.id)
  console.log(sku)
  if (sku) {
    row.sku_name = sku.name
    row.spec = sku.spec
    row.price = sku.price
    calcItem(row)
  }
}

const calcItem = (row) => {
  console.log(row)
  row.subtotal = parseFloat((row.price * row.quantity).toFixed(2))
  calcTotalAmount()
}

const calcTotalAmount = () => {
  form.value.total_amount = goodsItems.value.reduce((sum, cur) => sum + cur.subtotal, 0)
}

const handleGetOrderList = async () => {
  loading.value = true
  try {
    // ==============================
    // ✅ 请求前：创建查询参数
    // ==============================
    const params = {
      page: pagination.value.page,
      page_size: pagination.value.rowsPerPage,
      keyword: search.keyword || undefined,
      status: search.status || undefined,
      start_date: search.startDate || undefined,
      end_date: search.endDate || undefined,
    }

    // 发送请求
    const res = await getOrderList(params)

    // 赋值数据
    orderList.value = res.data.results || res.data || []
    pagination.value.rowsNumber = res.data.count || orderList.value.length
  } catch (err) {
    Notify.create({ type: 'negative', message: '获取失败：' + err.message })
  } finally {
    loading.value = false
  }
}
const openAddDialog = async () => {
  isEdit.value = false
  form.value = {
    order_no: '自动生成',
    customer_name: '',
    customer_phone: '',
    total_amount: 0,
    status: 0,
    remark: ''
  }
  goodsItems.value = []
  dialogVisible.value = true
  await loadSkuData()
}

// 编辑 —— 自动加载商品明细
const openEditDialog = async (row) => {
  isEdit.value = true
  dialogVisible.value = true
  // 1. 先加载 SKU 列表（必须等它完成！）
  await loadSkuData()
  try {
    // 1. 先加载SKU下拉列表
    await loadSkuData()

    // 2. 获取后端完整订单详情（含商品明细）
    const res = await getOrderDetail(row.id)
    const orderData = res.data

    // 3. 回填表单
    form.value = { ...orderData }

    // 4. 回填商品明细到表格（关键！）
    // 3. 回填商品明细（关键：从 skuList 里匹配出完整选项，让 select 能显示 label）
    goodsItems.value = orderData.items.map(item => {
      // 从已加载的sku列表中找到完整的选项
      const skuOption = skuList.value.find(s => s.id === item.sku)
      console.log(skuOption)
      return {
        key: Date.now() + Math.random(),
        sku_id: skuOption, // <-- 这里赋值【完整对象】，不是只给 id！
        sku_name: skuOption?.name || item.product_name,
        spec: skuOption?.spec || item.sku_spec,
        price: parseFloat(item.price),
        quantity: item.quantity,
        subtotal: parseFloat(item.subtotal)
      }
    })

    // 5. 重新计算总金额
    calcTotalAmount()

  } catch (err) {
    Notify.create({ type: 'negative', message: '加载订单详情失败' + err.message })
  }
}
const openDetailDialog = (row) => {
  detailInfo.value = { ...row }
  detailGoodsItems.value = row.items || []
  detailVisible.value = true
}

const submitForm = async () => {
  if (goodsItems.value.length === 0) {
    Notify.create({ type: 'warning', message: '请至少添加一个商品' })
    return
  }

  try {
    const submitData = {
      ...form.value,
      items: goodsItems.value.map(i => ({
        sku_id: i.sku_id.id,
        quantity: i.quantity
      }))
    }

    if (isEdit.value) {
      await updateOrder(form.value.id, submitData)
      Notify.create({ type: 'positive', message: '修改成功' })
    } else {
      await createOrder(submitData)
      Notify.create({ type: 'positive', message: '创建成功' })
    }
    dialogVisible.value = false
    handleGetOrderList()
  } catch (err) {
    Notify.create({ type: 'negative', message: '提交失败' + err.message })
  }
}

const handleDelete = async (row) => {
  if (!confirm('确定删除？')) return
  try {
    await deleteOrder(row.id)
    Notify.create({ type: 'positive', message: '删除成功' })
    handleGetOrderList()
  } catch (err) {
    Notify.create({ type: 'negative', message: '删除失败' + err.message })
  }
}

const handleExportOrder = async () => {
  try {
    const res = await exportOrder(search)

    // 创建下载链接
    const blob = new Blob([res.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `订单列表_${new Date().getTime()}.xlsx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)

    Notify.create({ type: 'positive', message: '导出成功' })
  } catch (err) {
    Notify.create({ type: 'negative', message: '导出失败' + err.message })
  }
}
const resetSearch = () => {
  search.keyword = ''
  search.status = ''
  search.startDate = ''
  search.endDate = ''
  handleGetOrderList()
}

onMounted(() => {
  handleGetOrderList()
})
</script>
