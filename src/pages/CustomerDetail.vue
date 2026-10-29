<template>
  <q-page class="q-pa-md">
    <!-- 顶部导航与返回 -->
    <div class="row justify-between items-center q-mb-md">
      <div class="flex items-center gap-2">
        <q-btn icon="arrow_back" flat @click="$router.back()" />
        <h1 class="text-h5">客户详情</h1>
      </div>
      <div class="flex gap-2">
        <q-btn label="编辑" color="primary" icon="edit" @click="openEditDialog" />
        <q-btn label="返回列表" color="secondary" @click="$router.push('/customers')" />
      </div>
    </div>

    <!-- 客户头部信息卡片 -->
    <q-card class="q-mb-md">
      <q-card-section class="row items-center">
        <div class="col-12 col-md-8">
          <div class="flex items-center gap-2 q-mb-sm">
            <h2 class="text-h6">{{ customer.name }}</h2>
            <q-badge :color="customer.is_active ? 'positive' : 'negative'">
              {{ customer.is_active ? '启用' : '禁用' }}
            </q-badge>
            <q-badge :color="customer.customer_type === 'enterprise' ? 'primary' : 'accent'">
              {{ customer.customer_type === 'enterprise' ? '企业' : '个人' }}
            </q-badge>
          </div>
          <div class="text-subtitle2">
            <span class="text-gray-600">编码：</span>{{ customer.code }}
            <span class="q-ml-md text-gray-600">联系人：</span>{{ customer.contact_person }}
            <span class="q-ml-md text-gray-600">电话：</span>{{ customer.contact_phone }}
          </div>
        </div>
        <div class="col-12 col-md-4 text-right">
          <div class="text-sm text-gray-600">创建时间：{{ formatDate(customer.created_at) }}</div>
        </div>
      </q-card-section>
    </q-card>

    <!-- 标签页内容 -->
    <q-tabs v-model="activeTab" class="text-primary q-mb-md">
      <q-tab label="基本信息" name="base" icon="info" />
      <q-tab label="业务记录" name="business" icon="assignment" />
      <q-tab label="联系记录" name="contact" icon="phone" />
      <q-tab label="备注日志" name="log" icon="note" />
    </q-tabs>

    <q-tab-panels v-model="activeTab" animated>
      <!-- 基本信息 -->
      <q-tab-panel name="base">
        <q-card>
          <q-card-section>
            <h5 class="text-h6 q-mb-md">基本资料</h5>
            <div class="row">
              <div class="col-12 col-md-6">
                <div class="row q-py-sm">
                  <div class="col-4 text-gray-600">客户名称</div>
                  <div class="col-8">{{ customer.name }}</div>
                </div>
                <div class="row q-py-sm">
                  <div class="col-4 text-gray-600">客户编码</div>
                  <div class="col-8">{{ customer.code }}</div>
                </div>
                <div class="row q-py-sm">
                  <div class="col-4 text-gray-600">客户类型</div>
                  <div class="col-8">{{ customer.customer_type === 'enterprise' ? '企业' : '个人' }}</div>
                </div>
                <div class="row q-py-sm">
                  <div class="col-4 text-gray-600">联系人</div>
                  <div class="col-8">{{ customer.contact_person }}</div>
                </div>
                <div class="row q-py-sm">
                  <div class="col-4 text-gray-600">联系电话</div>
                  <div class="col-8">{{ customer.contact_phone }}</div>
                </div>
              </div>
              <div class="col-12 col-md-6">
                <div class="row q-py-sm">
                  <div class="col-4 text-gray-600">电子邮箱</div>
                  <div class="col-8">{{ customer.email || '-' }}</div>
                </div>
                <div class="row q-py-sm">
                  <div class="col-4 text-gray-600">地址</div>
                  <div class="col-8">{{ customer.address || '-' }}</div>
                </div>
                <div class="row q-py-sm">
                  <div class="col-4 text-gray-600">税号</div>
                  <div class="col-8">{{ customer.tax_id || '-' }}</div>
                </div>
                <div class="row q-py-sm">
                  <div class="col-4 text-gray-600">银行账号</div>
                  <div class="col-8">{{ customer.bank_account || '-' }}</div>
                </div>
                <div class="row q-py-sm">
                  <div class="col-4 text-gray-600">备注</div>
                  <div class="col-8">{{ customer.remark || '-' }}</div>
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </q-tab-panel>

      <!-- 业务记录（订单/出库/入库等） -->
      <q-tab-panel name="business">
        <q-card>
          <q-card-section>
            <h5 class="text-h6 q-mb-md">业务记录</h5>
            <q-table :rows="businessRecords" :columns="businessColumns" row-key="id" :loading="loadingBusiness"
              :pagination="{ rowsPerPage: 10 }">
              <template #no-data>
                <div class="text-center q-py-xl">暂无业务记录</div>
              </template>
            </q-table>
          </q-card-section>
        </q-card>
      </q-tab-panel>

      <!-- 联系记录 -->
      <q-tab-panel name="contact">
        <q-card>
          <q-card-section>
            <h5 class="text-h6 q-mb-md">联系记录</h5>
            <q-table :rows="contactRecords" :columns="contactColumns" row-key="id" :loading="loadingContact"
              :pagination="{ rowsPerPage: 10 }">
              <template #no-data>
                <div class="text-center q-py-xl">暂无联系记录</div>
              </template>
            </q-table>
          </q-card-section>
        </q-card>
      </q-tab-panel>

      <!-- 备注日志 -->
      <q-tab-panel name="log">
        <q-card>
          <q-card-section>
            <h5 class="text-h6 q-mb-md">备注日志</h5>
            <q-table :rows="logRecords" :columns="logColumns" row-key="id" :loading="loadingLog"
              :pagination="{ rowsPerPage: 10 }">
              <template #no-data>
                <div class="text-center q-py-xl">暂无日志记录</div>
              </template>
            </q-table>
          </q-card-section>
        </q-card>
      </q-tab-panel>
    </q-tab-panels>

    <!-- 编辑弹窗（复用你之前的编辑组件） -->
    <q-dialog v-model="editDialogVisible">
      <q-card style="width:500px;max-width:90vw">
        <q-card-section>
          <h5 class="text-h5 q-mb-md">编辑客户</h5>
          <q-form ref="editForm" @submit="saveCustomer">
            <q-input v-model="form.name" label="客户名称" required />
            <q-input v-model="form.code" label="客户编码" required disabled />
            <q-select v-model="form.customer_type" label="客户类型" required :options="customerTypeOptions" />
            <q-input v-model="form.contact_person" label="联系人" required />
            <q-input v-model="form.contact_phone" label="联系电话" required />
            <q-input v-model="form.email" label="电子邮箱" type="email" />
            <q-input v-model="form.address" label="地址" type="textarea" rows="2" />
            <q-input v-model="form.tax_id" label="税号" />
            <q-input v-model="form.bank_account" label="银行账号" />
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
import {
  getCustomerDetail,
  updateCustomer,
  getCustomerBusinessRecords,
  getCustomerContactRecords,
  getCustomerLogRecords
} from 'src/services/settingsServiceApi'

