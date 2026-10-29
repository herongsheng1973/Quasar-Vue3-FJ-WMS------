<template>
  <q-page class="q-pa-md">
    <!-- 页面标题 -->
    <div class="col-12 flex flex-wrap justify-between items-center gap-4">
      <div class="col-6 q-py-none">
        <h5 class="text-h5 text-weight-bold text-grey-8 q-ma-none">出库单管理</h5>
        <p class="text-grey-5 text-subtitle1">查看和管理所有出库单</p>
      </div>
      <div class="col-6 flex items-center justify-end">
        <q-btn label="新增" color="primary" icon="add" @click="toCreate" />
        <q-btn-dropdown color="primary" label="导入" icon="upload" size="md">
          <q-list>
            <q-item clickable v-close-popup @click="showInitImportDialog = true">
              <q-item-section avatar>
                <q-icon name="cloud_upload" />
              </q-item-section>
              <q-item-section>
                <q-item-label>初始化导入</q-item-label>
                <q-item-label caption>覆盖现有数据</q-item-label>
              </q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="showNormalImportDialog = true">
              <q-item-section avatar>
                <q-icon name="playlist_add" />
              </q-item-section>
              <q-item-section>
                <q-item-label>增量导入</q-item-label>
                <q-item-label caption>新增或更新数据</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
        <q-btn label="下载导入模板" color="secondary" icon="file_download" @click="downloadImportTemplate" />
        <q-btn label="导出出库单" color="teal" icon="download" @click="handleExportAllStockOutData" />
      </div>
    </div>

    <!-- 筛选和搜索区域 -->
    <div class="col-12 q-py-none">
      <q-card>
        <q-card-section>
          <q-form class="row q-col-gutter-md items-center">
            <!-- 仓库筛选 -->
            <div class="col">
              <q-select v-model="filterParams.warehouse" label="仓库" :options="warehouses" option-label="name"
                option-value="id" map-options clearable />
            </div>
            <!-- 客户筛选 -->
            <div class="col-2">
              <q-select v-model="filterParams.customer" label="客户" :options="customers" option-label="name"
                option-value="id" map-options clearable />
            </div>
            <!-- 出库单号筛选 -->
            <div class="col-2">
              <q-input v-model="searchParams.order_no" label="出库单号">
                <template v-slot:append>
                  <q-icon name="search" @click="fetchStockOutOrders" />
                </template>
              </q-input>
            </div>
            <!-- 状态筛选 -->
            <div class="col-1">
              <q-select v-model="filterParams.status" label="状态" :options="statusOptions" option-label="label"
                option-value="value" emit-value clearable />
            </div>

            <!-- 出库日期范围筛选 -->
            <div class="col">
              <q-input>
                <template v-slot:prepend>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-date v-model="dateRange" range mask="YYYY-MM-DD" :locale="datePickerLocale">
                        <div class="row items-center justify-end">
                          <q-btn label="清除" color="primary" flat @click="clearDateRange" />
                          <q-btn v-close-popup label="确定" color="primary" flat @click="applyDateRange" />
                        </div>
                      </q-date>
                    </q-popup-proxy>
                  </q-icon>
                </template>

                <template v-slot:append>
                  <span v-if="filterParams.start_order_date && filterParams.end_order_date">
                    {{ filterParams.start_order_date }} ~ {{ filterParams.end_order_date }}
                  </span>
                  <span v-else-if="filterParams.start_order_date && !filterParams.end_order_date">
                    从 {{ filterParams.start_order_date }}
                  </span>
                  <span v-else-if="!filterParams.start_order_date && filterParams.end_order_date">
                    至 {{ filterParams.end_order_date }}
                  </span>
                  <span v-else>
                    选择日期范围
                  </span>
                </template>
              </q-input>
            </div>

            <!-- 操作按钮 -->
            <div class="flex no-wrap q-gutter-sm">
              <div class="flex no-wrap q-gutter-sm">
                <q-btn label="查询" color="primary" @click="fetchStockOutOrders" />
                <q-btn label="重置" color="secondary" @click="resetFilters" />
                <q-btn label="导出数据" color="accent" @click="handleExportFilteredStockOutData" />
              </div>
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </div>

    <!-- 出库单列表 -->
    <div class="row">
      <div class="col">
        <q-table ref="tableRef" :rows="stockOutOrders" :columns="tableColumns" :loading="tableLoading"
          v-model:pagination="pagination" :filter="filterParams" :rows-per-page-options="[10, 20, 50, 100]"
          @request="handleRequest" row-key="id" flat bordered wrap-cells>
          <!-- 添加序号列的插槽 -->
          <template v-slot:body-cell-index="props">
            <q-td :props="props">
              <q-badge color="primary">
                {{ (pagination.page - 1) * pagination.rowsPerPage + props.pageIndex + 1 }}
              </q-badge>
            </q-td>
          </template>
          <template v-slot:body-cell-status="props">
            <q-td :props="props">
              <q-badge :color="getStatusColor(props.row.status)">
                {{ getStatusText(props.row.status) }}
              </q-badge>
            </q-td>
          </template>
          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <div v-if="canSubmit(props.row.status)" class="q-gutter-xs">
                <q-btn size="sm" label="查看" color="primary" @click="viewDetails(props.row)" />
                <q-btn size="sm" label="编辑" color="secondary" @click="toEdit(props.row)" />
                <q-btn size="sm" label="提交" color="negative" @click="submitOrder(props.row)" />
                <q-btn size="sm" label="取消" color="negative" @click="cancelOrder(props.row)" />
              </div>
              <div v-else-if="canApprove(props.row.status)" class="q-gutter-x-sm">
                <q-btn size="sm" label="查看" color="primary" @click="viewDetails(props.row)" />
                <q-btn size="sm" label="审核" color="accent" @click="approveOrder(props.row)" />
                <q-btn size="sm" label="取消" color="negative" @click="cancelOrder(props.row)" />
              </div>
              <div v-else-if="canComplete(props.row.status)" class="q-gutter-xs">
                <q-btn size="sm" label="查看" color="primary" @click="viewDetails(props.row)" />
                <q-btn size="sm" label="完成" color="positive" @click="completeOrder(props.row)" />
                <q-btn size="sm" label="取消" color="negative" @click="cancelOrder(props.row)" />
              </div>
              <div v-else-if="completed(props.row.status)" class="q-gutter-xs">
                <q-btn size="sm" label="查看" color="primary" @click="viewDetails(props.row)" />
                <q-btn size="sm" icon="print" label="前端打印" color="primary" @click="printStockOrderPdf(props.row)" />
                <q-btn size="sm" icon="print" label="后端打印" color="primary" @click="printStockOrder_Pdf(props.row)" />
              </div>
              <div v-else class="q-gutter-xs">
                <q-btn size="sm" label="查看" color="primary" @click="viewDetails(props.row)" />
                <q-btn size="sm" label="恢复" color="secondary" @click="restoreOrder(props.row)" />
                <q-btn size="sm" label="删除" color="red" @click="deleteOrder(props.row)" />
              </div>
            </q-td>
          </template>
        </q-table>
      </div>
    </div>

    <!-- 详情对话框 -->
    <q-dialog v-model="detailDialogVisible">
      <q-card style="width: 800px; max-width: 90vw;">
        <!-- 👇 给需要打印的区域加 ref 和 print-area 类 -->
        <div class="print-body" ref="printTarget">

          <q-card-section>
            <h5 class="text-h5">出库单详情</h5>
            <div class="row q-col-gutter-md">
              <div class="col-6">
                <span class="text-grey-500">出库单号：</span>
                <span>{{ currentOrderDetail.order_no }}</span>
              </div>
              <div class="col-6">
                <span class="text-grey-500">出库日期：</span>
                <span>{{ formatDate(currentOrderDetail.order_date) }}</span>
              </div>
              <div class="col-6">
                <span class="text-grey-500">仓库：</span>
                <span>{{ currentOrderDetail.warehouse }}</span>
              </div>
              <div class="col-6">
                <span class="text-grey-500">客户：</span>
                <span>{{ currentOrderDetail.customer }}</span>
              </div>
              <div class="col-6">
                <span class="text-grey-500">状态：</span>
                <span :class="getStatusColor(currentOrderDetail.status)">{{ getStatusText(currentOrderDetail.status)
                }}</span>
              </div>
              <div class="col-6">
                <span class="text-grey-500">总金额：</span>
                <span>{{ formatCurrency(currentOrderDetail.total_amount) }}</span>
              </div>
              <div class="col-6">
                <span class="text-grey-500">创建人：</span>
                <span>{{ currentOrderDetail.created_by }}</span>
              </div>
              <div class="col-6">
                <span class="text-grey-500">创建时间：</span>
                <span>{{ formatDateTime(currentOrderDetail.created_at) }}</span>
              </div>
              <div class="col-6" v-if="currentOrderDetail.approved_by">
                <span class="text-grey-500">审核人：</span>
                <span>{{ currentOrderDetail.approved_by }}</span>
              </div>
              <div class="col-6" v-if="currentOrderDetail.approved_at">
                <span class="text-grey-500">审核时间：</span>
                <span>{{ formatDateTime(currentOrderDetail.approved_at) }}</span>
              </div>
            </div>

            <h6 class="text-h6 mt-6">出库明细</h6>
            <q-table :rows="currentOrderDetail.items || []" :columns="detailColumns" row-key="id" dense class="mt-2"
              :rows-per-page-options="[10, 20, 30, 50, 0]">
              <template v-slot:body-cell-product="props">
                <q-td :props="props">
                  <div>{{ props.row.sku_name }}</div>
                  <div class="text-grey-7 text-caption">{{ props.row.sku_code }}</div>
                </q-td>
              </template>

              <template v-slot:body-cell-location="props">
                <q-td :props="props">
                  <div>{{ props.row.location_code }}</div>
                </q-td>
              </template>

              <template v-slot:body-cell-unit_price="props">
                <q-td :props="props" class="text-right">
                  {{ formatCurrency(props.row.unit_price) }}
                </q-td>
              </template>

              <template v-slot:body-cell-amount="props">
                <q-td :props="props" class="text-right">
                  {{ formatCurrency(props.row.quantity * props.row.unit_price) }}
                </q-td>
              </template>

              <template v-slot:body-cell-quantity="props">
                <q-td :props="props" class="text-right">
                  {{ props.row.quantity }}
                </q-td>
              </template>
              <template v-slot:body-cell-manufacture_date="props">
                <q-td :props="props">
                  {{ formatDate(props.row.manufacture_date) }}
                </q-td>
              </template>

              <template v-slot:body-cell-expiration_date="props">
                <q-td :props="props">
                  {{ formatDate(props.row.expiration_date) }}
                </q-td>
              </template>
            </q-table>

            <div class="row q-col-gutter-md">
              <div class="col-6">
                <span class="text-grey-500">备注：</span>
                <span>{{ currentOrderDetail.notes || '无' }}</span>
              </div>
              <div class="col-6" v-if="currentOrderDetail.approval_notes">
                <span class="text-grey-500">审核备注：</span>
                <span>{{ currentOrderDetail.approval_notes || '无' }}</span>
              </div>
            </div>
          </q-card-section>
        </div>
        <!-- 👇 按钮区域保持不变，打印时会自动隐藏 -->
        <q-card-actions align="right">
          <q-btn label="打印" color="primary" @click="handlePrint" />
          <q-btn label="关闭" @click="detailDialogVisible = false" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 审核对话框 -->
    <q-dialog v-model="approvalDialogVisible">
      <q-card style="width: 500px; max-width: 90vw;">
        <q-card-section>
          <h5 class="text-h5">审核出库单</h5>
          <q-form class="mt-4">
            <q-radio v-model="approvalStatus" label="通过" val="approved" />
            <q-radio v-model="approvalStatus" label="驳回" val="draft" class="mt-2" />
            <q-input v-model="approvalNotes" label="审核备注" type="textarea" class="mt-4" />
          </q-form>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn label="取消" @click="approvalDialogVisible = false" />
          <q-btn label="提交" color="primary" @click="submitApproval" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 1. 初始化导入弹窗 -->
    <q-dialog v-model="showInitImportDialog" max-width="700px">
      <q-card>
        <q-card-section class="row items-center justify-between">
          <h5 class="text-h5 text-negative">⚠️ 出库单初始化导入</h5>
          <q-btn icon="close" flat round @click="showInitImportDialog = false" />
        </q-card-section>
        <q-card-section class="q-pa-md">
          <div class="space-y-4">
            <!-- 风险提示 -->
            <div class="bg-negative/10 p-3 rounded border border-negative/20">
              <h6 class="text-negative font-medium flex items-center">
                <q-icon name="warning" class="q-mr-sm" />
                重要提醒
              </h6>
              <ul class="text-sm mt-2 space-y-1 text-gray-700">
                <li>1. 初始化导入将<span class="font-medium text-negative">覆盖现有出库单数据</span>，适用于系统首次上线或全量数据重置</li>
                <li>2. 若勾选"清空现有数据"，将删除所有出库单记录，<span class="font-medium text-negative">操作不可撤销</span></li>
                <li>3. 请确保导入文件包含"仓库编码、出库单编码、出库单名称"等必填字段（建议先下载模板）</li>
              </ul>
            </div>

            <!-- 模板下载 -->
            <div class="flex justify-between items-center">
              <p class="text-sm">请下载模板并按格式填写数据</p>
              <q-btn label="下载初始化模板" color="secondary" icon="file_download" size="sm" @click="downloadInitTemplate" />
            </div>

            <!-- 文件上传 -->
            <q-uploader label="选择导入文件（仅支持.xlsx/.xls）" accept=".xlsx, .xls" :max-files="1" @added="handleFileSelected"
              @remove-file="() => { selectedFile = null; importErrors = []; }" dense class="mt-2">
              <template #file="{ file, remove }">
                <div class="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <div class="flex items-center">
                    <q-icon name="file-excel" color="teal" class="q-mr-sm" />
                    <span class="text-sm">{{ file.name }}</span>
                  </div>
                  <q-btn icon="close" size="sm" flat @click="remove" />
                </div>
              </template>
            </q-uploader>

            <!-- 清空现有数据选项 -->
            <div class="flex items-center mt-4">
              <q-checkbox v-model="initClearExisting" label="清空现有出库单数据" color="negative"
                @update:model-value="handleClearConfirm" />
            </div>

            <!-- 导入结果/错误展示 -->
            <div v-if="importErrors.length > 0" class="mt-4">
              <h6 class="text-negative text-sm font-medium">导入失败记录（共{{ importErrors.length }}条）</h6>
              <div class="bg-white border border-gray-200 rounded mt-2 max-h-60 overflow-auto">
                <q-table :rows="importErrors" :columns="importErrorColumns" row-key="row" dense hide-header flat />
              </div>
              <q-btn label="下载错误详情" color="negative" size="sm" class="mt-2" @click="downloadImportErrors" dense />
            </div>

            <!-- 初始化成功统计 -->
            <div v-if="initImportResult" class="mt-4 bg-positive/10 p-3 rounded">
              <h6 class="text-positive font-medium">出库单初始化导入成功</h6>
              <ul class="text-sm mt-2 space-y-1">
                <li>成功创建出库单记录：{{ initImportResult.success_count }} 条</li>
                <li>失败记录：{{ initImportResult.error_count }} 条</li>
              </ul>
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md">
          <q-btn label="取消" color="secondary" @click="resetInitImportState" />
          <q-btn label="开始出库单初始化" color="negative" class="ml-2" @click="handleInitImport"
            :disabled="!selectedFile || importLoading" :loading="importLoading" />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <!-- 2. 增量导入弹窗 -->
    <q-dialog v-model="showNormalImportDialog" max-width="700px">
      <q-card>
        <q-card-section class="row items-center justify-between">
          <h5 class="text-h5">出库单增量导入</h5>
          <q-btn icon="close" flat round @click="showNormalImportDialog = false" />
        </q-card-section>
        <q-card-section class="q-pa-md">
          <div class="space-y-4">
            <p class="text-sm">增量导入仅新增/更新出库单记录，不删除现有数据，适用于日常批量更新</p>
            <div class="flex justify-between items-center">
              <p class="text-sm">请下载模板并按格式填写数据</p>
              <q-btn label="下载增量导入模板" color="secondary" icon="file_download" size="sm"
                @click="downloadNormalTemplate" />
            </div>
            <q-uploader label="选择导入文件（仅支持.xlsx/.xls）" accept=".xlsx, .xls" :max-files="1" @added="handleFileSelected"
              @remove-file="() => { selectedFile = null; importErrors = []; }" dense />
            <div v-if="importErrors.length > 0" class="mt-4">
              <h6 class="text-negative text-sm font-medium">出库单导入失败记录（共{{ importErrors.length }}条）</h6>
              <div class="bg-white border border-gray-200 rounded mt-2 max-h-40 overflow-auto">
                <q-table :rows="importErrors" :columns="importErrorColumns" row-key="row" dense hide-header flat />
              </div>
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md">
          <q-btn label="取消" color="secondary" @click="showNormalImportDialog = false" />
          <q-btn label="开始导入" color="primary" class="ml-2" @click="handleNormalImport"
            :disabled="!selectedFile || importLoading" :loading="importLoading" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
