<template>
  <q-page class="q-pa-md">
    <!-- 页面标题和操作按钮 -->
    <div class="row justify-between items-center q-mb-md">
      <h1 class="text-h5">供应商管理</h1>
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
        <q-btn label="导出" color="primary" @click="exportSuppliers" icon="download" />
        <q-btn label="新增供应商" color="primary" @click="openEditDialog" icon="add" />
      </div>
    </div>

    <!-- 搜索筛选 -->
    <div class="q-pa-md bg-white rounded shadow-sm q-mb-md">
      <q-form class="row gap-3">
        <q-input v-model="searchQuery" label="搜索（名称/编码/联系人/电话）" class="col-12 col-md-3" @keyup.enter="fetchSuppliers">
          <template #append><q-icon name="search" /></template>
        </q-input>

        <q-select v-model="filterIsActive" label="状态" class="col-12 col-md-2" :options="[
          { label: '全部', value: null },
          { label: '启用', value: true },
          { label: '禁用', value: false }
        ]" emit-value map-options @update:model-value="fetchSuppliers" />

        <div class="col-12 col-md-3 flex items-end gap-2">
          <q-btn label="重置" color="secondary" @click="resetFilters" />
          <q-btn label="搜索" color="primary" @click="fetchSuppliers" />
        </div>
      </q-form>
    </div>

    <!-- 供应商列表 -->
    <div class="bg-white rounded shadow-sm">
      <q-table :rows="suppliers" :columns="columns" row-key="id" :loading="loading" v-model:pagination="pagination"
        :rows-per-page-options="[10, 20, 50]" @request="onRequest">
        <template #body-cell-actions="props">
          <q-td :props="props" class="gap-1">
            <!-- 查看详情 -->
            <q-btn size="sm" color="blue" icon="visibility" @click="$router.push(`/suppliers/${props.row.id}`)" />
            <q-btn size="sm" color="primary" icon="edit" @click="openEditDialog(props.row)" />
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

        <template #body-cell-created_at="props">
          <q-td :props="props">{{ formatDate(props.row.created_at) }}</q-td>
        </template>
      </q-table>
    </div>

    <!-- 新增/编辑弹窗 -->
    <q-dialog v-model="editDialogVisible">
      <q-card style="width:500px;max-width:90vw">
        <q-card-section>
          <h5 class="text-h5 q-mb-md">{{ isEditMode ? '编辑供应商' : '新增供应商' }}</h5>
          <q-form ref="editForm" @submit="saveSupplier">
            <q-input v-model="formData.name" label="供应商名称" required lazy-render />
            <q-input v-model="formData.code" label="供应商编码" required :disabled="isEditMode" lazy-render />
            <q-input v-model="formData.contact_person" label="联系人" required lazy-render />
            <q-input v-model="formData.contact_phone" label="联系电话" required lazy-render />
            <q-input v-model="formData.email" label="电子邮箱" type="email" />
            <q-input v-model="formData.address" label="地址" type="textarea" rows="2" />
            <q-input v-model="formData.remark" label="备注" type="textarea" rows="2" />
            <q-checkbox v-model="formData.is_active" label="启用" class="q-mt-md" />

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
          <h5 class="text-h5">供应商初始化导入</h5>
          <div class="space-y-4">
            <div class="bg-negative/10 p-3 rounded border border-negative/20">
              <h6 class="text-negative font-medium flex items-center">
                <q-icon name="warning" class="q-mr-sm" />
                重要提醒
              </h6>
              <ul class="text-sm mt-2 space-y-1 text-gray-700">
                <li>1. 初始化导入将<span class="font-medium text-negative">覆盖现有供应商数据</span></li>
                <li>2. 若勾选"清空现有数据"，将删除所有供应商记录，<span class="font-medium text-negative">操作不可撤销</span></li>
                <li>3. 请确保导入文件包含"供应商编码、名称、联系人、电话"等必填字段</li>
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
              <q-checkbox v-model="initClearExisting" label="清空现有供应商数据" color="negative"
                @update:model-value="handleClearConfirm" />
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
                <li>成功创建供应商记录：{{ initImportResult.success_count }} 条</li>
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
        <q-card-section class="q-pa-md">
          <h5 class="text-h5">供应商增量导入</h5>
          <div class="space-y-4">
            <p class="text-sm">增量导入仅新增/更新供应商记录，不删除现有数据，适用于日常批量更新</p>
            <div class="flex justify-between items-center">
              <p class="text-sm">请下载模板并按格式填写数据</p>
              <q-btn label="下载增量导入模板" color="secondary" icon="file_download" size="sm"
                @click="downloadNormalTemplate" />
            </div>
            <q-uploader label="选择导入文件（仅支持.xlsx/.xls）" accept=".xlsx, .xls" :max-files="1" @added="handleFileSelected"
              @remove-file="() => { selectedFile = null; importErrors = []; }" dense />
            <div v-if="importErrors.length > 0" class="mt-4">
              <h6 class="text-negative text-sm font-medium">导入失败记录</h6>
              <div class="bg-white border border-gray-200 rounded mt-2 max-h-40 overflow-auto">
                <q-table :rows="importErrors" :columns="importErrorColumns" row-key="row" dense hide-header flat />
              </div>
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md">
          <q-btn label="取消" color="secondary" @click="showNormalImportDialog = false" />
          <q-btn label="开始导入" color="primary" class="ml-2" @click="handleNormalImport"
            :disabled="!selectedFile || importLoading" :loading="importLoading" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 删除/禁用确认 -->
    <q-dialog v-model="deleteDialogVisible">
      <q-card style="width:400px;max-width:90vw">
        <q-card-section>
          <h5 class="text-h5">确认操作</h5>
          <p class="q-mt-md">确定要{{ deletingSupplier?.is_active ? '禁用' : '启用' }}「{{ deletingSupplier?.name }}」吗？</p>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn label="取消" @click="deleteDialogVisible = false" />
          <q-btn label="确认" color="negative" @click="handleDeleteSupplier" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { format } from 'date-fns'
