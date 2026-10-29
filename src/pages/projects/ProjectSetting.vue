<template>
  <q-page class="q-pa-md">
    <div class="row q-mb-md items-center">
      <div class="col">
        <h3 class="text-primary">项目设置管理</h3>
      </div>
      <div class="col-auto">
        <q-btn label="新增项目" color="primary" icon="add" @click="openAddDialog" />
      </div>
    </div>

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

    <!-- 新增/编辑弹窗 -->
    <q-dialog v-model="dialogVisible" max-width="700px">
      <q-card>
        <q-card-section>
          <h5 class="text-primary">{{ isEdit ? "编辑项目" : "新增项目" }}</h5>
        </q-card-section>

        <q-card-section class="q-gutter-md">
          <q-input v-model="form.project_name" label="项目名称" required />
          <q-input v-model="form.project_code" label="项目编号" />
          <q-input v-model="form.block_no" label="区块号" />
          <q-input v-model.number="form.area_sqkm" label="勘探面积(km²)" type="number" />
          <q-input v-model.number="form.total_receiver_points" label="总接收点数量" type="number" />
          <q-input v-model.number="form.total_source_points" label="总激发点数量" type="number" />
          <q-input v-model="form.start_date" label="开工日期" type="date" />
          <q-input v-model="form.end_date" label="完工日期" type="date" />
          <q-input v-model="form.company" label="项目甲方" />
          <q-input v-model="form.contractor" label="项目乙方" />
          <q-input v-model="form.remark" label="备注" type="textarea" />
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
import { projectSettingApi } from 'src/services/projectServiceApi'
import { Notify, Dialog } from 'quasar'

const columns = ref([
  { name: 'project_name', label: '项目名称', field: 'project_name' },
  { name: 'project_code', label: '项目编号', field: 'project_code', align: 'center' },
  { name: 'block_no', label: '区块号', field: 'block_no', align: 'center' },
  { name: 'area_sqkm', label: '面积(km²)', field: 'area_sqkm', align: 'center' },
  { name: 'total_receiver_points', label: '接收点总数', field: 'total_receiver_points', align: 'center' },
  { name: 'total_source_points', label: '激发点总数', field: 'total_source_points', align: 'center' },
  { name: 'start_date', label: '开工日期', field: 'start_date', align: 'center' },
  { name: 'end_date', label: '完工日期', field: 'end_date', align: 'center' },
  { name: 'actions', label: '操作', align: 'center' },
])

const tableData = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)

const form = reactive({
  project_name: '',
  project_code: '',
  block_no: '',
  area_sqkm: 0,
  total_receiver_points: 0,
  total_source_points: 0,
  start_date: '',
  end_date: '',
  company: '',
  contractor: '',
  remark: '',
})

// 日期格式化函数
const formatDate = (dateStr) => {
  if (!dateStr) return null
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return null
  return d.toISOString().split('T')[0]
}

const getList = async () => {
  loading.value = true
  try {
    const res = await projectSettingApi.list()
    tableData.value = res.data.results || []
  } catch (e) {
    Notify({ type: 'negative', message: '获取失败 ' + e.message })
  } finally {
    loading.value = false
  }
}

const openAddDialog = () => {
  isEdit.value = false
  Object.assign(form, {
    project_name: '',
    project_code: '',
    block_no: '',
    area_sqkm: 0,
    total_receiver_points: 0,
    total_source_points: 0,
    start_date: '',
    end_date: '',
    company: '',
    contractor: '',
    remark: '',
  })
  dialogVisible.value = true
}

const openEditDialog = (row) => {
  isEdit.value = true
  Object.assign(form, row)
  dialogVisible.value = true
}

// 保存时自动格式化日期
const saveForm = async () => {
  try {
    const submitData = {
      ...form,
      start_date: formatDate(form.start_date),
      end_date: formatDate(form.end_date)
    }

    if (isEdit.value) {
      await projectSettingApi.update(form.id, submitData)
      Notify.create({ type: 'positive', message: '修改成功' })
    } else {
      await projectSettingApi.create(submitData)
      Notify.create({ type: 'positive', message: '新增成功' })
    }
    dialogVisible.value = false
    getList()
  } catch (e) {
    Notify.create({ type: 'negative', message: '保存失败' + e.message })
  }
}

const deleteItem = async (row) => {
  Dialog.create({
    title: '确认删除',
    message: `确定删除项目：${row.project_name}？`,
  }).onOk(async () => {
    try {
      await projectSettingApi.delete(row.id)
      Notify.create({ type: 'positive', message: '删除成功' })
      getList()
    } catch (e) {
      Notify.create({ type: 'negative', message: '删除失败' + e.message })
    }
  })
}

onMounted(() => {
  getList()
})
</script>
