<!-- src/pages/WarehouseManagement.vue -->
<template>
  <q-page class="q-pa-md">
    <!-- 页面标题和操作按钮 -->
    <div class="row col-12 flex justify-between items-center q-ma-md">
      <div class="col-6">
        <h6 class="text-h5 q-ma-none">仓库管理</h6>
        <p class="text-subtitle2 text-secondary">管理系统中的仓库信息，包括新增、编辑、导入和导出等功能</p>
      </div>

      <div class="col-6 flex gap-2 justify-end">
        <q-btn-dropdown color="primary" label="导入" icon="upload">
          <q-list>
            <q-item clickable v-close-popup @click="showInitImportDialog = true">
              <q-item-section>
                <q-item-label>初始化导入</q-item-label>
              </q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="showNormalImportDialog = true">
              <q-item-section>
                <q-item-label>增量导入</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
        <q-btn label="导出" color="primary" @click="handleExportWarehouses" icon="download" />
        <q-btn label="新增仓库" color="primary" @click="openEditDialog()" icon="add" />
      </div>
    </div>

    <!-- 搜索和过滤区域 -->
    <div class="row col-12 flex flex-wrap gap-4 q-ma-lg">
      <q-input class="col-3 q-pr-md" v-model="searchQuery" label="搜索（名称/编码/地址/联系人）" @keyup.enter="fetchWarehouses"
        dense>
        <template #append>
          <q-icon name="search" />
        </template>
      </q-input>
      <q-select class="col-2" v-model="filterIsActive" label="状态" :options="statusOptions" option-label="label"
        option-value="value" emit-value map-options @update:model-value="fetchWarehouses" dense />
      <q-btn label="重置" color="secondary" @click="resetFilters" style="width: 120px;margin-left: 24px;" />
      <q-btn label="搜索" color="teal" @click="fetchWarehouses" style="width: 120px;margin-left: 24px;" />
    </div>

    <!-- 仓库列表 -->

    <q-table class="row col-12 flex  bg-white rounded-borders shadow-sm" :rows="warehouses" :columns="columns"
      row-key="id" :loading="loading" v-model:pagination="pagination" :rows-per-page-options="[10, 20, 50, 100]"
      @request="onRequest">
      <template v-slot:body-cell-index="props">
        <q-td :props="props" align="center">
          <q-badge color="primary">
            {{ (pagination.page - 1) * pagination.rowsPerPage + props.pageIndex + 1 }}
          </q-badge>
        </q-td>
      </template>

      <template v-slot:body-cell-actions="props">
        <q-td :props="props">
          <q-btn size="sm" color="primary" icon="edit" @click="openEditDialog(props.row)" />
          <q-btn size="sm" color="negative" icon="delete" @click="confirmDelete(props.row)" />
        </q-td>
      </template>

      <template v-slot:body-cell-is_active="props">
        <q-td :props="props">
          <q-badge :color="props.row.is_active ? 'positive' : 'negative'">
            {{ props.row.is_active ? '启用' : '禁用' }}
          </q-badge>
        </q-td>
      </template>

      <!-- 格式化创建时间显示 -->
      <template v-slot:body-cell-created_at="props">
        <q-td :props="props">
          {{ formatDate(props.row.created_at) }}
        </q-td>
      </template>

      <template #no-data>
        <q-item>
          <q-item-section class="text-center">
            暂无仓库数据
          </q-item-section>
        </q-item>
      </template>
    </q-table>


    <!-- 编辑/新增对话框 -->
    <q-dialog v-model="editDialogVisible">
      <q-card class="q-w-full q-mt-md" style="width: 400px; max-width: 600px;">
        <q-card-section>
          <h5 class="text-h5">{{ isEditMode ? '编辑仓库' : '新增仓库' }}</h5>
          <q-form ref="editForm" class="q-pa-md" @submit="saveWarehouse">
            <q-input v-model="formData.name" label="仓库名称" required :error="!!formErrors.name" lazy-render
              :rules="[val => val && val.length > 0 || '请输入仓库名称']" @blur="validateNameError" />

            <q-input v-model="formData.code" label="仓库编码" required :disabled="isEditMode" :error="!!formErrors.code"
              :rules="[val => val && val.length > 0 || '请输入仓库编码']" @blur="validateCodeError" lazy-render />

            <q-input v-model="formData.address" label="地址" type="textarea" rows="2" />

            <q-input v-model="formData.contact_person" label="联系人" />

            <q-input v-model="formData.contact_phone" label="联系电话" />

            <q-checkbox v-model="formData.is_active" label="启用" :checked="true" />

            <div class="row q-mt-md">
              <q-btn label="取消" color="secondary" @click="closeEditDialog" class="col-5" />
              <q-btn label="保存" color="primary" type="submit" class="col-5 offset-2" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- 1. 初始化导入弹窗 -->
    <q-dialog v-model="showInitImportDialog" max-width="700px">
      <q-card>
        <q-card-section class="row items-center justify-between">
          <h5 class="text-h5 text-negative">⚠️ 仓库初始化导入</h5>
          <q-btn icon="close" flat round @click="showInitImportDialog = false" />
        </q-card-section>
        <q-card-section class="q-pa-md">
          <div class="space-y-4">
            <!-- 风险提示 -->
            <div class="bg-negative/10 p-3 rounded border border-negative/20">
              <h6 class="text-negative font-medium flex items-center">
                <q-icon name="warning" class="q-mr-sm" />
                重要提醒
              </h6>
              <ul class="text-sm mt-2 space-y-1 text-gray-700">
                <li>1. 初始化导入将<span class="font-medium text-negative">覆盖现有仓库数据</span>，适用于系统首次上线或全量数据重置</li>
                <li>2. 若勾选"清空现有数据"，将删除所有仓库记录，<span class="font-medium text-negative">操作不可撤销</span></li>
                <li>3. 请确保导入文件包含"仓库名称、仓库编码"等必填字段（建议先下载模板）</li>
              </ul>
            </div>

            <!-- 模板下载 -->
            <div class="flex justify-between items-center">
              <p class="text-sm">请下载模板并按格式填写数据</p>
              <q-btn label="下载初始化模板" color="secondary" icon="file_download" size="sm"
                @click="handleDownloadInitTemplate" />
            </div>

            <!-- 文件上传 -->
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

            <!-- 清空现有数据选项 -->
            <div class="flex items-center mt-4">
              <q-checkbox v-model="initClearExisting" label="清空现有仓库数据" color="negative"
                @update:model-value="handleClearConfirm" />
            </div>

            <!-- 导入结果/错误展示 -->
            <div v-if="importErrors.length > 0" class="mt-4">
              <h6 class="text-negative text-sm font-medium">导入失败记录（共{{ importErrors.length }}条）</h6>
              <div class="bg-white border border-gray-200 rounded mt-2 max-h-60 overflow-auto">
                <q-table :rows="importErrors" :columns="importErrorColumns" row-key="row" dense hide-header flat />
              </div>
              <q-btn label="下载错误详情" color="negative" size="sm" class="mt-2" @click="downloadImportErrors" dense />
            </div>

            <!-- 初始化成功统计 -->
            <div v-if="initImportResult" class="mt-4 bg-positive/10 p-3 rounded">
              <h6 class="text-positive font-medium">初始化导入成功</h6>
              <ul class="text-sm mt-2 space-y-1">
                <li>成功创建仓库记录：{{ initImportResult.success_count }} 条</li>
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

    <!-- 2. 增量导入弹窗 -->
    <q-dialog v-model="showNormalImportDialog" max-width="700px">
      <q-card>
        <q-card-section class="row items-center justify-between">
          <h5 class="text-h5">仓库增量导入</h5>
          <q-btn icon="close" flat round @click="showNormalImportDialog = false" />
        </q-card-section>
        <q-card-section class="q-pa-md">
          <div class="space-y-4">
            <p class="text-sm">增量导入仅新增/更新仓库记录，不删除现有数据，适用于日常批量更新</p>
            <div class="flex justify-between items-center">
              <p class="text-sm">请下载模板并按格式填写数据</p>
              <q-btn label="下载增量导入模板" color="secondary" icon="file_download" size="sm"
                @click="handleDownloadNormalTemplate" />
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

    <!-- 删除确认对话框 -->
    <q-dialog v-model="deleteDialogVisible">
      <q-card class="q-w-full q-mt-md" style="max-width: 400px;">
        <q-card-section>
          <h5 class="text-h5">确认操作</h5>
          <p>您确定要{{ deletingWarehouse.is_active ? '禁用' : '启用' }}仓库 "{{ deletingWarehouse.name }}" 吗？</p>

          <div class="row q-mt-md">
            <q-btn label="取消" color="secondary" @click="deleteDialogVisible = false" class="col-5" />
            <q-btn :label="deletingWarehouse.is_active ? '禁用' : '启用'" color="negative" @click="handleDeleteWarehouse"
              class="col-5 offset-2" />
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- 导入结果对话框 -->
    <q-dialog v-model="showImportResult">
      <q-card class="q-w-full q-mt-md" style="max-width: 600px; max-height: 70vh; overflow-y: auto;">
        <q-card-section>
          <h5 class="text-h5">导入结果</h5>

          <div v-if="importResult.success" class="text-positive">
            <p>{{ importResult.message }}</p>
          </div>

          <div v-else class="text-negative">
            <p>{{ importResult.message }}</p>
          </div>

          <div v-if="importResult.errors && importResult.errors.length" class="q-mt-md">
            <h6 class="text-subtitle1">错误记录:</h6>
            <ul class="list-disc q-ml-md">
              <li v-for="(error, index) in importResult.errors" :key="index" class="text-negative">{{ error }}</li>
            </ul>
          </div>

          <q-btn label="关闭" color="primary" @click="showImportResult = false" class="q-mt-md" />
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { format } from 'date-fns'
import { exportExcel } from 'src/utils/excel-utils'
import {
  getWarehouses,
  exportWarehouseData,
  deleteWarehouse,
  createWarehouse,
  updateWarehouse,
  downloadWarehouseTemplate,
  importWarehouseData
} from 'src/services/settingsServiceApi'

