<!-- src/pages/CategoriesManagement.vue -->
<template>
  <q-page class="q-pa-md">
    <!-- 页面标题和操作按钮 -->
    <div class="row flex items-center q-ma-md">
      <div class="col-4">
        <h5 class="text-h5 q-ma-none">商品类别管理</h5>
        <p class="text-grey-8 text-subtitle2">
          已创建的分类总数：{{ totalCategories }}
        </p>
      </div>
      <div class="col-2">
        <q-btn label="新增分类" color="secondary" @click="openEditDialog()" icon="add" />
      </div>

      <div class="col-6 flex gap-6 justify-end">
        <!-- 新增导入按钮，区分初始化导入和增量导入 -->
        <q-btn-dropdown color="secondary" label="导入" icon="upload">
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
        <q-btn label="导出" color="blue-grey-5" @click="exportProductCategories" icon="download" />

      </div>
    </div>

    <!-- 搜索和过滤区域 -->
    <div class="col-12 q-pa-md bg-white rounded-borders shadow-sm mb-4">
      <q-form class="row gap-4">
        <q-input v-model="searchQuery" label="搜索（名称/编码/描述）" class="col-md-2" @keyup.enter="handleSearch"
          style="margin-left: 24px;">
          <template #append>
            <q-icon name="search" />
          </template>
        </q-input>

        <q-select v-model="filterParent" label="父分类" class="col-md-2" :options="parentOptions" option-label="name"
          option-value="id" clearable @update:model-value="handleSearch" style="margin-left: 24px;" />

        <q-select v-model="filterIsActive" label="状态" class="col-md-2" :options="[
          { label: '全部', value: null },
          { label: '启用', value: true },
          { label: '禁用', value: false }
        ]" option-label="label" option-value="value" emit-value map-options @update:model-value="handleSearch"
          style="margin-left: 24px;" />

        <q-input v-model="filterCode" label="编码" class="col-md-2" @keyup.enter="handleSearch"
          style="margin-left: 24px;" />

        <div class="col-md-3 flex items-end gap-2" style="margin-left: 24px;">
          <q-btn label="重置" color="secondary" @click="resetFilters" style="width: 120px;margin-right: 12px;" />
          <q-btn label="搜索" color="teal" type="submit" @click="handleSearch" style="width: 120px;" />
        </div>
      </q-form>
    </div>

    <!-- 分类列表 -->
    <div class="col-12 bg-white rounded-borders shadow-sm">
      <q-table :rows="categories" :columns="columns" row-key="id" :loading="loading" v-model:pagination="pagination"
        :rows-per-page-options="[10, 20, 50, 100]" @request="onRequest">
        <template v-slot:body-cell-index="props">
          <q-td :props="props">
            <q-badge color="primary">
              {{ (pagination.page - 1) * pagination.rowsPerPage + props.pageIndex + 1 }}
            </q-badge>
          </q-td>
        </template>

        <template v-slot:body-cell-actions="props">
          <q-td :props="props" class="text-center">
            <q-btn size="sm" color="primary" icon="edit" flat round @click="openEditDialog(props.row)" class="q-ml-xs">
              <q-tooltip>编辑</q-tooltip>
            </q-btn>
            <q-btn size="sm" color="negative" icon="delete" flat round confirm="确认删除吗？" class="q-ml-xs"
              @click="confirmDelete(props.row)">
              <q-tooltip>删除</q-tooltip>
            </q-btn>
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
              暂无分类数据
            </q-item-section>
          </q-item>
        </template>
      </q-table>
    </div>

    <!-- 编辑/新增对话框 -->
    <q-dialog v-model="editDialogVisible">
      <q-card class="q-w-full q-mt-md" style="width: 400px; max-width: 600px;">
        <q-card-section>
          <h5 class="text-h5">{{ isEditMode ? '编辑分类' : '新增分类' }}</h5>
          <q-form ref="editForm" class="q-pa-md" @submit="saveProductCategory">
            <q-input v-model="formData.name" label="分类名称" required :error="!!formErrors.name" lazy-render
              :rules="[val => val && val.length > 0 || 'Please input category name']" @blur="validateNameError" />

            <q-input v-model="formData.code" label="分类编码" required :disabled="isEditMode" :error="!!formErrors.code"
              :rules="[val => val && val.length > 0 || 'Please input category code']" @blur="validateCodeError"
              lazy-render />

            <q-select v-model="formData.parent" label="父分类" :options="parentOptions" option-label="name"
              option-value="id" clearable />

            <q-input v-model="formData.description" label="描述" type="textarea" rows="3" />

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
          <h5 class="text-h5 text-negative">⚠️ 分类初始化导入</h5>
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
                <li>1. 初始化导入将<span class="font-medium text-negative">覆盖现有分类数据</span>，适用于系统首次上线或全量数据重置</li>
                <li>2. 若勾选"清空现有数据"，将删除所有分类记录，<span class="font-medium text-negative">操作不可撤销</span></li>
                <li>3. 请确保导入文件包含"分类编码、分类名称"等必填字段（建议先下载模板）</li>
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
              <q-checkbox v-model="initClearExisting" label="清空现有分类数据" color="negative"
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
                <li>成功创建分类记录：{{ initImportResult.success_count }} 条</li>
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
          <h5 class="text-h5">分类增量导入</h5>
          <q-btn icon="close" flat round @click="showNormalImportDialog = false" />
        </q-card-section>
        <q-card-section class="q-pa-md">
          <div class="space-y-4">
            <p class="text-sm">增量导入仅新增/更新分类记录，不删除现有数据，适用于日常批量更新</p>
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

    <!-- 删除确认对话框 -->
    <q-dialog v-model="deleteDialogVisible">
      <q-card class="q-w-full q-mt-md" style="max-width: 400px;">
        <q-card-section>
          <h5 class="text-h5">确认操作</h5>
          <p>您确定要{{ deletingCategory.is_active ? '禁用' : '启用' }}分类 "{{ deletingCategory.name }}" 吗？</p>

          <div class="row q-mt-md">
            <q-btn label="取消" color="secondary" @click="deleteDialogVisible = false" class="col-5" />
            <q-btn :label="deletingCategory.is_active ? '禁用' : '启用'" color="negative"
              @click="handleDeleteProductCategory" class="col-5 offset-2" />
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
  getProductCategories,
  downloadProductCategory,
  deleteProductCategory,
  createProductCategory,
  updateProductCategory,
  downloadProductCategoryTemplate,
  importProductCategory
} from 'src/services/productServiceApi'

