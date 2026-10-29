<template>
  <q-page class="q-pa-md">
    <!-- 页面标题 -->
    <div class="row col-12 mb-6">
      <div class="col-2 q-py-none">
        <h1 class="text-h5 text-grey-8 q-py-none">日志管理</h1>
        <p class="text-grey-5 q-mt-sm">系统实时日志 · 自动保留90天</p>
      </div>
      <div class="col-8 flex items-center q-col-gutter-md">
        <!-- 日志类型筛选 -->
        <div>
          <q-select v-model="logType" :options="logTypeOptions" label="日志类型" clearable outlined dense
            style="width: 140px;" @input="fetchLogs" emit-value />
        </div>

        <!-- 日志级别筛选 -->
        <div>
          <q-select v-model="logLevel" :options="logLevelOptions" label="日志级别" clearable outlined dense
            style="width: 120px;" @input="fetchLogs" emit-value />
        </div>

        <!-- 时间范围 -->
        <div class="col-2">
          <q-input v-model="startDate" label="开始时间" outlined dense mask="date" @input="handleDateInput">
            <template v-slot:append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy>
                  <q-date v-model="startDate" mask="YYYY-MM-DD" />
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
        </div>
        <div class="col-2">
          <q-input v-model="endDate" label="结束时间" outlined dense mask="date" @input="handleDateInput">
            <template v-slot:append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy>
                  <q-date v-model="endDate" mask="YYYY-MM-DD" />
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
        </div>

        <!-- 搜索 -->
        <div class="col-3">
          <q-input v-model="searchQuery" label="搜索内容/模块" outlined dense clearable @keyup.enter="fetchLogs">
            <template v-slot:append>
              <q-icon name="search" class="cursor-pointer" @click="fetchLogs" />
            </template>
          </q-input>
        </div>

        <div>
          <q-btn round flat icon="refresh" :loading="loading" @click="fetchLogs" />
        </div>
      </div>

      <div class="col-2 justify-end flex items-center q-col-gutter-md">
        <q-btn color="secondary" label="导出" icon="download" @click="downloadLogs" />
        <q-btn color="negative" label="清空" icon="delete" @click="confirmClearLogs" />
      </div>
    </div>

    <!-- 快捷时间 + 日志统计 -->
    <div class="row items-center q-mb-md">
      <div class="text-subtitle1">总日志：{{ pagination.rowsNumber }} 条</div>
      <div class="q-ml-xl">
        <q-btn v-for="item in timeRangeOptions" :key="item.value" :label="item.label" flat dense class="q-mr-sm"
          @click="setTimeRange(item.value)" />
      </div>
    </div>

    <!-- 日志表格 -->
    <q-table :rows="logs" :columns="columns" row-key="id" :loading="loading" v-model:pagination="pagination"
      :rows-per-page-options="[20, 50, 100]" @request="onRequest" wrap-cells>
      <template v-slot:body-cell-level="props">
        <q-td>
          <q-badge :color="getLevelColor(props.row.level)" label={props.row.level} />
        </q-td>
      </template>

      <template v-slot:body-cell-log_type="props">
        <q-td>{{ getLogTypeLabel(props.row.log_type) }}</q-td>
      </template>

      <template v-slot:body-cell-message="props">
        <q-td>
          <div class="log-message" :title="props.row.message">{{ props.row.message }}</div>
        </q-td>
      </template>

      <template v-slot:body-cell-actions="props">
        <q-td class="text-center">
          <q-btn size="sm" icon="visibility" flat @click="viewDetail(props.row)" />
        </q-td>
      </template>
    </q-table>

    <!-- 日志详情弹窗 -->
    <q-dialog v-model="showDetail" maximized>
      <q-card>
        <q-bar>
          <q-icon name="description" />
          <div>日志详情</div>
          <q-space />
          <q-btn icon="close" v-close-popup />
        </q-bar>

        <q-card-section class="q-pa-lg" v-if="currentLog">
          <div class="row q-col-gutter-lg">
            <div class="col-6">
              <div class="text-xs text-grey">时间</div>
              <div class="text-md q-mt-xs">{{ currentLog.timestamp }}</div>
            </div>
            <div class="col-6">
              <div class="text-xs text-grey">级别</div>
              <q-badge :color="getLevelColor(currentLog.level)" :label="currentLog.level" class="q-mt-xs" />
            </div>
            <div class="col-6">
              <div class="text-xs text-grey">类型</div>
              <div class="text-md q-mt-xs">{{ getLogTypeLabel(currentLog.log_type) }}</div>
            </div>
            <div class="col-6">
              <div class="text-xs text-grey">模块:行号</div>
              <div class="text-md q-mt-xs">{{ currentLog.module }}:{{ currentLog.lineno }}</div>
            </div>

            <div class="col-12 q-mt-md">
              <div class="text-xs text-grey">日志内容</div>
              <div class="text-pre-wrap bg-grey-1 q-pa-md q-mt-xs rounded">{{ currentLog.message }}</div>
            </div>

            <div class="col-12 q-mt-md" v-if="currentLog.stack_trace">
              <div class="text-xs text-grey">错误堆栈</div>
              <pre class="error-stack q-pa-md q-mt-xs rounded">{{ currentLog.stack_trace }}</pre>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- 清空确认 -->
    <q-dialog v-model="showClearDialog">
      <q-card>
        <q-card-section>
          <div class="text-h6">确认清空所有日志？</div>
          <p class="q-mt-sm">清空后无法恢复，系统将自动保留最近90天日志</p>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="取消" v-close-popup />
          <q-btn color="negative" label="确认清空" @click="handleClear" :loading="clearLoading" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { format, addDays } from 'date-fns'
