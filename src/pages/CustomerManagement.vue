<!-- src/pages/CustomersManagement.vue -->
<template>
  <q-page class="q-pa-md">
    <!-- 页面标题 & 操作 -->
    <div class="row justify-between items-center q-mb-md">
      <h1 class="text-h5">客户管理</h1>
      <div class="flex gap-2">
        <q-btn-dropdown color="primary" label="导入" icon="upload">

          <q-list>
            <q-item clickable v-close-popup @click="showInitImportDialog = true">
              <q-item-section avatar>
                <q-icon name="cloud_upload" />
              </q-item-section>
              <q-item-section>
                <q-item-label>初始化导入</q-item-label>
                <q-item-label caption>覆盖现有数据</q-item-label>
              </q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="showNormalImportDialog = true">
              <q-item-section avatar>
                <q-icon name="playlist_add" />
              </q-item-section>
              <q-item-section>
                <q-item-label>增量导入</q-item-label>
                <q-item-label caption>新增或更新数据</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>

        </q-btn-dropdown>

        <q-btn label="导出" color="primary" @click="exportCustomers" icon="download" />
        <q-btn label="新增客户" color="primary" @click="openEditDialog(null)" icon="add" />
      </div>
    </div>

    <!-- 搜索区域 -->
    <div class="q-pa-md bg-white rounded shadow-sm q-mb-md">
      <q-form class="row q-gutter-md">
        <q-input v-model="filters.searchQuery" label="搜索（名称/编码/联系人）" class="col-12 col-md-2" clearable
          @keyup.enter="fetchCustomers">
          <template #append><q-icon name="search" /></template>
        </q-input>

        <q-select v-model="filters.customerType" label="客户类型" class="col-12 col-md-2" :options="customerTypeOptions"
          emit-value map-options @update:model-value="fetchCustomers" />

        <q-select v-model="filters.isActive" label="状态" class="col-12 col-md-2" :options="statusOptions" emit-value
          map-options @update:model-value="fetchCustomers" />

        <q-input v-model="filters.code" label="客户编码" class="col-12 col-md-2" clearable @keyup.enter="fetchCustomers" />

        <div class="col-12 col-md-2 flex items-center gap-2">
          <q-btn label="重置" color="secondary" @click="resetFilters" />
          <q-btn label="搜索" color="primary" @click="fetchCustomers" />
        </div>
      </q-form>
    </div>

    <!-- 表格 -->
    <div class="bg-white rounded shadow-sm">
      <q-table :rows="customers" :columns="columns" row-key="id" :loading="loading" v-model:pagination="pagination"
        :rows-per-page-options="[10, 20, 50, 100]" @request="onRequest">
        <template #body-cell-actions="props">
          <q-td :props="props">
            <q-btn size="sm" color="blue" icon="visibility" @click="$router.push(`/customers/${props.row.id}`)"
              class="q-mr-1" />
            <q-btn size="sm" color="primary" icon="edit" @click="openEditDialog(props.row)" class="q-mr-1" />
            <q-btn size="sm" color="negative" icon="delete" @click="confirmDelete(props.row)" />
          </q-td>
        </template>

        <template #body-cell-is_active="props">
          <q-td :props="props">
            <q-badge :color="props.row.is_active ? 'positive' : 'negative'">
              {{ props.row.is_active ? '启用' : '禁用' }}
            </q-badge>
          </q-td>
        </template>

        <template #body-cell-customer_type="props">
          <q-td :props="props">
            <q-badge :color="props.row.customer_type === 'business' ? 'primary' : 'accent'">
              {{ props.row.customer_type === 'business' ? '企业' : '个人' }}
            </q-badge>
          </q-td>
        </template>

        <template #body-cell-created_at="props">
          <q-td :props="props">{{ formatDate(props.row.created_at) }}</q-td>
        </template>

        <template #no-data>
          <div class="text-center q-py-xl">暂无客户数据</div>
        </template>
      </q-table>
    </div>

    <!-- 新增/编辑弹窗 -->
    <q-dialog v-model="editDialogVisible">
      <q-card style="width:500px;max-width:90vw">
        <q-card-section>
          <h5 class="text-h5 q-mb-md">{{ isEditMode ? '编辑客户' : '新增客户' }}</h5>
          <q-form ref="editForm" @submit="saveCustomer">
            <q-input v-model="form.name" label="客户名称" required lazy-rules :rules="[val => !!val || '客户名称不能为空']" />
            <q-input v-model="form.code" label="客户编码" required :disabled="isEditMode" lazy-rules
              :rules="[val => !!val || '客户编码不能为空']" />
            <q-select v-model="form.customer_type" label="客户类型" required :options="customerTypeOptions" emit-value
              map-options />
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

    <!-- 初始化导入 -->
    <q-dialog v-model="showInitImportDialog" max-width="700px">
      <q-card>
        <q-card-section class="q-pa-md">
          <h5 class="text-h5">客户初始化导入</h5>
          <div class="space-y-4">
            <div class="bg-negative/10 p-3 rounded border border-negative/20">
              <h6 class="text-negative font-medium flex items-center">
                <q-icon name="warning" class="q-mr-sm" />
                重要提醒
              </h6>
              <ul class="text-sm mt-2 space-y-1 text-gray-700">
                <li>1. 初始化导入将<span class="font-medium text-negative">覆盖现有客户数据</span></li>
                <li>2. 若勾选"清空现有数据"，将删除所有客户记录，<span class="font-medium text-negative">操作不可撤销</span></li>
                <li>3. 请确保导入文件包含"客户编码、名称、联系人、电话"等必填字段</li>
              </ul>
            </div>

            <div class="flex justify-between items-center">
              <p class="text-sm">请下载模板并按格式填写数据</p>
              <q-btn label="下载初始化模板" color="secondary" icon="file_download" size="sm" @click="downloadInitTemplate" />
            </div>

            <q-uploader label="选择初始化文件（仅支持.xlsx/.xls）" accept=".xlsx, .xls" :max-files="1" @added="handleFileSelected"
              @remove-file="() => { selectedFile = null; importErrors = []; }" dense class="mt-2">
              <template #file="{ file, remove }">
                <div class="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <div class="flex items-center">
                    <q-icon name="file-excel" color="teal" class="q-mr-sm" />
                    <span class="text-sm">{{ file.name }}</span>
                  </div>
                  <q-btn icon="close" size="sm" flat @click="remove" />
                </div>
              </template>
            </q-uploader>

            <div class="flex items-center mt-4">
              <q-checkbox v-model="initClearExisting" label="清空现有客户数据" color="negative" />
            </div>

            <div v-if="importErrors.length > 0" class="mt-4">
              <h6 class="text-negative text-sm font-medium">导入失败记录（共{{ importErrors.length }}条）</h6>
              <div class="bg-white border border-gray-200 rounded mt-2 max-h-60 overflow-auto">
                <q-table :rows="importErrors" :columns="importErrorColumns" row-key="row" dense hide-header flat />
              </div>
              <q-btn label="下载错误详情" color="negative" size="sm" class="mt-2" @click="downloadImportErrors" dense />
            </div>

            <div v-if="initImportResult" class="mt-4 bg-positive/10 p-3 rounded">
              <h6 class="text-positive font-medium">初始化导入成功</h6>
              <ul class="text-sm mt-2 space-y-1">
                <li>成功创建客户记录：{{ initImportResult.success_count }} 条</li>
                <li>失败记录：{{ initImportResult.error_count }} 条</li>
              </ul>
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md">
          <q-btn label="取消" color="secondary" @click="resetInitImportState" />
          <q-btn label="开始初始化" color="negative" class="ml-2" @click="handleInitImport"
            :disabled="!selectedFile || importLoading" :loading="importLoading" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 增量导入 -->
    <q-dialog v-model="showNormalImportDialog" max-width="700px">
      <q-card>
        <q-card-section>
          <h5 class="text-h5 q-mb-0">客户增量导入</h5>
        </q-card-section>
        <q-card-section class="q-pa-md">
          <p>增量导入不会删除现有数据</p>
          <q-btn size="sm" color="secondary" class="q-mb-md" @click="downloadNormalTemplate">下载增量模板</q-btn>
          <q-uploader accept=".xlsx,.xls" :max-files="1" @added="handleFileSelected" @remove-file="resetImportFile" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn label="取消" @click="resetInitImportState" />
          <q-btn label="开始导入" color="primary" :loading="importLoading" :disabled="!selectedFile"
            @click="handleNormalImport" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 删除确认 -->
    <q-dialog v-model="deleteDialogVisible">
      <q-card style="width:400px;max-width:90vw">
        <q-card-section>
          <h5 class="text-h5 q-mb-md">确认操作</h5>
          <p>确定要{{ deletingCustomer?.is_active ? '禁用' : '启用' }}客户：{{ deletingCustomer?.name }} 吗？</p>
          <div class="row gap-2 q-mt-md">
            <q-btn label="取消" color="secondary" @click="deleteDialogVisible = false" class="col" />
            <q-btn label="确认" color="negative" @click="handleDeleteCustomer" class="col" />
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { format } from 'date-fns'
import { exportExcel } from 'src/utils/excel-utils'
import {
  getCustomers,
  downloadCustomers,
  deleteCustomer,
  createCustomer,
  updateCustomer,
  downloadCustomerTemplate,
  importCustomers
} from 'src/services/settingsServiceApi'