// Quasar 实例
const $q = useQuasar()

// 状态变量
const warehouses = ref([])
const loading = ref(false)

// 搜索和过滤条件
const searchQuery = ref('')
const filterIsActive = ref(null)
const editForm = ref(null)

// 分页配置
const pagination = ref({
  page: 1,
  rowsPerPage: 10,
  sortBy: 'code',
  descending: false,
})

// 对话框状态
const editDialogVisible = ref(false)
const deleteDialogVisible = ref(false)
const showImportResult = ref(false)

// 新增的导入对话框状态
const showInitImportDialog = ref(false) // 初始化导入弹窗
const showNormalImportDialog = ref(false) // 增量导入弹窗

// 表单数据
const formData = reactive({
  name: '',
  code: '',
  address: '',
  contact_person: '',
  contact_phone: '',
  is_active: true
})

// 状态变量提示
const statusOptions = ref([
  { label: '全部', value: null },
  { label: '启用', value: true },
  { label: '禁用', value: false }
])
// 表单错误提示
const formErrors = reactive({
  name: '请输入仓库名称',
  code: '请输入仓库编码'
})

// 编辑模式标识
const isEditMode = ref(false)
const currentWarehouseId = ref(null)

// 导入相关
const importResult = ref({})
const selectedFile = ref(null)
const importLoading = ref(false)
const importErrors = ref([])
const initClearExisting = ref(false) // 初始化是否清空现有数据
const initImportResult = ref(null) // 初始化导入结果

