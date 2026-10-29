<template>
  <q-page class="q-pa-md">
    <!-- 顶部标题 + 操作栏 -->
    <div class="row justify-between items-center q-my-none mb-4">
      <div class="col-8 q-my-none">
        <h5 class="text-h5 q-my-none">仪器管理</h5>
        <p class="text-subtitle2 text-grey-7">
          记录仪设备全生命周期管理：档案、组件、库存、状态、维护日志、PDF打印
        </p>
      </div>
      <div class="row gap-2">
        <q-btn v-if="isAdmin" color="primary" label="新增仪器" @click="openCreate" />
        <q-btn color="brown" label="打印选中" :disabled="selectedList.length === 0" @click="printRecorders" />
      </div>
    </div>

    <!-- 仪器主表 -->
    <q-table :rows="rows" :columns="columns" row-key="id" :loading="loading" v-model:pagination="pagination"
      v-model:selected="selectedList" selection="multiple" :rows-per-page-options="[10, 20, 50]" @request="fetchData"
      class="rounded bg-white shadow-1">
      <template v-slot:body-cell-index="props">
        <q-td :props="props" class="text-center">
          {{ (pagination.page - 1) * pagination.rowsPerPage + props.pageIndex + 1 }}
        </q-td>
      </template>

      <template v-slot:body-cell-status="props">
        <q-td :props="props">
          <q-chip :color="props.row.status === 'normal' ? 'green' :
            props.row.status === 'repair' ? 'orange' : 'red'
            " text-color="white" label>
            {{
              props.row.status === 'normal' ? '正常' :
                props.row.status === 'repair' ? '维修中' : '待报废'
            }}
          </q-chip>
        </q-td>
      </template>

      <template v-slot:body-cell-actions="props">
        <q-td :props="props" class="text-center">
          <q-btn size="sm" color="primary" icon="visibility" round flat @click="goDetail(props.row)">
            <q-tooltip>查看</q-tooltip>

          </q-btn>
          <q-btn size="sm" color="primary" icon="edit" round flat @click="openEdit(props.row)">
            <q-tooltip>编辑</q-tooltip>
          </q-btn>
          <q-btn size="sm" color="purple" icon="settings" round flat @click="openStatus(props.row)">
            <q-tooltip>状态变更</q-tooltip>
          </q-btn>
          <q-btn size="sm" color="teal" icon="widgets" round flat @click="goToComponentPage(props.row)">
            <q-tooltip>组件管理</q-tooltip>
          </q-btn>
          <q-btn size="sm" color="brown" icon="attachment" round flat @click="goToAccessoryPage(props.row)">
            <q-tooltip>附件管理</q-tooltip>
          </q-btn>
          <q-btn size="sm" color="grey" icon="history" round flat @click="openLog(props.row)">
            <q-tooltip>操作日志</q-tooltip>
          </q-btn>
          <q-btn v-if="isAdmin" size="sm" color="red" icon="delete" round flat @click="openDelete(props.row)">
            <q-tooltip>删除</q-tooltip>
          </q-btn>

        </q-td>
      </template>
    </q-table>

    <!-- ======================== 弹窗 ======================== -->
    <!-- 1. 新增 -->
    <recorder-create v-model:show="showCreate" @success="fetchData" />

    <!-- 2. 编辑 -->
    <recorder-edit v-model:show="showEdit" :row="currentRow" @success="fetchData" />

    <!-- 3. 详情 -->


    <!-- 4. 状态变更 -->
    <recorder-status v-model:show="showStatus" :row="currentRow" @success="fetchData" />


    <!-- 7. 删除确认 -->
    <q-dialog v-model="showDelete" max-width="450px">
      <q-card>
        <q-card-section class="text-center">
          <h6 class="text-red">确认删除</h6>
          <p class="q-mt-md">仪器：{{ currentRow?.device_name }}</p>
          <p class="text-caption text-grey">删除后无法恢复</p>
        </q-card-section>
        <q-card-section class="q-pa-lg">
          <q-input v-model="deletePwd" type="password" label="输入登录密码确认" filled />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="取消" @click="showDelete = false" />
          <q-btn color="red" label="确认删除" :loading="delLoading" @click="doDelete" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from 'stores/user'
