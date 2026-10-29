<template>
  <q-page class="q-pa-md">
    <div class="row justify-between items-center q-mb-md">
      <div class="flex items-center gap-2">
        <q-btn icon="arrow_back" flat @click="$router.back()" />
        <h1 class="text-h5">供应商详情</h1>
      </div>
      <div class="flex gap-2">
        <q-btn label="编辑" color="primary" icon="edit" @click="openEditDialog" />
        <q-btn label="返回列表" color="secondary" @click="$router.push('/suppliers')" />
      </div>
    </div>

    <!-- 供应商头部卡片 -->
    <q-card class="q-mb-md">
      <q-card-section class="row items-center">
        <div class="col-12 col-md-8">
          <div class="flex items-center gap-2 q-mb-sm">
            <h2 class="text-h6">{{ supplier.name }}</h2>
            <q-badge :color="supplier.is_active ? 'positive' : 'negative'">
              {{ supplier.is_active ? '启用' : '禁用' }}
            </q-badge>
          </div>
          <div class="text-subtitle1">
            编码：{{ supplier.code }} | 联系人：{{ supplier.contact_person }} | 电话：{{ supplier.contact_phone }}
          </div>
        </div>
        <div class="col-12 col-md-4 text-right">
          创建时间：{{ formatDate(supplier.created_at) }}
        </div>
      </q-card-section>
    </q-card>

    <!-- 标签页 -->
    <q-tabs v-model="activeTab" class="q-mb-md">
      <q-tab label="基本信息" name="base" icon="info" />
      <q-tab label="业务记录" name="business" icon="assignment" />
      <q-tab label="联系记录" name="contact" icon="phone" />
      <q-tab label="备注日志" name="log" icon="note" />
    </q-tabs>

    <q-tab-panels v-model="activeTab" animated>
      <q-tab-panel name="base">
        <q-card>
          <q-card-section>
            <div class="row q-mt-sm">
              <div class="col-6 col-md-3 q-py-sm">供应商名称</div>
              <div class="col-6 col-md-3 q-py-sm">{{ supplier.name }}</div>
              <div class="col-6 col-md-3 q-py-sm">供应商编码</div>
              <div class="col-6 col-md-3 q-py-sm">{{ supplier.code }}</div>

              <div class="col-6 col-md-3 q-py-sm">联系人</div>
              <div class="col-6 col-md-3 q-py-sm">{{ supplier.contact_person }}</div>
              <div class="col-6 col-md-3 q-py-sm">联系电话</div>
              <div class="col-6 col-md-3 q-py-sm">{{ supplier.contact_phone }}</div>

              <div class="col-6 col-md-3 q-py-sm">邮箱</div>
              <div class="col-6 col-md-3 q-py-sm">{{ supplier.email || '-' }}</div>
              <div class="col-6 col-md-3 q-py-sm">状态</div>
              <div class="col-6 col-md-3 q-py-sm">{{ supplier.is_active ? '启用' : '禁用' }}</div>

              <div class="col-12 q-py-sm">地址</div>
              <div class="col-12 q-py-sm">{{ supplier.address || '-' }}</div>

              <div class="col-12 q-py-sm">备注</div>
              <div class="col-12 q-py-sm">{{ supplier.remark || '-' }}</div>
            </div>
          </q-card-section>
        </q-card>
      </q-tab-panel>

      <q-tab-panel name="business">
        <q-table :rows="businessRecords" :columns="businessColumns" row-key="id" dense flat />
      </q-tab-panel>
      <q-tab-panel name="contact">
        <q-table :rows="contactRecords" :columns="contactColumns" row-key="id" dense flat />
      </q-tab-panel>
      <q-tab-panel name="log">
        <q-table :rows="logRecords" :columns="logColumns" row-key="id" dense flat />
      </q-tab-panel>
    </q-tab-panels>

    <!-- 编辑弹窗 -->
    <q-dialog v-model="editDialogVisible">
      <q-card style="width:500px;max-width:90vw">
        <q-card-section>
          <h5 class="text-h5">编辑供应商</h5>
          <q-form ref="editForm" @submit="saveSupplier">
            <q-input v-model="form.name" label="供应商名称" required />
            <q-input v-model="form.code" label="编码" disabled />
            <q-input v-model="form.contact_person" label="联系人" required />
            <q-input v-model="form.contact_phone" label="联系电话" required />
            <q-input v-model="form.email" label="邮箱" type="email" />
            <q-input v-model="form.address" label="地址" type="textarea" rows="2" />
            <q-input v-model="form.remark" label="备注" type="textarea" rows="2" />
            <q-checkbox v-model="form.is_active" label="启用" class="q-mt-md" />

            <div class="row q-mt-md gap-2">
              <q-btn label="取消" color="secondary" @click="closeEditDialog" class="col" />
              <q-btn label="保存" color="primary" type="submit" class="col" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { format } from 'date-fns'