const $q = useQuasar()

// 数据列表
const customers = ref([])
const loading = ref(false)

// =============== 优化核心：统一搜索过滤参数 ===============
const filters = ref({
  searchQuery: '',
  customerType: null,
  isActive: null,
  code: ''
})

// 分页
const pagination = ref({
  page: 1,
  rowsPerPage: 10,
  sortBy: 'code',
  descending: false
})

// 弹窗
const editDialogVisible = ref(false)
const deleteDialogVisible = ref(false)
const showInitImportDialog = ref(false)
const showNormalImportDialog = ref(false)

// 表单
const editForm = ref(null)
const isEditMode = ref(false)
const currentCustomerId = ref(null)
const deletingCustomer = ref(null)

const form = ref({
  name: '',
  code: '',
  customer_type: 'private',
  contact_person: '',
  contact_phone: '',
  email: '',
  address: '',
  tax_id: '',
  bank_account: '',
  remark: '',
  is_active: true
})

// 导入
const selectedFile = ref(null)
const importLoading = ref(false)
const importErrors = ref([])
const initClearExisting = ref(false)
const initImportResult = ref(null)

// 选项
const customerTypeOptions = [
  { label: '全部', value: null },
  { label: '个人', value: 'private' },
  { label: '企业', value: 'business' }
]
const statusOptions = [
  { label: '全部', value: null },
  { label: '启用', value: true },
  { label: '禁用', value: false }
]

