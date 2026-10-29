<template>
  <q-page class="q-px-md">
    <!-- 页面标题和操作按钮 -->
    <div class="col-12 flex justify-between items-center mb-6 flex-wrap gap-4">
      <div>
        <h5 class="text-h5 q-ma-none">工资标准管理</h5>
        <p class="text-grey text-subtitle2">管理所有工资标准信息</p>
      </div>
      <div class="flex gap-2 flex-wrap">
        <!-- 新增工资标准按钮 -->
        <q-btn color="primary" label="新增工资标准" @click="openFormDialog('add')" />
        <!-- 工资标准导入 -->
        <q-btn-dropdown color="secondary" label="工资标准导入" icon="upload">
          <q-list>
            <q-item clickable v-close-popup @click="openImportDialog('init')">
              <q-item-section avatar>
                <q-icon name="database" />
              </q-item-section>
              <q-item-section>
                <q-item-label>初始导入</q-item-label>
                <q-item-label caption>覆盖现有数据</q-item-label>
              </q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="openImportDialog('normal')">
              <q-item-section avatar>
                <q-icon name="playlist_add" />
              </q-item-section>
              <q-item-section>
                <q-item-label>普通导入</q-item-label>
                <q-item-label caption>新增或更新数据</q-item-label>
              </q-item-section>
            </q-item>
            <q-separator />
            <q-item clickable v-close-popup @click="downloadInitTemplate">
              <q-item-section avatar>
                <q-icon name="file_download" />
              </q-item-section>
              <q-item-section>
                <q-item-label>下载初始模板</q-item-label>
              </q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="downloadNormalTemplate">
              <q-item-section avatar>
                <q-icon name="file_download" />
              </q-item-section>
              <q-item-section>
                <q-item-label>下载普通模板</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
        <!-- 导出工资标准 -->
        <q-btn-dropdown color="primary" label="导出工资标准" icon="download">
          <q-list>
            <q-item clickable v-close-popup @click="handleExportSalaryGrades('all')">
              <q-item-section avatar>
                <q-icon name="file_download" />
              </q-item-section>
              <q-item-section>
                <q-item-label>导出全部</q-item-label>
                <q-item-label caption>导出所有工资标准记录</q-item-label>
              </q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="handleExportSalaryGrades('filtered')">
              <q-item-section avatar>
                <q-icon name="filter_alt" />
              </q-item-section>
              <q-item-section>
                <q-item-label>导出筛选结果</q-item-label>
                <q-item-label caption>仅导出当前筛选结果</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </div>
    </div>

    <!-- 工资标准记录列表 -->
    <div class="col-12 bg-white rounded-borders shadow-sm">
      <q-table :rows="salaryGrades" :columns="columns" v-model:pagination="pagination"
        :rows-per-page-options="[10, 20, 30, 50, 100]" @request="onRequest" row-key="id" :loading="tableLoading">
        <!-- 序号显示模板 -->
        <template #body-cell-index="props">
          <q-td :props="props">
            <div>{{ (pagination.page - 1) * pagination.rowsPerPage + props.rowIndex + 1 }}</div>
          </q-td>
        </template>

        <template #body-cell-actions="props">
          <q-td :props="props">
            <q-btn size="sm" color="info" icon="visibility" class="q-mr-1" @click="viewSalaryGradeDetail(props.row)"
              label="查看" />
            <q-btn size="sm" color="accent" icon="edit" @click="editSalaryGrade(props.row)" label="编辑" />
            <q-btn size="sm" color="warning" icon="delete" @click="handleDeleteSalaryGrade(props.row)" label="删除" />
          </q-td>
        </template>

        <template #loading>
          <div class="row items-center justify-center q-pa-md">
            <q-spinner size="40px" color="primary" />
            <span class="q-ml-md text-subtitle1">加载工资标准记录中...</span>
          </div>
        </template>
      </q-table>
    </div>

    <!-- 查看记录详情弹窗 -->
    <q-dialog v-model="isDetailDialogOpen" persistent>
      <q-card style="width: 500px;">
        <q-card-section>
          <div class="row items-center justify-between">
            <h5 class="text-h5">工资标准详情</h5>
            <q-btn icon="close" flat round @click="isDetailDialogOpen = false" />
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pt-none">
          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">工资标准名称:</div>
            <div class="col-8">{{ salaryGradeDetail.salary_name || '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">工资等级:</div>
            <div class="col-8">{{ salaryGradeDetail.salary_grade || '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">工资级差:</div>
            <div class="col-8">{{ salaryGradeDetail.salary_step || '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">基本工资:</div>
            <div class="col-8">{{ salaryGradeDetail.basic_salary || '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">创建时间:</div>
            <div class="col-8">{{ salaryGradeDetail.created_at ? formatDate(salaryGradeDetail.created_at) : '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">创建人:</div>
            <div class="col-8">{{ salaryGradeDetail.created_by_name || '-' }}</div>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn label="关闭" color="primary" @click="isDetailDialogOpen = false" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="isDeleteDialogOpen">
      <q-card>
        <q-card-section>
          <div class="row items-center justify-between">
            <h5 class="text-h5">确认删除</h5>
            <q-btn icon="close" flat round @click="isDeleteDialogOpen = false" />
          </div>
        </q-card-section>
        <q-card-section>
          <p>确定要删除工资标准 {{ currentSalaryGrade.salary_name }} 吗？</p>
          <div class="q-mt-sm">
            <q-radio v-model="isSoftDelete" val="true" label="软删除" class="q-mr-md" />
            <q-radio v-model="isSoftDelete" val="false" label="硬删除" />
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn label="取消" @click="isDeleteDialogOpen = false" color="secondary" />
          <q-btn label="删除" @click="confirmDeleteSalaryGrade" color="warning" class="text-blue" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 新增/编辑表单对话框 -->
    <q-dialog v-model="isFormDialogOpen">
      <q-card style="width: 500px;">
        <q-card-section>
          <div class="row items-center justify-between">
            <h5 class="text-h5">{{ formMode === 'add' ? '新增工资标准' : '编辑工资标准' }}</h5>
            <q-btn icon="close" flat round @click="isFormDialogOpen = false" />
          </div>
        </q-card-section>
        <q-card-section>
          <q-form @submit="handleSubmit">
            <div class="row q-col-gutter-md">
              <div class="col-12">
                <q-input v-model="currentSalaryGrade.salary_name" label="工资标准名称" dense outlined
                  :rules="[val => !!val || '工资标准名称不能为空']" />
              </div>

              <div class="col-12">
                <q-input v-model="currentSalaryGrade.salary_grade" label="工资等级" dense outlined
                  :rules="[val => !!val || '工资等级不能为空']" />
              </div>

              <div class="col-12">
                <q-input v-model="currentSalaryGrade.salary_step" label="工资级差" dense outlined
                  :rules="[val => !!val || '工资级差不能为空']" />
              </div>

              <div class="col-12">
                <q-input v-model="currentSalaryGrade.basic_salary" label="基本工资" dense outlined type="number"
                  :rules="[val => val !== null && val !== '' || '基本工资不能为空']" />
              </div>
            </div>

            <q-card-actions align="right" class="q-pt-md">
              <q-btn label="取消" @click="isFormDialogOpen = false" color="secondary" />
              <q-btn label="保存" type="submit" color="primary" class="q-ml-sm" />
            </q-card-actions>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- 1. 初始化导入弹窗（新增） -->
    <q-dialog v-model="showInitImportDialog" max-width="700px">
      <q-card>
        <q-card-section class="row items-center justify-between">
          <h5 class="text-h5 text-negative">⚠️ 工资标准初始化导入</h5>
          <q-btn icon="close" flat round @click="closeImportDialogs" />
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
                <li>1. 初始化导入将<span class="font-medium text-negative">覆盖现有工资标准数据</span>，适用于系统首次上线或全量数据重置</li>
                <li>2. 若勾选"清空现有数据"，将删除所有工资标准记录及变动记录，<span class="font-medium text-negative">操作不可撤销</span></li>
                <li>3. 请确保导入文件包含"工资标准名称、工资等级、工资级差、基本工资"等必填字段（建议先下载模板）</li>
              </ul>
            </div>

            <!-- 模板下载 -->
            <div class="flex justify-between items-center">
              <p class="text-sm">请下载模板并按格式填写数据</p>
              <q-btn label="下载工资标准初始化模板" color="secondary" icon="file_download" size="sm"
                @click="downloadInitTemplate" />
            </div>

            <!-- 文件上传 -->
            <q-uploader label="选择工资标准初始化文件（仅支持.xlsx/.xls）" accept=".xlsx, .xls" :max-files="1"
              @added="handleFileSelected" @remove="() => { selectedFile = null; importErrors = []; }" dense
              class="mt-2">
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
              <q-checkbox v-model="initClearExisting" label="清空现有工资标准数据" color="negative"
                @update:model-value="handleClearConfirm" />
            </div>

            <!-- 导入结果/错误展示 -->
            <div v-if="importErrors.length > 0" class="mt-4">
              <h6 class="text-negative text-sm font-medium">导入失败记录（共{{ importErrors.length }}条）</h6>
              <div class="bg-white border border-gray-200 rounded mt-2 max-h-60 overflow-auto">
                <q-table :rows="importErrors" :columns="importErrorColumns" row-key="row" dense hide-header flat />
              </div>
              <q-btn label="下载工资标准错误详情" color="negative" size="sm" class="mt-2" @click="downloadImportErrors" dense />
            </div>

            <!-- 初始化成功统计 -->
            <div v-if="importResult" class="mt-4 bg-positive/10 p-3 rounded">
              <h6 class="text-positive font-medium">工资标准初始化导入成功</h6>
              <ul class="text-sm mt-2 space-y-1">
                <li>成功创建工资标准记录：{{ importResult.salary_grade_success_count }} 条</li>
                <li>失败记录：{{ importResult.error_count }} 条</li>
              </ul>
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md">
          <q-btn label="取消" color="secondary" @click="resetInitImportState" />
          <q-btn label="开始工资标准初始化" color="negative" class="ml-2" @click="handleImport"
            :disable="!selectedFile || importLoading" :loading="importLoading" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 2. 普通导入弹窗（保留原功能，区分初始化） -->
    <q-dialog v-model="showNormalImportDialog" max-width="700px">
      <q-card>
        <q-card-section class="row items-center justify-between">
          <h5 class="text-h5">普通工资标准导入</h5>
          <q-btn icon="close" flat round @click="closeImportDialogs" />
        </q-card-section>
        <q-card-section class="q-pa-md">
          <div class="space-y-4">
            <p class="text-sm">普通工资标准导入仅新增/更新工资标准记录，不删除现有数据，适用于日常批量更新</p>
            <div class="flex justify-between items-center">
              <p class="text-sm">请下载模板并按格式填写数据</p>
              <q-btn label="下载普通工资标准导入模板" color="secondary" icon="file_download" size="sm"
                @click="downloadNormalTemplate" />
            </div>
            <q-uploader label="选择工资标准普通导入文件（仅支持.xlsx/.xls）" accept=".xlsx, .xls" :max-files="1"
              @added="handleFileSelected" @remove-file="() => { selectedFile = null; importErrors = []; }" dense />
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
          <q-btn label="开始工资标准普通导入" color="primary" class="ml-2" @click="handleImport"
            :disable="!selectedFile || importLoading" :loading="importLoading" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useQuasar } from 'quasar'
import { format, parseISO } from 'date-fns'

import { exportExcel } from 'src/utils/excel-utils'
// 添加防抖计时器引用
let filterTimer = null

// API导入 - 修改为工资标准相关接口
import {
  getSalaryGrades,
  getSalaryGradeDetail,
  createSalaryGrade,
  updateSalaryGrade,
  deleteSalaryGrade,
  softDeleteSalaryGrade,
  exportSalaryGrades,
  importSalaryGrades,
  downloadSalaryGradeTemplate,
  fileUtils
} from 'src/services/employeeServiceApi'

// 初始化Quasar
const $q = useQuasar()

// -------------------------- 基础状态变量 --------------------------
const salaryGrades = ref([])
const tableLoading = ref(false)
const isDetailDialogOpen = ref(false)
const isDeleteDialogOpen = ref(false)
const isFormDialogOpen = ref(false)
const formMode = ref('add')

// -------------------------- 分页 --------------------------
const pagination = ref({
  page: 1,
  rowsPerPage: 10,
  sortBy: 'id',
  descending: true,
  rowsNumber: 0
})

// -------------------------- 数据模型 --------------------------
const currentSalaryGrade = ref({
  id: null,
  salary_name: '',
  salary_grade: '',
  salary_step: '',
  basic_salary: null
})

const salaryGradeDetail = ref({})

// -------------------------- 删除选项 --------------------------
const isSoftDelete = ref('true')

// -------------------------- 表格配置 --------------------------
const columns = ref([
  { name: 'index', label: '序号', field: '', align: 'left', sortable: true, width: '80px' },
  { name: 'salary_name', label: '工资标准名称', field: 'salary_name', align: 'left', sortable: true },
  { name: 'salary_grade', label: '工资等级', field: 'salary_grade', align: 'left', sortable: true },
  { name: 'salary_step', label: '工资级差', field: 'salary_step', align: 'left', sortable: true },
  { name: 'basic_salary', label: '基本工资', field: 'basic_salary', align: 'left', sortable: true },
  { name: 'created_at', label: '创建时间', field: 'created_at', align: 'left', sortable: true, format: formatDate },
  { name: 'created_by_name', label: '创建人', field: 'created_by_name', align: 'left', sortable: true },
  { name: 'actions', label: '操作', field: 'actions', align: 'center', width: '180px' }
])

// 导入错误表格列
const importErrorColumns = ref([
  { name: 'row', label: '行号', field: 'row', width: '80px' },
  { name: 'data', label: '数据', field: 'data', format: (val) => JSON.stringify(val).slice(0, 50) + '...' },
  { name: 'error', label: '错误原因', field: 'error' }
])

// -------------------------- 工具函数 --------------------------
// 日期格式化
function formatDate(dateString) {
  if (!dateString) return ''
  return format(parseISO(dateString), 'yyyy-MM-dd HH:mm')
}

// -------------------------- 操作方法 --------------------------
const openFormDialog = (mode, salaryGrade = null) => {
  formMode.value = mode
  isFormDialogOpen.value = true

  if (mode === 'edit' && salaryGrade) {
    currentSalaryGrade.value = { ...salaryGrade }
  } else {
    // 重置为默认值
    currentSalaryGrade.value = {
      id: null,
      salary_name: '',
      salary_grade: '',
      salary_step: '',
      basic_salary: null
    }
  }
}

// -------------------------- 数据加载函数 --------------------------
// 构建参数
function buildParams() {
  const params = new URLSearchParams()

  // 分页参数
  params.append('page', pagination.value.page)
  params.append('page_size', pagination.value.rowsPerPage)

  // 排序参数
  if (pagination.value.sortBy) {
    const order = pagination.value.descending ? `-${pagination.value.sortBy}` : pagination.value.sortBy
    params.append('ordering', order)
  }

  return params
}

// 获取工资标准列表
const fetchSalaryGrades = async () => {
  try {
    tableLoading.value = true
    const params = buildParams()
    const response = await getSalaryGrades(params)

    if (response.status === 200) {
      salaryGrades.value = response.data.results
      pagination.value.rowsNumber = response.data.count
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '获取工资标准失败',
      position: 'top'
    })
  } finally {
    tableLoading.value = false
  }
}

const viewSalaryGradeDetail = async (salaryGrade) => {
  isDetailDialogOpen.value = true
  try {
    const response = await getSalaryGradeDetail(salaryGrade.id)
    if (response.status === 200) {
      salaryGradeDetail.value = response.data
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '获取工资标准详情失败',
      position: 'top'
    })
  }
}

// -------------------------- 新增/编辑处理 --------------------------
// 表单验证
const validateForm = () => {
  if (!currentSalaryGrade.value.salary_name?.trim()) {
    $q.notify({
      color: 'negative',
      message: '请输入工资标准名称',
      position: 'top'
    })
    return false
  }

  if (!currentSalaryGrade.value.salary_grade?.trim()) {
    $q.notify({
      color: 'negative',
      message: '请输入工资等级',
      position: 'top'
    })
    return false
  }

  if (!currentSalaryGrade.value.salary_step?.trim()) {
    $q.notify({
      color: 'negative',
      message: '请输入工资级差',
      position: 'top'
    })
    return false
  }

  if (currentSalaryGrade.value.basic_salary === null || currentSalaryGrade.value.basic_salary === '') {
    $q.notify({
      color: 'negative',
      message: '请输入基本工资',
      position: 'top'
    })
    return false
  }

  return true
}

// 处理表单提交
const handleSubmit = async () => {
  if (!validateForm()) return

  try {
    if (formMode.value === 'add') {
      await handleAddSalaryGrade()
    } else if (formMode.value === 'edit') {
      await handleEditSalaryGrade(currentSalaryGrade.value.id)
    }
  } finally {
    isFormDialogOpen.value = false
  }
}

// 添加工资标准
const handleAddSalaryGrade = async () => {
  try {
    const formData = {
      salary_name: currentSalaryGrade.value.salary_name,
      salary_grade: currentSalaryGrade.value.salary_grade,
      salary_step: currentSalaryGrade.value.salary_step,
      basic_salary: parseFloat(currentSalaryGrade.value.basic_salary)
    }
    const response = await createSalaryGrade(formData)
    if (response.status === 201) {
      $q.notify({
        color: 'positive',
        message: '添加工资标准成功',
        position: 'top'
      })
      fetchSalaryGrades()
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '添加工资标准失败',
      position: 'top'
    })
  }
}

// 编辑工资标准
const editSalaryGrade = async (salaryGrade) => {
  formMode.value = 'edit'
  isFormDialogOpen.value = true
  try {
    const response = await getSalaryGradeDetail(salaryGrade.id)
    if (response.status === 200) {
      currentSalaryGrade.value = response.data
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '获取工资标准详情失败',
      position: 'top'
    })
  }
}

// 更新工资标准
const handleEditSalaryGrade = async (salaryGradeId) => {
  try {
    const formData = {
      salary_name: currentSalaryGrade.value.salary_name,
      salary_grade: currentSalaryGrade.value.salary_grade,
      salary_step: currentSalaryGrade.value.salary_step,
      basic_salary: parseFloat(currentSalaryGrade.value.basic_salary)
    }

    const response = await updateSalaryGrade(salaryGradeId, formData)
    if (response.status === 200) {
      $q.notify({
        color: 'positive',
        message: '更新工资标准成功',
        position: 'top'
      })
      fetchSalaryGrades()
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '更新工资标准失败',
      position: 'top'
    })
  }
}

// -------------------------- 删除处理 --------------------------
const handleDeleteSalaryGrade = async (salaryGrade) => {
  currentSalaryGrade.value.id = salaryGrade.id
  currentSalaryGrade.value.salary_name = salaryGrade.salary_name
  isDeleteDialogOpen.value = true
}

// 确认删除工资标准
const confirmDeleteSalaryGrade = async () => {
  try {
    const deleteMode = isSoftDelete.value === 'true'
    let response
    if (deleteMode) {
      response = await softDeleteSalaryGrade(currentSalaryGrade.value.id)
    } else {
      response = await deleteSalaryGrade(currentSalaryGrade.value.id)
    }
    if (response.status === 204) {
      $q.notify({
        color: 'positive',
        message: deleteMode ? '软删除成功' : '硬删除成功',
        position: 'top'
      })
      fetchSalaryGrades()
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '删除工资标准失败',
      position: 'top'
    })
  } finally {
    isDeleteDialogOpen.value = false
  }
}

// -------------------------- 分页处理 --------------------------
// 表格排序/分页请求
function onRequest(props) {
  const { page, rowsPerPage, sortBy, descending } = props.pagination

  pagination.value.page = page
  pagination.value.rowsPerPage = rowsPerPage
  pagination.value.sortBy = sortBy
  pagination.value.descending = descending

  fetchSalaryGrades()
}

// -------------------------- 导入导出功能 --------------------------
// 导入相关状态
const showInitImportDialog = ref(false)
const showNormalImportDialog = ref(false)
const selectedFile = ref(null)
const importLoading = ref(false)
const importErrors = ref([])
const initClearExisting = ref(false)
const importResult = ref(null)

// 1. 模板下载 - 使用优化后的接口参数传递方式
async function downloadInitTemplate() {
  try {
    const response = await downloadSalaryGradeTemplate({ template_type: 'init' })
    fileUtils.downloadBlob(response.data, '工资标准初始化导入模板.xlsx')
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
    const response = await downloadSalaryGradeTemplate({ template_type: 'normal' })
    fileUtils.downloadBlob(response.data, '工资标准普通导入模板.xlsx')
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '普通导入模板下载失败',
      position: 'top'
    })
  }
}

// 2. 文件选择处理
function handleFileSelected(files) {
  if (files && files.length > 0) {
    selectedFile.value = files[0]
    importErrors.value = []
    importResult.value = null
  }
}

// 3. 初始化导入确认
async function handleClearConfirm(checked) {
  if (checked) {
    $q.dialog({
      title: '危险操作确认',
      message: '确定要清空所有工资标准数据吗？此操作将删除所有工资标准记录，且无法恢复！',
      color: 'negative',
      persistent: true,
      ok: { label: '确认清空', color: 'negative' },
      cancel: { label: '取消', color: 'secondary' }
    }).onOk(() => {
      // 用户确认，保持勾选状态
    }).onCancel(() => {
      initClearExisting.value = false
    })
  }
}

// 4. 导入处理 - 使用优化后的接口参数传递方式
async function handleImport() {
  if (!selectedFile.value) {
    $q.notify({
      color: 'negative',
      message: '请选择要导入的文件',
      position: 'top'
    })
    return
  }

  try {
    importLoading.value = true

    // 根据当前打开的对话框确定导入类型
    let additionalParams = {}
    if (showInitImportDialog.value) {
      additionalParams = { clear_existing: initClearExisting.value }
    }

    // 使用优化后的接口参数传递方式
    const response = await importSalaryGrades(selectedFile.value, additionalParams)

    if (response.status === 200 || response.status === 201) {
      const result = response.data
      importResult.value = result
      importErrors.value = result.errors || []

      if (result.error_count === 0) {
        $q.notify({
          color: 'positive',
          message: '导入成功',
          position: 'top'
        })
        closeImportDialogs()
        fetchSalaryGrades()
      } else {
        $q.notify({
          color: 'warning',
          message: `导入完成，${result.error_count} 条数据导入失败`,
          position: 'top'
        })
      }
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '导入失败',
      position: 'top'
    })
  } finally {
    importLoading.value = false
  }
}

