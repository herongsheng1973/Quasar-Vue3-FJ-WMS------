<template>
  <q-page class="q-px-md">
    <!-- 页面标题和操作按钮 -->
    <div class="col-12 flex justify-between items-center mb-6 flex-wrap gap-4">
      <div>
        <h5 class="text-h5 q-ma-none">员工薪资信息管理</h5>
        <p class="text-grey text-subtitle2">管理员工薪资相关信息</p>
      </div>
      <div class="flex gap-2 flex-wrap">
        <!-- 新增薪资信息按钮 -->
        <q-btn color="primary" label="新增薪资信息" @click="openFormDialog('add')" />
        <!-- 薪资信息导入 -->
        <q-btn-dropdown color="secondary" label="薪资信息导入" icon="upload">
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
        <!-- 导出薪资信息 -->
        <q-btn-dropdown color="primary" label="导出薪资信息" icon="download">
          <q-list>
            <q-item clickable v-close-popup @click="handleExportEmployeeSalaryInfos('all')">
              <q-item-section avatar>
                <q-icon name="file_download" />
              </q-item-section>
              <q-item-section>
                <q-item-label>导出全部</q-item-label>
                <q-item-label caption>导出所有薪资信息记录</q-item-label>
              </q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="handleExportEmployeeSalaryInfos('filtered')">
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

    <!-- 筛选条件 -->
    <div class="col-12 q-pa-md bg-white rounded-borders shadow-sm mb-6">
      <q-form @submit="applyFilters">
        <div class="row q-col-gutter-md">
          <div class="col-md-3 col-sm-6 col-xs-12">
            <q-input v-model="filters.searchQuery" label="搜索员工姓名/WBC" emit-value map-options clearable
              @update:model-value="handleFilterChange" dense />
          </div>

          <div class="col-md-3 col-sm-6 col-xs-12">
            <q-select v-model="filters.employee" label="员工" :options="employeeOptions" option-label="employee_name"
              option-value="id" emit-value map-options clearable dense />
          </div>

          <div class="col-md-3 col-sm-6 col-xs-12">
            <q-select v-model="filters.salaryGrade" label="工资等级" :options="salaryGradeOptions" option-label="label"
              option-value="value" emit-value map-options clearable dense />
          </div>

          <div class="col-md-3 col-sm-3 col-xs-12">
            <div class="row q-col-gutter-sm justify-end">
              <div class="col-auto">
                <q-btn label="重置筛选" color="secondary" @click="resetFilters" class="full-width" unelevated />
              </div>
              <div class="col-auto">
                <q-btn label="应用筛选" color="primary" type="submit" class="full-width" unelevated />
              </div>
            </div>
          </div>
        </div>
      </q-form>
    </div>

    <!-- 薪资信息记录列表 -->
    <div class="col-12 bg-white rounded-borders shadow-sm">
      <q-table :rows="employeeSalaryInfos" :columns="columns" v-model:pagination="pagination"
        :rows-per-page-options="[10, 20, 30, 50, 100]" :filter="filters" @request="onRequest" row-key="id"
        :loading="tableLoading">
        <!-- 序号显示模板 -->
        <template #body-cell-index="props">
          <q-td :props="props">
            <div>{{ (pagination.page - 1) * pagination.rowsPerPage + props.rowIndex + 1 }}</div>
          </q-td>
        </template>

        <!-- 员工信息 -->
        <template #body-cell-employee="props">
          <q-td :props="props">
            <div>{{ props.row.employee_name }}({{ props.row.employee_wbc }})</div>
          </q-td>
        </template>

        <!-- 工资等级 -->
        <template #body-cell-salary_grade="props">
          <q-td :props="props">
            <q-badge :color="getSalaryGradeColor(props.row.salary_grade)" :label="props.row.salary_grade || '-'" />
          </q-td>
        </template>

        <!-- 操作按钮 -->
        <template #body-cell-actions="props">
          <q-td :props="props">
            <q-btn size="sm" color="info" icon="visibility" class="q-mr-1"
              @click="viewEmployeeSalaryInfoDetail(props.row)" label="查看" />
            <q-btn size="sm" color="accent" icon="edit" @click="editEmployeeSalaryInfo(props.row)" label="编辑" />
            <q-btn size="sm" color="warning" icon="delete" @click="handleDeleteEmployeeSalaryInfo(props.row)"
              label="删除" />
          </q-td>
        </template>

        <template #loading>
          <div class="row items-center justify-center q-pa-md">
            <q-spinner size="40px" color="primary" />
            <span class="q-ml-md text-subtitle1">加载薪资信息记录中...</span>
          </div>
        </template>
      </q-table>
    </div>

    <!-- 查看记录详情弹窗 -->
    <q-dialog v-model="isDetailDialogOpen" persistent>
      <q-card style="width: 700px; max-width: 90vw;">
        <q-card-section>
          <div class="row items-center justify-between">
            <h5 class="text-h5">薪资信息详情</h5>
            <q-btn icon="close" flat round @click="isDetailDialogOpen = false" />
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pt-none">
          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">员工:</div>
            <div class="col-8">{{ employeeSalaryInfoDetail.employee_detail?.employee_name }}({{
              employeeSalaryInfoDetail.employee_detail?.wbc }})</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">所属机构:</div>
            <div class="col-8">{{ employeeSalaryInfoDetail.employee_detail?.division || '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">所属部门:</div>
            <div class="col-8">{{ employeeSalaryInfoDetail.employee_detail?.department || '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">岗位:</div>
            <div class="col-8">{{ employeeSalaryInfoDetail.employee_detail?.position || '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">工资等级:</div>
            <div class="col-8">{{ employeeSalaryInfoDetail.salary_grade || '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">工资岗级:</div>
            <div class="col-8">{{ employeeSalaryInfoDetail.salary_level || '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">基本工资:</div>
            <div class="col-8">{{ employeeSalaryInfoDetail.salary_rate || '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">安保补贴金额:</div>
            <div class="col-8">{{ employeeSalaryInfoDetail.security_allowance || '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">其他补贴金额:</div>
            <div class="col-8">{{ employeeSalaryInfoDetail.other_allowance || '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">总补贴金额:</div>
            <div class="col-8">{{ employeeSalaryInfoDetail.total_allowance || '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">扣除养老保险金额:</div>
            <div class="col-8">{{ employeeSalaryInfoDetail.EOBI_deduction || '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">其他扣除金额:</div>
            <div class="col-8">{{ employeeSalaryInfoDetail.other_deduction || '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">差旅补贴:</div>
            <div class="col-8">{{ employeeSalaryInfoDetail.travelling_allowance || '-' }}</div>
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
          <p>确定要删除 {{ currentEmployeeSalaryInfo.employee_name }} 的薪资信息吗？</p>
          <div class="q-mt-sm">
            <q-radio v-model="isSoftDelete" val="true" label="软删除" class="q-mr-md" />
            <q-radio v-model="isSoftDelete" val="false" label="硬删除" />
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn label="取消" @click="isDeleteDialogOpen = false" color="secondary" />
          <q-btn label="删除" @click="confirmDeleteEmployeeSalaryInfo" color="warning" class="text-blue" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 新增/编辑表单对话框 -->
    <q-dialog v-model="isFormDialogOpen">
      <q-card style="width: 700px; max-width: 90vw;">
        <q-card-section>
          <div class="row items-center justify-between">
            <h5 class="text-h5">{{ formMode === 'add' ? '新增薪资信息' : '编辑薪资信息' }}</h5>
            <q-btn icon="close" flat round @click="isFormDialogOpen = false" />
          </div>
        </q-card-section>
        <q-card-section>
          <q-form @submit="handleSubmit">
            <div class="row q-col-gutter-md">
              <div class="col-12">
                <q-select v-model="currentEmployeeSalaryInfo.employee" label="员工 *" :options="employeeOptions"
                  option-label="employee_name" option-value="id" map-options emit-value clearable dense outlined
                  :rules="[val => !!val || '请选择员工']" />
              </div>

              <div class="col-6">
                <q-select v-model="currentEmployeeSalaryInfo.salary_grade" label="工资等级" :options="salaryGradeOptions"
                  option-label="label" option-value="value" map-options emit-value clearable dense outlined />
              </div>

              <div class="col-6">
                <q-input v-model.number="currentEmployeeSalaryInfo.salary_level" label="工资岗级" dense outlined
                  type="number" />
              </div>

              <div class="col-6">
                <q-input v-model.number="currentEmployeeSalaryInfo.salary_rate" label="基本工资 *" dense outlined
                  type="number" :rules="[val => val !== null && val !== '' || '请输入基本工资']" />
              </div>

              <div class="col-6">
                <q-input v-model.number="currentEmployeeSalaryInfo.security_allowance" label="安保补贴金额" dense outlined
                  type="number" />
              </div>

              <div class="col-6">
                <q-input v-model.number="currentEmployeeSalaryInfo.other_allowance" label="其他补贴金额" dense outlined
                  type="number" />
              </div>

              <div class="col-6">
                <q-input v-model.number="currentEmployeeSalaryInfo.EOBI_deduction" label="扣除养老保险金额" dense outlined
                  type="number" />
              </div>

              <div class="col-6">
                <q-input v-model.number="currentEmployeeSalaryInfo.other_deduction" label="其他扣除金额" dense outlined
                  type="number" />
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

    <!-- 1. 薪资信息初始化导入弹窗 -->
    <q-dialog v-model="showInitImportDialog" max-width="700px">
      <q-card>
        <q-card-section class="row items-center justify-between">
          <h5 class="text-h5 text-negative">⚠️ 薪资信息初始化导入</h5>
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
                <li>1. 初始化导入将<span class="font-medium text-negative">覆盖现有薪资信息数据</span>，适用于系统首次上线或全量数据重置</li>
                <li>2. 若勾选"清空现有数据"，将删除所有薪资信息记录，<span class="font-medium text-negative">操作不可撤销</span></li>
                <li>3. 请确保导入文件包含必要字段（建议先下载模板）</li>
              </ul>
            </div>

            <!-- 模板下载 -->
            <div class="flex justify-between items-center">
              <p class="text-sm">请下载模板并按格式填写数据</p>
              <q-btn label="下载薪资信息初始化模板" color="secondary" icon="file_download" size="sm"
                @click="downloadInitTemplate" />
            </div>

            <!-- 文件上传 -->
            <q-uploader label="选择薪资信息初始化文件（仅支持.xlsx/.xls）" accept=".xlsx, .xls" :max-files="1"
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
              <q-checkbox v-model="initClearExisting" label="清空现有薪资信息数据" color="negative"
                @update:model-value="handleClearConfirm" />
            </div>

            <!-- 导入结果/错误展示 -->
            <div v-if="importErrors.length > 0" class="mt-4">
              <h6 class="text-negative text-sm font-medium">导入失败记录（共{{ importErrors.length }}条）</h6>
              <div class="bg-white border border-gray-200 rounded mt-2 max-h-60 overflow-auto">
                <q-table :rows="importErrors" :columns="importErrorColumns" row-key="row" dense hide-header flat />
              </div>
              <q-btn label="下载薪资信息错误详情" color="negative" size="sm" class="mt-2" @click="downloadImportErrors" dense />
            </div>

            <!-- 初始化成功统计 -->
            <div v-if="importResult" class="mt-4 bg-positive/10 p-3 rounded">
              <h6 class="text-positive font-medium">薪资信息初始化导入成功</h6>
              <ul class="text-sm mt-2 space-y-1">
                <li>成功创建薪资信息记录：{{ importResult.salary_info_success_count }} 条</li>
                <li>失败记录：{{ importResult.error_count }} 条</li>
              </ul>
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md">
          <q-btn label="取消" color="secondary" @click="resetInitImportState" />
          <q-btn label="开始薪资信息初始化" color="negative" class="ml-2" @click="handleImport"
            :disable="!selectedFile || importLoading" :loading="importLoading" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 2. 普通导入弹窗 -->
    <q-dialog v-model="showNormalImportDialog" max-width="700px">
      <q-card>
        <q-card-section class="row items-center justify-between">
          <h5 class="text-h5">普通薪资信息导入</h5>
          <q-btn icon="close" flat round @click="closeImportDialogs" />
        </q-card-section>
        <q-card-section class="q-pa-md">
          <div class="space-y-4">
            <p class="text-sm">普通薪资信息导入仅新增/更新薪资信息记录，不删除现有数据，适用于日常批量更新</p>
            <div class="flex justify-between items-center">
              <p class="text-sm">请下载模板并按格式填写数据</p>
              <q-btn label="下载普通薪资信息导入模板" color="secondary" icon="file_download" size="sm"
                @click="downloadNormalTemplate" />
            </div>
            <q-uploader label="选择薪资信息普通导入文件（仅支持.xlsx/.xls）" accept=".xlsx, .xls" :max-files="1"
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
          <q-btn label="开始薪资信息普通导入" color="primary" class="ml-2" @click="handleImport"
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

// API导入
import {
  getEmployeeSalaryInfos,
  getEmployeeSalaryInfoDetail,
  createEmployeeSalaryInfo,
  updateEmployeeSalaryInfo,
  deleteEmployeeSalaryInfo,
  softDeleteEmployeeSalaryInfo,
  exportEmployeeSalaryInfos,
  importEmployeeSalaryInfos,
  downloadEmployeeSalaryInfoTemplate,
  getEmployees,
  fileUtils
} from 'src/services/employeeServiceApi'

// 初始化Quasar
const $q = useQuasar()

// -------------------------- 基础状态变量 --------------------------
const employeeSalaryInfos = ref([])
const tableLoading = ref(false)
const isDetailDialogOpen = ref(false)
const isDeleteDialogOpen = ref(false)
const isFormDialogOpen = ref(false)
const formMode = ref('add')

// -------------------------- 筛选与分页 --------------------------
const filters = ref({
  searchQuery: '',
  employee: null,
  salaryGrade: null
})

const pagination = ref({
  page: 1,
  rowsPerPage: 10,
  sortBy: 'employee__employee_name',
  descending: false,
  rowsNumber: 0
})

// -------------------------- 数据模型 --------------------------
const currentEmployeeSalaryInfo = ref({
  id: null,
  employee: null,
  salary_grade: null,
  salary_level: 0,
  salary_rate: 0,
  security_allowance: 0,
  other_allowance: 0,
  EOBI_deduction: 0,
  other_deduction: 0
})

const employeeSalaryInfoDetail = ref({})

// -------------------------- 下拉选项配置 --------------------------
const employeeOptions = ref([])
const salaryGradeOptions = ref([
  { label: 'A', value: 'A' },
  { label: 'B', value: 'B' },
  { label: 'C', value: 'C' },
  { label: 'D', value: 'D' },
  { label: 'E', value: 'E' },
  { label: 'F', value: 'F' },
  { label: 'G', value: 'G' },
  { label: 'H', value: 'H' },
  { label: 'I', value: 'I' },
  { label: 'J', value: 'J' },
  { label: 'K', value: 'K' },
  { label: 'L', value: 'L' }
])

// -------------------------- 删除选项 --------------------------
const isSoftDelete = ref('true')

// -------------------------- 表格配置 --------------------------
const columns = ref([
  { name: 'index', label: '序号', field: '', align: 'left', sortable: true, width: '80px' },
  { name: 'employee', label: '员工', field: 'employee_name', align: 'left', sortable: true },
  { name: 'salary_grade', label: '工资等级', field: 'salary_grade', align: 'left', sortable: true },
  { name: 'salary_level', label: '工资岗级', field: 'salary_level', align: 'left', sortable: true },
  { name: 'salary_rate', label: '基本工资', field: 'salary_rate', align: 'left', sortable: true },
  { name: 'total_allowance', label: '总补贴金额', field: 'total_allowance', align: 'left', sortable: true },
  { name: 'EOBI_deduction', label: '养老保险扣除', field: 'EOBI_deduction', align: 'left', sortable: true },
  { name: 'created_at', label: '创建时间', field: 'created_at', align: 'left', sortable: true, format: formatDate },
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

// 获取工资等级颜色
const getSalaryGradeColor = (grade) => {
  if (!grade) return 'grey'
  const colorMap = {
    'A': 'purple',
    'B': 'indigo',
    'C': 'blue',
    'D': 'light-blue',
    'E': 'cyan',
    'F': 'teal',
    'G': 'green',
    'H': 'light-green',
    'I': 'lime',
    'J': 'yellow',
    'K': 'amber',
    'L': 'orange'
  }
  return colorMap[grade] || 'grey'
}

// -------------------------- 操作方法 --------------------------
const openFormDialog = (mode, employeeSalaryInfo = null) => {
  formMode.value = mode
  isFormDialogOpen.value = true

  if (mode === 'edit' && employeeSalaryInfo) {
    currentEmployeeSalaryInfo.value = { ...employeeSalaryInfo }
  } else {
    // 重置为默认值
    currentEmployeeSalaryInfo.value = {
      id: null,
      employee: null,
      salary_grade: null,
      salary_level: 0,
      salary_rate: 0,
      security_allowance: 0,
      other_allowance: 0,
      EOBI_deduction: 0,
      other_deduction: 0
    }
  }
}

// -------------------------- 数据加载函数 --------------------------
// 构建筛选参数
function buildFilterParams() {
  const params = new URLSearchParams()

  // 分页参数
  params.append('page', pagination.value.page)
  params.append('page_size', pagination.value.rowsPerPage)

  // 排序参数
  if (pagination.value.sortBy) {
    const order = pagination.value.descending ? `-${pagination.value.sortBy}` : pagination.value.sortBy
    params.append('ordering', order)
  }

  // 筛选参数
  if (filters.value.searchQuery) {
    params.append('search', filters.value.searchQuery)
  }

  if (filters.value.employee) {
    params.append('employee', filters.value.employee)
  }

  if (filters.value.salaryGrade) {
    params.append('salary_grade', filters.value.salaryGrade)
  }

  return params
}

// 获取薪资信息列表
const fetchEmployeeSalaryInfos = async () => {
  try {
    tableLoading.value = true
    const params = buildFilterParams()
    const response = await getEmployeeSalaryInfos(params)

    if (response.status === 200) {
      employeeSalaryInfos.value = response.data.results
      pagination.value.rowsNumber = response.data.count
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '获取薪资信息失败',
      position: 'top'
    })
  } finally {
    tableLoading.value = false
  }
}

const viewEmployeeSalaryInfoDetail = async (employeeSalaryInfo) => {
  isDetailDialogOpen.value = true
  try {
    const response = await getEmployeeSalaryInfoDetail(employeeSalaryInfo.id)
    if (response.status === 200) {
      employeeSalaryInfoDetail.value = response.data
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '获取薪资信息详情失败',
      position: 'top'
    })
  }
}

// 获取员工选项
async function fetchEmployees() {
  try {
    const response = await getEmployees()
    if (response.status === 200) {
      employeeOptions.value = response.data.results.map(item => ({
        id: item.id,
        employee_name: `${item.employee_name}(${item.wbc})`
      }))
    }
  } catch (error) {
    console.error('获取员工选项失败:', error)
  }
}

// -------------------------- 新增/编辑处理 --------------------------
// 表单验证
const validateForm = () => {
  if (!currentEmployeeSalaryInfo.value.employee) {
    $q.notify({
      color: 'negative',
      message: '请选择员工',
      position: 'top'
    })
    return false
  }

  if (currentEmployeeSalaryInfo.value.salary_rate === null ||
    currentEmployeeSalaryInfo.value.salary_rate === '') {
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
      await handleAddEmployeeSalaryInfo()
    } else if (formMode.value === 'edit') {
      await handleEditEmployeeSalaryInfo(currentEmployeeSalaryInfo.value.id)
    }
  } finally {
    isFormDialogOpen.value = false
  }
}

// 添加薪资信息
const handleAddEmployeeSalaryInfo = async () => {
  try {
    const formData = {
      employee: currentEmployeeSalaryInfo.value.employee,
      salary_grade: currentEmployeeSalaryInfo.value.salary_grade,
      salary_level: currentEmployeeSalaryInfo.value.salary_level,
      salary_rate: currentEmployeeSalaryInfo.value.salary_rate,
      security_allowance: currentEmployeeSalaryInfo.value.security_allowance,
      other_allowance: currentEmployeeSalaryInfo.value.other_allowance,
      EOBI_deduction: currentEmployeeSalaryInfo.value.EOBI_deduction,
      other_deduction: currentEmployeeSalaryInfo.value.other_deduction
    }

    const response = await createEmployeeSalaryInfo(formData)
    if (response.status === 201) {
      $q.notify({
        color: 'positive',
        message: '添加薪资信息成功',
        position: 'top'
      })
      fetchEmployeeSalaryInfos()
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '添加薪资信息失败',
      position: 'top'
    })
  }
}

// 编辑薪资信息
const editEmployeeSalaryInfo = async (employeeSalaryInfo) => {
  formMode.value = 'edit'
  isFormDialogOpen.value = true
  try {
    const response = await getEmployeeSalaryInfoDetail(employeeSalaryInfo.id)
    if (response.status === 200) {
      currentEmployeeSalaryInfo.value = {
        id: response.data.id,
        employee: response.data.employee,
        salary_grade: response.data.salary_grade,
        salary_level: response.data.salary_level,
        salary_rate: response.data.salary_rate,
        security_allowance: response.data.security_allowance,
        other_allowance: response.data.other_allowance,
        EOBI_deduction: response.data.EOBI_deduction,
        other_deduction: response.data.other_deduction
      }
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '获取薪资信息详情失败',
      position: 'top'
    })
  }
}

// 更新薪资信息
const handleEditEmployeeSalaryInfo = async (employeeSalaryInfoId) => {
  try {
    const formData = {
      salary_grade: currentEmployeeSalaryInfo.value.salary_grade,
      salary_level: currentEmployeeSalaryInfo.value.salary_level,
      salary_rate: currentEmployeeSalaryInfo.value.salary_rate,
      security_allowance: currentEmployeeSalaryInfo.value.security_allowance,
      other_allowance: currentEmployeeSalaryInfo.value.other_allowance,
      EOBI_deduction: currentEmployeeSalaryInfo.value.EOBI_deduction,
      other_deduction: currentEmployeeSalaryInfo.value.other_deduction
    }

    const response = await updateEmployeeSalaryInfo(employeeSalaryInfoId, formData)
    if (response.status === 200) {
      $q.notify({
        color: 'positive',
        message: '更新薪资信息成功',
        position: 'top'
      })
      fetchEmployeeSalaryInfos()
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '更新薪资信息失败',
      position: 'top'
    })
  }
}

// -------------------------- 删除处理 --------------------------
const handleDeleteEmployeeSalaryInfo = async (employeeSalaryInfo) => {
  currentEmployeeSalaryInfo.value.id = employeeSalaryInfo.id
  currentEmployeeSalaryInfo.value.employee_name = employeeSalaryInfo.employee_name
  isDeleteDialogOpen.value = true
}

// 确认删除薪资信息
const confirmDeleteEmployeeSalaryInfo = async () => {
  try {
    const deleteMode = isSoftDelete.value === 'true'
    let response
    if (deleteMode) {
      response = await softDeleteEmployeeSalaryInfo(currentEmployeeSalaryInfo.value.id)
    } else {
      response = await deleteEmployeeSalaryInfo(currentEmployeeSalaryInfo.value.id)
    }
    if (response.status === 204) {
      $q.notify({
        color: 'positive',
        message: deleteMode ? '软删除成功' : '硬删除成功',
        position: 'top'
      })
      fetchEmployeeSalaryInfos()
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '删除薪资信息失败',
      position: 'top'
    })
  } finally {
    isDeleteDialogOpen.value = false
  }
}

// -------------------------- 筛选与分页处理 --------------------------
const applyFilters = () => {
  pagination.value.page = 1
  fetchEmployeeSalaryInfos()
}

// 筛选条件变化
function handleFilterChange() {
  pagination.value.page = 1
}

// 重置筛选
function resetFilters() {
  filters.value = {
    searchQuery: '',
    employee: null,
    salaryGrade: null
  }

  pagination.value.page = 1

  // 添加防抖处理
  clearTimeout(filterTimer)
  filterTimer = setTimeout(() => {
    fetchEmployeeSalaryInfos()
  }, 300)
}

// 表格排序/分页请求
function onRequest(props) {
  const { page, rowsPerPage, sortBy, descending } = props.pagination

  pagination.value.page = page
  pagination.value.rowsPerPage = rowsPerPage
  pagination.value.sortBy = sortBy
  pagination.value.descending = descending

  handleFilterChange()
  fetchEmployeeSalaryInfos()
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

// 1. 模板下载
async function downloadInitTemplate() {
  try {
    const response = await downloadEmployeeSalaryInfoTemplate({ template_type: 'init' })
    fileUtils.downloadBlob(response.data, '薪资信息初始化导入模板.xlsx')
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
    const response = await downloadEmployeeSalaryInfoTemplate({ template_type: 'normal' })
    fileUtils.downloadBlob(response.data, '薪资信息普通导入模板.xlsx')
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
      message: '确定要清空所有薪资信息数据吗？此操作将删除所有薪资信息记录，且无法恢复！',
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

// 4. 导入处理
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

    const response = await importEmployeeSalaryInfos(selectedFile.value, additionalParams)

    if (response.status === 200 || response.status === 201) {
      const result = response.data

      // 检查是否是成功的导入响应
      if (result.success === false) {
        // 处理后端返回的错误信息
        $q.notify({
          color: 'negative',
          message: result.message || '导入失败',
          position: 'top'
        })
      } else {
        importResult.value = result
        importErrors.value = result.errors || []

        if (result.error_count === 0) {
          $q.notify({
            color: 'positive',
            message: '导入成功',
            position: 'top'
          })
          closeImportDialogs()
          fetchEmployeeSalaryInfos()
        } else {
          $q.notify({
            color: 'warning',
            message: `导入完成，${result.error_count} 条数据导入失败`,
            position: 'top'
          })
        }
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

// 6. 导出处理
async function handleExportEmployeeSalaryInfos(exportType = 'all') {
  try {
    tableLoading.value = true

    // 构建导出参数
    let params = {}

    // 如果是导出筛选结果，则使用当前筛选条件
    if (exportType === 'filtered') {
      if (filters.value.searchQuery) {
        params.search = filters.value.searchQuery
      }
      if (filters.value.employee) {
        params.employee = filters.value.employee
      }
      if (filters.value.salaryGrade) {
        params.salary_grade = filters.value.salaryGrade
      }
    }

    const response = await exportEmployeeSalaryInfos(params)
    const filename = `薪资信息_${format(new Date(), 'yyyyMMddHHmmss')}.xlsx`
    fileUtils.downloadBlob(response.data, filename)

  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '导出薪资信息失败',
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

  exportExcel(exportData, `薪资信息导入错误详情_${format(new Date(), 'yyyyMMddHHmmss')}.xlsx`)
}

// -------------------------- 页面初始化 --------------------------
onMounted(() => {
  fetchEmployeeSalaryInfos()
  fetchEmployees()
})

onUnmounted(() => {
  if (filterTimer) {
    clearTimeout(filterTimer)
  }
})
</script>

<style scoped></style>
