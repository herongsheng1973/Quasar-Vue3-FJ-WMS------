<template>
  <q-page class="q-px-md">
    <!-- 页面标题和操作按钮 -->
    <div class="col-12 flex justify-between items-center mb-6 flex-wrap gap-4">
      <div>
        <h5 class="text-h5 q-ma-none">工资历史记录管理</h5>
        <p class="text-grey text-subtitle2">管理员工工资变动历史记录</p>
      </div>
      <div class="flex gap-2 flex-wrap">
        <!-- 新增工资历史记录按钮 -->
        <q-btn color="primary" label="新增工资记录" @click="openFormDialog('add')" />
        <!-- 工资历史记录导入 -->
        <q-btn-dropdown color="secondary" label="工资记录导入" icon="upload">
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
        <!-- 导出工资历史记录 -->
        <q-btn-dropdown color="primary" label="导出工资记录" icon="download">
          <q-list>
            <q-item clickable v-close-popup @click="handleExportSalaryHistories('all')">
              <q-item-section avatar>
                <q-icon name="file_download" />
              </q-item-section>
              <q-item-section>
                <q-item-label>导出全部</q-item-label>
                <q-item-label caption>导出所有工资记录</q-item-label>
              </q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="handleExportSalaryHistories('filtered')">
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
          <!-- 员工筛选 -->
          <div class="col-md-2 col-sm-4 col-xs-12">
            <q-input v-model="filters.employeeSearch" label="员工姓名/WBC" dense clearable
              @update:model-value="handleFilterHistory" />
          </div>

          <!-- 变动类型筛选 -->
          <div class="col-md-2 col-sm-4 col-xs-12">
            <q-select v-model="filters.changeType" label="变动类型" :options="changeTypeOptions" option-label="label"
              option-value="value" emit-value map-options clearable @update:model-value="handleFilterHistory" dense />
          </div>

          <!-- 生效日期范围 -->
          <div class="col-md-3 col-sm-6 col-xs-12">
            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <q-input v-model="filters.startDate" label="开始日期" dense clearable
                  @update:model-value="handleFilterHistory" mask="date" :rules="['date']">
                  <template #append>
                    <q-icon name="event" class="cursor-pointer">
                      <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                        <q-date v-model="filters.startDate" mask="YYYY-MM-DD">
                          <div class="row items-center justify-end">
                            <q-btn v-close-popup label="关闭" color="primary" flat />
                          </div>
                        </q-date>
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
              </div>
              <div class="col-6">
                <q-input v-model="filters.endDate" label="结束日期" dense clearable
                  @update:model-value="handleFilterHistory" mask="date" :rules="['date']">
                  <template #append>
                    <q-icon name="event" class="cursor-pointer">
                      <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                        <q-date v-model="filters.endDate" mask="YYYY-MM-DD">
                          <div class="row items-center justify-end">
                            <q-btn v-close-popup label="关闭" color="primary" flat />
                          </div>
                        </q-date>
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
              </div>
            </div>
          </div>

          <div class="col-md-3 col-sm-6 col-xs-12">
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

    <!-- 工资历史记录列表 -->
    <div class="col-12 bg-white rounded-borders shadow-sm">
      <q-table :rows="salaryHistories" :columns="columns" v-model:pagination="pagination"
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

        <!-- 工资变动 -->
        <template #body-cell-salary_change="props">
          <q-td :props="props">
            <div>{{ props.row.previous_salary }} → {{ props.row.updated_salary }}</div>
            <div class="text-caption text-grey">
              {{ props.row.salary_change_amount }} ({{ props.row.salary_change_percentage }}%)
            </div>
          </q-td>
        </template>

        <!-- 变动类型 -->
        <template #body-cell-change_type="props">
          <q-td :props="props">
            <q-badge :color="getChangeTypeColor(props.row.change_type)" :label="props.row.change_type_display" />
          </q-td>
        </template>

        <template #body-cell-actions="props">
          <q-td :props="props">
            <q-btn size="sm" color="info" icon="visibility" class="q-mr-1" @click="viewSalaryHistoryDetail(props.row)"
              label="查看" />
            <q-btn size="sm" color="accent" icon="edit" @click="editSalaryHistory(props.row)" label="编辑" />
            <q-btn size="sm" color="warning" icon="delete" @click="handleDeleteSalaryHistory(props.row)" label="删除" />
          </q-td>
        </template>

        <template #loading>
          <div class="row items-center justify-center q-pa-md">
            <q-spinner size="40px" color="primary" />
            <span class="q-ml-md text-subtitle1">加载工资记录中...</span>
          </div>
        </template>
      </q-table>
    </div>

    <!-- 查看记录详情弹窗 -->
    <q-dialog v-model="isDetailDialogOpen" persistent>
      <q-card style="width: 700px; max-width: 90vw;">
        <q-card-section>
          <div class="row items-center justify-between">
            <h5 class="text-h5">工资记录详情</h5>
            <q-btn icon="close" flat round @click="isDetailDialogOpen = false" />
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pt-none">
          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">员工:</div>
            <div class="col-8">{{ salaryHistoryDetail.employee_detail?.employee_name }}
              ({{ salaryHistoryDetail.employee_detail?.wbc }})</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">部门:</div>
            <div class="col-8">{{ salaryHistoryDetail.employee_detail?.department || '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">岗位:</div>
            <div class="col-8">{{ salaryHistoryDetail.employee_detail?.position || '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">生效日期:</div>
            <div class="col-8">{{ salaryHistoryDetail.effective_date ? formatDate(salaryHistoryDetail.effective_date)
              : '-'
            }}
            </div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">调整前工资:</div>
            <div class="col-8">{{ salaryHistoryDetail.previous_salary }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">调整后工资:</div>
            <div class="col-8">{{ salaryHistoryDetail.updated_salary }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">工资变动:</div>
            <div class="col-8">
              {{ salaryHistoryDetail.salary_change_amount }}
              ({{ salaryHistoryDetail.salary_change_percentage }}%)
            </div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">变动类型:</div>
            <div class="col-8">
              <q-badge :color="getChangeTypeColor(salaryHistoryDetail.change_type)"
                :label="salaryHistoryDetail.change_type_display" />
            </div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">变动说明:</div>
            <div class="col-8">{{ salaryHistoryDetail.description || '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">操作人:</div>
            <div class="col-8">{{ salaryHistoryDetail.created_by_detail?.username || '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">创建时间:</div>
            <div class="col-8">{{ salaryHistoryDetail.created_at ? formatDate(salaryHistoryDetail.created_at) : '-' }}
            </div>
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
          <p>确定要删除 {{ currentSalaryHistory.employee_name }} 的工资记录吗？</p>
          <div class="q-mt-sm">
            <q-radio v-model="isSoftDelete" val="true" label="软删除" class="q-mr-md" />
            <q-radio v-model="isSoftDelete" val="false" label="硬删除" />
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn label="取消" @click="isDeleteDialogOpen = false" color="secondary" />
          <q-btn label="删除" @click="confirmDeleteSalaryHistory" color="warning" class="text-blue" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 新增/编辑表单对话框 -->
    <q-dialog v-model="isFormDialogOpen">
      <q-card style="width: 700px; max-width: 90vw;">
        <q-card-section>
          <div class="row items-center justify-between">
            <h5 class="text-h5">{{ formMode === 'add' ? '新增工资记录' : '编辑工资记录' }}</h5>
            <q-btn icon="close" flat round @click="isFormDialogOpen = false" />
          </div>
        </q-card-section>
        <q-card-section>
          <q-form @submit="handleSubmit">
            <div class="row q-col-gutter-md">
              <!-- 员工选择 -->
              <div class="col-12">
                <q-select v-model="currentSalaryHistory.employee" label="员工" :options="employeeOptions"
                  option-label="employee_name" option-value="id" map-options emit-value clearable dense outlined
                  :rules="[val => !!val || '请选择员工']" />
              </div>

              <!-- 生效日期 -->
              <div class="col-12">
                <q-input v-model="currentSalaryHistory.effective_date" label="生效日期" dense outlined mask="date"
                  :rules="['date']">
                  <template #append>
                    <q-icon name="event" class="cursor-pointer">
                      <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                        <q-date v-model="currentSalaryHistory.effective_date" mask="YYYY-MM-DD">
                          <div class="row items-center justify-end">
                            <q-btn v-close-popup label="关闭" color="primary" flat />
                          </div>
                        </q-date>
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
              </div>

              <!-- 调整前工资和调整后工资 -->
              <div class="col-6">
                <q-input v-model="currentSalaryHistory.previous_salary" label="调整前工资" dense outlined type="number"
                  step="0.01" :rules="[val => val >= 0 || '工资不能为负数']" />
              </div>

              <div class="col-6">
                <q-input v-model="currentSalaryHistory.updated_salary" label="调整后工资" dense outlined type="number"
                  step="0.01" :rules="[val => val >= 0 || '工资不能为负数']" />
              </div>

              <!-- 变动类型 -->
              <div class="col-12">
                <q-select v-model="currentSalaryHistory.change_type" label="变动类型" :options="changeTypeOptions"
                  option-label="label" option-value="value" map-options emit-value clearable dense outlined
                  :rules="[val => !!val || '请选择变动类型']" />
              </div>

              <!-- 变动说明 -->
              <div class="col-12">
                <q-input v-model="currentSalaryHistory.description" label="变动说明" dense outlined type="textarea" rows="3"
                  :rules="[val => !!val?.trim() || '变动说明不能为空']" />
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
          <h5 class="text-h5 text-negative">⚠️ 工资记录初始化导入</h5>
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
                <li>1. 初始化导入将<span class="font-medium text-negative">覆盖现有工资记录数据</span>，适用于系统首次上线或全量数据重置</li>
                <li>2. 若勾选"清空现有数据"，将删除所有工资记录，<span class="font-medium text-negative">操作不可撤销</span></li>
                <li>3. 请确保导入文件包含必要字段（建议先下载模板）</li>
              </ul>
            </div>

            <!-- 模板下载 -->
            <div class="flex justify-between items-center">
              <p class="text-sm">请下载模板并按格式填写数据</p>
              <q-btn label="下载工资记录初始化模板" color="secondary" icon="file_download" size="sm"
                @click="downloadInitTemplate" />
            </div>

            <!-- 文件上传 -->
            <q-uploader label="选择工资记录初始化文件（仅支持.xlsx/.xls）" accept=".xlsx, .xls" :max-files="1"
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
              <q-checkbox v-model="initClearExisting" label="清空现有工资记录数据" color="negative"
                @update:model-value="handleClearConfirm" />
            </div>

            <!-- 导入结果/错误展示 -->
            <div v-if="importErrors.length > 0" class="mt-4">
              <h6 class="text-negative text-sm font-medium">导入失败记录（共{{ importErrors.length }}条）</h6>
              <div class="bg-white border border-gray-200 rounded mt-2 max-h-60 overflow-auto">
                <q-table :rows="importErrors" :columns="importErrorColumns" row-key="row" dense hide-header flat />
              </div>
              <q-btn label="下载工资记录错误详情" color="negative" size="sm" class="mt-2" @click="downloadImportErrors" dense />
            </div>

            <!-- 初始化成功统计 -->
            <div v-if="importResult" class="mt-4 bg-positive/10 p-3 rounded">
              <h6 class="text-positive font-medium">工资记录初始化导入成功</h6>
              <ul class="text-sm mt-2 space-y-1">
                <li>成功创建工资记录：{{ importResult.salary_success_count }} 条</li>
                <li>失败记录：{{ importResult.error_count }} 条</li>
              </ul>
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md">
          <q-btn label="取消" color="secondary" @click="resetInitImportState" />
          <q-btn label="开始工资记录初始化" color="negative" class="ml-2" @click="handleImport"
            :disable="!selectedFile || importLoading" :loading="importLoading" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 2. 普通导入弹窗 -->
    <q-dialog v-model="showNormalImportDialog" max-width="700px">
      <q-card>
        <q-card-section class="row items-center justify-between">
          <h5 class="text-h5">普通工资记录导入</h5>
          <q-btn icon="close" flat round @click="closeImportDialogs" />
        </q-card-section>
        <q-card-section class="q-pa-md">
          <div class="space-y-4">
            <p class="text-sm">普通工资记录导入仅新增/更新工资记录，不删除现有数据，适用于日常批量更新</p>
            <div class="flex justify-between items-center">
              <p class="text-sm">请下载模板并按格式填写数据</p>
              <q-btn label="下载普通工资记录导入模板" color="secondary" icon="file_download" size="sm"
                @click="downloadNormalTemplate" />
            </div>
            <q-uploader label="选择工资记录普通导入文件（仅支持.xlsx/.xls）" accept=".xlsx, .xls" :max-files="1"
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
          <q-btn label="开始工资记录普通导入" color="primary" class="ml-2" @click="handleImport"
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

// API导入 - 修改为工资历史记录相关接口
import {
  getEmployees,
  getSalaryHistories,
  getSalaryHistoryDetail,
  createSalaryHistory,
  updateSalaryHistory,
  deleteSalaryHistory,
  softDeleteSalaryHistory,
  exportSalaryHistories,
  importSalaryHistories,
  downloadSalaryHistoryTemplate
} from 'src/services/employeeServiceApi'

// 初始化Quasar
const $q = useQuasar()

// -------------------------- 基础状态变量 --------------------------
const salaryHistories = ref([])
const tableLoading = ref(false)
const isDetailDialogOpen = ref(false)
const isDeleteDialogOpen = ref(false)
const isFormDialogOpen = ref(false)
const formMode = ref('add')

// -------------------------- 筛选与分页 --------------------------
const filters = ref({
  employeeSearch: '',
  changeType: null,
  startDate: null,
  endDate: null
})

const pagination = ref({
  page: 1,
  rowsPerPage: 10,
  sortBy: 'effective_date',
  descending: true,
  rowsNumber: 0
})

// -------------------------- 数据模型 --------------------------
const currentSalaryHistory = ref({
  id: null,
  employee: null,
  effective_date: format(new Date(), 'yyyy-MM-dd'),
  previous_salary: 0,
  updated_salary: 0,
  change_type: null,
  description: ''
})

const salaryHistoryDetail = ref({})
// -------------------------- 下拉选项配置 --------------------------
const employeeOptions = ref([])
const changeTypeOptions = ref([
  { label: '晋升调薪', value: 'promotion' },
  { label: '年度调薪', value: 'annual' },
  { label: '降级调薪', value: 'demotion' },
  { label: '其他调薪', value: 'other' }
])

// const statusOptions = ref([
//   { label: '全部', value: null },
//   { label: '是', value: true },
//   { label: '否', value: false },
// ])
// -------------------------- 删除选项 --------------------------
const isSoftDelete = ref('true')
// -------------------------- 表格配置 --------------------------
const columns = ref([
  { name: 'index', label: '序号', field: '', align: 'left', sortable: true, width: '80px' },
  { name: 'employee', label: '员工', field: 'employee_name', align: 'left', sortable: true },
  { name: 'effective_date', label: '生效日期', field: 'effective_date', align: 'left', sortable: true, format: formatDate },
  { name: 'salary_change', label: '工资变动', field: 'salary_change', align: 'left', sortable: false },
  { name: 'change_type', label: '变动类型', field: 'change_type', align: 'left', sortable: true },
  { name: 'created_by_name', label: '操作人', field: 'created_by_name', align: 'left', sortable: true },
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

// 获取变动类型颜色
const getChangeTypeColor = (changeType) => {
  switch (changeType) {
    case 'promotion': return 'positive'
    case 'annual': return 'info'
    case 'demotion': return 'negative'
    case 'other': return 'warning'
    default: return 'grey'
  }
}

// -------------------------- 操作方法 --------------------------
const openFormDialog = (mode, salaryHistory = null) => {
  formMode.value = mode
  isFormDialogOpen.value = true

  if (mode === 'edit' && salaryHistory) {
    currentSalaryHistory.value = { ...salaryHistory }
  } else {
    // 重置为默认值
    currentSalaryHistory.value = {
      id: null,
      employee: null,
      effective_date: format(new Date(), 'yyyy-MM-dd'),
      previous_salary: 0,
      updated_salary: 0,
      change_type: null,
      description: ''
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
  if (filters.value.employeeSearch) {
    params.append('search', filters.value.employeeSearch)
  }

  if (filters.value.changeType) {
    params.append('change_type', filters.value.changeType)
  }

  if (filters.value.startDate) {
    params.append('start_date', filters.value.startDate)
  }

  if (filters.value.endDate) {
    params.append('end_date', filters.value.endDate)
  }

  return params
}

// 获取工资历史记录列表
const fetchSalaryHistories = async () => {
  try {
    tableLoading.value = true
    const params = buildFilterParams()
    const response = await getSalaryHistories(params)

    if (response.status === 200) {
      salaryHistories.value = response.data.results
      pagination.value.rowsNumber = response.data.count
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '获取工资记录失败',
      position: 'top'
    })
  } finally {
    tableLoading.value = false
  }
}

const viewSalaryHistoryDetail = async (salaryHistory) => {
  isDetailDialogOpen.value = true
  try {
    const response = await getSalaryHistoryDetail(salaryHistory.id)
    if (response.status === 200) {
      salaryHistoryDetail.value = response.data
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '获取工资记录详情失败',
      position: 'top'
    })
  }
}

// -------------------------- 新增/编辑处理 --------------------------
// 表单验证
const validateForm = () => {
  if (!currentSalaryHistory.value.employee) {
    $q.notify({
      color: 'negative',
      message: '请选择员工',
      position: 'top'
    })
    return false
  }

  if (!currentSalaryHistory.value.change_type) {
    $q.notify({
      color: 'negative',
      message: '请选择变动类型',
      position: 'top'
    })
    return false
  }

  if (!currentSalaryHistory.value.description?.trim()) {
    $q.notify({
      color: 'negative',
      message: '变动说明不能为空',
      position: 'top'
    })
    return false
  }

  if (currentSalaryHistory.value.previous_salary < 0) {
    $q.notify({
      color: 'negative',
      message: '调整前工资不能为负数',
      position: 'top'
    })
    return false
  }

  if (currentSalaryHistory.value.updated_salary < 0) {
    $q.notify({
      color: 'negative',
      message: '调整后工资不能为负数',
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
      await handleAddSalaryHistory()
    } else if (formMode.value === 'edit') {
      await handleEditSalaryHistory(currentSalaryHistory.value.id)
    }
  } finally {
    isFormDialogOpen.value = false
  }
}

// 添加工资历史记录
const handleAddSalaryHistory = async () => {
  try {
    const formData = {
      employee: currentSalaryHistory.value.employee,
      effective_date: currentSalaryHistory.value.effective_date,
      previous_salary: parseFloat(currentSalaryHistory.value.previous_salary),
      updated_salary: parseFloat(currentSalaryHistory.value.updated_salary),
      change_type: currentSalaryHistory.value.change_type,
      description: currentSalaryHistory.value.description
    }
    const response = await createSalaryHistory(formData)
    if (response.status === 201) {
      $q.notify({
        color: 'positive',
        message: '添加工资记录成功',
        position: 'top'
      })
      fetchSalaryHistories()
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '添加工资记录失败',
      position: 'top'
    })
  }
}

// 编辑工资历史记录
const editSalaryHistory = async (salaryHistory) => {
  formMode.value = 'edit'
  isFormDialogOpen.value = true
  try {
    const response = await getSalaryHistoryDetail(salaryHistory.id)
    if (response.status === 200) {
      currentSalaryHistory.value = {
        id: response.data.id,
        employee: response.data.employee,
        effective_date: response.data.effective_date,
        previous_salary: response.data.previous_salary,
        updated_salary: response.data.updated_salary,
        change_type: response.data.change_type,
        description: response.data.description
      }
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '获取工资记录详情失败',
      position: 'top'
    })
  }
}

// 更新工资历史记录
const handleEditSalaryHistory = async (salaryHistoryId) => {
  try {
    const formData = {
      description: currentSalaryHistory.value.description
    }

    const response = await updateSalaryHistory(salaryHistoryId, formData)
    if (response.status === 200) {
      $q.notify({
        color: 'positive',
        message: '更新工资记录成功',
        position: 'top'
      })
      fetchSalaryHistories()
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '更新工资记录失败',
      position: 'top'
    })
  }
}

// -------------------------- 删除处理 --------------------------
const handleDeleteSalaryHistory = async (salaryHistory) => {
  currentSalaryHistory.value.id = salaryHistory.id
  currentSalaryHistory.value.employee_name = salaryHistory.employee_name
  isDeleteDialogOpen.value = true
}

// 确认删除工资历史记录
const confirmDeleteSalaryHistory = async () => {
  try {
    const deleteMode = isSoftDelete.value === 'true'
    let response
    if (deleteMode) {
      response = await softDeleteSalaryHistory(currentSalaryHistory.value.id)
    } else {
      response = await deleteSalaryHistory(currentSalaryHistory.value.id)
    }
    if (response.status === 204) {
      $q.notify({
        color: 'positive',
        message: deleteMode ? '软删除成功' : '硬删除成功',
        position: 'top'
      })
      fetchSalaryHistories()
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '删除工资记录失败',
      position: 'top'
    })
  } finally {
    isDeleteDialogOpen.value = false
  }
}

// -------------------------- 筛选与分页处理 --------------------------
async function fetchSelectOptions() {
  try {
    // 获取员工选项
    const employeesResponse = await getEmployees()
    if (employeesResponse.status === 200) {
      employeeOptions.value = employeesResponse.data.map(item => ({
        id: item.id,
        employee_name: `${item.employee_name}(${item.wbc})`
      }))
    }
  } catch (error) {
    console.error('获取下拉选项失败:', error)
  }
}

const applyFilters = () => {
  pagination.value.page = 1
  fetchSalaryHistories()
}

// 筛选条件变化
function handleFilterHistory() {
  pagination.value.page = 1
}

// 重置筛选
function resetFilters() {
  filters.value = {
    employeeSearch: '',
    changeType: null,
    startDate: null,
    endDate: null
  }

  pagination.value.page = 1

  // 添加防抖处理
  clearTimeout(filterTimer)
  filterTimer = setTimeout(() => {
    fetchSalaryHistories()
  }, 300)
}

// 表格排序/分页请求
function onRequest(props) {
  const { page, rowsPerPage, sortBy, descending } = props.pagination

  pagination.value.page = page
  pagination.value.rowsPerPage = rowsPerPage
  pagination.value.sortBy = sortBy
  pagination.value.descending = descending

  handleFilterHistory()
  fetchSalaryHistories()
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

// 通用文件下载处理函数
function handleFileDownload(response, filename) {
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

// 1. 模板下载
async function downloadInitTemplate() {
  try {
    const response = await downloadSalaryHistoryTemplate({ type: 'init' })
    handleFileDownload(response, '工资记录初始化导入模板.xlsx')
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
    const response = await downloadSalaryHistoryTemplate({ type: 'normal' })
    handleFileDownload(response, '工资记录普通导入模板.xlsx')
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
      message: '确定要清空所有工资记录数据吗？此操作将删除所有工资记录，且无法恢复！',
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

    const response = await importSalaryHistories(selectedFile.value, additionalParams)

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
        fetchSalaryHistories()
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

// 5. 导出处理
async function handleExportSalaryHistories(exportType = 'all') {
  try {
    tableLoading.value = true

    // 构建导出参数
    const params = {}

    // 如果是导出筛选结果，则使用当前筛选条件
    if (exportType === 'filtered') {
      // 添加筛选参数到导出请求
      if (filters.value.employeeSearch) {
        params.search = filters.value.employeeSearch
      }

      if (filters.value.changeType) {
        params.change_type = filters.value.changeType
      }

      if (filters.value.startDate) {
        params.start_date = filters.value.startDate
      }

      if (filters.value.endDate) {
        params.end_date = filters.value.endDate
      }
    }

    const response = await exportSalaryHistories(params)

    // 处理文件下载
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `工资记录_${format(new Date(), 'yyyyMMddHHmmss')}.xlsx`
    document.body.appendChild(a)
    a.click()
    URL.revokeObjectURL(url)
    document.body.removeChild(a)

  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '导出工资记录失败',
      position: 'top'
    })
  } finally {
    tableLoading.value = false
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

  exportExcel(exportData, `工资记录导入错误详情_${format(new Date(), 'yyyyMMddHHmmss')}.xlsx`)
}

// -------------------------- 页面初始化 --------------------------
onMounted(() => {
  fetchSelectOptions()
  fetchSalaryHistories()
})

onUnmounted(() => {
  if (filterTimer) {
    clearTimeout(filterTimer)
  }
})
</script>

<style scoped></style>
