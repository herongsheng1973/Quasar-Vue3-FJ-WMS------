<!-- src/pages/LocationManagement.vue -->
<template>
  <q-page class="q-pa-md">
    <!-- 页面标题与操作按钮 -->
    <div class="row col-12 flex justify-between items-center">
      <div>
        <h5 class="text-h5 q-ma-none">库位管理</h5>
        <p class="text-caption text-grey-7 q-mt-xs">管理系统中的库位信息，包括新增、编辑、导入和导出等功能</p>
      </div>

      <div class="flex gap-2">
        <q-btn-dropdown color="primary" label="导入" icon="upload" size="md">
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
        <q-btn label="导出" color="primary" icon="download" @click="handleExportLocations" size="md" />
        <q-btn label="新增库位" color="primary" @click="openEditDialog()" icon="add" size="md" />
      </div>
    </div>

    <!-- 搜索与过滤区域 -->
    <div class="col-12 bg-white rounded-borders shadow-sm q-py-md">
      <q-form class="row q-col-gutter-md" @submit.prevent="filterLocations">
        <!-- 仓库筛选 -->
        <div class="col-md-2 col-sm-6 col-xs-12">
          <q-select v-model="filters.warehouse" label="所属仓库" :options="warehouseOptions" option-label="name"
            option-value="id" emit-value map-options clearable @update:model-value="filterLocations" dense outlined />
        </div>

        <!-- 库位编码搜索 -->
        <div class="col-md-2 col-sm-6 col-xs-12">
          <q-input v-model="searching.code" label="库位编码" clearable @keyup.enter="filterLocations"
            @update:model-value="filterLocations" dense outlined />
        </div>

        <!-- 库位名称搜索 -->
        <div class="col-md-2 col-sm-6 col-xs-12">
          <q-input v-model="searching.name" label="库位名称" clearable @keyup.enter="filterLocations"
            @update:model-value="filterLocations" dense outlined />
        </div>

        <!-- 状态筛选 -->
        <div class="col-md-2 col-sm-6 col-xs-12">
          <q-select v-model="filters.is_active" label="状态" :options="[
            { label: '全部', value: null },
            { label: '启用', value: 'True' },
            { label: '禁用', value: 'False' }
          ]" option-label="label" option-value="value" emit-value map-options @update:model-value="filterLocations"
            dense outlined />
        </div>

        <!-- 操作按钮 -->
        <div class="col-md-4 col-sm-12 col-xs-12 flex items-end">
          <q-btn label="重置" color="secondary" @click="resetFilters" class="col-2 q-mr-md" dense />
          <q-btn label="搜索" color="primary" type="submit" class="col-2" dense />
        </div>
      </q-form>
    </div>

    <!-- 库位列表表格 -->
    <div class="col-12 bg-white rounded-borders shadow-sm">
      <q-table :rows="locations" :columns="columns" row-key="id" :loading="loading" v-model:pagination="pagination"
        :rows-per-page-options="[10, 20, 50]" @request="onTableRequest">
        <template v-slot:body-cell-index="props">
          <q-td :props="props">
            <q-badge color="primary">
              {{ (pagination.page - 1) * pagination.rowsPerPage + props.pageIndex + 1 }}
            </q-badge>
          </q-td>
        </template>

        <!-- 状态列：用徽章显示 -->
        <template v-slot:body-cell-is_active="props">
          <q-td :props="props">
            <q-badge :color="props.row.is_active ? 'positive' : 'negative'">
              {{ props.row.is_active ? '启用' : '禁用' }}
            </q-badge>
          </q-td>
        </template>

        <!-- 创建时间格式化 -->
        <template v-slot:body-cell-created_at="props">
          <q-td :props="props">
            {{ formatDate(props.row.created_at) }}
          </q-td>
        </template>

        <!-- 操作列：编辑/删除 -->
        <template v-slot:body-cell-actions="props">
          <q-td :props="props" color="grey">
            <q-btn size="sm" color="primary" icon="edit" round flat class="q-ml-xs" @click="openEditDialog(props.row)"
              :disabled="!props.row.is_active" />
            <q-btn size="sm" :color="props.row.is_active ? 'negative' : 'positive'"
              :icon="props.row.is_active ? 'delete' : 'check'" round flat class="q-ml-xs"
              @click="confirmStatusChange(props.row)" />
          </q-td>
        </template>

        <!-- 无数据提示 -->
        <template #no-data>
          <q-item>
            <q-item-section class="text-center">暂无库位数据</q-item-section>
          </q-item>
        </template>
      </q-table>
    </div>

    <!-- 新增/编辑库位弹窗 -->
    <q-dialog v-model="editDialogVisible">
      <q-card class="q-w-full q-mt-md" style="max-width: 600px;">
        <q-card-section>
          <h5 class="text-h5">{{ isEditMode ? '编辑库位' : '新增库位' }}</h5>
          <q-form ref="editForm" class="q-pa-md" @submit.prevent="saveLocation">
            <!-- 所属仓库（编辑时禁用） -->
            <q-select v-model="formData.warehouse" label="所属仓库 *" required :options="warehouseOptions"
              option-label="name" option-value="id" emit-value map-options :disabled="isEditMode"
              :error="!!formErrors.warehouse" @blur="validateWarehouse" />

            <!-- 库位编码（需校验仓库内唯一性） -->
            <q-input v-model="formData.code" label="库位编码 *" required :error="!!formErrors.code"
              :rules="[val => val && val.length > 0 || '请输入库位编码']" @blur="validateCodeUnique"
              placeholder="如：WH01-A01（仓库编码-区域编码）" />

            <!-- 库位名称 -->
            <q-input v-model="formData.name" label="库位名称 *" required :error="!!formErrors.name"
              :rules="[val => val && val.length > 0 || '请输入库位名称']" @blur="validateName" />

            <!-- 库位描述 -->
            <q-input v-model="formData.description" label="库位描述" type="textarea" rows="2" />

            <!-- 是否启用（默认启用） -->
            <q-checkbox v-model="formData.is_active" label="启用" :checked="true" class="mt-2" />

            <!-- 提交/取消按钮 -->
            <div class="row q-mt-md">
              <q-btn label="取消" color="secondary" @click="closeEditDialog" class="col-5" />
              <q-btn label="保存" color="primary" type="submit" class="col-5 offset-2" :loading="formLoading" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- 状态变更确认弹窗（启用/禁用） -->
    <q-dialog v-model="statusDialogVisible">
      <q-card class="q-w-full q-mt-md" style="max-width: 400px;">
        <q-card-section>
          <h5 class="text-h5">确认操作</h5>
          <p>
            您确定要{{ currentLocation.is_active ? '禁用' : '启用' }}库位
            "{{ currentLocation.warehouse_name }} - {{ currentLocation.name }}" 吗？
          </p>

          <div class="row q-mt-md">
            <q-btn label="取消" color="secondary" @click="statusDialogVisible = false" class="col-5" />
            <q-btn :label="currentLocation.is_active ? '禁用' : '启用'"
              :color="currentLocation.is_active ? 'negative' : 'positive'" @click="handleStatusChange"
              class="col-5 offset-2" :loading="statusLoading" />
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- 导入弹窗（基础占位，可根据需求扩展） -->
    <!-- 1. 初始化导入弹窗 -->
    <q-dialog v-model="showInitImportDialog" max-width="700px">
      <q-card>
        <q-card-section class="row items-center justify-between">
          <h5 class="text-h5 text-negative">⚠️ 库位初始化导入</h5>
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
                <li>1. 初始化导入将<span class="font-medium text-negative">覆盖现有库位数据</span>，适用于系统首次上线或全量数据重置</li>
                <li>2. 若勾选"清空现有数据"，将删除所有库位记录，<span class="font-medium text-negative">操作不可撤销</span></li>
                <li>3. 请确保导入文件包含"仓库编码、库位编码、库位名称"等必填字段（建议先下载模板）</li>
              </ul>
            </div>

            <!-- 模板下载 -->
            <div class="flex justify-between items-center">
              <p class="text-sm">请下载模板并按格式填写数据</p>
              <q-btn label="下载初始化模板" color="secondary" icon="file_download" size="sm" @click="downloadInitTemplate" />
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
              <q-checkbox v-model="initClearExisting" label="清空现有库位数据" color="negative"
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
                <li>成功创建库位记录：{{ initImportResult.success_count }} 条</li>
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
          <h5 class="text-h5">库位增量导入</h5>
          <q-btn icon="close" flat round @click="showNormalImportDialog = false" />
        </q-card-section>
        <q-card-section class="q-pa-md">
          <div class="space-y-4">
            <p class="text-sm">增量导入仅新增/更新库位记录，不删除现有数据，适用于日常批量更新</p>
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
  </q-page>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { format } from 'date-fns'

