<template>
  <div class="page-container">

    <div class="page-header q-mb-md flex justify-between items-center">
      <h3 class="text-primary text-weight-bold">检波点收放线管理 & 统计分析</h3>
      <q-select v-model="params.project_id" label="选择项目" :options="projectList" emit-value map-options
        options-value="id" options-label="name" class="col-12 col-md-3 q-mt-sm" @update:model-value="refreshAll" />
    </div>
    <!-- 筛选 -->


    <!-- 统计卡片 -->
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-12 col-md-6 col-lg-3">
        <q-card class="card-total">
          <q-card-section class="text-center">
            <div class="text-h2 text-weight-bold q-mb-lg">{{ stats.total }}</div>
            <div class="text-grey-8">总点数</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-6 col-lg-3">
        <q-card class="card-layouted">
          <q-card-section class="text-center">
            <div class="text-h2 text-weight-bold q-mb-lg">{{ stats.layouted }}</div>
            <div class="text-grey-8">已布设点数</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-6 col-lg-3">
        <q-card class="card-picked">
          <q-card-section class="text-center">
            <div class="text-h2 text-weight-bold q-mb-lg">{{ stats.picked }}</div>
            <div class="text-grey-8">已回收点数</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-6 col-lg-3">
        <q-card class="card-unlayout">
          <q-card-section class="text-center">
            <div class="text-h2 text-weight-bold q-mb-lg">{{ stats.unlayout }}</div>
            <div class="text-grey-8">未布设点数</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- 图表 -->
    <div class="row q-gutter-md q-mb-md">
      <q-card class="col-12 col-md-12 q-mb-md" elevation="2">
        <q-card-section>
          <div class="row q-col-gutter-md flex justify-between items-center">
            <div class="text-h5">收放线统计-按日期统计</div>
            <q-input class="col-12 col-md-2" v-model="paramsDate.startDate" label="开始日期" type="date" outlined dense />
            <q-input class="col-12 col-md-2" v-model="paramsDate.endDate" label="结束日期" type="date" outlined dense />
            <div class="col-12 col-md-4 flex items-center">
              <q-btn label="搜索" color="primary" @click="fetchStatsByDate" style="width: 160px;margin-right: 12px;" />
              <q-btn label="重置" color="grey" @click="resetDateParams" style="width: 160px" />
            </div>
          </div>
        </q-card-section>
        <q-card-section>
          <div ref="chartDate" style="width: 100%; height: 400px; box-sizing: border-box;"></div>
        </q-card-section>
      </q-card>

      <q-card class="col-12 col-md-12" elevation="2">
        <q-card-section>
          <div class="row flex justify-between items-center">
            <h5>收放线进度-按测线统计</h5>
            <q-select class="col-6 col-md-1" v-model="paramsLine.receiver_line_begin" label="开始线号"
              :options="lineOptions" emit-value map-options options-value="id" options-label="label" />
            <q-select class="col-6 col-md-1" v-model="paramsLine.receiver_line_end" label="结束线号" :options="lineOptions"
              emit-value map-options options-value="id" options-label="label" />
            <q-select class="col-6 col-md-1" v-model="paramsLine.status" label="状态" :options="statusOptions" emit-value
              map-options options-value="value" options-label="label" />
            <q-btn label="搜索" color="primary" @click="fetchStatsByLine" style="width: 120px;margin-right: 12px;" />
            <q-btn label="重置" color="grey" @click="resetLineParams" style="width: 120px" />
          </div>

        </q-card-section>
        <q-card-section>
          <div ref="chartLine" style="width: 100%; height: 400px; box-sizing: border-box;"></div>
        </q-card-section>
      </q-card>
    </div>

    <!-- 表格 -->
    <q-card elevation="2">
      <q-card-section>
        <q-table title="收放线明细" :rows="list" :columns="columns" row-key="id" :loading="loading" />
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'