const $q = useQuasar()
import { useRoute, useRouter } from 'vue-router'
const route = useRoute()
const router = useRouter()

// 页面数据
const customer = ref({})
const activeTab = ref('base')

// 加载状态
const loadingBusiness = ref(false)
const loadingContact = ref(false)
const loadingLog = ref(false)

// 编辑弹窗
const editDialogVisible = ref(false)
const editForm = ref(null)
const form = reactive({
  name: '',
  code: '',
  customer_type: 'individual',
  contact_person: '',
  contact_phone: '',
  email: '',
  address: '',
  tax_id: '',
  bank_account: '',
  remark: '',
  is_active: true
})

// 选项
const customerTypeOptions = [
  { label: '个人', value: 'individual' },
  { label: '企业', value: 'enterprise' }
]

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

// 初始化
onMounted(async () => {
  const id = route.params.id
  if (!id) {
    $q.notify({ type: 'negative', message: '客户ID不存在' })
    router.push('/customers')
    return
  }
  await fetchCustomerDetail(id)
})

// 获取客户详情
const fetchCustomerDetail = async (id) => {
  try {
    const res = await getCustomerDetail(id)
    customer.value = res.data
    Object.assign(form, customer.value)
    // 加载各标签页数据
    fetchBusinessRecords(id)
    fetchContactRecords(id)
    fetchLogRecords(id)
  } catch (err) {
    $q.notify({ type: 'negative', message: '获取客户详情失败: ' + err.message })
    router.push('/customers')
  }
}

// 业务记录
const fetchBusinessRecords = async (id) => {
  loadingBusiness.value = true
  try {
    const res = await getCustomerBusinessRecords(id)
    businessRecords.value = res.data.results || []
  } finally {
    loadingBusiness.value = false
  }
}

// 联系记录
const fetchContactRecords = async (id) => {
  loadingContact.value = true
  try {
    const res = await getCustomerContactRecords(id)
    contactRecords.value = res.data.results || []
  } finally {
    loadingContact.value = false
  }
}

// 日志记录
const fetchLogRecords = async (id) => {
  loadingLog.value = true
  try {
    const res = await getCustomerLogRecords(id)
    logRecords.value = res.data.results || []
  } finally {
    loadingLog.value = false
  }
}

// 编辑客户
const openEditDialog = () => {
  Object.assign(form, customer.value)
  editDialogVisible.value = true
}

const closeEditDialog = () => {
  editDialogVisible.value = false
  editForm.value?.resetValidation()
}

const saveCustomer = async () => {
  try {
    await updateCustomer(customer.value.id, form)
    $q.notify({ type: 'positive', message: '客户更新成功' })
    closeEditDialog()
    fetchCustomerDetail(customer.value.id)
  } catch (err) {
    $q.notify({ type: 'negative', message: '更新失败: ' + err.message })
  }
}

// 日期格式化
const formatDate = (str) => {
  if (!str) return '-'
  try { return format(new Date(str), 'yyyy-MM-dd HH:mm:ss') } catch { return str }
}
</script>