// 打开导入对话框
function openImportDialog(type) {
  if (type === 'init') {
    showInitImportDialog.value = true
    showNormalImportDialog.value = false
  } else {
    showNormalImportDialog.value = true
    showInitImportDialog.value = false
  }

  // 重置状态
  selectedFile.value = null
  importErrors.value = []
  importResult.value = null
}

// 关闭导入对话框
function closeImportDialogs() {
  showInitImportDialog.value = false
  showNormalImportDialog.value = false
  selectedFile.value = null
  importErrors.value = []
  importResult.value = null
}

// 5. 重置导入状态
const resetInitImportState = () => {
  closeImportDialogs()
  selectedFile.value = null
  importErrors.value = []
  importResult.value = null
}

// 6. 导出处理 - 使用优化后的接口参数传递方式
async function handleExportSalaryGrades(exportType = 'all') {
  try {
    tableLoading.value = true

    // 构建导出参数
    let params = {}

    // 如果是导出筛选结果，则使用当前筛选条件
    if (exportType === 'filtered') {
      // 在此组件中没有筛选条件，但保持一致性
      params.include_inactive = true
    } else {
      params.include_inactive = true
    }

    // 使用优化后的接口参数传递方式
    const response = await exportSalaryGrades(params)

    // 使用优化后的文件工具函数处理下载
    fileUtils.downloadBlob(
      response.data,
      `工资标准_${format(new Date(), 'yyyyMMddHHmmss')}.xlsx`
    )

  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '导出工资标准失败',
      position: 'top'
    })
  } finally {
    tableLoading.value = false
  }
}

// 7. 下载导入错误详情
function downloadImportErrors() {
  if (importErrors.value.length === 0) return

  // 转换错误数据为Excel格式
  const exportData = importErrors.value.map(err => ({
    '行号': err.row,
    '错误原因': err.error,
    '原始数据': JSON.stringify(err.data)
  }))

  exportExcel(exportData, `工资标准导入错误详情_${format(new Date(), 'yyyyMMddHHmmss')}.xlsx`)
}

// -------------------------- 页面初始化 --------------------------
onMounted(() => {
  fetchSalaryGrades()
})

onUnmounted(() => {
  if (filterTimer) {
    clearTimeout(filterTimer)
  }
})
</script>

<style scoped></style>