const router = useRouter()
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
  getStockOutOrders,
  printStockOutOrder,
  getStockOutOrderDetail,
  submitStockOutOrder,
  approveStockOutOrder,
  rejectStockOutOrder,
  completeStockOutOrder,
  cancelStockOutOrder,
  deleteStockOutOrder,
  restoreStockOutOrder,
  exportStockOutOrder,
  exportStockOutTemplate,
  importStockOutOrder
} from 'src/services/inventoryServiceApi'

import { getCustomerOptions, getLocationOptions, getWarehouseOptions } from "src/services/settingsServiceApi"
import { getProductList, getProductSkus } from "src/services/productServiceApi"
const $q = useQuasar()

// 状态选项
const statusOptions = [
  { label: '草稿', value: 'draft' },
  { label: '待审核', value: 'pending' },
  { label: '已审核', value: 'approved' },
  { label: '已完成', value: 'completed' },
  { label: '已取消', value: 'cancelled' }
]

// 表格列定义
const tableColumns = [
  { name: 'index', label: '序号', field: 'index', align: 'center', width: '80px' },
  { name: 'order_no', label: '出库单号', field: 'order_no' },
  { name: 'warehouse', label: '仓库', field: 'warehouse_code' },
  { name: 'customer', label: '客户', field: 'customer_name' },
  { name: 'order_date', label: '出库日期', field: 'order_date' },
  { name: 'status', label: '状态', field: row => getStatusText(row.status) },
  { name: 'total_amount', label: '总金额', field: 'total_amount' },
  { name: 'created_by', label: '创建人', field: 'created_by_name' },
  { name: 'created_at', label: '创建时间', field: 'created_at' },
  { name: 'actions', label: '操作', field: 'actions', align: 'center' }
]

