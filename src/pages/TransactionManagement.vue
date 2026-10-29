<template>
  <q-page class="q-pa-md">
    <!-- 页面标题 -->
    <div class="col-12 flex flex-wrap justify-between items-center gap-4">
      <div class="col-6 q-py-none">
        <h5 class="text-h5 q-ma-none text-grey-8">库存变动记录管理</h5>
        <p class="text-grey-5 text-subtitle1">查看和管理所有库存变动记录</p>
      </div>
      <div class="col-6 flex justify-between items-center">
        <q-btn label="新增" color="primary" icon="add" @click="createTransaction" />
        <q-btn label="导入" color="primary" icon="file_upload" @click="openImportDialog" />
        <q-btn label="导出所有数据" color="primary" icon="download" @click="exportTransactionRecords" />
      </div>
    </div>

    <!-- 筛选和搜索区域 -->
    <div class="col-12 q-py-none">
      <form ref="searchForm" @submit.prevent="handleFetchTransactions">
        <q-card>
          <q-card-section>
            <div class="row q-col-gutter-md items-center">
              <!-- 入库仓库 -->
              <div class="col">
                <q-select label="入库仓库 *" v-model="filters.warehouse" :options="warehouseOptions" dense clearable
                  option-label="name" option-value="id" map-options @update:model-value="handleFetchTransactions" />
              </div>
              <!-- 交易类型筛选 -->
              <div class="col">
                <q-select v-model="filters.transaction_type" label="交易类型" :options="transactionTypes" dense clearable
                  emit-value map-options @update:model-value="handleFetchTransactions">
                  <template v-slot:before>
                    <q-icon name="category" />
                  </template>
                </q-select>
              </div>
              <!-- 搜索框 -->
              <div class="col">
                <q-input v-model="searchQuery" label="搜索(单号/商品/仓库)" placeholder="输入关键词搜索" dense clearable
                  @keyup.enter="fetchTransactions" @update:model-value="handleFetchTransactions">
                  <template v-slot:prepend>
                    <q-icon name="search" />
                  </template>
                </q-input>
              </div>
              <!-- 替换原有的日期选择代码 -->
              <div class="col-3">
                <DateRangePicker :start-date="startDate" :end-date="endDate" @update:date-range="onDateRangeChange" />
              </div>

              <!-- 操作按钮 -->
              <div class="col-3">
                <div class="row q-gutter-sm ">
                  <q-btn label="重置" color="secondary" @click="resetFilters" icon="refresh" unelevated size="md" />
                  <q-btn label="查询" color="primary" type="submit" icon="search" unelevated size="md" />
                  <q-btn label="导出" color="primary" icon="file_download" @click="exportFilteredTransactionRecords"
                    unelevated size="md" />
                </div>
              </div>

            </div>
          </q-card-section>

        </q-card>
      </form>
    </div>


    <!-- 数据表格 -->
    <div class="col-12 q-mt-md">
      <q-card>
        <q-card-section class="q-pa-0">
          <q-table :rows="transactions" :columns="columns" v-model:pagination="pagination" :loading="loading"
            row-key="id" :rows-per-page-options="[10, 20, 30, 50, 100]" @request="onRequest">
            <!-- 交易类型显示 -->
            <template v-slot:body-cell-transaction_type="props">
              <q-td :props="props">
                <q-badge :color="getTransactionTypeColor(props.row.transaction_type)"
                  :label="props.row.transaction_type_display" />
              </q-td>
            </template>

            <!-- 商品信息显示 -->
            <template v-slot:body-cell-product_name="props">
              <q-td :props="props">
                <div>
                  <div>{{ props.row.product_name }}</div>
                  <div class="text-caption text-grey">
                    {{ props.row.sku_code || '' }}
                  </div>
                </div>
              </q-td>
            </template>

            <!-- 仓库库位信息显示 -->
            <template v-slot:body-cell-location_code="props">
              <q-td :props="props">
                <div>
                  <div>{{ props.row.warehouse_name }}</div>
                  <div class="text-caption text-grey">
                    {{ props.row.location_code }}
                  </div>
                </div>
              </q-td>
            </template>

            <!-- 数量显示 -->
            <template v-slot:body-cell-quantity="props">
              <q-td :props="props">
                <span :class="props.row.quantity >= 0 ? 'text-green-6' : 'text-red-6'">
                  {{ props.row.quantity >= 0 ? '+' : '' }}{{ props.row.quantity }}
                  {{ props.row.sku_unit || '' }}
                </span>
                <div class="text-caption text-grey">
                  {{ props.row.before_quantity }} → {{ props.row.after_quantity }}
                </div>
              </q-td>
            </template>

            <!-- 操作列 -->
            <template v-slot:body-cell-actions="props">
              <q-td :props="props">
                <q-btn size="sm" color="primary" icon="visibility" @click="viewDetails(props.row)" />
              </q-td>
            </template>
          </q-table>
        </q-card-section>
      </q-card>
    </div>

    <!-- 详情对话框 -->
    <q-dialog v-model="detailDialogVisible" maximized>
      <q-card>
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">库存变动详情</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <div class="row q-col-gutter-md">
            <!-- 基本信息 -->
            <div class="col-12">
              <q-card flat bordered>
                <q-card-section>
                  <div class="text-subtitle1 text-weight-bold">基本信息</div>
                  <q-separator class="q-mb-sm" />
                  <div class="row q-col-gutter-md">
                    <div class="col-md-3 col-sm-6 col-xs-12">
                      <div class="text-caption text-grey">交易单号</div>
                      <div>{{ selectedTransaction?.transaction_no }}</div>
                    </div>
                    <div class="col-md-3 col-sm-6 col-xs-12">
                      <div class="text-caption text-grey">交易类型</div>
                      <q-badge :color="getTransactionTypeColor(selectedTransaction?.transaction_type)"
                        :label="selectedTransaction?.transaction_type_display" />
                    </div>
                    <div class="col-md-3 col-sm-6 col-xs-12">
                      <div class="text-caption text-grey">参考单号</div>
                      <div>{{ selectedTransaction?.reference_no || '无' }}</div>
                    </div>
                    <div class="col-md-3 col-sm-6 col-xs-12">
                      <div class="text-caption text-grey">批次号</div>
                      <div>{{ selectedTransaction?.batch_number || '无' }}</div>
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>

            <!-- 商品信息 -->
            <div class="col-12">
              <q-card flat bordered>
                <q-card-section>
                  <div class="text-subtitle1 text-weight-bold">商品信息</div>
                  <q-separator class="q-mb-sm" />
                  <div class="row q-col-gutter-md">
                    <div class="col-md-3 col-sm-6 col-xs-12">
                      <div class="text-caption text-grey">商品名称</div>
                      <div>{{ selectedTransaction?.product_name || '' }}</div>
                    </div>
                    <div class="col-md-3 col-sm-6 col-xs-12">
                      <div class="text-caption text-grey">商品编码</div>
                      <div>{{ selectedTransaction?.product_code || '' }}</div>
                    </div>
                    <div class="col-md-3 col-sm-6 col-xs-12">
                      <div class="text-caption text-grey">规格型号</div>
                      <div>{{ selectedTransaction?.sku_spec || '' }}</div>
                    </div>
                    <div class="col-md-3 col-sm-6 col-xs-12">
                      <div class="text-caption text-grey">SKU编码</div>
                      <div>{{ selectedTransaction?.sku_code || '' }}</div>
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>

            <!-- 仓库信息 -->
            <div class="col-12">
              <q-card flat bordered>
                <q-card-section>
                  <div class="text-subtitle1 text-weight-bold">仓库信息</div>
                  <q-separator class="q-mb-sm" />
                  <div class="row q-col-gutter-md">
                    <div class="col-md-3 col-sm-6 col-xs-12">
                      <div class="text-caption text-grey">仓库库位</div>
                      <div>{{ selectedTransaction?.location_name || '' }}</div>
                    </div>
                    <div class="col-md-3 col-sm-6 col-xs-12">
                      <div class="text-caption text-grey">库位编码</div>
                      <div>{{ selectedTransaction?.location_code || '' }}</div>
                    </div>
                    <div class="col-md-3 col-sm-6 col-xs-12">
                      <div class="text-caption text-grey">变动数量</div>
                      <div :class="selectedTransaction?.quantity >= 0 ? 'text-green-6' : 'text-red-6'">
                        {{ selectedTransaction?.quantity >= 0 ? '+' : '' }}
                        {{ selectedTransaction?.quantity }}
                        {{ selectedTransaction?.sku_unit || '' }}
                      </div>
                    </div>
                    <div class="col-md-3 col-sm-6 col-xs-12">
                      <div class="text-caption text-grey">变动前后</div>
                      <div>
                        {{ selectedTransaction?.before_quantity }} → {{ selectedTransaction?.after_quantity }}
                      </div>
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>

            <!-- 操作信息 -->
            <div class="col-12">
              <q-card flat bordered>
                <q-card-section>
                  <div class="text-subtitle1 text-weight-bold">操作信息</div>
                  <q-separator class="q-mb-sm" />
                  <div class="row q-col-gutter-md">
                    <div class="col-md-3 col-sm-6 col-xs-12">
                      <div class="text-caption text-grey">操作人</div>
                      <div>{{ selectedTransaction?.created_by_name }}</div>
                    </div>
                    <div class="col-md-3 col-sm-6 col-xs-12">
                      <div class="text-caption text-grey">操作时间</div>
                      <div>{{ formatDate(selectedTransaction?.created_at) }}</div>
                    </div>
                    <div class="col-md-6 col-sm-12 col-xs-12">
                      <div class="text-caption text-grey">备注</div>
                      <div>{{ selectedTransaction?.notes || '无' }}</div>
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn label="关闭" color="secondary" @click="detailDialogVisible = false" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { useQuasar } from 'quasar'
import { getInventoryTransactions, exportInventoryTransactions, downloadInventoryTransaction } from 'src/services/inventoryTransactionApi'
import { getWarehouseOptions } from 'src/services/settingsServiceApi'
import DateRangePicker from 'components/DateRangePicker.vue'

