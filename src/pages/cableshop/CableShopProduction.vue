<template>
  <q-page class="row q-pa-md">
    <div class="col-12">
      <!-- 顶部标题 + 项目选择 + 功能按钮 -->
      <div class="row q-mb-md items-center">
        <div class="col">
          <h3 class="text-primary">CableShop生产管理</h3>
        </div>

        <!-- 项目选择下拉框 -->
        <div class="col-auto q-mr-md">
          <q-select v-model="currentProjectId" label="当前项目" :options="projectList" emit-value map-options
            options-value="value" options-label="label" style="width: 220px" @update:model-value="getList" />

        </div>

        <div class="col-auto">
          <q-btn label="新增生产记录" color="primary" icon="add" class="q-mr-sm" @click="openAddDialog" />
          <q-btn label="导出Excel" color="positive" icon="download" @click="exportData" />
        </div>
      </div>

      <!-- 搜索栏 -->
      <q-card class="q-mb-md">
        <q-card-section>
          <q-input v-model="searchKey" placeholder="搜索日期/关键字" @keyup.enter="getList" clearable />
        </q-card-section>
      </q-card>

      <!-- 数据表格 -->
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
    <q-dialog v-model="dialogVisible" max-width="720px">
      <q-card>
        <q-card-section>
          <h5 class="text-primary">{{ isEdit ? '编辑生产记录' : '新增生产记录' }}</h5>
        </q-card-section>
        <q-card-section class="q-gutter-md">
          <q-input v-model="form.production_date" label="生产日期" type="date" required />

          <!-- 泄漏测试 -->
          <q-input v-model.number="form.geophone_leakage_test" label="泄漏测试总数" type="number" />
          <q-input v-model.number="form.geophone_leakage_pass" label="泄漏测试通过" type="number" />
          <q-input v-model.number="form.geophone_leakage_fail" label="泄漏测试失败" type="number" />
          <q-input v-model.number="form.geophone_leakage_repair" label="泄漏测试维修" type="number" />

          <!-- SMT 测试 -->
          <q-input v-model.number="form.geophone_smt_test" label="SMT测试总数" type="number" />
          <q-input v-model.number="form.geophone_smt_pass" label="SMT测试通过" type="number" />
          <q-input v-model.number="form.geophone_smt_fail" label="SMT测试失败" type="number" />
          <q-input v-model.number="form.geophone_smt_repair" label="SMT测试维修" type="number" />

          <!-- 3FDU / 4FDU -->
          <q-input v-model.number="form.fdu3_link_test" label="3FDU测试总数" type="number" />
          <q-input v-model.number="form.fdu3_link_pass" label="3FDU通过" type="number" />
          <q-input v-model.number="form.fdu3_link_fail" label="3FDU失败" type="number" />

          <q-input v-model.number="form.fdu4_link_test" label="4FDU测试总数" type="number" />
          <q-input v-model.number="form.fdu4_link_pass" label="4FDU通过" type="number" />
          <q-input v-model.number="form.fdu4_link_fail" label="4FDU失败" type="number" />

          <!-- 材料消耗 -->
          <q-input v-model.number="form.material_wire_m" label="线材消耗(米)" type="number" />
          <q-input v-model.number="form.material_plug" label="插头消耗" type="number" />
          <q-input v-model.number="form.material_element" label="芯体消耗" type="number" />
          <q-input v-model.number="form.material_top" label="顶盖消耗" type="number" />

          <!-- 坏件 -->
          <q-input v-model.number="form.bad_laux" label="坏LAUX" type="number" />
          <q-input v-model.number="form.bad_laul" label="坏LAUL" type="number" />
          <q-input v-model.number="form.bad_fdu" label="坏FDU" type="number" />

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
import { cableshopProductionApi } from 'src/services/cableshopServiceApi'
import { projectSettingApi } from 'src/services/projectServiceApi' // 项目接口
import { Notify, Dialog } from 'quasar'

// 表格列
const columns = ref([
  { name: 'index', label: '序号', field: 'index', width: '50px', align: 'center' },
  { name: 'production_date', label: '日期', field: 'production_date', align: 'center' },
  { name: 'geophone_leakage_test', label: '泄漏总数', field: 'geophone_leakage_test', align: 'center' },
  { name: 'geophone_leakage_pass', label: '泄漏通过', field: 'geophone_leakage_pass', align: 'center' },
  { name: 'geophone_smt_test', label: 'SMT总数', field: 'geophone_smt_test', align: 'center' },
  { name: 'geophone_smt_pass', label: 'SMT通过', field: 'geophone_smt_pass', align: 'center' },
  { name: 'fdu3_link_test', label: '3FDU测试', field: 'fdu3_link_test', align: 'center' },
  { name: 'fdu3_link_pass', label: '3FDU通过', field: 'fdu3_link_pass', align: 'center' },
  { name: 'fdu4_link_test', label: '4FDU测试', field: 'fdu4_link_test', align: 'center' },
  { name: 'fdu4_link_pass', label: '4FDU通过', field: 'fdu4_link_pass', align: 'center' },
  { name: 'material_wire_m', label: '线材(米)', field: 'material_wire_m', align: 'center' },
  { name: 'bad_laux', label: '坏LAUX', field: 'bad_laux', align: 'center' },
  { name: 'bad_laul', label: '坏LAUL', field: 'bad_laul', align: 'center' },
  { name: 'bad_fdu', label: '坏FDU', field: 'bad_fdu', align: 'center' },
  { name: 'actions', label: '操作', field: 'actions', align: 'center' },
])

