<template>
  <q-page class="row q-pa-md">
    <div class="col-12">
      <!-- 标题 + 项目选择 + 按钮 -->
      <div class="row q-mb-md items-center">
        <div class="col">
          <h3 class="text-primary">设备总表管理</h3>
        </div>

        <!-- 项目选择器 -->
        <div class="col-auto q-mr-md">
          <q-select v-model="currentProjectId" label="当前项目" :options="projectList" options-label="label"
            options-value="id" map-options emit-value outlined dense style="width: 220px"
            @update:model-value="getList" />
        </div>

        <div class="col-auto">
          <q-btn label="新增设备" color="primary" icon="add" class="q-mr-sm" @click="openAddDialog" />
          <q-btn label="导出Excel" color="positive" icon="download" @click="exportDeviceTotal" />
        </div>
      </div>

      <!-- 搜索 -->
      <q-card class="q-mb-md">
        <q-card-section>
          <q-input v-model="searchKey" placeholder="搜索设备名称 / 描述" @keyup.enter="getList" clearable />
        </q-card-section>
      </q-card>

      <!-- 表格 -->
      <q-card>
        <q-table :rows="tableData" :columns="columns" row-key="id" :loading="loading">
          <template #body-cell-index="props">
            <q-td :props="props">
              {{ props.rowIndex + 1 }}
            </q-td>
          </template>
          <template #body-cell-actions="props">
            <q-btn-group>
              <q-btn icon="visibility" color="green" size="sm" @click="viewDetail(props.row)" />
              <q-btn icon="edit" color="blue" size="sm" @click="openEditDialog(props.row)" />
              <q-btn icon="delete" color="red" size="sm" @click="deleteItem(props.row)" />
            </q-btn-group>
          </template>
        </q-table>
      </q-card>
    </div>

    <!-- 月度详情弹窗 -->
    <q-dialog v-model="detailDialogVisible" max-width="800px">
      <q-card>
        <q-card-section>
          <h5 class="text-primary">设备月度详情：{{ detailDeviceName }}</h5>
        </q-card-section>
        <q-card-section class="q-pa-md">
          <q-table title="月度统计" :rows="detailTableData" :columns="detailColumns" row-key="id"
            :loading="detailLoading" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn label="关闭" color="grey" @click="detailDialogVisible = false" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 新增/编辑弹窗 -->
    <q-dialog v-model="dialogVisible" max-width="700px">
      <q-card>
        <q-card-section>
          <h5 class="text-primary">{{ isEdit ? '编辑设备' : '新增设备' }}</h5>
        </q-card-section>
        <q-card-section class="q-gutter-md">
          <q-input v-model="form.device_name" label="设备名称" required />
          <q-input v-model.number="form.arrive_quantity" label="到队数量" type="number" />
          <q-input v-model.number="form.repair_send_quantity" label="送修数量" type="number" />
          <q-input v-model.number="form.repair_return_quantity" label="返回数量" type="number" />
          <q-input v-model.number="form.lost_quantity" label="丢失数量" type="number" />
          <q-input v-model.number="form.scrap_quantity" label="报废数量" type="number" />
          <q-input v-model.number="form.consume_quantity" label="消耗数量" type="number" />
          <q-input v-model.number="form.total_quantity" label="总计" type="number" />
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
import { deviceTotalApi, monthlySummaryApi } from 'src/services/cableshopServiceApi'
import { projectSettingApi } from 'src/services/projectServiceApi' // 项目接口
import { Notify, Dialog } from 'quasar'

// 表格列
const columns = ref([
  { name: 'index', label: '序号', field: 'index', align: 'center' },
  { name: 'device_name', label: '设备名称', field: 'device_name' },
  { name: 'arrive_quantity', label: '到队数量', field: 'arrive_quantity', align: 'center' },
  { name: 'repair_send_quantity', label: '送修数量', field: 'repair_send_quantity', align: 'center' },
  { name: 'repair_return_quantity', label: '返回数量', field: 'repair_return_quantity', align: 'center' },
  { name: 'lost_quantity', label: '丢失数量', field: 'lost_quantity', align: 'center' },
  { name: 'scrap_quantity', label: '报废数量', field: 'scrap_quantity', align: 'center' },
  { name: 'consume_quantity', label: '消耗数量', field: 'consume_quantity', align: 'center' },
  { name: 'total_quantity', label: '总计', field: 'total_quantity', align: 'center' },
  { name: 'actions', label: '操作', align: 'center' },
])