// 初始化 Quasar
const $q = useQuasar()


const searchForm = ref(null)
// 状态管理
const transactions = ref([])
const loading = ref(false)
const pagination = ref({
  page: 1,
  rowsPerPage: 10,
  sortBy: 'created_at',
  descending: true
})

// 筛选条件
const searchQuery = ref('')
const filters = reactive({
  warehouse: null,
  transaction_type: null
})
const startDate = ref('')
const endDate = ref('')

// 详情对话框
const detailDialogVisible = ref(false)
const selectedTransaction = ref(null)


// 库房列表选项
const warehouseOptions = ref([])
// 交易类型选项
const transactionTypes = [
  { label: '初始化', value: 'init' },
  { label: '入库', value: 'in' },
  { label: '出库', value: 'out' },
  { label: '调整', value: 'adjust' },
  { label: '调拨入库', value: 'transfer_in' },
  { label: '调拨出库', value: 'transfer_out' }
]

// 表格列定义
const columns = [
  { name: 'transaction_no', label: '交易单号', field: 'transaction_no', sortable: true },
  { name: 'product_name', label: '商品信息', field: 'product_name' },
  { name: 'location_code', label: '仓库库位', field: 'location_code' },
  { name: 'transaction_type', label: '交易类型', field: 'transaction_type' },
  { name: 'quantity', label: '变动数量', field: 'quantity', sortable: true },
  { name: 'created_by_name', label: '操作人', field: 'created_by_name' },
  {
    name: 'created_at',
    label: '操作时间',
    field: 'created_at',
    sortable: true,
    format: (val) => formatDate(val)
  },
  { name: 'actions', label: '操作', align: 'center', field: 'actions' }
]
// 格式化日期 - 改进版本
const formatDate = (dateString) => {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    // 检查日期是否有效
    if (isNaN(date.getTime())) return dateString

    // 格式化为 "YYYY-MM-DD HH:mm:ss"
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  } catch (error) {
    console.error('日期格式化错误:', error)
    return dateString
  }
}
// 获取交易类型对应的颜色
const getTransactionTypeColor = (type) => {
  switch (type) {
    case 'init': return 'blue-grey'
    case 'in': return 'green'
    case 'out': return 'red'
    case 'adjust': return 'orange'
    case 'transfer': return 'blue'
    default: return 'grey'
  }
}
/** 加载仓库列表（用于下拉选择） */
const fetchWarehouses = async () => {
  try {
    const res = await getWarehouseOptions()
    warehouseOptions.value = res.data || []
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: '加载仓库列表失败：' + (error.response?.data?.error || error.message)
    })
  }
}
// 更严格的日期比较函数
const isValidDateRange = (start, end) => {
  if (!start || !end) return false

  const startDateObj = new Date(start)
  const endDateObj = new Date(end)

  // 检查日期有效性
  if (isNaN(startDateObj) || isNaN(endDateObj)) return false

  // 比较日期大小
  return startDateObj <= endDateObj
}
const buildRequestParams = () => {
  const params = {
    page: pagination.value.page,
    page_size: pagination.value.rowsPerPage,
    ordering: pagination.value.sortBy ? (pagination.value.descending ? `-${pagination.value.sortBy}` : pagination.value.sortBy) : '',
  }

  // 仓库筛选
  if (filters.warehouse) {
    params.warehouse_id = filters.warehouse.id
  }
  // 交易类型筛选
  if (filters.transaction_type) {
    params.transaction_type = filters.transaction_type
  }


  if (isValidDateRange(startDate.value, endDate.value)) {
    params.start_date = startDate.value
    params.end_date = endDate.value
  }

  console.log('请求参数:', params)
  // 搜索参数
  const searchTerms = []
  if (searchQuery.value) {
    searchTerms.push(searchQuery.value)
  }
  if (searchTerms.length > 0) {
    params.search = searchTerms.join(' ')
  }
  return params
}