import * as echarts from 'echarts'
import { receiverPointApi, projectSettingApi, receiverLineApi } from 'src/services/projectServiceApi'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const loading = ref(false)
const list = ref([])
const projectList = ref([])
const chartDate = ref(null)
const chartLine = ref(null)

// 图表实例
let chartDateInst = null
let chartLineInst = null

const params = ref({
  project_id: '',
  receiver_line: '',
  startDate: '',
  endDate: '',
  status: ''
})

const paramsLine = ref({
  receiver_line_begin: null,
  receiver_line_end: null,
  status: null
})

const paramsDate = ref({
  startDate: '',
  endDate: ''
})

const lineOptions = ref([])

const stats = ref({
  total: 0, layouted: 0, picked: 0, unlayout: 0
})

const statusOptions = [
  { label: '全部', value: '' },
  { label: '已布设', value: 'layouted' },
  { label: '已回收', value: 'picked' },
  { label: '未回收', value: 'unpicked' },
  { label: '未布设', value: 'unlayout' }
]

const columns = [
  { name: 'receiver_line', label: '线号', field: 'receiver_line', align: 'center' },
  { name: 'station', label: '桩号', field: 'station', align: 'center' },
  { name: 'geophone_layout_date', label: '检波器布设', field: 'geophone_layout_date', align: 'center' },
  { name: 'geophone_pickup_date', label: '检波器回收', field: 'geophone_pickup_date', align: 'center' },
  { name: 'cable_layout_date', label: '大线布设', field: 'cable_layout_date', align: 'center' },
  { name: 'cable_pickup_date', label: '大线回收', field: 'cable_pickup_date', align: 'center' },
]

// 加载项目
const loadProject = async () => {
  const res = await projectSettingApi.list()
  const list = res.data.results || res.data

  projectList.value = list.map(i => ({
    label: i.project_name,
    value: i.id
  }))

  if (projectList.value.length > 0) {
    const maxId = Math.max(...projectList.value.map(item => item.value))
    params.value.project_id = maxId
    await loadLineOptions()
  }
}

const loadLineOptions = async () => {
  const res = await receiverLineApi.options({ project_id: params.value.project_id })
  lineOptions.value = res.data.results || res.data
}

// 刷新全部
const refreshAll = async () => {
  if (!params.value.project_id) return
  params.value.receiver_line = ''
  params.value.startDate = ''
  params.value.endDate = ''
  params.value.status = ''
  await fetchList()
  paramsDate.value.startDate = ''
  paramsDate.value.endDate = ''

  await fetchStatsByDate()
  paramsLine.value.receiver_line_begin = null
  paramsLine.value.receiver_line_end = null
  paramsLine.value.status = null
  await fetchStatsByLine()
  await loadLineOptions()
}

