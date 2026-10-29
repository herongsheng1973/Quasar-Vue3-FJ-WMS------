<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <div class="col">
        <h4 class="text-primary">检波点明细</h4>
      </div>
      <div class="col-auto">
        <q-select v-model="projectId" label="选择项目" :options="projects" @update:model-value="getList" />
      </div>
    </div>
    <q-card>
      <q-table :rows="rows" :columns="columns" row-key="id" :loading="loading" v-model:pagination="pagination" />
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { receiverPointApi, projectSettingApi } from 'src/services/projectServiceApi'
const rows = ref([])
const loading = ref(false)
const projectId = ref('')
const projects = ref([])
const pagination = ref({
  page: 1,
  pageSize: 10,
})
const columns = [
  { name: 'receiver_line', label: '接收线', field: 'receiver_line' },
  { name: 'station', label: '站位', field: 'station' },
  { name: 'easting', label: '东坐标', field: 'easting' },
  { name: 'northing', label: '北坐标', field: 'northing' },
  { name: 'geophone_layout_date', label: '布设日期', field: 'geophone_layout_date' },
]
async function getProjects() {
  const res = await projectSettingApi.list()
  projects.value = res.data.map(p => ({ label: p.project_name, value: p.id }))
}
async function getList() {
  if (!projectId.value) return
  loading.value = true
  const res = await receiverPointApi.list({ project: projectId.value })
  rows.value = res.data
  loading.value = false
}
onMounted(() => getProjects())
</script>