// 详情列表列
const detailColumns = ref([
  { name: 'month_name', label: '统计年月', field: 'month_name', align: 'center' },
  { name: 'quantity', label: '数量', field: 'quantity', align: 'center' },
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
    if (projectList.value.length) {
      const maxItem = projectList.value.reduce((a, b) => a.value > b.value ? a : b)
      currentProjectId.value = maxItem.value
    }
  } catch (err) {
    Notify.create({ type: 'negative', message: '项目加载失败：' + err.message })
  }
}

// 表格数据
const tableData = ref([])
const loading = ref(false)
const searchKey = ref('')

// 弹窗
const dialogVisible = ref(false)
const isEdit = ref(false)
const form = reactive({
  device_name: '',
  arrive_quantity: 0,
  repair_send_quantity: 0,
  repair_return_quantity: 0,
  lost_quantity: 0,
  scrap_quantity: 0,
  consume_quantity: 0,
  total_quantity: 0,
  project: null
})

// 月度详情
const detailDialogVisible = ref(false)
const detailDeviceName = ref('')
const detailTableData = ref([])
const detailLoading = ref(false)

// ================== 查看详情（带 project）==================
const viewDetail = async (row) => {
  if (!currentProjectId.value) return
  detailDeviceName.value = row.device_name
  detailDialogVisible.value = true
  detailLoading.value = true
  try {
    const res = await monthlySummaryApi.list({
      project: currentProjectId.value,
      device_name: row.device_name
    })
    detailTableData.value = res.data || []
  } catch (e) {
    Notify.create({ type: 'negative', message: '获取月度详情失败：' + e.message })
  } finally {
    detailLoading.value = false
  }
}

// ================== 获取列表（带 project）==================
const getList = async () => {
  if (!currentProjectId.value) return
  loading.value = true
  try {
    const res = await deviceTotalApi.list({
      project: currentProjectId.value,
      search: searchKey.value,
    })
    tableData.value = res.data || []
  } catch (e) {
    Notify.create({ type: 'negative', message: '获取失败：' + e.message })
  } finally {
    loading.value = false
  }
}

// 新增
const openAddDialog = () => {
  isEdit.value = false
  Object.assign(form, {
    device_name: '',
    arrive_quantity: 0,
    repair_send_quantity: 0,
    repair_return_quantity: 0,
    lost_quantity: 0,
    scrap_quantity: 0,
    consume_quantity: 0,
    total_quantity: 0,
    project: currentProjectId.value
  })
  dialogVisible.value = true
}

// 编辑
const openEditDialog = (row) => {
  isEdit.value = true
  Object.assign(form, row)
  dialogVisible.value = true
}

// 保存（自动带 project）
const saveForm = async () => {
  form.project = currentProjectId.value
  try {
    if (isEdit.value) {
      await deviceTotalApi.update(form.id, form)
      Notify.create({ type: 'positive', message: '修改成功' })
    } else {
      await deviceTotalApi.create(form)
      Notify.create({ type: 'positive', message: '新增成功' })
    }
    dialogVisible.value = false
    getList()
  } catch (error) {
    Notify.create({ type: 'negative', message: '保存失败：' + error.message })
  }
}

// 删除
const deleteItem = async (row) => {
  Dialog.create({
    title: '确认删除',
    message: `确定删除【${row.device_name}】？`,
    ok: { color: 'red' },
  }).onOk(async () => {
    try {
      await deviceTotalApi.delete(row.id)
      Notify.create({ type: 'positive', message: '删除成功' })
      getList()
    } catch (err) {
      Notify.create({ type: 'negative', message: '删除失败：' + err.message })
    }
  })
}

// 导出（带 project）
const exportDeviceTotal = async () => {
  try {
    const res = await deviceTotalApi.export({
      params: { project: currentProjectId.value },
      responseType: 'blob'
    })
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const a = document.createElement('a')
    a.href = url
    a.download = `设备总表_项目${currentProjectId.value}.xlsx`
    a.click()
    window.URL.revokeObjectURL(url)
  } catch (err) {
    Notify.create({ type: 'negative', message: '导出失败：' + err.message })
  }
}

// 初始化：先加载项目 → 再加载数据
onMounted(async () => {
  await loadProjectList()
  getList()
})
</script>

<style scoped></style>
