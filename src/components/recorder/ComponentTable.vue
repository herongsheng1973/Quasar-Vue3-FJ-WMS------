<template>
  <div>
    <div class="row justify-between items-center mb-3">
      <div><b>组件列表</b></div>
      <q-btn size="sm" color="primary" label="新增组件" @click="openCreate" />
    </div>

    <q-table :rows="rows" :columns="columns" row-key="id" :loading="loading" class="shadow-1 rounded bg-white">
      <template v-slot:body-cell-component_type="props">
        <q-td :props="props">
          {{ props.row.component_type }}
        </q-td>
      </template>

      <template v-slot:body-cell-actions="props">
        <q-td :props="props" class="text-center">
          <q-btn size="sm" color="primary" icon="edit" round flat @click="openEdit(props.row)" />
          <q-btn size="sm" color="red" icon="delete" round flat @click="delItem(props.row)" />
        </q-td>
      </template>
    </q-table>

    <!-- 新增/编辑弹窗 -->
    <q-dialog v-model="showDialog" max-width="700px">
      <q-card>
        <q-card-section>
          <h5 class="text-center">{{ isEdit ? '编辑' : '新增' }}组件</h5>
        </q-card-section>
        <q-card-section class="q-pa-lg">
          <q-select v-model="form.component_type" label="组件类型" :options="typeOptions" :option-value="value"
            :option-label="lable" emit-value required class="q-mb-sm" />
          <q-input v-model="form.component_name" label="组件名称" required class="q-mb-sm" />
          <q-input v-model="form.component_sn" label="序列号" class="q-mb-sm" />
          <q-input v-model.number="form.quantity" label="数量" type="number" min="1" class="q-mb-sm" />
          <q-input v-model="form.system_name" label="系统名称" class="q-mb-sm" />
          <q-input v-model="form.system_version" label="系统版本" class="q-mb-sm" />
          <q-input v-model="form.soft_version" label="软件版本" class="q-mb-sm" />
          <q-input v-model="form.license_info" label="授权信息" class="q-mb-sm" />
          <q-input v-model="form.remark" type="textarea" label="备注" rows="2" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="取消" @click="showDialog = false" />
          <q-btn color="primary" label="保存" :loading="submitting" @click="submit" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

import { useQuasar } from 'quasar'
const $q = useQuasar()


import {
  getComponentList,
  createComponent,
  updateComponent,
  deleteComponent
} from 'src/services/recorderServiceApi'

const props = defineProps({
  recorder_id: [String, Number]
})

const rows = ref([])
const loading = ref(false)
const showDialog = ref(false)
const submitting = ref(false)
const isEdit = ref(false)
const current = ref(null)

const form = ref({
  component_type: '',
  component_name: '',
  component_sn: '',
  quantity: 1,
  system_name: '',
  system_version: '',
  soft_version: '',
  license_info: '',
  remark: ''
})

const typeOptions = ref([
  { label: '中心单元', value: 'Central Unit' },
  { label: '服务器', value: 'Server Workstation' },
  { label: '客户端', value: 'Client Computer' },
  { label: '信号分析', value: 'SGA' },
  { label: '质量控制', value: 'SQC' }
])

const columns = [

  { name: 'component_type', label: '类型', field: 'component_type', align: 'center' },
  { name: 'component_name', label: '组件名称', field: 'component_name', align: 'center' },
  { name: 'component_sn', label: '序列号', field: 'component_sn', align: 'center' },
  { name: 'quantity', label: '数量', field: 'quantity', align: 'center' },
  { name: 'system_name', label: '系统名称', field: 'system_name', align: 'center' },
  { name: 'system_version', label: '系统版本', field: 'system_version', align: 'center' },
  { name: 'soft_version', label: '软件版本', field: 'soft_version', align: 'center' },
  { name: 'license_info', label: '授权信息', field: 'license_info', align: 'center' },
  { name: 'remark', label: '备注', field: 'remark', align: 'center' },
  { name: 'actions', label: '操作', align: 'center' }
]

async function fetchList() {
  if (!props.recorder_id) return
  loading.value = true
  try {
    const res = await getComponentList({ recorder: props.recorder_id })
    rows.value = res.data.results
  } finally {
    loading.value = false
  }
}

function openCreate() {
  isEdit.value = false
  current.value = null
  form.value = {
    component_type: '',
    component_name: '',
    component_sn: '',
    quantity: 1,
    system_name: '',
    system_version: '',
    soft_version: '',
    license_info: '',
    remark: ''
  }
  showDialog.value = true
}

function openEdit(row) {
  isEdit.value = true
  current.value = row
  form.value = { ...row }
  showDialog.value = true
}

async function submit() {
  submitting.value = true
  try {
    const data = { ...form.value, recorder: props.recorder_id }
    if (isEdit.value) {
      await updateComponent(current.value.id, data)
      $q.notify({ type: 'positive', message: '修改成功' })
    } else {
      await createComponent(data)
      $q.notify({ type: 'positive', message: '新增成功' })
    }
    showDialog.value = false
    fetchList()
  } finally {
    submitting.value = false
  }
}

async function delItem(row) {
  if (!confirm('确定删除该组件？')) return
  await deleteComponent(row.id)
  $q.notify({ type: 'positive', message: '删除成功' })
  fetchList()
}

watch(() => props.recorder_id, fetchList, { immediate: true })
</script>