// Quasar 实例
const $q = useQuasar()

// 状态变量
const categories = ref([])
const loading = ref(false)
const parentOptions = ref([])
const totalCategories = ref(0)
// 搜索和过滤条件
const searchQuery = ref('')
const filterParent = ref(null)
const filterIsActive = ref(null)
const filterCode = ref('')
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
  parent: null,
  description: '',
  is_active: true
})

// 表单错误
const formErrors = reactive({
  name: '请输入分类名称',
  code: '请输入分类编码'
})

// 编辑模式标识
const isEditMode = ref(false)
const currentCategoryId = ref(null)

// 导入相关
const importResult = ref({})
const selectedFile = ref(null)
const importLoading = ref(false)
const importErrors = ref([])
const initClearExisting = ref(false) // 初始化是否清空现有数据
const initImportResult = ref(null) // 初始化导入结果

// 删除相关
const deletingCategory = ref({})

// 表格列配置
const columns = [
  { name: 'index', label: '序号', field: 'index', width: '80px', align: 'center', sortable: false },
  { name: 'name', label: '分类名称', field: 'name', sortable: true },
  { name: 'code', label: '分类编码', field: 'code', sortable: true },
  { name: 'parent_name', label: '父分类', field: row => row.parent_name || '-', sortable: false },
  { name: 'full_path', label: '完整路径', field: 'full_path' },
  { name: 'is_active', label: '状态', field: 'is_active', sortable: true },
  { name: 'description', label: '描述', field: 'description', sortable: false },
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
  fetchProductCategories()
  fetchParentOptions()
})

// 添加清除错误的方法
// 验证分类名称
const validateNameError = () => {
  if (!formData.name.trim() || formData.name.trim().length < 2 || formData.name.trim().length > 50) {
    formErrors.name = '分类名称不能为空且长度必须在2到50个字符之间'
  } else {
    formErrors.name = ''
  }
}

// 验证分类编码
const validateCodeError = () => {
  if (!formData.code.trim() || formData.code.trim().length < 2 || formData.code.trim().length > 50) {
    formErrors.code = '分类编码不能为空且长度必须在2到50个字符之间'
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

// 获取分类列表
const fetchProductCategories = async () => {
  try {
    loading.value = true

    // 构建查询参数
    const params = new URLSearchParams()
    params.append('page', pagination.value.page)
    params.append('page_size', pagination.value.rowsPerPage)

    // 排序参数 - 使用后端字段名
    if (pagination.value.sortBy) {
      const sortField = pagination.value.sortBy === 'parent_name'
        ? 'parent__name'
        : pagination.value.sortBy
      params.append('ordering', pagination.value.descending ? `-${sortField}` : sortField)
    }

    if (searchQuery.value) params.append('search', searchQuery.value)
    if (filterParent.value) params.append('parent__code', filterParent.value.code)
    if (filterIsActive.value !== null) params.append('is_active', filterIsActive.value)
    if (filterCode.value) params.append('code', filterCode.value)

    const response = await getProductCategories(params)

    categories.value = response.data.results.map(category => ({
      ...category,
      parent_name: category.parent_name || '-' // 处理父分类名称
    }))

    pagination.value.rowsNumber = response.data.count
    totalCategories.value = response.data.count
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: '获取分类列表失败: ' + (error.response?.data?.message || error.message)
    })
  } finally {
    loading.value = false
  }
}

// 获取父分类选项
const fetchParentOptions = async () => {
  try {
    const response = await getProductCategories({ is_active: true, parent__isnull: true })
    parentOptions.value = response.data.results
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: '获取父分类选项失败: ' + (error.response?.data?.message || error.message)
    })
  }
}

