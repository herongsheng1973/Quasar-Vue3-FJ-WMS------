<template>
  <q-page class="row q-pa-md">
    <q-card class="col-12">
      <q-card-section>
        <div class="flex justify-between items-center">
          <h5 class="text-h5">移库单管理</h5>
          <div class="flex gap-2">
            <q-btn color="primary" label="新增移库单" @click="openFormDialog" />
            <q-btn color="brown" label="导出" @click="exportTransfers" />
          </div>
        </div>

        <!-- 筛选区域 -->
        <q-form class="q-pa-md q-mb-md bg-white rounded-borders" @submit="fetchTransfers" ref="transferForm"
          @reset="resetFilters">
          <div class="row q-col-gutter-md items-center">
            <q-input v-model="filters.transfer_no" label="移库单号" class="col-12 col-md-3 col-lg-2" dense filled />
            <q-input v-model="filters.sku_code" label="SKU编码" class="col-12 col-md-3 col-lg-2" dense filled />
            <q-select v-model="filters.status" label="状态" :options="statusOptions" class="col-12 col-md-3 col-lg-2"
              dense filled />
            <q-input v-model="filters.batch_number" label="批次号" class="col-12 col-md-3 col-lg-2" dense filled />

            <!-- 查询/重置 按钮组 -->
            <div class="col-12 col-md-12 col-lg-4 flex justify-center items-center">
              <q-btn label="查询" type="submit" color="primary" dense size="md" />
              <q-btn label="重置" type="reset" color="grey" dense size="md" class="q-ml-sm" />
            </div>
          </div>
        </q-form>

        <!-- 移库单列表 -->
        <q-table :rows="transfers" :columns="columns" row-key="id" :loading="loading" class="mt-4">
          <template v-slot:body-cell-created_at="props">
            <q-td :props="props">
              {{ formatDateTime(props.row.created_at) }}
            </q-td>
          </template>

          <template v-slot:body-cell-status="props">
            <q-td :props="props">
              <span :class="getStatusColor(props.row.status)">
                {{ getStatusText(props.row.status) }}
              </span>
            </q-td>
          </template>

          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <q-btn size="sm" label="详情" color="primary" @click="viewDetails(props.row)" />
              <q-btn size="sm" label="编辑" color="secondary" @click="editTransfer(props.row)"
                v-if="canEdit(props.row)" />
              <q-btn size="sm" label="提交审核" color="orange" @click="handlePendingTransfer(props.row)"
                v-if="canPending(props.row)" />
              <q-btn size="sm" label="审批" color="info" @click="handleApproveTransfer(props.row)"
                v-if="canApprove(props.row)" />
              <q-btn size="sm" label="完成" color="positive" @click="handleCompleteTransfer(props.row)"
                v-if="canComplete(props.row)" />
              <q-btn size="sm" label="取消" color="negative" @click="handleCancelTransfer(props.row)"
                v-if="canCancel(props.row)" />
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <!-- 表单弹窗 -->
    <stock-transfer-form :dialogVisible="formDialogVisible" :transfer="currentTransfer"
      @close="formDialogVisible = false" @saved="onTransferSaved" />

    <!-- 详情弹窗 -->
    <q-dialog v-model="detailDialogVisible">
      <q-card style="width: 850px; max-width: 95vw;">
        <q-card-section>
          <h5 class="text-h5">移库单详情</h5>
          <div class="grid grid-cols-2 gap-4 mt-4">
            <div><span class="text-grey-500">移库单号：</span>{{ currentTransferDetail.transfer_no }}</div>
            <div><span class="text-grey-500">SKU编码：</span>{{ currentTransferDetail.sku_code }}</div>
            <div><span class="text-grey-500">批次号：</span>{{ currentTransferDetail.batch_number || '空批次' }}</div>
            <div><span class="text-grey-500">移库数量：</span>{{ currentTransferDetail.quantity }}</div>
            <div><span class="text-grey-500">源库位：</span>{{ currentTransferDetail.source_location_name }}</div>
            <div><span class="text-grey-500">目标库位：</span>{{ currentTransferDetail.target_location_name }}</div>
            <div><span class="text-grey-500">状态：</span><span :class="getStatusColor(currentTransferDetail.status)">{{
              getStatusText(currentTransferDetail.status) }}</span></div>
            <div><span class="text-grey-500">创建人：</span>{{ currentTransferDetail.created_by_name }}</div>
            <div><span class="text-grey-500">创建时间：</span>{{ formatDateTime(currentTransferDetail.created_at) }}</div>
            <div v-if="currentTransferDetail.completed_at"><span class="text-grey-500">完成时间：</span>{{
              formatDateTime(currentTransferDetail.completed_at) }}</div>
          </div>
          <div class="mt-4"><span class="text-grey-500">备注：</span>
            <p>{{ currentTransferDetail.notes || '无' }}</p>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn label="关闭" @click="detailDialogVisible = false" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import StockTransferForm from 'components/StockTransferForm.vue'