// 详情表格列定义
const detailColumns = [
  { name: 'product', label: '商品', field: 'sku_name', align: 'left' },
  { name: 'location', label: '库位', field: 'location_code', align: 'left' },
  { name: 'quantity', label: '数量', field: 'quantity', align: 'right' },
  { name: 'unit_price', label: '单价', field: 'unit_price', align: 'right' },
  { name: 'amount', label: '金额', field: 'amount', align: 'right' },
  { name: 'batch_number', label: '批次号', field: 'batch_number' },
  { name: 'manufacture_date', label: '生产日期', field: row => formatDate(row.manufacture_date) },
  { name: 'expiration_date', label: '过期日期', field: row => formatDate(row.expiration_date) }
]

// 新增的导入对话框状态
const showInitImportDialog = ref(false) // 初始化导入弹窗
const showNormalImportDialog = ref(false) // 增量导入弹窗

// 导入相关
const selectedFile = ref(null)
const importLoading = ref(false)
const importErrors = ref([])
const initClearExisting = ref(false) // 初始化是否清空现有数据
const initImportResult = ref(null) // 初始化导入结果

// 响应式变量
const stockOutOrders = ref([])
const customers = ref([])
const products = ref([])
const locations = ref([])
const warehouses = ref([])
const tableLoading = ref(false)
const filterParams = ref({
  warehouse: null,
  customer: null,
  status: '',
  start_order_date: null,
  end_order_date: null
})
const searchParams = ref({
  order_no: '',
})
const skus = ref([])