import {
  getSuppliers,
  downloadSuppliers,
  deleteSupplier,
  createSupplier,
  updateSupplier,
  downloadSupplierTemplate,
  importSupplier
} from 'src/services/settingsServiceApi'

const $q = useQuasar()


// 数据
const suppliers = ref([])
const loading = ref(false)
const searchQuery = ref('')
const filterIsActive = ref(null)

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
const currentSupplierId = ref(null)
const formData = reactive({
  name: '',
  code: '',
  contact_person: '',
  contact_phone: '',
  email: '',
  address: '',
  remark: '',
  is_active: true
})

// 导入
const selectedFile = ref(null)
const importLoading = ref(false)
const importErrors = ref([])
const initClearExisting = ref(false)
const initImportResult = ref(null)
// 导入错误表格列
const importErrorColumns = ref([
  { name: 'row', label: '行号', field: 'row', width: '80px' },
  { name: 'data', label: '数据', field: 'data', format: (val) => JSON.stringify(val).slice(0, 50) + '...' },
  { name: 'error', label: '错误原因', field: 'error' }
])

// 删除
const deletingSupplier = ref(null)

// 表格列
const columns = [
  { name: 'name', label: '供应商名称', field: 'name', sortable: true },
  { name: 'code', label: '编码', field: 'code', sortable: true },
  { name: 'contact_person', label: '联系人', field: 'contact_person' },
  { name: 'contact_phone', label: '联系电话', field: 'contact_phone' },
  { name: 'is_active', label: '状态', field: 'is_active', sortable: true },
  { name: 'created_at', label: '创建时间', field: 'created_at', sortable: true },
  { name: 'actions', label: '操作', align: 'center' }
]

// 日期格式化
const formatDate = (str) => {
  if (!str) return '-'
  try { return format(new Date(str), 'yyyy-MM-dd HH:mm:ss') } catch { return str }
}

// 加载列表
onMounted(fetchSuppliers)

function buildRequestParams() {
  const p = pagination.value
  const params = new URLSearchParams()
  params.append('page', p.page)
  params.append('page_size', p.rowsPerPage)
  if (p.sortBy) params.append('ordering', p.descending ? `-${p.sortBy}` : p.sortBy)
  if (filterIsActive.value !== null) params.append('is_active', filterIsActive.value)
  if (searchQuery.value) params.append('search', searchQuery.value)
  return params
}

async function fetchSuppliers() {
  try {
    loading.value = true
    const res = await getSuppliers(buildRequestParams())
    suppliers.value = res.data.results
    pagination.value.rowsNumber = res.data.count
  } catch (error) {
    $q.notify({ type: 'negative', message: '加载失败' + error.message })
  } finally { loading.value = false }
}

function onRequest(props) {
  pagination.value = { ...pagination.value, ...props.pagination }
  fetchSuppliers()
}

function resetFilters() {
  searchQuery.value = ''
  filterIsActive.value = null
  pagination.value.page = 1
  fetchSuppliers()
}

