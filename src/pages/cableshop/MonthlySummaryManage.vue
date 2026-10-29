<template>
  <q-page class="row q-pa-md">
    <div class="col-12">
      <!-- 标题 + 项目选择 + 按钮 -->
      <div class="row q-mb-md items-center">
        <div class="col">
          <h3 class="text-primary">设备月度统计管理</h3>
        </div>

        <!-- 项目选择器 -->
        <div class="col-auto q-mr-md">
          <q-select v-model="currentProjectId" :options="projectList" label="当前项目" options-label="label"
            options-value="id" map-options emit-value outlined dense style="width: 220px"
            @update:model-value="getList" />
        </div>

        <div class="col-auto">
          <q-btn label="新增月度数据" color="primary" icon="add" class="q-mr-sm" @click="openAddDialog" />
          <q-btn label="导出Excel" color="positive" icon="download" @click="exportData" />
        </div>
      </div>

      <!-- 搜索栏 -->
      <q-card class="q-mb-md">
        <q-card-section>
          <div class="row q-gutter-sm">
            <q-input class="col" v-model="searchDevice" placeholder="搜索设备名称" clearable @keyup.enter="getList" />
            <q-input class="col" v-model="searchMonth" placeholder="搜索月份 如：2026-03" clearable @keyup.enter="getList" />
            <q-btn label="搜索" color="primary" @click="getList" />
          </div>
        </q-card-section>
      </q-card>

      <!-- 主表格 -->
      <q-card>
        <q-table :rows="tableData" :columns="columns" row-key="id" :loading="loading">
          <template #body-cell-actions="props">
            <q-btn-group>
              <q-btn icon="edit" color="blue" size="sm" @click="openEditDialog(props.row)" />
              <q-btn icon="delete" color="red" size="sm" @click="deleteItem(props.row)" />
            </q-btn-group>
          </template>
        </q-table>
      </q-card>
    </div>

    <!-- 新增 / 编辑 弹窗 -->
    <q-dialog v-model="dialogVisible" max-width="600px">
      <q-card>
        <q-card-section>
          <h5 class="text-primary">{{ isEdit ? '编辑月度数据' : '新增月度数据' }}</h5>
        </q-card-section>

        <q-card-section class="q-gutter-md">
          <q-input v-model="form.device_name" label="设备名称" required />
          <q-input v-model="form.month_name" label="统计年月（如 2026-03）" required />
          <q-input v-model.number="form.quantity" label="设备总数" type="number" required />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn label="取消" @click="dialogVisible = false" />
          <q-btn label="保存" color="primary" @click="saveForm" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { monthlySummaryApi } from 'src/services/cableshopServiceApi'
import { projectSettingApi } from 'src/services/projectServiceApi'
import { Notify, Dialog } from 'quasar'

// 表格列
const columns = ref([
  { name: 'id', label: 'ID', field: 'id', align: 'center' },
  { name: 'device_name', label: '设备名称', field: 'device_name' },
  { name: 'month_name', label: '统计年月', field: 'month_name', align: 'center' },
  { name: 'quantity', label: '设备总数', field: 'quantity', align: 'center' },
  { name: 'actions', label: '操作', align: 'center' },
])

// ==========================================
// 项目相关（自动加载、默认最大ID）
// ==========================================
const projectList = ref([])
const currentProjectId = ref(null)

const loadProjectList = async () => {
  try {
    const res = await projectSettingApi.list()
    projectList.value = res.data.results.map(item => ({
      label: item.project_name,
      value: item.id
    }))
    // 默认选中 ID 最大的项目
    if (projectList.value.length > 0) {
      const maxItem = projectList.value.reduce((a, b) => a.value > b.value ? a : b)
      currentProjectId.value = maxItem.value
    }
  } catch (error) {
    Notify.create({ type: 'negative', message: '项目加载失败：' + error.message })
  }
}

// 表格数据
const tableData = ref([])
const loading = ref(false)
const searchDevice = ref('')
const searchMonth = ref('')

// 弹窗
const dialogVisible = ref(false)
const isEdit = ref(false)
const form = reactive({
  device_name: '',
  month_name: '',
  quantity: 0,
  project: null
})

// ======================================
// 获取列表（带 project）
// ======================================
const getList = async () => {
  if (!currentProjectId.value) return
  loading.value = true
  try {
    const res = await monthlySummaryApi.list({
      project: currentProjectId.value,
      device_name: searchDevice.value,
      month_name: searchMonth.value
    })
    tableData.value = res.data || []
  } catch (e) {
    Notify.create({ type: 'negative', message: '获取失败：' + e.message })
  } finally {
    loading.value = false
  }
}

// ======================================
// 新增 / 编辑
// ======================================
const openAddDialog = () => {
  isEdit.value = false
  Object.assign(form, {
    device_name: '',
    month_name: '',
    quantity: 0,
    project: currentProjectId.value
  })
  dialogVisible.value = true
}

const openEditDialog = (row) => {
  isEdit.value = true
  Object.assign(form, row)
  dialogVisible.value = true
}

const saveForm = async () => {
  form.project = currentProjectId.value
  try {
    if (isEdit.value) {
      await monthlySummaryApi.update(form.id, form)
      Notify.create({ type: 'positive', message: '修改成功' })
    } else {
      await monthlySummaryApi.create(form)
      Notify.create({ type: 'positive', message: '新增成功' })
    }
    dialogVisible.value = false
    getList()
  } catch (error) {
    Notify.create({ type: 'negative', message: '保存失败：' + error.message })
  }
}

// ======================================
// 删除
// ======================================
const deleteItem = async (row) => {
  Dialog.create({
    title: '确认删除',
    message: `确定删除【${row.device_name} - ${row.month_name}】？`,
    ok: { color: 'red' },
  }).onOk(async () => {
    try {
      await monthlySummaryApi.delete(row.id)
      Notify.create({ type: 'positive', message: '删除成功' })
      getList()
    } catch (error) {
      Notify.create({ type: 'negative', message: '删除失败：' + error.message })
    }
  })
}

// ======================================
// 导出Excel（带 project）
// ======================================
const exportData = async () => {
  try {
    const res = await monthlySummaryApi.export({
      params: { project: currentProjectId.value },
      responseType: 'blob'
    })
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const a = document.createElement('a')
    a.href = url
    a.download = `设备月度统计_项目${currentProjectId.value}.xlsx`
    a.click()
    window.URL.revokeObjectURL(url)
  } catch (error) {
    Notify.create({ type: 'negative', message: '导出失败：' + error.message })
  }
}

// 初始化
onMounted(async () => {
  await loadProjectList()
  getList()
})
</script>

<style scoped></style>