// 引入API函数（需根据实际项目路径调整）
import {
  getLocations,
  createLocation,
  updateLocation,
  updateLocationStatus,
  exportLocations,
  importLocations,
  downloadLocationTemplate,
  getWarehouseOptions
} from 'src/services/settingsServiceApi'

// Quasar 实例
const $q = useQuasar()
import { exportExcel } from 'src/utils/excel-utils' // 添加Excel导出工具
// ---------------------- 状态定义 ----------------------
// 仓库列表（用于下拉选择）
const warehouseOptions = ref([])
// 库位列表数据
const locations = ref([])
// 加载状态
const loading = ref(false)
const formLoading = ref(false)
const statusLoading = ref(false)

// 搜索过滤条件
const filters = reactive({
  warehouse: null, // 所属仓库ID
  is_active: null
})
const searching = reactive({
  name: '',
  code: ''
})
// 新增的导入对话框状态
const showInitImportDialog = ref(false) // 初始化导入弹窗
const showNormalImportDialog = ref(false) // 增量导入弹窗

// 导入相关
const selectedFile = ref(null)
const importLoading = ref(false)
const importErrors = ref([])
const initClearExisting = ref(false) // 初始化是否清空现有数据
const initImportResult = ref(null) // 初始化导入结果

// 导入错误表格列
const importErrorColumns = ref([
  { name: 'row', label: '行号', field: 'row', width: '80px' },
  { name: 'data', label: '数据', field: 'data', format: (val) => JSON.stringify(val).slice(0, 50) + '...' },
  { name: 'error', label: '错误原因', field: 'error' }
])

