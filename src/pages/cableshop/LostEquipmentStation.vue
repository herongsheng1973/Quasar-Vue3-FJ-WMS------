<template>
  <q-page class="row q-pa-md">
    <div class="col-12">
      <!-- 顶部标题 & 功能按钮 -->
      <div class="row q-mb-md items-center">
        <div class="col">
          <h3 class="text-primary">丢失设备站号管理</h3>
        </div>
        <div class="col-auto">
          <q-btn label="新增站号记录" color="primary" icon="add" class="q-mr-sm" @click="openAddDialog" />
          <q-btn label="导出Excel" color="positive" icon="download" @click="exportData" />
        </div>
      </div>

      <!-- 搜索区域 -->
      <q-card class="q-mb-md">
        <q-card-section>
          <q-input v-model="searchKey" placeholder="搜索设备名称 / 站号 / 备注" @keyup.enter="getList" clearable />
        </q-card-section>
      </q-card>

      <!-- 数据表格 -->
      <q-card>
        <q-table title="丢失设备站号列表" :rows="tableData" :columns="columns" row-key="id" :loading="loading"
          v-model:pagination="pagination" @request="onRequest">
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
    <q-dialog v-model="dialogVisible" max-width="700px">
      <q-card>
        <q-card-section>
          <h5 class="text-primary">{{ isEdit ? '编辑站号记录' : '新增站号记录' }}</h5>
        </q-card-section>
        <q-card-section class="q-gutter-md">
          <q-input v-model="form.device_name" label="设备名称" required />
          <q-input v-model="form.station_no" label="站号" />
          <q-input v-model.number="form.lost_count" label="丢失数量" type="number" />
          <q-input v-model="form.lost_time" label="丢失时间" type="date" />
          <q-input v-model="form.person_in_charge" label="负责人" />
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
import { lostEquipmentStationApi } from 'src/services/cableshopServiceApi'
import { Notify, Dialog } from 'quasar'

// 表格列配置
const columns = ref([
  { name: 'index', label: '序号', field: 'index', align: 'center' },
  { name: 'lost_date', label: '丢失日期', field: 'lost_date', align: 'center' },
  { name: 'line', label: '线路', field: 'line', align: 'center' },
  { name: 'rp', label: 'RP站号', field: 'rp', align: 'center' },
  { name: 'fdu', label: 'FDU编号', field: 'fdu', align: 'center' },
  {
    name: 'fdu_number',
    label: 'FDU数量',
    field: 'fdu_number',
    align: 'center',
    format: val => val === 0 ? '-' : val
  },
  {
    name: 'laul',
    label: 'LAUL数量',
    field: 'laul',
    align: 'center',
    format: val => val === 0 ? '-' : val
  },
  { name: 'remark', label: '备注', field: 'remark' },
  { name: 'actions', label: '操作', align: 'center' }
])
// 基础数据
const tableData = ref([])
const loading = ref(false)
const searchKey = ref('')
const pagination = ref({ page: 1, rowsPerPage: 10 })

// 弹窗 & 表单
const dialogVisible = ref(false)
const isEdit = ref(false)
const form = reactive({
  device_name: '',
  station_no: '',
  lost_count: 0,
  lost_time: '',
  person_in_charge: '',
  remark: ''
})

// 获取列表数据
const getList = async () => {
  loading.value = true
  try {
    const res = await lostEquipmentStationApi.list(
      {
        search: searchKey.value,
        page: pagination.value.page,
        page_size: pagination.value.rowsPerPage
      }
    )
    tableData.value = res.data.results
    pagination.value.rowsNumber = res.data.count
  } catch (error) {
    Notify.create({ type: 'negative', message: '数据加载失败' + error.message })
  } finally {
    loading.value = false
  }
}

// 分页切换
const onRequest = (props) => {
  pagination.value = props.pagination
  getList()
}

// 打开新增弹窗
const openAddDialog = () => {
  isEdit.value = false
  Object.assign(form, {
    device_name: '',
    station_no: '',
    lost_count: 0,
    lost_time: '',
    person_in_charge: '',
    remark: ''
  })
  dialogVisible.value = true
}

// 打开编辑弹窗
const openEditDialog = (row) => {
  isEdit.value = true
  Object.assign(form, row)
  dialogVisible.value = true
}

// 保存表单（新增/编辑）
const saveForm = async () => {
  try {
    if (isEdit.value) {
      await lostEquipmentStationApi.update(form.id, form)
      Notify.update({ type: 'positive', message: '编辑成功' })
    } else {
      await lostEquipmentStationApi.post(form)
      Notify.create({ type: 'positive', message: '新增成功' })
    }
    dialogVisible.value = false
    getList()
  } catch (error) {
    Notify.create({ type: 'negative', message: '保存失败' + error.message })
  }
}

// 删除单条数据
const deleteItem = async (row) => {
  Dialog.create({
    title: '确认删除',
    message: `确定删除【${row.device_name} - ${row.station_no}】记录？`,
    ok: { color: 'red' }
  }).onOk(async () => {
    try {
      await lostEquipmentStationApi.delete(row.id)
      Notify.create({ type: 'positive', message: '删除成功' })
      getList()
    } catch (error) {
      Notify.create({ type: 'negative', message: '删除失败' + error.message })
    }
  })
}

// 导出Excel
const exportData = async () => {
  try {
    const res = await lostEquipmentStationApi.export({
      responseType: 'blob'
    })
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href = url
    link.download = '丢失设备站号.xlsx'
    link.click()
    window.URL.revokeObjectURL(url)
  } catch (err) {
    Notify.create({ type: 'negative', message: '导出失败' + err.message })
  }
}

onMounted(() => {
  getList()
})
</script>

<style scoped></style>
