<template>
  <q-page class="row q-pa-md">
    <div class="col-12">
      <!-- 标题 + 项目选择 + 按钮 -->
      <div class="row q-mb-md items-center">
        <div class="col">
          <h3 class="text-primary">设备丢失明细管理</h3>
        </div>

        <!-- 项目选择器 -->
        <div class="col-auto q-mr-md">
          <q-select v-model="currentProjectId" :options="projectList" label="当前项目" options-label="label"
            options-value="id" map-options emit-value outlined dense style="width: 220px"
            @update:model-value="getList" />
        </div>

        <div class="col-auto">
          <q-btn label="新增丢失记录" color="primary" icon="add" class="q-mr-sm" @click="openAddDialog" />
          <q-btn label="导出Excel" color="positive" icon="download" @click="exportData" />
        </div>
      </div>

      <!-- 搜索 -->
      <q-card class="q-mb-md">
        <q-card-section>
          <q-input v-model="searchKey" placeholder="搜索设备名称 / 线路 / 备注" @keyup.enter="getList" clearable />
        </q-card-section>
      </q-card>

      <!-- 表格 -->
      <q-card>
        <q-table :rows="tableData" :columns="columns" row-key="id" :loading="loading" v-model:pagination="pagination"
          @request="onRequest">
          <template #body-cell-index="props">
            <q-td :props="props">
              {{ props.rowIndex + 1 }}
            </q-td>
          </template>
          <template #body-cell-actions="props">
            <q-btn-group>
              <q-btn icon="edit" color="blue" size="sm" @click="openEditDialog(props.row)" />
              <q-btn icon="delete" color="red" size="sm" @click="deleteItem(props.row)" />
            </q-btn-group>
          </template>
        </q-table>
      </q-card>
    </div>

    <!-- 新增/编辑弹窗 -->
    <q-dialog v-model="dialogVisible" max-width="750px">
      <q-card>
        <q-card-section>
          <h5 class="text-primary">{{ isEdit ? '编辑丢失记录' : '新增丢失记录' }}</h5>
        </q-card-section>
        <q-card-section class="q-gutter-md">
          <q-input v-model="form.lost_date" label="丢失日期" type="date" required />
          <q-input v-model="form.line" label="线路" />
          <q-input v-model="form.from_rp" label="起始RP" />
          <q-input v-model="form.to_rp" label="结束RP" />

          <q-input v-model.number="form.cable_m" label="电缆长度(m)" type="number" />
          <q-input v-model.number="form.fdu_428" label="FDU428" type="number" />
          <q-input v-model.number="form.geophone" label="检波器" type="number" />
          <q-input v-model.number="form.line_battery" label="排列电池" type="number" />
          <q-input v-model.number="form.battery_lead" label="电池引线" type="number" />
          <q-input v-model.number="form.battery_box" label="电池盒" type="number" />
          <q-input v-model.number="form.laul_428" label="LAUL428" type="number" />
          <q-input v-model.number="form.laux_428" label="LAUX428" type="number" />
          <q-input v-model.number="form.rubber_mat" label="过路胶皮" type="number" />
          <q-input v-model.number="form.jumper_m" label="跳线长度(m)" type="number" />

          <q-input v-model="form.remark" label="备注" />
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
import { equipmentLostDetailApi } from 'src/services/cableshopServiceApi'
import { projectSettingApi } from 'src/services/projectServiceApi'
import { Notify, Dialog } from 'quasar'