// 表格列
const columns = [
  { name: 'name', label: '客户名称', field: 'name', sortable: true },
  { name: 'code', label: '客户编码', field: 'code', sortable: true },
  { name: 'customer_type', label: '客户类型', field: 'customer_type', sortable: true },
  { name: 'contact_person', label: '联系人', field: 'contact_person', sortable: true },
  { name: 'contact_phone', label: '联系电话', field: 'contact_phone' },
  { name: 'email', label: '邮箱', field: 'email' },
  { name: 'is_active', label: '状态', field: 'is_active', sortable: true },
  { name: 'created_at', label: '创建时间', field: 'created_at', sortable: true },
  { name: 'actions', label: '操作', align: 'center' }
]

const importErrorColumns = [
  { name: 'row', label: '行号', field: 'row' },
  { name: 'error', label: '错误', field: 'error' }
]

// 初始化
onMounted(() => fetchCustomers())

// =============== 优化：获取列表（参数自动合并） ===============
const fetchCustomers = async () => {
  try {
    loading.value = true
    const params = new URLSearchParams()
    params.append('page', pagination.value.page)
    params.append('page_size', pagination.value.rowsPerPage)

    // 排序
    if (pagination.value.sortBy) {
      const order = pagination.value.descending
        ? `-${pagination.value.sortBy}`
        : pagination.value.sortBy
      params.append('ordering', order)
    }

    // 智能合并搜索：关键词 + 编码
    const { searchQuery, code, customerType, isActive } = filters.value
    const searchText = [searchQuery, code].filter(Boolean).join(' ').trim()
    if (searchText) params.append('search', searchText)

    // 精确筛选
    if (customerType) params.append('customer_type', customerType)
    if (isActive !== null) params.append('is_active', isActive)

    const res = await getCustomers(params)
    customers.value = res.data.results
    pagination.value.rowsNumber = res.data.count
  } catch (err) {
    $q.notify({ type: 'negative', message: '获取失败：' + err.message })
  } finally {
    loading.value = false
  }
}