import {
  getStockTransfers,
  pendingStockTransfer,
  getStockTransferDetail,
  approveStockTransfer,
  completeStockTransfer,
  cancelStockTransfer,
  exportStockTransfers
} from 'src/services/inventoryServiceApi'

const $q = useQuasar()

// 状态
const statusOptions = [
  { label: '草稿', value: 'draft' },
  { label: '待审核', value: 'pending' },
  { label: '已批准', value: 'approved' },
  { label: '已完成', value: 'completed' },
  { label: '已取消', value: 'cancelled' },
]

// 列
const columns = [
  { name: 'transfer_no', label: '移库单号', field: 'transfer_no' },
  { name: 'sku_code', label: 'SKU编码', field: 'sku_code' },
  { name: 'batch_number', label: '批次号', field: row => row.batch_number || '空批次' },
  { name: 'quantity', label: '移库数量', field: 'quantity' },
  { name: 'source_location', label: '源库位', field: 'source_location_code' },
  { name: 'target_location', label: '目标库位', field: 'target_location_code' },
  { name: 'status', label: '状态', field: 'status' },
  { name: 'created_at', label: '创建时间', field: 'created_at' },
  { name: 'actions', label: '操作', align: 'center' },
]

const transfers = ref([])
const loading = ref(false)
const filters = ref({ transfer_no: '', sku_code: '', batch_number: '', status: '' })
const formDialogVisible = ref(false)
const currentTransfer = ref(null)
const detailDialogVisible = ref(false)
const currentTransferDetail = ref({})

onMounted(() => {
  fetchTransfers()
})

// 获取列表
const fetchTransfers = async () => {
  loading.value = true
  try {
    const res = await getStockTransfers(filters.value)
    transfers.value = res.data
  } catch (e) {
    $q.notify({ color: 'negative', message: '获取失败：' + e.message })
  } finally {
    loading.value = false
  }
}

// 重置筛选
const resetFilters = () => {
  filters.value = { transfer_no: '', sku_code: '', batch_number: '', status: '' }
}

// 打开新增
const openFormDialog = () => {
  currentTransfer.value = null
  formDialogVisible.value = true
}

// 编辑
const editTransfer = (row) => {
  currentTransfer.value = row
  formDialogVisible.value = true
}

// 详情
const viewDetails = async (row) => {
  const res = await getStockTransferDetail(row.id)
  currentTransferDetail.value = res.data
  detailDialogVisible.value = true
}
const handlePendingTransfer = async (row) => {
  $q.dialog({ title: '确认提交', message: '确定提交审核？', cancel: true })
    .onOk(async () => {
      // 这里调用接口提交审核，接口未实现
      await pendingStockTransfer(row.id)
      $q.notify({ color: 'positive', message: '已提交审核' })
      fetchTransfers()
    })
}
// 审批移库
const handleApproveTransfer = async (row) => {
  $q.dialog({ title: '确认审批', message: '确定审批该移库单？', cancel: true })
    .onOk(async () => {
      // 这里调用接口审批，接口未实现
      await approveStockTransfer(row.id, true, '')
      $q.notify({ color: 'positive', message: '已审批' })
      fetchTransfers()
    })
}

// 完成移库
const handleCompleteTransfer = async (row) => {
  $q.dialog({ title: '确认完成', message: '确定完成移库？将扣减对应库存', cancel: true })
    .onOk(async () => {
      await completeStockTransfer(row.id)
      $q.notify({ color: 'positive', message: '移库完成' })
      fetchTransfers()
    })
}

// 取消移库
const handleCancelTransfer = async (row) => {
  $q.dialog({ title: '确认取消', message: '确定取消该移库单？', cancel: true })
    .onOk(async () => {
      await cancelStockTransfer(row.id)
      $q.notify({ color: 'positive', message: '已取消' })
      fetchTransfers()
    })
}

// 导出
const exportTransfers = async () => {
  try {
    const res = await exportStockTransfers(filters.value)
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url
    a.download = '移库单.xlsx'
    a.click()
  } catch (e) {
    $q.notify({ color: 'negative', message: '导出失败：' + e.message })
  }
}

const onTransferSaved = () => {
  formDialogVisible.value = false
  fetchTransfers()
}

// 状态文本
const getStatusText = (s) => {
  const map = { draft: '草稿', pending: '待审核', approved: '已批准', completed: '已完成', cancelled: '已取消' }
  return map[s] || s
}

// 状态颜色
const getStatusColor = (s) => {
  const map = {
    draft: 'text-grey-7',
    pending: 'text-blue-7',
    approved: 'text-orange-7',
    completed: 'text-green-7',
    cancelled: 'text-red-7',
  }
  return map[s] || ''
}

// 时间格式化
const formatDateTime = (d) => d ? new Date(d).toLocaleString('zh-CN') : ''

// 按钮权限
const canEdit = (row) => row.status === 'draft'
const canPending = (row) => row.status === 'draft'
const canApprove = (row) => row.status === 'pending'
const canComplete = (row) => ['approved'].includes(row.status)
const canCancel = (row) => ['draft', 'pending', 'approved'].includes(row.status)
</script>