// 删除相关
const deletingWarehouse = ref({})

// 表格列配置
const columns = [
  { name: 'index', label: '序号', field: 'index', align: 'center' },
  { name: 'name', label: '仓库名称', field: 'name', sortable: true },
  { name: 'code', label: '仓库编码', field: 'code', sortable: true },
  { name: 'address', label: '地址', field: 'address', sortable: false },
  { name: 'contact_person', label: '联系人', field: 'contact_person', sortable: false },
  { name: 'contact_phone', label: '联系电话', field: 'contact_phone', sortable: false },
  { name: 'is_active', label: '状态', field: 'is_active', sortable: true },
  { name: 'created_by_name', label: '创建人', field: 'created_by_name', sortable: true },
  { name: 'created_at', label: '创建时间', field: 'created_at', sortable: true },
  { name: 'actions', label: '操作', align: 'center' }
]

// 导入错误表格列
const importErrorColumns = ref([
  { name: 'row', label: '行号', field: 'row', width: '80px' },
  { name: 'data', label: '数据', field: 'data', format: (val) => JSON.stringify(val).slice(0, 50) + '...' },
  { name: 'error', label: '错误原因', field: 'error' }
])

// 初始化
onMounted(() => {
  fetchWarehouses()
})

// 验证仓库名称
const validateNameError = () => {
  if (!formData.name.trim() || formData.name.trim().length < 2 || formData.name.trim().length > 100) {
    formErrors.name = '仓库名称不能为空且长度必须在2到100个字符之间'
  } else {
    formErrors.name = ''
  }
}

// 验证仓库编码
const validateCodeError = () => {
  if (!formData.code.trim() || formData.code.trim().length < 2 || formData.code.trim().length > 50) {
    formErrors.code = '仓库编码不能为空且长度必须在2到50个字符之间'
  } else {
    formErrors.code = ''
  }
}