import { getLogList, exportLogs, clearLogs } from '../services/logService'

const $q = useQuasar()

// 数据
const logs = ref([])
const loading = ref(false)
const clearLoading = ref(false)
const showDetail = ref(false)
const showClearDialog = ref(false)
const currentLog = ref(null)

// 筛选
const logType = ref(null)
const logLevel = ref(null)
const startDate = ref('')
const endDate = ref('')
const searchQuery = ref('')

// 分页
const pagination = ref({
  page: 1,
  rowsPerPage: 20,
  rowsNumber: 0,
  sortBy: 'timestamp',
  descending: true
})

// 选项
const logTypeOptions = [
  { label: '系统日志', value: 'django.log' },
  { label: '请求日志', value: 'request.log' },
  { label: '业务日志', value: 'business.log' },
  { label: '错误日志', value: 'error.log' }
]

const logLevelOptions = [
  { label: 'DEBUG', value: 'DEBUG' },
  { label: 'INFO', value: 'INFO' },
  { label: 'WARNING', value: 'WARNING' },
  { label: 'ERROR', value: 'ERROR' }
]

const timeRangeOptions = [
  { label: '今天', value: 'today' },
  { label: '7天', value: '7days' },
  { label: '30天', value: '30days' },
  { label: '90天', value: '90days' }
]

// 表格列
const columns = [
  { name: 'timestamp', label: '时间', field: 'timestamp', sortable: true, width: '180px' },
  { name: 'log_type', label: '类型', field: 'log_type', width: '110px' },
  { name: 'level', label: '级别', field: 'level', width: '80px' },
  { name: 'module', label: '模块', field: 'module', width: '120px' },
  { name: 'message', label: '日志内容', field: 'message' },
  { name: 'actions', label: '操作', width: '70px' }
]

// 颜色映射
const getLevelColor = (level) => {
  const map = { DEBUG: 'blue', INFO: 'green', WARNING: 'amber', ERROR: 'red' }
  return map[level] || 'grey'
}

const getLogTypeLabel = (val) => {
  const item = logTypeOptions.find(i => i.value === val)
  return item ? item.label : val
}

// 请求参数
const getParams = (pageInfo = null) => {
  const info = pageInfo || pagination.value
  return {
    page: info.page,
    rowsPerPage: info.rowsPerPage,
    sortBy: info.sortBy,
    descending: info.descending,
    log_type: logType.value,
    level: logLevel.value,
    startDate: format(new Date(startDate.value), 'yyyy-MM-dd'),
    endDate: format(new Date(endDate.value), 'yyyy-MM-dd'),
    search: searchQuery.value.trim()
  }
}

// 获取日志
const fetchLogs = async (props = null) => {
  try {
    loading.value = true
    const params = getParams(props?.pagination)
    const res = await getLogList(params)
    logs.value = res.data.results || []
    pagination.value.rowsNumber = res.data.count || 0
  } catch (e) {
    $q.notify({ color: 'negative', message: e.message || '加载日志失败' })
  } finally {
    loading.value = false
  }
}

// 表格请求
const onRequest = (props) => fetchLogs(props)

// 查看详情
const viewDetail = (row) => {
  currentLog.value = row
  showDetail.value = true
}

// 导出
const downloadLogs = async () => {
  try {
    $q.loading.show()
    const res = await exportLogs(getParams())
    const blob = new Blob([res.data])
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `system_logs_${format(new Date(), 'yyyyMMddHHmmss')}.csv`
    a.click()
    URL.revokeObjectURL(url)
    $q.notify({ color: 'positive', message: '导出成功' })
  } catch (e) {
    $q.notify({ color: 'negative', message: e.message || '导出失败' })
  } finally {
    $q.loading.hide()
  }
}

// 清空
const confirmClearLogs = () => showClearDialog.value = true
const handleClear = async () => {
  try {
    clearLoading.value = true
    await clearLogs()
    $q.notify({ color: 'positive', message: '清空成功' })
    showClearDialog.value = false
    fetchLogs()
  } catch (e) {
    $q.notify({ color: 'negative', message: e.message || '清空失败' })
  } finally {
    clearLoading.value = false
  }
}

// 快捷时间
const setTimeRange = (type) => {
  const now = new Date()
  let start = now
  if (type === 'today') start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (type === '7days') start = addDays(now, -7)
  if (type === '30days') start = addDays(now, -30)
  if (type === '90days') start = addDays(now, -90)
  startDate.value = format(start, 'yyyy-MM-dd')
  endDate.value = format(now, 'yyyy-MM-dd')
  fetchLogs()
}

// 防抖
const handleDateInput = () => {
  clearTimeout(window.t)
  window.t = setTimeout(fetchLogs, 600)
}

// 初始化
onMounted(() => {
  const today = format(new Date(), 'yyyy-MM-dd')
  startDate.value = today
  endDate.value = today
  fetchLogs()
})
</script>

<style scoped>
.log-message {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 500px;
}

.text-pre-wrap {
  white-space: pre-wrap;
  word-break: break-all;
}

.error-stack {
  background: #f5f5f5;
  font-size: 12px;
  line-height: 1.5;
  max-height: 400px;
  overflow: auto;
  color: #c0392b;
}
</style>