// 打开编辑
function openEditDialog(row = null) {
  Object.assign(formData, {
    name: '', code: '', contact_person: '', contact_phone: '',
    email: '', address: '', remark: '', is_active: true
  })
  isEditMode.value = !!row
  if (row) {
    currentSupplierId.value = row.id
    Object.assign(formData, row)
  }
  editDialogVisible.value = true
}

function closeEditDialog() {
  editDialogVisible.value = false
  editForm.value?.resetValidation()
}

async function saveSupplier() {
  try {
    if (isEditMode.value) {
      await updateSupplier(currentSupplierId.value, formData)
      $q.notify({ type: 'positive', message: '更新成功' })
    } else {
      await createSupplier(formData)
      $q.notify({ type: 'positive', message: '创建成功' })
    }
    closeEditDialog()
    fetchSuppliers()
  } catch (error) {
    $q.notify({ type: 'negative', message: '保存失败' + error.message })
  }
}

// 删除/禁用
function confirmDelete(row) {
  deletingSupplier.value = row
  deleteDialogVisible.value = true
}

async function handleDeleteSupplier() {
  try {
    await deleteSupplier(deletingSupplier.value.id)
    $q.notify({ type: 'positive', message: '操作成功' })
    fetchSuppliers()
  } catch (error) {
    $q.notify({ type: 'negative', message: '操作失败' + error.message })
  } finally {
    deleteDialogVisible.value = false
  }
}

// 导出
async function exportSuppliers() {
  try {
    const res = await downloadSuppliers()
    downloadExcelFile(res, `供应商数据_${formatDate(new Date())}.xlsx`)
    $q.notify({ type: 'positive', message: '导出成功' })
  } catch (error) {
    $q.notify({ type: 'negative', message: '导出失败' + error.message })
  }
}

// 下载模板
async function downloadInitTemplate() {
  try {
    const res = await downloadSupplierTemplate('init')
    downloadExcelFile(res, '供应商初始化模板.xlsx')
    $q.notify({ type: 'positive', message: '下载成功' })
  } catch (error) {
    $q.notify({ type: 'negative', message: '下载失败' + error.message })
  }
}
async function downloadNormalTemplate() {
  try {
    const res = await downloadSupplierTemplate('normal')
    downloadExcelFile(res, '供应商增量模板.xlsx')
    $q.notify({ type: 'positive', message: '下载成功' })
  } catch (error) {
    $q.notify({ type: 'negative', message: '下载失败' + error.message })
  }
}



// 文件下载通用方法
function downloadExcelFile(response, fileName) {
  const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// 导入相关
function handleFileSelected(files) {
  selectedFile.value = files[0]
}
async function handleInitImport() {
  if (!selectedFile.value) return

  try {
    importLoading.value = true
    const formData = new FormData()
    formData.append('file', selectedFile.value)

    formData.append('import_type', 'initial')

    formData.append('import_type', 'incremental')

    const response = await importSupplier(formData)
    if (response.status === 200) {
      const result = response.data
      initImportResult.value = result
      importErrors.value = result.errors || []

      $q.notify({
        color: 'positive',
        message: `初始化成功！供应商记录：${result.success_count}条`,
        position: 'top'
      })

      if (result.error_count === 0) {
        setTimeout(() => {
          resetInitImportState()
          fetchSuppliers()
        }, 1500)
      }
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '供应商初始化失败',
      position: 'top'
    })
  } finally {
    importLoading.value = false
  }
}

async function handleNormalImport() {
  if (!selectedFile.value) return

  try {
    importLoading.value = true
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    formData.append('clear_existing', false)
    formData.append('import_type', 'incremental')

    const response = await importSupplier(formData)
    if (response.status === 200) {
      const result = response.data
      importErrors.value = result.errors || []

      $q.notify({
        color: 'positive',
        message: `导入成功！共处理${result.success_count}条记录`,
        position: 'top'
      })

      if (result.error_count === 0) {
        showNormalImportDialog.value = false
        fetchSuppliers()
      } else {
        downloadImportErrors()
      }
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '增量导入失败',
      position: 'top'
    })
  } finally {
    importLoading.value = false
  }
}

function downloadImportErrors() {
  if (importErrors.value.length === 0) return
  const exportData = importErrors.value.map(err => ({
    '行号': err.row,
    '错误原因': err.error,
    '原始数据': JSON.stringify(err.data)
  }))
  downloadExcelFile(exportData, `供应商导入错误详情_${format(new Date(), 'yyyyMMddHHmmss')}.xlsx`)
}

const resetInitImportState = () => {
  showInitImportDialog.value = false
  selectedFile.value = null
}
</script>
