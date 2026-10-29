<template>
  <q-page class="q-pa-md">
    <div class="row justify-between items-center mb-4">
      <div>
        <h5 class="text-h5 q-my-none">仪器附件管理</h5>
        <p class="text-grey">
          仪器：{{ $route.query.device_name }} | 合同编号：{{ $route.query.sn }}
        </p>
      </div>
      <q-btn label="返回" color="primary" @click="goBack" />
    </div>

    <!-- 工具栏 -->
    <div class="row q-mb-md">
      <q-btn color="primary" label="新增附件" @click="openCreate" />
    </div>

    <!-- 表格 -->
    <q-table :rows="rows" :columns="columns" row-key="id" :loading="loading" v-model:pagination="pagination"
      @request="fetchData" class="rounded bg-white shadow-1">
      <template v-slot:body-cell-acc_type="props">
        <q-td :props="props">
          <q-chip color="primary" text-color="white" label>
            {{ getAccTypeLabel(props.row.acc_type) }}
          </q-chip>
        </q-td>
      </template>

      <template v-slot:body-cell-actions="props">
        <q-td :props="props" class="text-center">
          <q-btn size="sm" color="primary" icon="edit" round flat @click="openEdit(props.row)" />
          <q-btn size="sm" color="red" icon="delete" round flat @click="openDelete(props.row)" />
        </q-td>
      </template>
    </q-table>

    <!-- 新增弹窗 -->
    <accessory-create v-model:show="showCreate" :recorder_id="recorderId" :options="accTypeOptions"
      @success="fetchData" />

    <!-- 编辑弹窗 -->
    <accessory-edit v-model:show="showEdit" :row="currentRow" :options="accTypeOptions" @success="fetchData" />

    <!-- 删除弹窗 -->
    <q-dialog v-model="showDelete">
      <q-card style="width:450px">
        <q-card-section class="text-center">
          <h6 class="text-red">确认删除</h6>
          <p class="q-mt-md">附件：{{ currentRow?.acc_name }}</p>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="取消" @click="showDelete = false" />
          <q-btn color="red" label="删除" @click="doDelete" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import {
  getRecorderAccessoryList,
  deleteRecorderAccessory
} from 'src/services/recorderServiceApi'
import AccessoryCreate from './AccessoryCreate.vue'
import AccessoryEdit from './AccessoryEdit.vue'

const $q = useQuasar()
const route = useRoute()
const router = useRouter()

const recorderId = ref(route.params.id)
const rows = ref([])
const loading = ref(false)
const pagination = ref({ page: 1, rowsPerPage: 10 })
const currentRow = ref(null)

const showCreate = ref(false)
const showEdit = ref(false)
const showDelete = ref(false)

const accTypeOptions = ref([])

const columns = [
  { name: 'acc_type', label: '附件类型', field: 'acc_type', align: 'center' },
  { name: 'acc_name', label: '附件名称', field: 'acc_name', align: 'center' },
  { name: 'acc_sn', label: '附件编号', field: 'acc_sn', align: 'center' },
  { name: 'remark', label: '备注', field: 'remark', align: 'center' },
  { name: 'create_time', label: '创建时间', field: 'create_time', align: 'center' },
  { name: 'actions', label: '操作', field: 'actions', align: 'center' }
]

function getAccTypeLabel(value) {
  if (!accTypeOptions.value || accTypeOptions.value.length === 0) {
    return value
  }
  const item = accTypeOptions.value.find(o => o.value === value)
  return item ? item.label : value
}
async function fetchData() {
  loading.value = true
  try {
    const res = await getRecorderAccessoryList({
      recorder: recorderId.value,
      page: pagination.value.page,
      page_size: pagination.value.rowsPerPage
    })
    rows.value = res.data.results
    accTypeOptions.value = res.data.results[0].acc_type_options

    pagination.value.rowsNumber = res.data.count
  } finally {
    loading.value = false
  }
}

function openCreate() { showCreate.value = true }
function openEdit(row) { currentRow.value = row; showEdit.value = true }
function openDelete(row) { currentRow.value = row; showDelete.value = true }

async function doDelete() {
  await deleteRecorderAccessory(currentRow.value.id)
  $q.notify({ type: 'positive', message: '删除成功' })
  showDelete.value = false
  fetchData()
}

function goBack() { router.go(-1) }

onMounted(fetchData)
</script>