import { useQuasar } from 'quasar'
const $q = useQuasar()
import {
  getRecorderList,
  deleteRecorder,
  printRecorderPdf,
  checkPassword
} from 'src/services/recorderServiceApi'

import RecorderStatus from './RecorderStatus.vue'
import RecorderEdit from './RecorderEdit.vue'

import RecorderCreate from './RecorderCreate.vue'

// 权限
const userStore = useUserStore()
const isAdmin = computed(() => userStore.isAdmin)

// 表格
const rows = ref([])
const loading = ref(false)
const delLoading = ref(false)
const selectedList = ref([])
const pagination = ref({ page: 1, rowsPerPage: 10 })
const currentRow = ref(null)

// 弹窗
const showCreate = ref(false)
const showEdit = ref(false)
const showStatus = ref(false)

const showDelete = ref(false)
const deletePwd = ref('')

// 列
const columns = [
  { name: 'index', label: '序号', align: 'center' },
  { name: 'device_name', label: '设备名称', field: 'device_name', align: 'left' },
  { name: 'sn', label: '合同编号', field: 'sn' },
  { name: 'capacity', label: '容量', field: 'capacity' },
  { name: 'firmware_version', label: '固件版本', field: 'firmware_version' },
  { name: 'location', label: '库位', field: 'location_name' },
  { name: 'status', label: '状态', field: 'status', align: 'center' },
  { name: 'start_use_date', label: '启用日期', field: 'start_use_date' },
  { name: 'actions', label: '操作', align: 'center' }
]
import { useRouter } from 'vue-router'
const router = useRouter()

function goToComponentPage(row) {
  router.push({
    path: `/recorder/component/${row.id}`,
    query: {
      id: row.id,
      sn: row.sn,
      device_name: row.device_name
    }
  })
}

function goToAccessoryPage(row) {
  router.push({
    path: `/recorder/accessory/${row.id}`,
    query: {
      device_name: row.device_name,
      sn: row.sn
    }
  })
}
// 获取列表
async function fetchData() {
  loading.value = true
  try {
    const res = await getRecorderList({
      page: pagination.value.page,
      page_size: pagination.value.rowsPerPage
    })
    rows.value = res.data.results
    pagination.value.rowsNumber = res.data.count
  } finally { loading.value = false }
}

// 打开
function openCreate() {
  showCreate.value = true
}
function openEdit(row) {
  currentRow.value = row;
  showEdit.value = true
}
function goDetail(row) {
  router.push(`/recorder/detail/${row.id}`)
}
function openStatus(row) {
  currentRow.value = row;
  showStatus.value = true
}
function openLog(row) {
  router.push({
    path: `/recorder/log/${row.id}`,
    query: {
      device_name: row.device_name
    }
  })
}
function openDelete(row) {
  currentRow.value = row;
  deletePwd.value = '';
  showDelete.value = true
}

// 删除
async function doDelete() {
  if (!deletePwd.value) return $q.notify({ type: 'warning', message: '请输入密码' })
  const ok = await checkPassword({ password: deletePwd.value })
  if (!ok) return $q.notify({ type: 'negative', message: '密码错误' })
  delLoading.value = true
  try {
    await deleteRecorder(currentRow.value.id)
    $q.notify({ type: 'positive', message: '删除成功' })
    showDelete.value = false
    fetchData()
  } finally { delLoading.value = false }
}

// 打印
// 打印选中仪器
async function printRecorders() {
  if (selectedList.value.length === 0) {
    $q.notify({ type: 'warning', message: '请选择要打印的仪器' })
    return
  }
  const ids = selectedList.value.map(item => item.id).join(',')

  try {
    // 1. 获取 blob 格式 PDF
    const res = await printRecorderPdf(ids)

    // 2. 创建二进制 URL（必须这样做）
    const blob = new Blob([res.data], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)

    // 3. 打开新标签
    window.open(url, '_blank')
  } catch (err) {
    $q.notify({ type: 'negative', message: '打印失败' })
    console.error(err)
  }
}
onMounted(fetchData)
</script>