// 格式化日期显示
const formatDate = (dateString) => {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    return format(date, 'yyyy-MM-dd HH:mm:ss')
  } catch {
    return dateString
  }
}

// 获取仓库列表
const fetchWarehouses = async () => {
  try {
    loading.value = true

    // 构建查询参数
    const params = new URLSearchParams()
    params.append('page', pagination.value.page)
    params.append('page_size', pagination.value.rowsPerPage)

    // 排序参数
    if (pagination.value.sortBy) {
      params.append('ordering', pagination.value.descending ? `-${pagination.value.sortBy}` : pagination.value.sortBy)
    }

    if (searchQuery.value) params.append('search', searchQuery.value)
    if (filterIsActive.value !== null) params.append('is_active', filterIsActive.value)

    const response = await getWarehouses(params)

    warehouses.value = response.data.results
    pagination.value.rowsNumber = response.data.count
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: '获取仓库列表失败: ' + (error.response?.data?.message || error.message)
    })
  } finally {
    loading.value = false
  }
}

// 处理表格请求（排序、分页）
const onRequest = (props) => {
  pagination.value = {
    ...pagination.value,
    page: props.pagination.page,
    rowsPerPage: props.pagination.rowsPerPage,
    sortBy: props.pagination.sortBy,
    descending: props.pagination.descending
  }
  fetchWarehouses()
}

// 打开编辑对话框
const openEditDialog = (warehouse = null) => {
  // 重置表单
  Object.keys(formData).forEach(key => {
    formData[key] = key === 'is_active' ? true : ''
  })

  // 重置错误状态
  formErrors.name = ''
  formErrors.code = ''

  if (warehouse) {
    // 编辑模式
    isEditMode.value = true
    currentWarehouseId.value = warehouse.id
    formData.name = warehouse.name
    formData.code = warehouse.code
    formData.address = warehouse.address || ''
    formData.contact_person = warehouse.contact_person || ''
    formData.contact_phone = warehouse.contact_phone || ''
    formData.is_active = warehouse.is_active
  } else {
    // 新增模式
    isEditMode.value = false
    currentWarehouseId.value = null
  }
  editDialogVisible.value = true
}

// 关闭编辑对话框
const closeEditDialog = () => {
  editDialogVisible.value = false
  // 重置表单验证
  editForm.value.resetValidation()
}

// 保存仓库
const saveWarehouse = async () => {
  // 先进行验证
  validateNameError()
  validateCodeError()

  // 检查是否有错误
  const hasErrors = formErrors.name || formErrors.code
  if (hasErrors) {
    $q.notify({ type: 'negative', message: `${formErrors.name}, ${formErrors.code}` })
    return
  }

  try {
    loading.value = true

    if (isEditMode.value) {
      // 更新仓库
      await updateWarehouse(currentWarehouseId.value, {
        name: formData.name,
        code: formData.code.toUpperCase(),
        address: formData.address,
        contact_person: formData.contact_person,
        contact_phone: formData.contact_phone,
        is_active: formData.is_active
      })

      $q.notify({
        type: 'positive',
        message: '仓库更新成功'
      })
    } else {
      // 创建新仓库
      await createWarehouse({
        name: formData.name,
        code: formData.code.toUpperCase(),
        address: formData.address,
        contact_person: formData.contact_person,
        contact_phone: formData.contact_phone,
        is_active: formData.is_active
      })

      $q.notify({
        type: 'positive',
        message: '仓库创建成功'
      })
    }

    closeEditDialog()
    fetchWarehouses()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: (isEditMode.value ? '更新' : '创建') + '仓库失败: ' +
        (error.response?.data?.message || error.response?.data?.non_field_errors?.[0] || error.message)
    })

    // 显示字段错误
    if (error.response?.data) {
      Object.keys(error.response.data).forEach(key => {
        if (Object.prototype.hasOwnProperty.call(formErrors, key)) {
          formErrors[key] = error.response.data[key][0]
        }
      })
    }
  } finally {
    loading.value = false
    if (editForm.value) {
      editForm.value.resetValidation()
    }
  }
}

// 确认删除
const confirmDelete = (warehouse) => {
  deletingWarehouse.value = { ...warehouse }
  deleteDialogVisible.value = true
}

// 删除仓库（逻辑删除）
const handleDeleteWarehouse = async () => {
  try {
    loading.value = true

    // 逻辑删除：更新is_active状态
    await deleteWarehouse(deletingWarehouse.value.id)

    $q.notify({
      type: 'positive',
      message: `仓库已${deletingWarehouse.value.is_active ? '禁用' : '启用'}`
    })
    deleteDialogVisible.value = false
    fetchWarehouses()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: '操作失败: ' + (error.data?.message || error.message)
    })
  } finally {
    loading.value = false
    deletingWarehouse.value = null
    deleteDialogVisible.value = false
  }
}