import { getSupplierDetail, updateSupplier, getSupplierBusinessRecords, getSupplierContactRecords, getSupplierLogs } from 'src/services/settingsServiceApi'

const $q = useQuasar()
import { useRoute, useRouter } from 'vue-router'
const route = useRoute()
const router = useRouter()
const loadingBusiness = ref(false)
const loadingContact = ref(false)
const loadingLog = ref(false)

const supplier = ref({})
// 业务记录
const businessRecords = ref([])
const businessColumns = [
  { name: 'type', label: '业务类型', field: 'type' },
  { name: 'order_no', label: '单号', field: 'order_no' },
  { name: 'amount', label: '金额', field: 'amount' },
  { name: 'created_at', label: '时间', field: 'created_at' }
]

// 联系记录
const contactRecords = ref([])
const contactColumns = [
  { name: 'contact_type', label: '联系类型', field: 'contact_type' },
  { name: 'content', label: '内容', field: 'content' },
  { name: 'operator', label: '操作人', field: 'operator' },
  { name: 'created_at', label: '时间', field: 'created_at' }
]

// 日志记录
const logRecords = ref([])
const logColumns = [
  { name: 'action', label: '操作', field: 'action' },
  { name: 'content', label: '内容', field: 'content' },
  { name: 'operator', label: '操作人', field: 'operator' },
  { name: 'created_at', label: '时间', field: 'created_at' }
]
const activeTab = ref('base')
const editDialogVisible = ref(false)
// const editForm = ref(null)

const form = reactive({
  name: '',
  code: '',
  contact_person: '',
  contact_phone: '',
  email: '',
  address: '',
  remark: '',
  is_active: true
})

onMounted(async () => {
  const id = route.params.id
  if (!id) { router.push('/suppliers'); return }
  try {
    const res = await getSupplierDetail(id)
    supplier.value = res.data
    Object.assign(form, res.data)
    // 加载各标签页数据
    fetchBusinessRecords(id)
    fetchContactRecords(id)
    fetchLogRecords(id)
  } catch (error) {
    $q.notify({ type: 'negative', message: '加载失败' + error.message })
    router.push('/suppliers')
  }
})
// 业务记录
const fetchBusinessRecords = async (id) => {
  loadingBusiness.value = true
  try {
    const res = await getSupplierBusinessRecords(id)
    businessRecords.value = res.data.results || []
  } finally {
    loadingBusiness.value = false
  }
}

// 联系记录
const fetchContactRecords = async (id) => {
  loadingContact.value = true
  try {
    const res = await getSupplierContactRecords(id)
    contactRecords.value = res.data.results || []
  } finally {
    loadingContact.value = false
  }
}

// 日志记录
const fetchLogRecords = async (id) => {
  loadingLog.value = true
  try {
    const res = await getSupplierLogs(id)
    logRecords.value = res.data.results || []
  } finally {
    loadingLog.value = false
  }
}
const formatDate = (str) => {
  if (!str) return '-'
  try { return format(new Date(str), 'yyyy-MM-dd HH:mm:ss') } catch { return str }
}

const openEditDialog = () => { editDialogVisible.value = true }
const closeEditDialog = () => { editDialogVisible.value = false }


const saveSupplier = async () => {
  try {
    await updateSupplier(supplier.value.id, form)
    $q.notify({ type: 'positive', message: '保存成功' })
    supplier.value = { ...form }
    closeEditDialog()
  } catch (error) {
    $q.notify({ type: 'negative', message: '保存失败' + error.message })
  }
}
</script>
