<template>
  <q-page class="row q-pa-md">
    <!-- 页面标题 -->
    <div class="col-6 mb-6">
      <h1 class="text-h5 text-weight-bold text-grey-8">报表管理</h1>
      <p class="text-grey-5 q-mt-sm">生成、下载和管理库存/出入库/客户/供应商报表</p>
    </div>

    <div class="col-4 q-mt-md">
      <div class="text-subtitle1">生成新报表</div>
      <div class="text-caption text-grey-6">
        选择条件后生成Excel/PDF报表，支持库存、出入库、客户、供应商统计
      </div>
    </div>

    <div class="col-2 q-pt-md justify-end">
      <q-btn color="primary" label="生成报表" icon="analytics" @click="handleGenerateReport" :loading="generatingReport"
        size="md" />
    </div>

    <!-- 报表选项区域 -->
    <q-card class="col-12 q-mb-md">
      <q-card-section>
        <div class="row q-mt-md q-col-gutter-md">
          <!-- 报表类型 -->
          <div class="col-md-3 col-xs-12">
            <q-select v-model="reportParams.report_type" label="报表类型" :options="reportTypeOptions" option-value="value"
              option-label="label" outlined dense map-options emit-value />
          </div>

          <!-- 导出格式 -->
          <div class="col-md-3 col-xs-12">
            <q-select v-model="reportParams.export_type" label="导出格式" :options="exportTypeOptions" option-value="value"
              option-label="label" outlined dense map-options emit-value />
          </div>

          <!-- 仓库 -->
          <div class="col-md-3 col-xs-12">
            <q-select v-model="reportParams.warehouse_id" :label="warehouseRequired ? '仓库（必填）' : '仓库（可选）'"
              :options="warehouseOptions" :disabled="isWarehouseDisabled" option-value="id" option-label="name" outlined
              dense clearable map-options emit-value />
          </div>

          <!-- 供应商 -->
          <div class="col-md-3 col-xs-12">
            <q-select v-model="reportParams.supplier_id" :label="supplierRequired ? '供应商（必填）' : '供应商（可选）'"
              :options="supplierOptions" :disabled="isSupplierDisabled" outlined dense clearable option-label="name"
              option-value="id" map-options emit-value />
          </div>

          <!-- 客户 -->
          <div class="col-md-3 col-xs-12 q-mt-sm">
            <q-select v-model="reportParams.customer_id" :label="customerRequired ? '客户（必填）' : '客户（可选）'"
              :options="customerOptions" :disabled="isCustomerDisabled" outlined dense clearable option-label="name"
              option-value="id" map-options emit-value />
          </div>

          <!-- 开始日期 -->
          <div class="col-md-3 col-xs-12 q-mt-sm">
            <q-input v-model="reportParams.start_date" :label="dateRequired ? '开始日期（必填）' : '开始日期（可选）'"
              :disabled="isDateDisabled" type="date" outlined dense />
          </div>

          <!-- 结束日期 -->
          <div class="col-md-3 col-xs-12 q-mt-sm">
            <q-input v-model="reportParams.end_date" :label="dateRequired ? '结束日期（必填）' : '结束日期（可选）'"
              :disabled="isDateDisabled" type="date" outlined dense />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- 报表列表 -->
    <q-card class="col-12">
      <q-card-section>
        <div class="row justify-between items-center q-mb-md">
          <div class="text-subtitle1">已生成报表</div>
          <q-btn flat round icon="refresh" @click="loadReportHistory" :loading="loading">
            <q-tooltip>刷新</q-tooltip>
          </q-btn>
        </div>

        <q-table :rows="reportHistory" :columns="columns" row-key="id" :loading="loading"
          v-model:pagination="pagination" :rows-per-page-options="[10, 20, 50]" @request="onRequest" wrap-cells>

          <!-- 序号 -->
          <template v-slot:body-cell-index="props">
            <q-td :props="props">
              <q-badge color="primary">
                {{ (pagination.page - 1) * pagination.rowsPerPage + props.pageIndex + 1 }}
              </q-badge>
            </q-td>
          </template>

          <!-- 报表类型 + 图标 -->
          <template #body-cell-report_type="props">
            <q-td :props="props">
              <q-icon :name="getReportTypeIcon(props.row.report_config_code)"
                :color="getReportTypeColor(props.row.report_config_code)" class="q-mr-sm text-medium" />
              <span>{{ getReportTypeName(props.row.report_config_code) }}</span>
            </q-td>
          </template>

          <!-- 导出类型 -->
          <template #body-cell-export_type="props">
            <q-td :props="props">
              <q-badge :color="props.row.export_type === 'pdf' ? 'red' : 'green'">
                {{ props.row.export_type === 'pdf' ? 'PDF' : 'Excel' }}
              </q-badge>
            </q-td>
          </template>

          <!-- 状态 -->
          <template v-slot:body-cell-status="props">
            <q-td :props="props">
              <q-badge :color="props.row.status === 'success' ? 'positive' :
                props.row.status === 'generating' ? 'warning' : 'negative'
                " text-color="white" dense>
                {{
                  props.row.status === 'success' ? '生成成功' :
                    props.row.status === 'generating' ? '生成中' : '生成失败'
                }}
              </q-badge>
            </q-td>
          </template>

          <!-- 操作 -->
          <template v-slot:body-cell-actions="props">
            <q-td :props="props" class="text-center">
              <q-btn size="sm" color="primary" icon="info" flat round @click="openDetail(props.row)">
                <q-tooltip>详情</q-tooltip>
              </q-btn>
              <q-btn size="sm" color="positive" icon="cloud_download" flat round class="q-ml-xs"
                @click="handleDownload(props.row)" :loading="downloadingId === props.row.id"
                :disabled="props.row.status !== 'success'">
                <q-tooltip>下载</q-tooltip>
              </q-btn>
              <q-btn size="sm" color="negative" icon="delete" flat round class="q-ml-xs"
                @click="openDeleteModal(props.row)">
                <q-tooltip>删除</q-tooltip>
              </q-btn>
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <!-- 详情弹窗 -->
    <q-dialog v-model="showDetailDialog">
      <q-card style="width: 500px; max-width: 90vw;">
        <q-card-section>
          <div class="text-h6">报表详情</div>
        </q-card-section>
        <q-card-section v-if="currentReport">
          <q-list separator>
            <q-item>
              <q-item-section>
                <q-item-label caption>报表名称</q-item-label>
                <q-item-label>{{ currentReport.report_config_name }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                <q-item-label caption>生成时间</q-item-label>
                <q-item-label>{{ formatTime(currentReport.generated_at) }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                <q-item-label caption>操作人</q-item-label>
                <q-item-label>{{ currentReport.generated_by_name || '系统' }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                <q-item-label caption>状态</q-item-label>
                <q-item-label>
                  <q-chip :color="currentReport.status === 'success' ? 'positive' : 'negative'" text-color="white"
                    dense>
                    {{ currentReport.status === 'success' ? '生成成功' : '失败' }}
                  </q-chip>
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="关闭" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 删除弹窗 -->
    <q-dialog v-model="showDeleteDialog">
      <q-card>
        <q-card-section>
          <div class="row items-center">
            <q-icon name="warning" color="negative" size="24px" class="q-mr-sm" />
            <span class="text-h6">确认删除报表</span>
          </div>
        </q-card-section>
        <q-card-section>
          <p>确定要删除该报表吗？此操作不可撤销。</p>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="取消" v-close-popup />
          <q-btn color="negative" label="确认删除" @click="handleDelete" :loading="deleting" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import dayjs from 'dayjs'

import {
  fetchReportHistory,
  generateReport,
  downloadReport,
  deleteReport,
} from 'src/services/reportServiceApi'

import {
  getWarehouseOptions,
  getSupplierOptions,
  getCustomerOptions,
} from 'src/services/settingsServiceApi'

const $q = useQuasar()

// ===================== 选项 =====================
const reportTypeOptions = [
  { label: '库存汇总报表', value: 'inventory' },
  { label: '出入库综合报表', value: 'stock_movement' },
  { label: '入库统计报表', value: 'stock_in' },
  { label: '出库统计报表', value: 'stock_out' },
  { label: '供应商入库分析', value: 'supplier_in' },
  { label: '客户出库分析', value: 'customer_out' },
]
const exportTypeOptions = [
  { label: 'Excel', value: 'excel' },
  { label: 'PDF', value: 'pdf' },
]

const warehouseOptions = ref([])
const supplierOptions = ref([])
const customerOptions = ref([])

// ===================== 参数 =====================
const today = new Date().toISOString().split('T')[0]
const reportParams = ref({
  report_type: 'inventory',
  export_type: 'excel',
  warehouse_id: '',
  supplier_id: '',
  customer_id: '',
  start_date: today,
  end_date: today,
})

// ===================== 状态 =====================
const reportHistory = ref([])
const loading = ref(false)
const generatingReport = ref(false)
const downloadingId = ref(null)
const deleting = ref(false)

const pagination = ref({
  page: 1,
  rowsPerPage: 10,
  total: 0,
  sortBy: 'generated_at',
  descending: true,
})

const showDetailDialog = ref(false)
const showDeleteDialog = ref(false)
const currentReport = ref(null)

// ===================== 表格列 =====================
const columns = [
  { name: 'index', label: '序号', align: 'center' },
  { name: 'report_type', label: '报表类型', align: 'left' },
  { name: 'file_name', label: '文件名', field: 'file_name', align: 'left' },
  { name: 'export_type', label: '格式', align: 'left' },
  { name: 'generated_at', label: '生成时间', align: 'left', format: (v) => dayjs(v).format('YYYY-MM-DD HH:mm') },
  { name: 'generated_by_name', label: '操作人', align: 'left' },
  { name: 'status', label: '状态', align: 'center' },
  { name: 'actions', label: '操作', align: 'center' },
]

// ===================== 图标 + 颜色 + 名称 =====================
const getReportTypeIcon = (code) => {
  const map = {
    inventory: 'warehouse',
    stock_movement: 'swap_horiz',
    supplier_in: 'download',
    customer_out: 'upload',
    stock_in: 'arrow_downward',
    stock_out: 'arrow_upward',
  }
  return map[code] || 'help'
}

const getReportTypeColor = (code) => {
  const map = {
    inventory: 'primary',
    stock_movement: 'info',
    supplier_in: 'positive',
    customer_out: 'purple',
    stock_in: 'teal',
    stock_out: 'orange',
  }
  return map[code] || 'grey'
}

const getReportTypeName = (code) => {
  const map = {
    inventory: '库存汇总报表',
    stock_movement: '出入库综合报表',
    supplier_in: '供应商入库分析',
    customer_out: '客户出库分析',
    stock_in: '入库综合分析',
    stock_out: '出库综合分析',
  }
  return map[code] || '未知报表'
}

const formatTime = (time) => dayjs(time).format('YYYY-MM-DD HH:mm')
import { computed, watch } from 'vue'

// 当前选中的报表类型
const currentType = computed(() => reportParams.value.report_type)

// 各种报表类型判断
const isInventory = computed(() => currentType.value === 'inventory')
const isStockIn = computed(() => currentType.value === 'stock_in')
const isStockOut = computed(() => currentType.value === 'stock_out')
const isStockMovement = computed(() => currentType.value === 'stock_movement')
const isSupplierIn = computed(() => currentType.value === 'supplier_in')
const isCustomerOut = computed(() => currentType.value === 'customer_out')

// ===================== 仓库 =====================
// 是否必填
const warehouseRequired = computed(() => {
  return isInventory.value || isStockIn.value || isStockOut.value || isStockMovement.value
})
// 是否禁用（供应商/客户报表时禁用）
const isWarehouseDisabled = computed(() => {
  return isSupplierIn.value || isCustomerOut.value
})

// ===================== 供应商 =====================
const supplierRequired = computed(() => isSupplierIn.value)
const isSupplierDisabled = computed(() => !isSupplierIn.value)

// ===================== 客户 =====================
const customerRequired = computed(() => isCustomerOut.value)
const isCustomerDisabled = computed(() => !isCustomerOut.value)

// ===================== 日期 =====================
const dateRequired = computed(() => {
  return isStockIn.value || isStockOut.value || isStockMovement.value
})
const isDateDisabled = computed(() => isInventory.value)

// ===================== 切换报表类型 → 自动清空无关选项 =====================
watch(currentType, () => {
  reportParams.value.warehouse_id = ''
  reportParams.value.supplier_id = ''
  reportParams.value.customer_id = ''
  reportParams.value.start_date = ''
  reportParams.value.end_date = ''
})
// ===================== 加载数据 =====================
const fetchSuppliers = async () => {
  try {
    const res = await getSupplierOptions()
    supplierOptions.value = res.data || []
  } catch (e) {
    $q.notify({ color: 'negative', message: '获取供应商失败：' + e.message })
  }
}
const fetchCustomers = async () => {
  try {
    const res = await getCustomerOptions()
    customerOptions.value = res.data || []
  } catch (e) {
    $q.notify({ color: 'negative', message: '获取客户失败：' + e.message })
  }
}
const fetchWarehouses = async () => {
  try {
    const res = await getWarehouseOptions({ active: true })
    warehouseOptions.value = res.data || []
  } catch (e) {
    $q.notify({ color: 'negative', message: '获取仓库失败：' + e.message })
  }
}

// ===================== 报表历史 =====================
const loadReportHistory = async () => {
  try {
    loading.value = true
    const params = { page: pagination.value.page, page_size: pagination.value.rowsPerPage }
    const res = await fetchReportHistory(params)
    reportHistory.value = res.data?.results || []
    pagination.value.total = res.data?.count || 0
  } catch (e) {
    $q.notify({ color: 'negative', message: '加载失败：' + e.message })
  } finally {
    loading.value = false
  }
}

// ===================== 生成 / 下载 / 删除 =====================
// ===================== 生成报表 - 完整验证规则 =====================
const handleGenerateReport = async () => {
  try {
    const {
      report_type,
      warehouse_id,
      supplier_id,
      customer_id,
      start_date,
      end_date
    } = reportParams.value

    // ==============================================
    // 规则 1：库存汇总报表
    // ==============================================
    if (report_type === 'inventory') {
      // 必须选仓库
      if (!warehouse_id) {
        $q.notify({ color: 'warning', message: '【库存汇总报表】必须选择仓库' })
        return
      }
      // 禁止填写：供应商、客户、起止日期
      if (supplier_id || customer_id || start_date || end_date) {
        $q.notify({ color: 'warning', message: '【库存汇总报表】不能选择供应商、客户、起止日期' })
        reportParams.value.supplier_id = ''
        reportParams.value.customer_id = ''
        reportParams.value.start_date = null
        reportParams.value.end_date = null
      }
    }

    // ==============================================
    // 规则 2：入库统计报表
    // ==============================================
    else if (report_type === 'stock_in') {
      if (!warehouse_id) {
        $q.notify({ color: 'warning', message: '【入库统计报表】必须选择仓库' })
        return
      }
      if (!start_date || !end_date) {
        $q.notify({ color: 'warning', message: '【入库统计报表】必须选择起止日期' })
        return
      }
      if (start_date >= end_date) {
        $q.notify({ color: 'warning', message: '【入库统计报表】开始时间不能大于等于结束时间' })
        return
      }
    }

    // ==============================================
    // 规则 3：出库统计报表
    // ==============================================
    else if (report_type === 'stock_out') {
      if (!warehouse_id) {
        $q.notify({ color: 'warning', message: '【出库统计报表】必须选择仓库' })
        return
      }
      if (!start_date || !end_date) {
        $q.notify({ color: 'warning', message: '【出库统计报表】必须选择起止日期' })
        return
      }
      if (start_date >= end_date) {
        $q.notify({ color: 'warning', message: '【出库统计报表】开始时间不能大于等于结束时间' })
        return
      }
    }

    // ==============================================
    // 规则 4：出入库综合报表
    // ==============================================
    else if (report_type === 'stock_movement') {
      if (!warehouse_id) {
        $q.notify({ color: 'warning', message: '【出入库综合报表】必须选择仓库' })
        return
      }
      if (!start_date || !end_date) {
        $q.notify({ color: 'warning', message: '【出入库综合报表】必须选择起止日期' })
        return
      }
      if (start_date >= end_date) {
        $q.notify({ color: 'warning', message: '【出入库综合报表】开始时间不能大于等于结束时间' })
        return
      }
    }

    // ==============================================
    // 规则 5：供应商入库分析
    // ==============================================
    else if (report_type === 'supplier_in') {
      if (!supplier_id) {
        $q.notify({ color: 'warning', message: '【供应商入库分析】必须选择供应商' })
        return
      }
    }

    // ==============================================
    // 规则 6：客户出库分析
    // ==============================================
    else if (report_type === 'customer_out') {
      if (!customer_id) {
        $q.notify({ color: 'warning', message: '【客户出库分析】必须选择客户' })
        return
      }
    }

    // ==============================================
    // 通用时间校验（除库存报表外）
    // ==============================================
    if (
      report_type !== 'inventory' &&
      start_date &&
      end_date &&
      start_date >= end_date
    ) {
      $q.notify({ color: 'warning', message: '开始时间不能大于或等于结束时间' })
      return
    }

    // ==============================================
    // 验证通过 → 开始生成
    // ==============================================
    generatingReport.value = true
    await generateReport(reportParams.value)
    $q.notify({ color: 'positive', message: '报表生成成功！' })
    loadReportHistory()

  } catch (e) {
    $q.notify({
      color: 'negative',
      message: e.message || '生成失败，请重试'
    })
  } finally {
    generatingReport.value = false
  }
}
const handleDownload = async (row) => {
  try {
    downloadingId.value = row.id
    const res = await downloadReport(row.id)
    const filename = row.file_name
    const blob = new Blob([res.data])
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    $q.notify({ color: 'positive', message: `${filename} 下载成功` })
  } catch (e) {
    $q.notify({ color: 'negative', message: e.message || '下载失败' })
  } finally {
    downloadingId.value = null
  }
}

// const getFileNameFromResponse = (response) => {
//   const disp = response.headers['content-disposition'] || ''
//   const match = disp.match(/filename\*=UTF-8''(.+)/)
//   if (match) return decodeURIComponent(match[1])
//   return 'report.xlsx'
// }

const openDeleteModal = (row) => {
  currentReport.value = row
  showDeleteDialog.value = true
}

const handleDelete = async () => {
  try {
    deleting.value = true
    await deleteReport(currentReport.value.id)
    await loadReportHistory()
    $q.notify({ color: 'positive', message: '删除成功' })
  } catch (e) {
    $q.notify({ color: 'negative', message: e.message })
  } finally {
    deleting.value = false
    showDeleteDialog.value = false
  }
}

const openDetail = (row) => {
  currentReport.value = row
  showDetailDialog.value = true
}

const onRequest = () => loadReportHistory()

onMounted(() => {
  loadReportHistory()
  fetchSuppliers()
  fetchCustomers()
  fetchWarehouses()
})
</script>