// 项目相关
const projectList = ref([])
const currentProjectId = ref(null)

// 表格
const tableData = ref([])
const loading = ref(false)
const searchKey = ref('')
const pagination = ref({ page: 1, rowsPerPage: 10 })

// 弹窗
const dialogVisible = ref(false)
const isEdit = ref(false)
const form = reactive({
  production_date: '',
  geophone_leakage_test: 0,
  geophone_leakage_pass: 0,
  geophone_leakage_fail: 0,
  geophone_leakage_repair: 0,
  geophone_smt_test: 0,
  geophone_smt_pass: 0,
  geophone_smt_fail: 0,
  geophone_smt_repair: 0,
  fdu3_link_test: 0,
  fdu3_link_pass: 0,
  fdu3_link_fail: 0,
  fdu4_link_test: 0,
  fdu4_link_pass: 0,
  fdu4_link_fail: 0,
  material_wire_m: 0,
  material_plug: 0,
  material_element: 0,
  material_top: 0,
  bad_laux: 0,
  bad_laul: 0,
  bad_fdu: 0,
  project: null
})

// ==========================================
// 加载项目列表 + 默认选中最大ID
// ==========================================
const loadProjectList = async () => {
  try {
    const res = await projectSettingApi.list()
    projectList.value = res.data.results.map(item => ({
      label: item.project_name,
      value: item.id
    }))

    // 取 id 最大的项目
    if (projectList.value.length > 0) {
      const maxProject = projectList.value.reduce((a, b) => (a.value > b.value ? a : b))
      currentProjectId.value = maxProject.value
    }
  } catch (err) {
    Notify.create({ type: 'negative', message: '项目加载失败：' + err.message })
  }
}

// ==========================================
// 获取生产数据（自动带 project）
// ==========================================
const getList = async () => {
  if (!currentProjectId.value) return
  loading.value = true
  try {
    const res = await cableshopProductionApi.list({
      project: currentProjectId.value,
      search: searchKey.value,
      page: pagination.value.page,
      page_size: pagination.value.rowsPerPage
    })
    tableData.value = res.data.results || []
    pagination.value.rowsNumber = res.data.count || 0
  } catch (err) {
    Notify.create({ type: 'negative', message: '加载失败：' + err.message })
  } finally {
    loading.value = false
  }
}

// 分页
const onRequest = (props) => {
  pagination.value = props.pagination
  getList()
}

// 新增
const openAddDialog = () => {
  isEdit.value = false
  Object.assign(form, {
    production_date: new Date().toISOString().split('T')[0],
    geophone_leakage_test: 0,
    geophone_leakage_pass: 0,
    geophone_leakage_fail: 0,
    geophone_leakage_repair: 0,
    geophone_smt_test: 0,
    geophone_smt_pass: 0,
    geophone_smt_fail: 0,
    geophone_smt_repair: 0,
    fdu3_link_test: 0,
    fdu3_link_pass: 0,
    fdu3_link_fail: 0,
    fdu4_link_test: 0,
    fdu4_link_pass: 0,
    fdu4_link_fail: 0,
    material_wire_m: 0,
    material_plug: 0,
    material_element: 0,
    material_top: 0,
    bad_laux: 0,
    bad_laul: 0,
    bad_fdu: 0,
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
      await cableshopProductionApi.update(form.id, form)
      Notify.create({ type: 'positive', message: '编辑成功' })
    } else {
      await cableshopProductionApi.post(form)
      Notify.create({ type: 'positive', message: '新增成功' })
    }
    dialogVisible.value = false
    getList()
  } catch (err) {
    Notify.create({ type: 'negative', message: '保存失败：' + err.message })
  }
}

// 删除
const deleteItem = async (row) => {
  Dialog.create({
    title: '确认删除',
    message: '确定删除该记录？',
    ok: { color: 'red' }
  }).onOk(async () => {
    try {
      await cableshopProductionApi.delete(row.id)
      Notify.create({ positive: '删除成功' })
      getList()
    } catch (err) {
      Notify.create({ negative: '删除失败：' + err.message })
    }
  })
}

// 导出（自动带 project）
const exportData = async () => {
  try {
    const res = await cableshopProductionApi.export({
      params: { project: currentProjectId.value },
      responseType: 'blob'
    })
    const blob = new Blob([res.data])
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `CableShop生产记录_项目${currentProjectId.value}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
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