// 分页配置

const pagination = ref({
  page: 1,
  rowsPerPage: 10,
  sortBy: 'code',
  descending: false
})

// 弹窗状态
const editDialogVisible = ref(false)
const statusDialogVisible = ref(false)


// 表单数据
const formData = reactive({
  warehouse: null, // 所属仓库ID
  name: '',
  code: '',
  description: '',
  is_active: true
})

// 表单错误信息
const formErrors = reactive({
  warehouse: '',
  code: '',
  name: ''
})

// 编辑模式标识与当前操作数据
const isEditMode = ref(false)
const currentLocationId = ref(null)
const currentLocation = ref({})

// 表格列配置（匹配序列化器返回字段）
const columns = ref([
  { name: "index", label: '序号', field: 'index', align: 'center', width: '80px' },
  { name: 'warehouse_name', label: '所属仓库', field: 'warehouse_name', sortable: true },
  { name: 'code', label: '库位编码', field: 'code', sortable: true },
  { name: 'name', label: '库位名称', field: 'name', sortable: true },
  { name: 'description', label: '描述', field: 'description', sortable: false },
  { name: 'is_active', label: '状态', field: 'is_active', sortable: true },
  { name: 'created_at', label: '创建时间', field: 'created_at', sortable: true },
  { name: 'actions', label: '操作', align: 'center', sortable: false }
])

// ---------------------- 初始化 ----------------------
onMounted(async () => {
  // 先加载仓库列表（用于筛选和表单选择）
  await fetchWarehouses()
  // 再加载库位列表
  await fetchLocations()
})