const currentOrder = ref(null)
const detailDialogVisible = ref(false)
const currentOrderDetail = ref({})
const approvalDialogVisible = ref(false)
const approvalStatus = ref('approved')
const approvalNotes = ref('')

const selectedFileName = ref('')
const fileToImport = ref(null)
const dateRange = ref({ from: null, to: null })

// 日期选择器本地化设置
const datePickerLocale = {
  days: '日_一_二_三_四_五_六'.split('_'),
  daysShort: '日_一_二_三_四_五_六'.split('_'),
  months: '一月_二月_三月_四月_五月_六月_七月_八月_九月_十月_十一月_十二月'.split('_'),
  monthsShort: '1月_2月_3月_4月_5月_6月_7月_8月_9月_10月_11月_12月'.split('_')
}
// 导入错误表格列
const importErrorColumns = ref([
  { name: 'row', label: '行号', field: 'row', width: '80px' },
  { name: 'data', label: '数据', field: 'data', format: (val) => JSON.stringify(val).slice(0, 50) + '...' },
  { name: 'error', label: '错误原因', field: 'error' }
])

const pagination = ref({
  rowsPerPage: 10,
  page: 1,
  rowsNumber: 0
})

// 格式化货币
const formatCurrency = (value) => {
  if (!value) return '0.00'
  return parseFloat(value).toFixed(2)
}
const printTarget = ref(null)
const handlePrint = () => {
  // 给要打印的区域加个标记
  const el = printTarget.value
  if (!el) return

  el.classList.add('print-now')

  // 执行打印
  window.print()

  // 打印完移除标记
  setTimeout(() => {
    el.classList.remove('print-now')
  }, 100)
}
// 日期验证函数 - 允许空值
const isValidDate = (dateString) => {
  if (!dateString) return true // 空值视为有效
  // 检查是否为有效日期格式 YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(dateString)) return false

  // 进一步验证日期有效性
  const date = new Date(dateString)
  return date instanceof Date && !isNaN(date) && dateString === date.toISOString().split('T')[0]
}