// 重置筛选条件
const resetFilters = () => {
  searchQuery.value = ''
  filterIsActive.value = null
  pagination.value.page = 1
  fetchWarehouses()
}

// 导出仓库数据
const handleExportWarehouses = async () => {
  try {
    loading.value = true
    const response = await exportWarehouseData()

    // 处理文件下载
    const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `仓库数据_${format(new Date(), 'yyyyMMddHHmmss')}.xlsx`
    document.body.appendChild(a)
    a.click()
    URL.revokeObjectURL(url)
    document.body.removeChild(a)

    $q.notify({
      type: 'positive',
      message: '仓库数据导出成功'
    })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: '导出失败: ' + (error.response?.data?.message || error.message)
    })
  } finally {
    loading.value = false
  }
}

// ==================== 导入功能相关 ====================

// 1. 模板下载（区分初始化和增量模板）
async function handleDownloadInitTemplate() {
  try {
    const response = await downloadWarehouseTemplate('init')
    handleFileDownload(response, '仓库初始化导入模板.xlsx')
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '初始化模板下载失败',
      position: 'top'
    })
  }
}

async function handleDownloadNormalTemplate() {
  try {
    const response = await downloadWarehouseTemplate('normal')
    handleFileDownload(response, '仓库增量导入模板.xlsx')
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '增量导入模板下载失败',
      position: 'top'
    })
  }
}

// 通用文件下载处理函数
function handleFileDownload(response, filename) {
  // 创建一个隐藏的下载链接并触发下载
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

// 2. 文件选择处理
function handleFileSelected(files) {
  if (files && files.length > 0) {
    selectedFile.value = files[0]
    importErrors.value = []
    initImportResult.value = null
  }
}

// 3. 初始化导入确认（清空数据的二次确认）
async function handleClearConfirm(checked) {
  if (checked) {
    const confirm = await $q.dialog({
      title: '危险操作确认',
      message: '确定要清空所有仓库数据吗？此操作将删除所有仓库记录，且无法恢复！',
      color: 'negative',
      cancel: true,
      persistent: true,
      okLabel: '确认清空',
      cancelLabel: '取消'
    }).onOk

    if (!confirm) {
      initClearExisting.value = false // 取消勾选
    }
  }
}

// 4. 仓库初始化导入（核心功能）
async function handleInitImport() {
  if (!selectedFile.value) return

  try {
    importLoading.value = true
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    formData.append('clear_existing', initClearExisting.value) // 传递清空参数
    formData.append('import_type', 'initial') // 标识初始化导入

    const response = await importWarehouseData(formData) // 第二个参数标识初始化导入

    if (response.status === 200) {
      const result = response.data
      initImportResult.value = result
      importErrors.value = result.errors || []

      // 提示结果
      $q.notify({
        color: 'positive',
        message: `初始化成功！仓库记录：${result.success_count}条`,
        position: 'top'
      })

      // 无错误则关闭弹窗并刷新
      if (result.error_count === 0) {
        setTimeout(() => {
          resetInitImportState()
          fetchWarehouses()
        }, 1500)
      }
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '仓库初始化失败',
      position: 'top'
    })
  } finally {
    importLoading.value = false
  }
}

// 5. 仓库增量导入
async function handleNormalImport() {
  if (!selectedFile.value) return

  try {
    importLoading.value = true
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    formData.append('clear_existing', false) // 增量导入不清空

    formData.append('import_type', 'incremental') // 标识增量导入

    const response = await importWarehouseData(formData)
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
        fetchWarehouses()
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

// 6. 下载导入错误详情
function downloadImportErrors() {
  if (importErrors.value.length === 0) return
  // 转换错误数据为Excel格式
  const exportData = importErrors.value.map(err => ({
    '行号': err.row,
    '错误原因': err.error,
    '原始数据': JSON.stringify(err.data)
  }))
  exportExcel(exportData, `仓库导入错误详情_${format(new Date(), 'yyyyMMddHHmmss')}.xlsx`)
}

// 7. 重置初始化导入状态
const resetInitImportState = () => {
  showInitImportDialog.value = false
  showNormalImportDialog.value = false
  selectedFile.value = null
  importErrors.value = []
  initClearExisting.value = false
  initImportResult.value = null
  importLoading.value = false
}

// ==================== 导入功能相关结束 ====================
</script>
