<template>
  <q-page class="page-container">
    <!-- 标题居中 + 项目选择靠右 -->
    <div class="row q-mb-md items-center justify-between">
      <!-- page-header 水平居中 -->
      <div class="col-4">

      </div>
      <div class="col-4">
        <page-header title="激发点生产管理" />
      </div>

      <!-- 项目选择 靠右 -->
      <div class="col-2">
        <q-select v-model="currentProjectId" :options="projectList" label="选择项目" option-label="label"
          option-value="value" map-options emit-value outlined dense @update:model-value="refreshAllData" />
      </div>
    </div>
    <!-- 总进度卡片 -->
    <div class="row q-gutter-md q-mb-md">
      <q-card class="col-12" elevation="2">
        <q-card-section>
          <h5 class="text-primary">项目整体生产进度</h5>
          <div class="row flex justify-between items-center">
            <div class="col-6 col-md-3 q-pa-md">
              <div class="text-center">
                <div class="text-h6">总点数</div>
                <div class="text-h5 font-bold">{{ progress.total }}</div>
              </div>
            </div>
            <div class="col-6 col-md-3 q-pa-md">
              <div class="text-center">
                <div class="text-h6 text-positive">已完成</div>
                <div class="text-h5 font-bold text-positive">{{ progress.finished }}</div>
              </div>
            </div>
            <div class="col-6 col-md-3 q-pa-md">
              <div class="text-center">
                <div class="text-h6 text-warning">未完成</div>
                <div class="text-h5 font-bold text-warning">{{ progress.unfinished }}</div>
              </div>
            </div>
            <div class="col-12 col-md-3 q-pa-md">
              <div class="text-center">
                <div class="text-h6">完成率</div>
                <div class="text-h5 font-bold text-primary">{{ progress.progress_rate }}%</div>
              </div>
            </div>
          </div>
          <q-linear-progress class="q-mt-md" :value="progress.progress_rate / 100" color="primary" height="10px" />
        </q-card-section>
      </q-card>
    </div>

    <!-- 图表区域 -->
    <div class="row q-gutter-md">
      <!-- 按日期统计 -->
      <q-card class="col-12" elevation="2">
        <q-card-section>
          <h5 class="text-primary">按日期统计生产进度</h5>
          <v-chart class="chart" :option="dateChartOption" autoresize />
        </q-card-section>
      </q-card>
      <!-- 按Block统计 -->
      <q-card class="col-12" elevation="2">
        <q-card-section>
          <h5 class="text-primary">按Block生产进度</h5>
          <v-chart class="chart" :option="blockChartOption" autoresize />
        </q-card-section>
      </q-card>

      <!-- 按SourceLine统计 -->
      <q-card class="col-12">
        <q-card-section>
          <h5 class="text-primary">按SourceLine生产进度</h5>
          <v-chart class="chart" :option="lineChartOption" autoresize />
        </q-card-section>
      </q-card>
    </div>

    <div class="row q-gutter-md q-mt-md">
      <!-- 重激发统计 -->
      <q-card class="col-12" elevation="2">
        <q-card-section>
          <h5 class="text-primary">按Block重激发统计</h5>
          <v-chart class="chart" :option="reshotChartOption" autoresize />
        </q-card-section>
      </q-card>
    </div>

    <!-- 激发点列表 -->
    <q-card class="q-mt-md" elevation="2">
      <q-card-section>
        <h5 class="text-primary">激发点列表</h5>
      </q-card-section>

      <q-table :rows="sourcePointList" :columns="columns" row-key="id" :loading="listLoading"
        v-model:pagination="pagination" />
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import { useQuasar } from 'quasar'
import PageHeader from 'src/components/cableshop/PageHeader.vue'
import { sourcePointApi } from 'src/services/projectServiceApi'
import { projectSettingApi } from 'src/services/projectServiceApi'