// 应用日期范围筛选
const applyDateRange = () => {
  // 如果只选择了一个日期，则将开始和结束日期都设为该日期
  if (!dateRange.value.from && !dateRange.value.to && dateRange.value) {
    filterParams.value.start_order_date = dateRange.value
    filterParams.value.end_order_date = dateRange.value
    if (!isValidDate(filterParams.value.start_order_date) || !isValidDate(filterParams.value.end_order_date)) {
      $q.notify({
        color: 'negative',
        message: '请输入有效的日期范围'
      })
      tableLoading.value = false
      return
    }
  }
  // 如果选择了两个日期，则正常设置范围
  else if (dateRange.value.from && dateRange.value.to) {
    // 确保开始日期不大于结束日期
    if (dateRange.value.from <= dateRange.value.to) {
      filterParams.value.start_order_date = dateRange.value.from
      filterParams.value.end_order_date = dateRange.value.to
    } else {
      filterParams.value.start_order_date = dateRange.value.to
      filterParams.value.end_order_date = dateRange.value.from
    }
  }
  // 如果没有选择日期，则清空筛选条件
  else {
    filterParams.value.start_order_date = null
    filterParams.value.end_order_date = null
  }
}

// 清除日期范围
const clearDateRange = () => {
  dateRange.value = { from: null, to: null }
  filterParams.value.start_order_date = null
  filterParams.value.end_order_date = null
}


// 去新增
const toCreate = () => {
  router.push('/operations/stock-out/create')
}

// 去编辑
const toEdit = (row) => {
  router.push(`/operations/stock-out/edit/${row.id}`)
}
const fetchCustomers = async () => {
  try {
    const response = await getCustomerOptions()
    customers.value = response.data || []
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.response?.data?.error || '获取客户列表失败'
    })
  }
}

const fetchProducts = async () => {
  try {
    const response = await getProductList()
    products.value = response.data.results || []
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.response?.data?.error || '获取商品列表失败'
    })
  }
}

const fetchLocations = async (warehouseId = 1) => {
  try {
    const params = {
      page: 1,
      page_size: 1000,
      warehouse_id: warehouseId
    }
    const response = await getLocationOptions(params)
    locations.value = response.data || []
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.response?.data?.error || '获取库位列表失败'
    })
  }
}

const fetchSkus = async () => {
  try {
    const response = await getProductSkus()
    skus.value = response.data.results || []
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.response?.data?.error || '获取SKU列表失败'
    })
  }
}

