<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <div class="col">
        <h4 class="text-primary">接收线汇总</h4>
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
import { receiverLineApi, projectSettingApi } from 'src/services/projectServiceApi'
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
  { name: 'start_stake', label: '起始桩号', field: 'start_stake' },
  { name: 'end_stake', label: '结束桩号', field: 'end_stake' },
  { name: 'point_count', label: '点数', field: 'point_count' },
]
async function getProjects() {
  const res = await projectSettingApi.list()
  projects.value = res.data.map(p => ({ label: p.project_name, value: p.id }))
}
async function getList() {
  if (!projectId.value) return
  loading.value = true
  const res = await receiverLineApi.list({ project: projectId.value })
  rows.value = res.data
  loading.value = false
}
onMounted(() => getProjects())
</script>