use([
  CanvasRenderer,
  BarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

const $q = useQuasar()

// 项目
const projectList = ref([])
const currentProjectId = ref(null)

// 列表
const sourcePointList = ref([])
const listLoading = ref(false)
const columns = [
  { name: 'source_line_name', label: '激发线', field: 'source_line_name', align: 'left' },
  { name: 'station', label: '站位', field: 'station', align: 'left' },
  { name: 'block_no', label: 'Block', field: 'block_no' },
  { name: 'shooting_date', label: '激发日期', field: 'shooting_date' },
  { name: 'reshooting_date', label: '重激发日期', field: 'reshooting_date' },
  { name: 'reshooting_times', label: '重激发次数', field: 'reshooting_times' }
]

// 统计
const progress = ref({ total: 0, finished: 0, unfinished: 0, progress_rate: 0 })
const dateChartOption = ref({})
const blockChartOption = ref({})
const lineChartOption = ref({})
const reshotChartOption = ref({})
const pagination = ref({
  page: 1,
  pageSize: 10,
})
// 加载项目
const loadProjects = async () => {
  const res = await projectSettingApi.list()
  const list = res.data.results
  console.log(list)
  projectList.value = list.map(i => ({
    label: i.project_name,
    value: i.id
  }))

  if (projectList.value.length > 0) {
    const maxId = Math.max(...projectList.value.map(item => item.value))
    currentProjectId.value = maxId
  }
}

// 刷新所有数据
const refreshAllData = async () => {
  if (!currentProjectId.value) return
  await Promise.all([
    loadProgress(),
    loadDateStats(),
    loadBlockStats(),
    loadLineStats(),
    loadReshotStats(),
    loadSourcePointList()
  ])
}

// 项目总进度
const loadProgress = async () => {
  const res = await sourcePointApi.projectProgress({ project_id: currentProjectId.value })
  progress.value = res.data
}
// 按日期统计
const loadDateStats = async () => {
  const res = await sourcePointApi.statsByDate({ project_id: currentProjectId.value })
  const data = res.data
  dateChartOption.value = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['prod'] },
    xAxis: { type: 'category', data: data.map(i => i.shooting_date) },
    yAxis: { type: 'value' },
    series: [
      { name: 'prod', data: data.map(i => i.prod), type: 'bar' },
    ]
  }
}
// 按Block统计
const loadBlockStats = async () => {
  const res = await sourcePointApi.statsByBlock({ project_id: currentProjectId.value })
  const data = res.data
  blockChartOption.value = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['总数', '已完成', '未完成'] },
    xAxis: { type: 'category', data: data.map(i => i.block_no || '未知') },
    yAxis: { type: 'value' },
    series: [
      { name: '总数', type: 'bar', data: data.map(i => i.total) },
      { name: '已完成', type: 'bar', data: data.map(i => i.finished) },
      { name: '未完成', type: 'bar', data: data.map(i => i.unfinished) }
    ]
  }
}

// 按激发线统计
const loadLineStats = async () => {
  const res = await sourcePointApi.statsByLine({ project_id: currentProjectId.value })
  const data = res.data
  lineChartOption.value = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['总数', '已完成', '未完成'] },
    xAxis: { type: 'category', data: data.map(i => i.source_line__source_line) },
    yAxis: { type: 'value' },
    series: [
      { name: '总数', type: 'bar', data: data.map(i => i.total) },
      { name: '已完成', type: 'bar', data: data.map(i => i.finished) },
      { name: '未完成', type: 'bar', data: data.map(i => i.unfinished) }
    ]
  }
}

// 重激发统计
const loadReshotStats = async () => {
  const res = await sourcePointApi.statsReshotByBlock({ project_id: currentProjectId.value })
  const data = res.data
  reshotChartOption.value = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['重激发点数', '重激发总次数'] },
    xAxis: { type: 'category', data: data.map(i => i.block_no || '未知') },
    yAxis: { type: 'value' },
    series: [
      { name: '重激发点数', type: 'bar', data: data.map(i => i.reshot_point_count) },
      { name: '重激发总次数', type: 'bar', data: data.map(i => i.total_reshot_times || 0) }
    ]
  }
}

// 列表
const loadSourcePointList = async () => {
  listLoading.value = true
  try {
    const res = await sourcePointApi.list({ project: currentProjectId.value })
    sourcePointList.value = res.data.results || []
  } catch (error) {
    $q.notify({ type: 'negative', message: '加载激发点列表失败' + error.message })
  } finally {
    listLoading.value = false
  }
}

onMounted(async () => {
  await loadProjects()
  refreshAllData()
})
</script>

<style scoped>
.page-container {
  padding: 20px;
}

.chart {
  height: 320px;
  width: 100%;
}
</style>