// ---------------------- 接口调用 ----------------------
/** 加载仓库列表（用于下拉选择） */
const fetchWarehouses = async () => {
  try {
    const res = await getWarehouseOptions()
    warehouseOptions.value = res.data || []
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: '加载仓库列表失败：' + (error.response?.data?.error || error.message)
    })
  }
}
const buildRequestParams = () => {
  const params = {
    page: pagination.value.page,
    page_size: pagination.value.rowsPerPage,
    ordering: pagination.value.descending
      ? `-${pagination.value.sortBy || 'code'}`
      : pagination.value.sortBy || 'code'
  }

  // 处理仓库筛选
  if (filters.warehouse) {
    params.warehouse_id = filters.warehouse
  }

  // 处理产品筛选
  if (filters.is_active) {
    params.is_active = filters.is_active
  }

  // 收集搜索参数
  const searchTerms = []

  // 添加产品搜索词
  if (searching.code) {
    searchTerms.push(searching.code)
  }

  // 添加SKU搜索词
  if (searching.name) {
    searchTerms.push(searching.name)
  }

  // 如果有搜索词，添加到参数中
  if (searchTerms.length > 0) {
    params.search = searchTerms.join(' ')
  }

  return params
}
/** 加载库位列表（带筛选条件） */
const fetchLocations = async () => {
  try {
    loading.value = true
    // 构建查询参数
    const params = buildRequestParams()
    const res = await getLocations(params)
    locations.value = res.data.results || []
    pagination.value.rowsNumber = res.data.count || 0
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: '加载库位列表失败：' + (error.response?.data?.error || error.message)
    })
  } finally {
    loading.value = false
  }
}
const filterLocations = async () => {
  // 触发分页刷新
  pagination.value.page = 1
  await fetchLocations()
}
/** 保存库位（新增/编辑） */
const saveLocation = async () => {
  // 表单基础校验
  const hasError = validateForm()
  if (hasError) return

  try {
    formLoading.value = true
    const locationData = {
      warehouse: formData.warehouse,
      name: formData.name,
      code: formData.code.trim().toUpperCase(), // 编码统一转为大写
      description: formData.description,
      is_active: formData.is_active
    }

    if (isEditMode.value) {
      // 编辑：仅更新可修改字段（仓库和编码不可改）
      await updateLocation(currentLocationId.value, {
        warehouse: formData.warehouse,
        name: formData.name,
        code: formData.code.trim().toUpperCase(), // 编码统一转为大写
        description: formData.description,
        is_active: formData.is_active
      })
      $q.notify({ type: 'positive', message: '库位更新成功' })
    } else {
      // 新增：提交完整数据
      await createLocation(locationData)
      $q.notify({ type: 'positive', message: '库位创建成功' })
    }

    // 关闭弹窗并刷新列表
    closeEditDialog()
    await fetchLocations()
  } catch (error) {
    // 捕获后端返回的字段错误（如编码唯一性冲突）
    const errMsg = error.response?.data?.error || error.response?.data?.non_field_errors?.[0] || error.message
    $q.notify({ type: 'negative', message: (isEditMode.value ? '更新' : '创建') + '库位失败：' + errMsg })

    // 映射字段错误到表单提示
    // 映射字段错误到表单提示
    const errorData = error.response?.data || {}
    Object.keys(errorData).forEach(field => {
      if (Object.prototype.hasOwnProperty.call(formErrors, field)) {
        formErrors[field] = errorData[field][0] || '校验失败'
      }
    })
  } finally {
    formLoading.value = false
  }
}

/** 变更库位状态（启用/禁用） */
const handleStatusChange = async () => {
  try {
    statusLoading.value = true
    await updateLocationStatus(currentLocation.value.id, {
      is_active: !currentLocation.value.is_active
    })
    $q.notify({
      type: 'positive',
      message: `库位已${currentLocation.value.is_active ? '禁用' : '启用'}`
    })
    statusDialogVisible.value = false
    await fetchLocations()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: '状态变更失败：' + (error.response?.data?.error || error.message)
    })
  } finally {
    statusLoading.value = false
  }
}

/** 导出库位数据 */
const handleExportLocations = async () => {
  try {
    loading.value = true
    const res = await exportLocations()

    // 处理Excel文件下载
    const blob = new Blob([res.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `库位数据_${format(new Date(), 'yyyyMMddHHmmss')}.xlsx`
    document.body.appendChild(a)
    a.click()
    URL.revokeObjectURL(url)
    document.body.removeChild(a)

    $q.notify({ type: 'positive', message: '库位数据导出成功' })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: '导出失败：' + (error.response?.data?.error || error.message)
    })
  } finally {
    loading.value = false
  }
}

// ==================== 导入功能相关 ====================

// 1. 模板下载（区分初始化和增量模板）
async function downloadInitTemplate() {
  try {
    const response = await downloadLocationTemplate('init')
    handleFileDownload(response, '库位初始化导入模板.xlsx')
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '初始化模板下载失败',
      position: 'top'
    })
  }
}