const handleFetchTransactions = () => {
  pagination.value.page = 1
  setTimeout(() => {
    fetchTransactions()
  }, 300)
}

// 获取数据
const fetchTransactions = async () => {
  try {
    loading.value = true
    const params = buildRequestParams()
    // 调用API
    const response = await getInventoryTransactions(params)

    // 处理响应数据
    transactions.value = response.data.results
    pagination.value.rowsNumber = response.data.count
  } catch (error) {
    console.error('获取库存变动记录失败:', error)
    $q.notify({
      color: 'negative',
      message: '获取库存变动记录失败，请重试',
      position: 'top'
    })
  } finally {
    loading.value = false
  }
}

// 处理表格请求（分页、排序）
const onRequest = (props) => {
  const { page, rowsPerPage, sortBy, descending } = props.pagination
  pagination.value.page = page
  pagination.value.rowsPerPage = rowsPerPage
  pagination.value.sortBy = sortBy
  pagination.value.descending = descending
  fetchTransactions()
}
// 重置筛选条件

const resetFilters = () => {
  searchQuery.value = ''
  filters.transaction_type = null
  filters.warehouse = null
  startDate.value = ''  // 改为 ''
  endDate.value = ''    // 改为 ''
  pagination.value.page = 1

  handleFetchTransactions()
}