// 初始化
onMounted(() => {
  fetchStockOutOrders()
  fetchCustomers()
  fetchProducts()
  fetchLocations(1)
  fetchWarehouses()
  fetchSkus()
})
const buildQueryParams = () => {
  // 基础分页参数
  const params = {
    page: pagination.value.page,
    page_size: pagination.value.rowsPerPage
  }

  // 仓库筛选
  if (filterParams.value.warehouse) {
    params.warehouse_id = filterParams.value.warehouse.id
  }

  // 客户筛选
  if (filterParams.value.customer) {
    params.customer_id = filterParams.value.customer.id
  }

  // 状态筛选
  if (filterParams.value.status) {
    params.status = filterParams.value.status
  }

  // 日期范围
  const start = filterParams.value.start_order_date
  const end = filterParams.value.end_order_date

  if (start && end) {
    if (start === end) {
      params.order_date = start
    } else if (start < end) {
      params.order_date_start = start
      params.order_date_end = end
    }
  }

  // 搜索订单号
  if (searchParams.value.order_no) {
    params.search = searchParams.value.order_no
  }

  return params
}
// 获取出库单列表
const fetchStockOutOrders = async () => {
  tableLoading.value = true

  try {
    // 直接调用构建好的参数 ✅
    const params = buildQueryParams()
    const response = await getStockOutOrders(params)

    stockOutOrders.value = response.data.results || []
    pagination.value.rowsNumber = response.data.count || 0
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.response?.data?.error || '获取出库单失败'
    })
  } finally {
    tableLoading.value = false
  }
}

// 分页、筛选、每页行数变化时触发
const handleRequest = (props) => {
  // 同步 Quasar 表格的分页信息（关键！）
  pagination.value.page = props.pagination.page
  pagination.value.rowsPerPage = props.pagination.rowsPerPage

  // 重新获取数据
  fetchStockOutOrders()
}

// 获取仓库列表
const fetchWarehouses = async () => {
  try {
    const response = await getWarehouseOptions({ active: true })
    warehouses.value = response.data || []
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.response?.data?.error || '获取仓库列表失败'
    })
  }
}

// 查看详情
const viewDetails = async (row) => {
  try {
    const response = await getStockOutOrderDetail(row.id)
    currentOrderDetail.value = response.data
    detailDialogVisible.value = true
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.response?.data?.error || '获取详情失败'
    })
  }
}

const submitOrder = async (row) => {
  try {
    await submitStockOutOrder(row.id)
    $q.notify({
      color: 'positive',
      message: '提交成功'
    })
    fetchStockOutOrders()
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.response?.data?.error || '提交失败'
    })
  }
}

// 审核订单
const approveOrder = (row) => {
  currentOrder.value = row
  approvalStatus.value = 'approved'
  approvalNotes.value = ''
  approvalDialogVisible.value = true
}

// 提交审核
const submitApproval = async () => {
  if (!approvalNotes.value) {
    $q.notify({
      color: 'negative',
      message: '请填写审核意见'
    })
    return
  }
  if (approvalStatus.value === 'approved') {
    try {
      await approveStockOutOrder(
        currentOrder.value.id,
        approvalStatus.value === 'approved',
        approvalNotes.value
      )
      $q.notify({
        color: 'positive',
        message: `出库单已${approvalStatus.value === 'approved' ? '通过' : '驳回'}审核`
      })
      approvalDialogVisible.value = false
      fetchStockOutOrders()
    } catch (error) {
      $q.notify({
        color: 'negative',
        message: error.response?.data?.error || '审核失败'
      })
    }
  } else {
    try {
      await rejectStockOutOrder(
        currentOrder.value.id,
        true,
        approvalNotes.value
      )
      $q.notify({
        color: 'red',
        message: `出库单已${approvalStatus.value === 'rejected' ? '驳回' : '通过'}审核`
      })
      approvalDialogVisible.value = false
      fetchStockOutOrders()
    } catch (error) {
      $q.notify({
        color: 'negative',
        message: error.response?.data?.error || '审核失败'
      })
    }
  }

}

// 完成订单
const completeOrder = async (row) => {
  $q.dialog({
    title: '确认完成',
    message: '确定要完成此出库单吗？完成后将更新库存。',
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      await completeStockOutOrder(row.id)
      $q.notify({
        color: 'positive',
        message: '出库单已完成'
      })
      fetchStockOutOrders()
    } catch (error) {
      $q.notify({
        color: 'negative',
        message: error.response?.data?.error || '操作失败'
      })
    }
  })
}

// 取消订单
const cancelOrder = async (row) => {
  $q.dialog({
    title: '确认取消',
    message: '确定要取消此出库单吗？',
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      await cancelStockOutOrder(row.id)
      $q.notify({
        color: 'positive',
        message: '出库单已取消'
      })
      fetchStockOutOrders()
    } catch (error) {
      $q.notify({
        color: 'negative',
        message: error.response?.data?.error || '操作失败'
      })
    }
  })
}
const deleteOrder = async (row) => {
  $q.dialog({
    title: '确认删除',
    message: '确定要删除此出库单吗？',
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      await deleteStockOutOrder(row.id)
      $q.notify({
        color: 'positive',
        message: '出库单已删除'
      })
      fetchStockOutOrders()
    } catch (error) {
      $q.notify({
        color: 'negative',
        message: error.response?.data?.error || '操作失败'
      })
    }
  })
}