// 表格翻页/排序
const onRequest = (props) => {
  pagination.value = { ...props.pagination }
  fetchCustomers()
}

// =============== 优化：一键重置筛选 ===============
const resetFilters = () => {
  filters.value = {
    searchQuery: '',
    customerType: null,
    isActive: null,
    code: ''
  }
  pagination.value.page = 1
  fetchCustomers()
}

const openEditDialog = (row = null) => {
  if (!row) {
    form.value = {
      name: '',
      code: '',
      customer_type: 'business', // 统一默认值
      contact_person: '',
      contact_phone: '',
      email: '',
      address: '',
      tax_id: '',
      bank_account: '',
      remark: '',
      is_active: true
    }
    isEditMode.value = false
    currentCustomerId.value = null
  } else {
    // 深拷贝，不污染原数据
    form.value = { ...row }
    isEditMode.value = true
    currentCustomerId.value = row.id
  }
  editDialogVisible.value = true
}
// 关闭新增/编辑客户弹窗
const closeEditDialog = () => {
  editDialogVisible.value = false
  editForm.value?.resetValidation()
}

// 保存
// 保存客户（修复：只提交有效字段，不提交只读字段）
const saveCustomer = async () => {
  try {
    loading.value = true

    // ✅ 核心修复：只提交后端需要的写字段，排除 id/时间/只读字段
    const submitData = {
      name: form.value.name,
      code: form.value.code,
      customer_type: form.value.customer_type,
      contact_person: form.value.contact_person,
      contact_phone: form.value.contact_phone,
      email: form.value.email || '',
      address: form.value.address || '',
      tax_id: form.value.tax_id || '',
      bank_account: form.value.bank_account || '',
      remarks: form.value.remark || '', //  remark 对应后端 remarks
      is_active: form.value.is_active
    }

    if (isEditMode.value) {
      // 修改：PATCH
      await updateCustomer(currentCustomerId.value, submitData)
      $q.notify({ type: 'positive', message: '更新成功' })
    } else {
      // 新增：POST
      await createCustomer(submitData)
      $q.notify({ type: 'positive', message: '创建成功' })
    }

    closeEditDialog()
    fetchCustomers()
  } catch (err) {
    $q.notify({ type: 'negative', message: '保存失败：' + err.message })
  } finally {
    loading.value = false
  }
}

// 删除/禁用
const confirmDelete = (row) => {
  deletingCustomer.value = { ...row }
  deleteDialogVisible.value = true
}