async function downloadNormalTemplate() {
  try {
    const response = await downloadLocationTemplate('normal')
    handleFileDownload(response, '库位增量导入模板.xlsx')
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
      message: '确定要清空所有库位数据吗？此操作将删除所有库位记录，且无法恢复！',
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

// 4. 库位初始化导入（核心功能）
async function handleInitImport() {
  if (!selectedFile.value) return

  try {
    importLoading.value = true
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    formData.append('clear_existing', initClearExisting.value) // 传递清空参数
    formData.append('import_type', 'init')

    const response = await importLocations(formData) // 第二个参数标识初始化导入

    if (response.status === 200) {
      const result = response.data
      initImportResult.value = result
      importErrors.value = result.errors || []

      // 提示结果
      $q.notify({
        color: 'positive',
        message: `初始化成功！库位记录：${result.success_count}条`,
        position: 'top'
      })

      // 无错误则关闭弹窗并刷新
      if (result.error_count === 0) {
        setTimeout(() => {
          resetInitImportState()
          fetchLocations()
        }, 1500)
      }
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '库位初始化失败',
      position: 'top'
    })
  } finally {
    importLoading.value = false
  }
}

// 5. 库位增量导入
async function handleNormalImport() {
  if (!selectedFile.value) return

  try {
    importLoading.value = true
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    formData.append('clear_existing', false) // 增量导入不清空

    const response = await importLocations(formData, false)
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
        fetchLocations()
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
  exportExcel(exportData, `库位导入错误详情_${format(new Date(), 'yyyyMMddHHmmss')}.xlsx`)
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


// ---------------------- 表单验证 ----------------------
/** 表单基础校验 */
const validateForm = () => {
  let hasError = false
  // 仓库校验
  if (!formData.warehouse) {
    formErrors.warehouse = '请选择所属仓库'
    hasError = true
  } else {
    formErrors.warehouse = ''
  }
  // 编码校验
  if (!formData.code.trim()) {
    formErrors.code = '请输入库位编码'
    hasError = true
  } else if (formData.code.length > 50) {
    formErrors.code = '编码长度不能超过50个字符'
    hasError = true
  } else {
    formErrors.code = ''
  }
  // 名称校验
  if (!formData.name.trim()) {
    formErrors.name = '请输入库位名称'
    hasError = true
  } else if (formData.name.length > 100) {
    formErrors.name = '名称长度不能超过100个字符'
    hasError = true
  } else {
    formErrors.name = ''
  }
  return hasError
}

/** 校验仓库内编码唯一性（新增时） */
const validateCodeUnique = async () => {
  if (!formData.warehouse || !formData.code.trim()) return

  try {
    const res = await getLocations({
      warehouse: formData.warehouse,
      code: formData.code.trim()
    })
    if (res.data.count > 0) {
      formErrors.code = '当前仓库下已存在该编码的库位'
    } else {
      formErrors.code = ''
    }
  } catch {
    formErrors.code = '校验编码唯一性失败，请稍后重试'
  }
}

/** 仓库选择校验 */
const validateWarehouse = () => {
  if (!formData.warehouse) {
    formErrors.warehouse = '请选择所属仓库'
  } else {
    formErrors.warehouse = ''
  }
}

/** 名称校验 */
const validateName = () => {
  if (!formData.name.trim()) {
    formErrors.name = '请输入库位名称'
  } else if (formData.name.length > 100) {
    formErrors.name = '名称长度不能超过100个字符'
  } else {
    formErrors.name = ''
  }
}

// ---------------------- 弹窗操作 ----------------------
/** 打开新增/编辑弹窗 */
const openEditDialog = (location = null) => {
  // 重置表单
  Object.keys(formData).forEach(key => {
    formData[key] = key === 'is_active' ? true : ''
  })
  // 重置错误信息
  Object.keys(formErrors).forEach(key => {
    formErrors[key] = ''
  })

  if (location) {
    // 编辑模式：填充当前库位数据
    isEditMode.value = true
    currentLocationId.value = location.id
    formData.warehouse = location.warehouse // 仓库ID（序列化器返回warehouse字段）
    formData.name = location.name
    formData.code = location.code
    formData.description = location.description || ''
    formData.is_active = location.is_active
  } else {
    // 新增模式
    isEditMode.value = false
    currentLocationId.value = null
  }

  editDialogVisible.value = true
}

/** 关闭编辑弹窗 */
const closeEditDialog = () => {
  editDialogVisible.value = false
  if (editForm.value) {
    editForm.value.resetValidation()
  }
}

/** 打开状态变更弹窗 */
const confirmStatusChange = (location) => {
  currentLocation.value = { ...location }
  statusDialogVisible.value = true
}

// ---------------------- 表格与筛选操作 ----------------------
/** 表格排序/分页变更 */
const onTableRequest = (props) => {
  pagination.value = {
    ...pagination.value,
    page: props.pagination.page,
    rowsPerPage: props.pagination.rowsPerPage,
    sortBy: props.pagination.sortBy,
    descending: props.pagination.descending
  }
  fetchLocations()
}

/** 重置筛选条件 */
const resetFilters = () => {
  filters.warehouse = null
  filters.is_active = null
  searching.code = ''
  searching.name = ''
  pagination.value.page = 1
  fetchLocations()
}

// ---------------------- 工具函数 ----------------------
/** 格式化日期显示 */
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  try {
    return format(new Date(dateStr), 'yyyy-MM-dd HH:mm:ss')
  } catch {
    return dateStr
  }
}

// 表单引用
const editForm = ref(null)
</script>