const restoreOrder = async (row) => {
  $q.dialog({
    title: '确认恢复',
    message: '确定要恢复此出库单吗？',
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      await restoreStockOutOrder(row.id)
      $q.notify({
        color: 'positive',
        message: '出库单已恢复'
      })
    } catch (error) {
      $q.notify({
        color: 'negative',
        message: error.response?.data?.error || '操作失败'
      })
    } finally {
      fetchStockOutOrders()
    }
  })
}
// 导入相关方法
const handleFileSelected = (e) => {
  const file = e.target.files[0]
  if (file) {
    selectedFileName.value = file.name
    fileToImport.value = file
  }
}

// 4. 出库单初始化导入（核心功能）
async function handleInitImport() {
  if (!selectedFile.value) return

  try {
    importLoading.value = true
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    formData.append('clear_existing', initClearExisting.value) // 传递清空参数
    formData.append('import_type', 'init') // 明确导入类型为初始化

    const response = await importStockOutOrder(formData) // 第二个参数标识初始化导入

    if (response.status === 200) {
      const result = response.data
      initImportResult.value = result
      importErrors.value = result.errors || []

      // 提示结果
      $q.notify({
        color: 'positive',
        message: `初始化成功！库位记录：${result.success_count}条`,
        position: 'top'
      })

      // 无错误则关闭弹窗并刷新
      if (result.error_count === 0) {
        setTimeout(() => {
          resetInitImportState()
          fetchStockOutOrders()
        }, 1500)
      }
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '出库单初始化失败',
      position: 'top'
    })
  } finally {
    importLoading.value = false
  }
}
// 5. 出库单增量导入
async function handleNormalImport() {
  if (!selectedFile.value) return

  try {
    importLoading.value = true
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    formData.append('clear_existing', false) // 增量导入不清空
    formData.append('import_type', 'normal') // 明确导入类型为增量
    const response = await importStockOutOrder(formData)
    if (response.status === 200) {
      const result = response.data
      importErrors.value = result.errors || []

      $q.notify({
        color: 'positive',
        message: `导入成功！共处理${result.success_count}条记录`,
        position: 'top'
      })

      if (result.error_count === 0) {
        showNormalImportDialog.value = false
        fetchStockOutOrders()
      }
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '增量导入失败',
      position: 'top'
    })
  } finally {
    importLoading.value = false
  }
}
// 1. 模板下载（区分初始化和增量模板）
async function downloadInitTemplate() {
  try {
    const response = await exportStockOutTemplate('init')
    handleFileDownload(response, '出库单初始化导入模板.xlsx')
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '初始化模板下载失败',
      position: 'top'
    })
  }
}

async function downloadNormalTemplate() {
  try {
    const response = await exportStockOutTemplate('normal')
    handleFileDownload(response, '出库单增量导入模板.xlsx')
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '增量导入模板下载失败',
      position: 'top'
    })
  }
}
// 通用文件下载处理函数
function handleFileDownload(response, filename) {
  // 创建一个隐藏的下载链接并触发下载
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

/**
 * 初始化导入确认（清空数据的二次确认）
 */
async function handleClearConfirm(checked) {
  if (checked) {
    const confirm = $q.dialog({
      title: '危险操作确认',
      message: '确定要清空所有出库单数据吗？此操作将删除所有出库单记录，且无法恢复！',
      color: 'negative',
      cancel: true,
      persistent: true,
      okLabel: '确认清空',
      cancelLabel: '取消'
    }).onOk

    if (!confirm) {
      initClearExisting.value = false // 取消勾选
    }
  }
}

// 下载导入模板
const downloadImportTemplate = async () => {
  try {
    const response = await exportStockOutTemplate('normal') // 传递参数区分模板类型;

    // 创建一个隐藏的下载链接
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', '出库单增量导入模板.xlsx'); // 设置默认文件名

    // 触发下载
    document.body.appendChild(link);
    link.click();

    // 清理下载链接
    link.remove();
    window.URL.revokeObjectURL(url);

    $q.notify({
      color: 'positive',
      message: '模板下载成功'
    });
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '模板下载失败'
    });
  }
}

// 7. 重置初始化导入状态
const resetInitImportState = () => {
  showInitImportDialog.value = false
  showNormalImportDialog.value = false
  selectedFile.value = null
  importErrors.value = []
  initClearExisting.value = false
  initImportResult.value = null
  importLoading.value = false
}


// 导出所有数据
const handleExportAllStockOutData = async () => {
  try {
    const response = await exportStockOutOrder();

    // 创建下载链接并触发下载
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', '出库单数据.xlsx'); // 设置默认文件名

    // 触发下载
    document.body.appendChild(link);
    link.click();

    // 清理
    link.remove();
    window.URL.revokeObjectURL(url);

    $q.notify({
      color: 'positive',
      message: '数据导出成功'
    });
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '导出失败'
    });
  }
}