const handleDeleteCustomer = async () => {
  try {
    await deleteCustomer(deletingCustomer.value.id)
    $q.notify({ type: 'positive', message: '操作成功' })
  } catch (err) {
    $q.notify({ type: 'negative', message: '操作失败：' + err.message })
  } finally {
    deleteDialogVisible.value = false
    fetchCustomers()
  }
}

// 导出
const exportCustomers = async () => {
  try {
    loading.value = true
    const res = await downloadCustomers()
    const blob = new Blob([res.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `客户_${format(new Date(), 'yyyyMMddHHmmss')}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
    $q.notify({ type: 'positive', message: '导出成功' })
  } catch (err) {
    $q.notify({ type: 'negative', message: '导出失败：' + err.message })
  } finally {
    loading.value = false
  }
}

// 导入相关
const resetImportFile = () => {
  selectedFile.value = null
  importErrors.value = []
  initImportResult.value = null
}

const handleFileSelected = (files) => {
  if (files.length) selectedFile.value = files[0]
}

const resetInitImportState = () => {
  showInitImportDialog.value = false
  showNormalImportDialog.value = false
  resetImportFile()
  initClearExisting.value = false
}

// 下载初始化模板
const downloadInitTemplate = async () => {
  try {
    const res = await downloadCustomerTemplate('init')
    downloadExcelFile(res, '客户初始化导入模板.xlsx')
    $q.notify({ type: 'positive', message: '模板下载成功' })
  } catch (err) {
    $q.notify({ type: 'negative', message: '下载失败：' + err.message })
  }
}

// 下载增量模板
const downloadNormalTemplate = async () => {
  try {
    const res = await downloadCustomerTemplate('normal')
    downloadExcelFile(res, '客户增量导入模板.xlsx')
    $q.notify({ type: 'positive', message: '模板下载成功' })
  } catch (err) {
    $q.notify({ type: 'negative', message: '下载失败：' + err.message })
  }
}

// 公共工具方法：处理Blob下载
const downloadExcelFile = (response, defaultFileName) => {
  const blob = new Blob([response.data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })

  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.href = url

  const disposition = response.headers['content-disposition']
  if (disposition) {
    const matches = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
    if (matches != null && matches[1]) {
      defaultFileName = decodeURIComponent(matches[1].replace(/["']/g, ''))
    }
  }

  link.download = defaultFileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const handleInitImport = async () => {
  try {
    importLoading.value = true
    const fd = new FormData()
    fd.append('file', selectedFile.value)
    fd.append('is_init', true)
    fd.append('clear_existing', initClearExisting.value)
    const res = await importCustomers(fd)
    importErrors.value = res.data.errors || []
    if (!importErrors.value.length) {
      $q.notify({ type: 'positive', message: '初始化成功' })
      resetInitImportState()
      fetchCustomers()
    }
  } catch (err) {
    $q.notify({ type: 'negative', message: '导入失败：' + err.message })
  } finally {
    importLoading.value = false
  }
}

const handleNormalImport = async () => {
  try {
    importLoading.value = true
    const fd = new FormData()
    fd.append('file', selectedFile.value)
    fd.append('is_init', false)
    const res = await importCustomers(fd)
    importErrors.value = res.data.errors || []
    if (!importErrors.value.length) {
      $q.notify({ type: 'positive', message: '导入成功' })
      resetInitImportState()
      fetchCustomers()
    }
  } catch (err) {
    $q.notify({ type: 'negative', message: '导入失败：' + err.message })
  } finally {
    importLoading.value = false
  }
}

const downloadImportErrors = () => {
  const data = importErrors.value.map(e => ({
    行号: e.row,
    错误原因: e.error,
    数据: JSON.stringify(e.data)
  }))
  exportExcel(data, `客户导入错误_${format(new Date(), 'yyyyMMddHHmmss')}.xlsx`)
}

// 日期格式化
const formatDate = (str) => {
  if (!str) return '-'
  try {
    return format(new Date(str), 'yyyy-MM-dd HH:mm:ss')
  } catch {
    return str
  }
}
</script>