// 处理搜索
const handleSearch = () => {
  pagination.value.page = 1
  fetchProductCategories()
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
  fetchProductCategories()
}

// 打开编辑对话框
const openEditDialog = (category = null) => {
  // 重置表单
  Object.keys(formData).forEach(key => {
    formData[key] = key === 'is_active' ? true : ''
  })

  // 重置错误状态
  formErrors.name = ''
  formErrors.code = ''

  if (category) {
    // 编辑模式
    isEditMode.value = true
    currentCategoryId.value = category.id
    formData.name = category.name
    formData.code = category.code
    formData.parent = category.parent ? { id: category.parent, name: category.parent_name } : null
    formData.description = category.description || ''
    formData.is_active = category.is_active
  } else {
    // 新增模式
    isEditMode.value = false
    currentCategoryId.value = null
  }
  editDialogVisible.value = true
}

// 关闭编辑对话框
const closeEditDialog = () => {
  editDialogVisible.value = false
  // 重置表单验证
  editForm.value.resetValidation()
}

// 保存分类
const saveProductCategory = async () => {
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
      // 更新分类
      await updateProductCategory(currentCategoryId.value, {
        name: formData.name,
        code: formData.code.toUpperCase(),
        parent: formData.parent?.id || null,
        description: formData.description,
        is_active: formData.is_active
      })

      $q.notify({
        type: 'positive',
        message: '分类更新成功'
      })
    } else {
      // 创建新分类
      await createProductCategory({
        name: formData.name,
        code: formData.code.toUpperCase(),
        parent: formData.parent?.id || null,
        description: formData.description,
        is_active: formData.is_active
      })

      $q.notify({
        type: 'positive',
        message: '分类创建成功'
      })
    }

    closeEditDialog()
    fetchProductCategories()
    fetchParentOptions() // 刷新父分类选项
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: (isEditMode.value ? '更新' : '创建') + '分类失败: ' +
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
const confirmDelete = (category) => {
  deletingCategory.value = { ...category }
  deleteDialogVisible.value = true
}

// 删除分类（逻辑删除）
const handleDeleteProductCategory = async () => {
  try {
    loading.value = true

    // 逻辑删除：更新is_active状态
    await deleteProductCategory(deletingCategory.value.id)

    $q.notify({
      type: 'positive',
      message: `分类已${deletingCategory.value.is_active ? '禁用' : '启用'}`
    })
    deleteDialogVisible.value = false
    fetchProductCategories()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: '操作失败: ' + (error.data?.message || error.message)
    })
  } finally {
    loading.value = false
    deletingCategory.value = null
    deleteDialogVisible.value = false
  }
}

// 重置筛选条件
const resetFilters = () => {
  searchQuery.value = ''
  filterParent.value = null
  filterIsActive.value = null
  filterCode.value = ''
  pagination.value.page = 1
  fetchProductCategories()
}

// 导出分类数据
const exportProductCategories = async () => {
  try {
    loading.value = true
    const response = await downloadProductCategory()

    // 处理文件下载
    const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `商品分类_${format(new Date(), 'yyyyMMddHHmmss')}.xlsx`
    document.body.appendChild(a)
    a.click()
    URL.revokeObjectURL(url)
    document.body.removeChild(a)

    $q.notify({
      type: 'positive',
      message: '分类数据导出成功'
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
async function downloadInitTemplate() {
  try {
    const response = await downloadProductCategoryTemplate('init')
    handleFileDownload(response, '商品分类初始化导入模板.xlsx')
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
    const response = await downloadProductCategoryTemplate('normal')
    handleFileDownload(response, '商品分类增量导入模板.xlsx')
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
      message: '确定要清空所有分类数据吗？此操作将删除所有分类记录，且无法恢复！',
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

// 4. 分类初始化导入（核心功能）
async function handleInitImport() {
  if (!selectedFile.value) return

  try {
    importLoading.value = true
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    formData.append('clear_existing', initClearExisting.value) // 传递清空参数

    const response = await importProductCategory(formData, true) // 第二个参数标识初始化导入

    if (response.status === 200) {
      const result = response.data
      initImportResult.value = result
      importErrors.value = result.errors || []

      // 提示结果
      $q.notify({
        color: 'positive',
        message: `初始化成功！商品分类记录：${result.total_count}条`,
        position: 'top'
      })

      // 无错误则关闭弹窗并刷新
      if (result.error_count === 0) {
        setTimeout(() => {
          resetInitImportState()
          fetchProductCategories()
          fetchParentOptions()
        }, 1500)
      }
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '商品分类初始化失败',
      position: 'top'
    })
  } finally {
    importLoading.value = false
  }
}

// 5. 分类增量导入
async function handleNormalImport() {
  if (!selectedFile.value) return

  try {
    importLoading.value = true
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    formData.append('clear_existing', false) // 增量导入不清空

    const response = await importProductCategory(formData, false)
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
        fetchProductCategories()
        fetchParentOptions()
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
  exportExcel(exportData, `分类导入错误详情_${format(new Date(), 'yyyyMMddHHmmss')}.xlsx`)
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