// 获取列表
const fetchList = async () => {
  if (!params.value.project_id) return
  loading.value = true
  try {
    const sendParams = { ...params.value }

    if (!sendParams.status) {
      sendParams.status = 'layouted'
    }

    if (!sendParams.startDate) {
      sendParams.last_layout_day = true
    }

    const res = await receiverPointApi.getLayoutList(sendParams)
    list.value = res.data.list
    stats.value = res.data.stats

    $q.notify({ type: 'positive', message: '查询成功' })
  } finally {
    loading.value = false
  }
}
// 按日统计
const fetchStatsByDate = async () => {
  if (!params.value.project_id || !chartDateInst) return

  // ============= 1. 获取日期并格式化 / 校正顺序 =============
  let startDate = paramsDate.value.startDate
  let endDate = paramsDate.value.endDate

  // 格式转换：把 yyyy/mm/dd 换成 yyyy-mm-dd（兼容各种输入）
  if (startDate) startDate = startDate.replace(/\//g, '-')
  if (endDate) endDate = endDate.replace(/\//g, '-')

  // ============= 2. 如果开始日期 > 结束日期，自动互换 =============
  if (startDate && endDate && startDate > endDate) {
    [startDate, endDate] = [endDate, startDate]
  }

  // ============= 3. 传给后端 =============
  const res = await receiverPointApi.statsByDate({
    project_id: params.value.project_id,
    start_date: startDate,
    end_date: endDate
  })

  // 过滤无效数据
  const validData = res.data.filter(item => item.date !== null && item.date !== '')

  const x = validData.map(i => i.date)
  const count = validData.map(i => i.count)
  const picked = validData.map(i => i.picked)

  const allValues = [...count, ...picked]
  const maxCount = allValues.length > 0 ? Math.max(...allValues) : 0
  const yMax = maxCount > 0 ? maxCount + 10 : 10

  chartDateInst.resize()
  chartDateInst.setOption({
    grid: { left: '3%', right: '3%', top: '10%', bottom: '10%', containLabel: true },
    tooltip: { trigger: 'axis' },
    legend: { data: ['布设', '回收'], top: '8%', left: 'center' },
    xAxis: { type: 'category', data: x, axisLabel: { interval: 7, rotate: 30 } },
    yAxis: { type: 'value', min: 0, max: yMax },
    series: [
      { name: '布设', data: count, type: 'line', smooth: true },
      { name: '回收', data: picked, type: 'line', smooth: true }
    ]
  })
}

// 按线统计
const fetchStatsByLine = async () => {
  if (!params.value.project_id || !chartLineInst) return

  // 🔥 把所有筛选参数一起传过去
  const res = await receiverPointApi.statsByLine({
    project_id: params.value.project_id,
    receiver_line_begin: paramsLine.value.receiver_line_begin,
    receiver_line_end: paramsLine.value.receiver_line_end,
    status: paramsLine.value.status
  })

  const x = res.data.map(i => i.receiver_line__receiver_line)
  const total = res.data.map(i => i.total)
  const layouted = res.data.map(i => i.layouted)
  const picked = res.data.map(i => i.picked)

  chartLineInst.resize()
  chartLineInst.setOption({
    grid: { left: '3%', right: '3%', top: '15%', bottom: '10%', containLabel: true },
    tooltip: { trigger: 'axis' },
    title: { text: '各线收放排列统计', top: '1%', left: 'center' },
    legend: { data: ['总数', '布设', '回收'], top: '8%', left: 'center' },
    xAxis: { data: x, axisLabel: { interval: 5, rotate: 30 } },
    yAxis: { type: 'value' },
    series: [
      { name: '总数', data: total, type: 'bar' },
      { name: '布设', data: layouted, type: 'bar' },
      { name: '回收', data: picked, type: 'bar' }
    ]
  })
}
const resetLineParams = () => {
  paramsLine.value.receiver_line_begin = null
  paramsLine.value.receiver_line_end = null
  paramsLine.value.status = null
  fetchStatsByLine()
}

const resetDateParams = () => {
  paramsDate.value.startDate = ''
  paramsDate.value.endDate = ''
  fetchStatsByDate()
}
// 页面挂载（最关键：先初始化图表，再加载数据）
onMounted(async () => {
  // 1. 先初始化图表
  await nextTick()
  chartDateInst = echarts.init(chartDate.value)
  chartLineInst = echarts.init(chartLine.value)

  // 2. 加载项目
  await loadProject()

  // 3. 最后刷新数据
  refreshAll()

  // 窗口自适应
  window.addEventListener('resize', () => {
    chartDateInst?.resize()
    chartLineInst?.resize()
  })
})
</script>
<style scoped>
.page-container {
  padding: 20px;
}

.page-header {
  border-bottom: 1px solid #e0e0e0;
}

.card-total {
  background: #e3f2fd !important;
  color: #1976d2;
}

.card-layouted {
  background: #e8f5e9 !important;
  color: #388e3c;

}

.card-picked {
  background: #f8eef3 !important;
  color: #d81b60;
}

.card-unlayout {
  background: #fff8e1 !important;
  color: #ffa000;
}
</style>