// 表格列
const columns = ref([
  { name: 'index', label: '序号', field: 'index', align: 'center' },
  { name: 'lost_date', label: '丢失日期', field: 'lost_date', align: 'center' },
  { name: 'line', label: '线路', field: 'line', align: 'center' },
  { name: 'from_rp', label: '起始RP', field: 'from_rp', align: 'center' },
  { name: 'to_rp', label: '结束RP', field: 'to_rp', align: 'center' },

  { name: 'cable_m', label: '电缆(m)', field: 'cable_m', align: 'center', format: val => val || '-' },
  { name: 'fdu_428', label: 'FDU428', field: 'fdu_428', align: 'center', format: val => val || '-' },
  { name: 'geophone', label: '检波器', field: 'geophone', align: 'center', format: val => val || '-' },
  { name: 'line_battery', label: '排列电池', field: 'line_battery', align: 'center', format: val => val || '-' },
  { name: 'battery_lead', label: '电池引线', field: 'battery_lead', align: 'center', format: val => val || '-' },
  { name: 'battery_box', label: '电池盒', field: 'battery_box', align: 'center', format: val => val || '-' },
  { name: 'laul_428', label: 'LAUL428', field: 'laul_428', align: 'center', format: val => val || '-' },
  { name: 'laux_428', label: 'LAUX428', field: 'laux_428', align: 'center', format: val => val || '-' },
  { name: 'rubber_mat', label: '过路胶皮', field: 'rubber_mat', align: 'center', format: val => val || '-' },
  { name: 'jumper_m', label: '跳线(m)', field: 'jumper_m', align: 'center', format: val => val || '-' },

  { name: 'remark', label: '备注', field: 'remark' },
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
    // 默认选中 ID 最大项目
    if (projectList.value.length > 0) {
      const maxItem = projectList.value.reduce((a, b) => a.value > b.value ? a : b)
      currentProjectId.value = maxItem.value
    }
  } catch (error) {
    Notify.create({ type: 'negative', message: '项目加载失败：' + error.message })
  }
}

// 列表数据
const tableData = ref([])
const loading = ref(false)
const searchKey = ref('')
const pagination = ref({ page: 1, rowsPerPage: 10, rowsNumber: 0, sortBy: 'lost_date', descending: true })

// 弹窗
const dialogVisible = ref(false)
const isEdit = ref(false)
const form = reactive({
  lost_date: '',
  line: '',
  from_rp: '',
  to_rp: '',
  cable_m: 0,
  fdu_428: 0,
  geophone: 0,
  line_battery: 0,
  battery_lead: 0,
  battery_box: 0,
  laul_428: 0,
  laux_428: 0,
  rubber_mat: 0,
  jumper_m: 0,
  remark: '',
  project: null
})

// 获取列表（带 project）
const getList = async () => {
  if (!currentProjectId.value) return
  loading.value = true
  try {
    const res = await equipmentLostDetailApi.list({
      project: currentProjectId.value,
      search: searchKey.value,
      page: pagination.value.page,
      page_size: pagination.value.rowsPerPage,
    })
    tableData.value = res.data.results
    pagination.value.rowsNumber = res.data.count || 0
  } catch (error) {
    Notify.create({ type: 'negative', message: '获取列表失败：' + error.message })
  } finally {
    loading.value = false
  }
}

// 分页触发
const onRequest = (props) => {
  pagination.value = props.pagination
  getList()
}

// 新增
const openAddDialog = () => {
  isEdit.value = false
  Object.assign(form, {
    lost_date: new Date().toISOString().split('T')[0],
    line: '',
    from_rp: '',
    to_rp: '',
    cable_m: 0,
    fdu_428: 0,
    geophone: 0,
    line_battery: 0,
    battery_lead: 0,
    battery_box: 0,
    laul_428: 0,
    laux_428: 0,
    rubber_mat: 0,
    jumper_m: 0,
    remark: '',
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
      await equipmentLostDetailApi.update(form.id, form)
      Notify.create({ type: 'positive', message: '修改成功' })
    } else {
      await equipmentLostDetailApi.create(form)
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
    message: `确定删除这条丢失记录？`,
    ok: { color: 'red' },
  }).onOk(async () => {
    try {
      await equipmentLostDetailApi.delete(row.id)
      Notify.create({ type: 'positive', message: '删除成功' })
      getList()
    } catch (error) {
      Notify.create({ type: 'negative', message: '删除失败：' + error.message })
    }
  })
}

// 导出（带 project）
const exportData = async () => {
  try {
    const res = await equipmentLostDetailApi.export({
      params: { project: currentProjectId.value },
      responseType: 'blob'
    })
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const a = document.createElement('a')
    a.href = url
    a.download = `设备丢失明细_项目${currentProjectId.value}.xlsx`
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