const onDateRangeChange = ({ startDate: newStartDate, endDate: newEndDate }) => {
  startDate.value = newStartDate
  endDate.value = newEndDate
  fetchTransactions()
}
// 导出筛选后的交易记录
const exportFilteredTransactionRecords = async () => {
  try {
    loading.value = true

    // 构建查询参数 - 使用与获取数据相同的逻辑
    const params = buildRequestParams()

    // 移除分页和排序参数，因为导出需要所有匹配的数据
    delete params.page
    delete params.page_size
    delete params.ordering

    // 调用导出API
    const response = await exportInventoryTransactions({
      params,
      responseType: 'blob'
    })

    // 处理导出文件
    const blob = new Blob([response.data])
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url

    // 生成更具描述性的文件名
    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10)
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '')
    const filename = `库存变动记录_筛选_${dateStr}_${timeStr}.xlsx`

    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // 清理内存
    window.URL.revokeObjectURL(url)

    $q.notify({
      color: 'positive',
      message: '筛选数据导出成功',
      position: 'top'
    })
  } catch (error) {
    console.error('导出库存变动记录失败:', error)
    $q.notify({
      color: 'negative',
      message: `导出失败: ${error.response?.data?.error || error.message || '未知错误'}`,
      position: 'top'
    })
  } finally {
    loading.value = false
  }
}

// 查看详情
const viewDetails = (transaction) => {
  selectedTransaction.value = transaction
  detailDialogVisible.value = true
}
/** 加载数据 */
// 页面挂载时加载数据
onMounted(() => {
  fetchTransactions()
  fetchWarehouses()
})

// 新增和导入功能（暂未实现）
const createTransaction = () => {
  $q.notify({
    message: '此功能尚未实现',
    color: 'info',
    position: 'top'
  })
}

const openImportDialog = () => {
  $q.notify({
    message: '此功能尚未实现',
    color: 'info',
    position: 'top'
  })
}

// 导出所有交易数据
const exportTransactionRecords = async () => {
  try {
    loading.value = true

    // 调用导出所有数据的API
    const response = await downloadInventoryTransaction({
      responseType: 'blob'
    })

    // 处理导出文件
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    const filename = `库存变动记录_全部_${new Date().toISOString().slice(0, 10)}.xlsx`
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url) // 清理内存

    $q.notify({
      color: 'positive',
      message: '所有数据导出成功',
      position: 'top'
    })
  } catch (error) {
    console.error('导出所有库存变动记录失败:', error)
    $q.notify({
      color: 'negative',
      message: '导出所有库存变动记录失败，请重试',
      position: 'top'
    })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.text-green-6 {
  color: #2e7d32;
  font-weight: bold;
}

.text-red-6 {
  color: #d32f2f;
  font-weight: bold;
}
</style>