// 导出筛选后的数据
const handleExportFilteredStockOutData = async () => {
  try {
    const response = await exportStockOutOrder(filterParams.value);

    // 创建下载链接并触发下载
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', '出库单筛选数据.xlsx'); // 设置默认文件名

    // 触发下载
    document.body.appendChild(link);
    link.click();

    // 清理
    link.remove();
    window.URL.revokeObjectURL(url);

    $q.notify({
      color: 'positive',
      message: '数据导出成功'
    });
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.response?.data?.error || '导出失败'
    });
  }
}

// 辅助方法
const getStatusText = (status) => {
  const statusMap = {
    'draft': '草稿',
    'pending': '待审核',
    'approved': '已审核',
    'completed': '已完成',
    'cancelled': '已取消'
  }
  return statusMap[status] || status
}

const getStatusColor = (status) => {
  const colorMap = {
    'draft': 'text-grey',
    'pending': 'text-warning',
    'approved': 'text-accent',
    'completed': 'text-positive',
    'cancelled': 'text-negative'
  }
  return colorMap[status] || ''
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString()
}

const formatDateTime = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
}

// 权限控制
const canSubmit = (status) => {
  return status === 'draft'
}

const canApprove = (status) => {
  return status === 'pending'
}

const canComplete = (status) => {
  return status === 'approved'
}

const completed = (status) => {
  return status === 'completed'
}

// 重置筛选条件
const resetFilters = () => {
  filterParams.value = {
    order_no: '',
    warehouse: '',
    customer: null,
    status: '',
    start_order_date: null,
    end_order_date: null
  }
  searchParams.value.order_no = ''
}

// 打印出库单PDF
const printStockOrderPdf = async (row) => {
  try {
    // 1. 获取后端数据
    const { data } = await getStockOutOrderDetail(row.id);

    // 2. 创建PDF（默认配置，不需要中文字体）
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // ===========================
    // 标题（和你PDF一致）
    // ===========================
    doc.setFontSize(16);
    doc.text("BGP (PAKISTAN) INTERNATIONAL INVENTORY ISSUANCE NOTE", 14, 22);

    // ===========================
    // 单据信息
    // ===========================
    doc.setFontSize(11);
    doc.text(`IIN # : ${data.order_no}`, 14, 32);
    doc.text(`Date : ${data.order_date}`, 14, 40);
    doc.text(`Type : NON ERP`, 14, 48);
    doc.text(`From Warehouse : ${data.warehouse}`, 14, 56);
    doc.text(`To Customer : ${data.customer}`, 14, 64);
    doc.text(`Remarks : ${data.notes || "-"}`, 14, 72);

    // ===========================
    // 物品明细（纯英文表格）
    // ===========================
    autoTable(doc, {
      startY: 82,
      head: [
        ["S/N", "SKU Code", "Product Name", "Location", "Batch", "Qty", "Unit Price", "Remarks"]
      ],
      body: data.items.map((item, idx) => [
        idx + 1,
        item.sku_code,
        item.product_name,
        item.location_code,
        item.batch_number || "No Batch",
        item.quantity,
        item.unit_price,
        item.notes || "Replace"
      ]),
      styles: {
        fontSize: 9,
        font: "Helvetica",
      },
      headStyles: {
        fillColor: "#333",
        textColor: "#FFF",
      },
    });

    // ===========================
    // 签名
    // ===========================
    const finalY = doc.lastAutoTable.finalY + 15;
    doc.text(`Prepared By: ${data.created_by || "-"}`, 14, finalY);
    doc.text(`Received By: _________________`, 120, finalY);

    // 下载
    doc.save(`OUT_${data.order_no}.pdf`);
    $q.notify({
      color: "positive",
      message: "PDF downloaded successfully",
    });
  } catch (err) {
    console.error(err);
    $q.notify({
      color: "negative",
      message: "Print failed: " + err.message,
    });
  }
};

const printStockOrder_Pdf = async (row) => {
  try {
    // 调用后端“导出PDF”接口，直接返回 PDF 文件流
    const res = await printStockOutOrder(row.id);

    // 2. 创建下载链接
    const blob = new Blob([res.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `出库单_${row.order_no}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
    $q.notify({
      color: "positive",
      message: "出库单打印PDF成功，可直接打印"
    });
  } catch (err) {
    $q.notify({
      color: "negative",
      message: "出库单打印PDF失败: " + err.message
    });
  }
};
</script>
<style lang="scss">
/* 注意：不能加 scoped！必须全局生效 */
@media print {

  /* 隐藏页面所有内容 */
  body * {
    visibility: hidden !important;
  }

  /* 只显示打印区域 */
  .print-now,
  .print-now * {
    visibility: visible !important;
  }

  /* 定位到顶部全屏显示 */
  .print-now {
    position: fixed !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    padding: 20px !important;
  }

  /* 调整表格样式以适应打印 */
  .q-table {
    font-size: 12px;
  }

  /* 确保分页在打印时显示全部内容 */
  .q-table__bottom {
    overflow: visible !important;
  }
}
</style>
