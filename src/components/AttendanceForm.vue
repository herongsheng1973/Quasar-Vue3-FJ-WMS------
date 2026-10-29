<template>
  <q-page class="q-px-md">
    <!-- 页面标题和操作按钮 -->
    <div class="col-12 flex justify-between items-center mb-6 flex-wrap gap-4">
      <div>
        <h5 class="text-h5 q-ma-none">考勤管理</h5>
        <p class="text-grey text-subtitle2">管理员工考勤记录</p>
      </div>
      <div class="flex gap-2 flex-wrap">
        <!-- 新增考勤按钮 -->
        <q-btn color="primary" label="新增考勤" @click="openFormDialog('add')" />
        <!-- 考勤导入 -->
        <q-btn-dropdown color="secondary" label="考勤导入" icon="upload">
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
        <!-- 导出考勤 -->
        <q-btn-dropdown color="primary" label="导出考勤" icon="download">
          <q-list>
            <q-item clickable v-close-popup @click="handleExportAttendances('all')">
              <q-item-section avatar>
                <q-icon name="file_download" />
              </q-item-section>
              <q-item-section>
                <q-item-label>导出全部</q-item-label>
                <q-item-label caption>导出所有考勤记录</q-item-label>
              </q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="handleExportAttendances('filtered')">
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
            <q-select v-model="filters.employee" label="员工" :options="employeeOptions" option-label="employee_name"
              option-value="id" emit-value map-options clearable dense />
          </div>

          <!-- 考勤状态筛选 -->
          <div class="col-md-2 col-sm-4 col-xs-12">
            <q-select v-model="filters.attendanceStatus" label="考勤状态" :options="statusOptions" option-label="label"
              option-value="value" emit-value map-options clearable @update:model-value="handleFilterChange" dense />
          </div>

          <!-- 考勤日期范围 -->
          <div class="col-md-3 col-sm-6 col-xs-12">
            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <q-input v-model="filters.startDate" label="开始日期" dense clearable
                  @update:model-value="handleFilterChange" mask="date" :rules="['date']">
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
                <q-input v-model="filters.endDate" label="结束日期" dense clearable @update:model-value="handleFilterChange"
                  mask="date" :rules="['date']">
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

    <!-- 考勤记录列表 -->
    <div class="col-12 bg-white rounded-borders shadow-sm">
      <q-table :rows="attendances" :columns="columns" v-model:pagination="pagination"
        :rows-per-page-options="[10, 20, 30, 50, 100]" :filter="filters" @request="onRequest" row-key="index"
        :loading="tableLoading">
        <!-- 序号显示模板 -->
        <template #body-cell-index="props">
          <q-td :props="props">
            <div>{{ props.rowIndex + 1 }}</div>
          </q-td>
        </template>

        <!-- 员工信息 -->
        <template #body-cell-employee="props">
          <q-td :props="props">
            <div>{{ props.row.employee_name }}({{ props.row.employee_wbc }})</div>
          </q-td>
        </template>

        <!-- 考勤状态 -->
        <template #body-cell-attendance_status="props">
          <q-td :props="props">
            <q-badge :color="getAttendanceStatusColor(props.row.attendance_status)" :label="props.row.status_label" />
          </q-td>
        </template>

        <!-- 工作时长 -->
        <template #body-cell-working_hours="props">
          <q-td :props="props">
            <div>{{ props.row.working_hours }} 小时</div>
          </q-td>
        </template>

        <template #body-cell-actions="props">
          <q-td :props="props">
            <q-btn size="sm" color="info" icon="visibility" class="q-mr-1" @click="viewAttendanceDetail(props.row)"
              label="查看" />
            <q-btn size="sm" color="accent" icon="edit" @click="editAttendance(props.row)" label="编辑" />
            <q-btn size="sm" color="warning" icon="delete" @click="handleDeleteAttendance(props.row)" label="删除" />
          </q-td>
        </template>

        <template #loading>
          <div class="row items-center justify-center q-pa-md">
            <q-spinner size="40px" color="primary" />
            <span class="q-ml-md text-subtitle1">加载考勤记录中...</span>
          </div>
        </template>
      </q-table>
    </div>

    <!-- 查看记录详情弹窗 -->
    <q-dialog v-model="isDetailDialogOpen" persistent>
      <q-card style="width: 600px; max-width: 90vw;">
        <q-card-section>
          <div class="row items-center justify-between">
            <h5 class="text-h5">考勤详情</h5>
            <q-btn icon="close" flat round @click="isDetailDialogOpen = false" />
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pt-none">
          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">员工:</div>
            <div class="col-8">{{ attendanceDetail.employee_name }} ({{ attendanceDetail.employee_wbc }})</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">考勤日期:</div>
            <div class="col-8">{{ attendanceDetail.date ? formatDate(attendanceDetail.date) : '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">出勤状态:</div>
            <div class="col-8">
              <q-badge :color="getAttendanceStatusColor(attendanceDetail.attendance_status)"
                :label="attendanceDetail.status_label" />
            </div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">上班时间:</div>
            <div class="col-8">{{ attendanceDetail.check_in_time || '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">下班时间:</div>
            <div class="col-8">{{ attendanceDetail.check_out_time || '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">工作时长:</div>
            <div class="col-8">{{ attendanceDetail.working_hours ? `${attendanceDetail.working_hours} 小时` : '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">备注:</div>
            <div class="col-8">{{ attendanceDetail.description || '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">创建人:</div>
            <div class="col-8">{{ attendanceDetail.created_by_name || '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">创建时间:</div>
            <div class="col-8">{{ attendanceDetail.created_at ? formatDate(attendanceDetail.created_at) : '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">更新时间:</div>
            <div class="col-8">{{ attendanceDetail.updated_at ? formatDate(attendanceDetail.updated_at) : '-' }}</div>
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
          <p>确定要删除 {{ currentAttendance.employee_name }} 的考勤记录吗？</p>
          <div class="q-mt-sm">
            <q-radio v-model="isSoftDelete" val="true" label="软删除" class="q-mr-md" />
            <q-radio v-model="isSoftDelete" val="false" label="硬删除" />
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn label="取消" @click="isDeleteDialogOpen = false" color="secondary" />
          <q-btn label="删除" @click="confirmDeleteAttendance" color="warning" class="text-blue" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 新增/编辑表单对话框 -->
    <q-dialog v-model="isFormDialogOpen">
      <q-card style="width: 600px; max-width: 90vw;">
        <q-card-section>
          <div class="row items-center justify-between">
            <h5 class="text-h5">{{ formMode === 'add' ? '新增考勤' : '编辑考勤' }}</h5>
            <q-btn icon="close" flat round @click="isFormDialogOpen = false" />
          </div>
        </q-card-section>
        <q-card-section>
          <q-form @submit="handleSubmit">
            <div class="row q-col-gutter-md">
              <!-- 员工选择 -->
              <div class="col-12">
                <q-select v-model="currentAttendance.employee" label="员工 *" :options="employeeOptions"
                  option-label="employee_name" option-value="id" map-options emit-value clearable dense outlined
                  :rules="[val => !!val || '请选择员工']" />
              </div>

              <!-- 考勤日期 -->

              <div class="col-12">
                <q-input v-model="currentAttendance.date" label="考勤日期 *" dense outlined mask="####-##-##"
                  :rules="[val => /^\d{4}-\d{2}-\d{2}$/.test(val) || '请输入有效日期']">
                  <template #append>
                    <q-icon name="event" class="cursor-pointer">
                      <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                        <q-date v-model="currentAttendance.date" mask="YYYY-MM-DD">
                          <div class="row items-center justify-end">
                            <q-btn v-close-popup label="关闭" color="primary" flat />
                          </div>
                        </q-date>
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
              </div>


              <!-- 出勤状态 -->
              <div class="col-12">
                <q-select v-model="currentAttendance.attendance_status" label="出勤状态 *"
                  :options="attendanceStatusOptions" option-label="label" option-value="value" map-options emit-value
                  clearable dense outlined :rules="[val => val !== null && val !== undefined || '请选择出勤状态']" />
              </div>

              <!-- 上班时间和下班时间 -->
              <div class="col-6">
                <q-input v-model="currentAttendance.check_in_time" label="上班时间" dense outlined mask="time">
                  <template #append>
                    <q-icon name="access_time" class="cursor-pointer">
                      <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                        <q-time v-model="currentAttendance.check_in_time" mask="HH:mm">
                          <div class="row items-center justify-end">
                            <q-btn v-close-popup label="关闭" color="primary" flat />
                          </div>
                        </q-time>
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
              </div>

              <div class="col-6">
                <q-input v-model="currentAttendance.check_out_time" label="下班时间" dense outlined mask="time">
                  <template #append>
                    <q-icon name="access_time" class="cursor-pointer">
                      <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                        <q-time v-model="currentAttendance.check_out_time" mask="HH:mm">
                          <div class="row items-center justify-end">
                            <q-btn v-close-popup label="关闭" color="primary" flat />
                          </div>
                        </q-time>
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
              </div>

              <!-- 备注 -->
              <div class="col-12">
                <q-input v-model="currentAttendance.description" label="备注" dense outlined type="textarea" rows="3" />
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

    <!-- 1. 初始化导入弹窗 -->
    <q-dialog v-model="showInitImportDialog" max-width="700px">
      <q-card>
        <q-card-section class="row items-center justify-between">
          <h5 class="text-h5 text-negative">⚠️ 考勤初始化导入</h5>
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
                <li>1. 初始化导入将<span class="font-medium text-negative">覆盖现有考勤数据</span>，适用于系统首次上线或全量数据重置</li>
                <li>2. 若勾选"清空现有数据"，将删除所有考勤记录，<span class="font-medium text-negative">操作不可撤销</span></li>
                <li>3. 请确保导入文件包含必要字段（建议先下载模板）</li>
              </ul>
            </div>

            <!-- 模板下载 -->
            <div class="flex justify-between items-center">
              <p class="text-sm">请下载模板并按格式填写数据</p>
              <q-btn label="下载考勤初始化模板" color="secondary" icon="file_download" size="sm" @click="downloadInitTemplate" />
            </div>

            <!-- 文件上传 -->
            <q-uploader label="选择考勤初始化文件（仅支持.xlsx/.xls）" accept=".xlsx, .xls" :max-files="1" @added="handleFileSelected"
              @remove="() => { selectedFile = null; importErrors = []; }" dense class="mt-2">
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
              <q-checkbox v-model="initClearExisting" label="清空现有考勤数据" color="negative"
                @update:model-value="handleClearConfirm" />
            </div>

            <!-- 导入结果/错误展示 -->
            <div v-if="importErrors.length > 0" class="mt-4">
              <h6 class="text-negative text-sm font-medium">导入失败记录（共{{ importErrors.length }}条）</h6>
              <div class="bg-white border border-gray-200 rounded mt-2 max-h-60 overflow-auto">
                <q-table :rows="importErrors" :columns="importErrorColumns" row-key="row" dense hide-header flat />
              </div>
              <q-btn label="下载考勤错误详情" color="negative" size="sm" class="mt-2" @click="downloadImportErrors" dense />
            </div>

            <!-- 初始化成功统计 -->
            <div v-if="importResult" class="mt-4 bg-positive/10 p-3 rounded">
              <h6 class="text-positive font-medium">考勤初始化导入成功</h6>
              <ul class="text-sm mt-2 space-y-1">
                <li>成功创建考勤记录：{{ importResult.attendance_success_count }} 条</li>
                <li>失败记录：{{ importResult.error_count }} 条</li>
              </ul>
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md">
          <q-btn label="取消" color="secondary" @click="resetInitImportState" />
          <q-btn label="开始考勤初始化" color="negative" class="ml-2" @click="handleImport"
            :disable="!selectedFile || importLoading" :loading="importLoading" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 2. 普通导入弹窗 -->
    <q-dialog v-model="showNormalImportDialog" max-width="700px">
      <q-card>
        <q-card-section class="row items-center justify-between">
          <h5 class="text-h5">普通考勤导入</h5>
          <q-btn icon="close" flat round @click="closeImportDialogs" />
        </q-card-section>
        <q-card-section class="q-pa-md">
          <div class="space-y-4">
            <p class="text-sm">普通考勤导入仅新增/更新考勤记录，不删除现有数据，适用于日常批量更新</p>
            <div class="flex justify-between items-center">
              <p class="text-sm">请下载模板并按格式填写数据</p>
              <q-btn label="下载普通考勤导入模板" color="secondary" icon="file_download" size="sm"
                @click="downloadNormalTemplate" />
            </div>
            <q-uploader label="选择考勤普通导入文件（仅支持.xlsx/.xls）" accept=".xlsx, .xls" :max-files="1"
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
          <q-btn label="开始考勤普通导入" color="primary" class="ml-2" @click="handleImport"
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

// API导入 - 考勤相关接口
import {
  getAttendances,
  getAttendanceDetail,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  softDeleteAttendance,
  exportAttendances,
  importAttendances,
  downloadAttendanceTemplate,
  getEmployees
} from 'src/services/employeeServiceApi'

// 初始化Quasar
const $q = useQuasar()

// -------------------------- 基础状态变量 --------------------------
const attendances = ref([])
const tableLoading = ref(false)
const isDetailDialogOpen = ref(false)
const isDeleteDialogOpen = ref(false)
const isFormDialogOpen = ref(false)
const formMode = ref('add')

// -------------------------- 筛选与分页 --------------------------
const filters = ref({
  employee: null,
  attendanceStatus: null,
  startDate: null,
  endDate: null
})

const pagination = ref({
  page: 1,
  rowsPerPage: 10,
  sortBy: 'date',
  descending: true,
  rowsNumber: 0
})

// -------------------------- 数据模型 --------------------------
const currentAttendance = ref({
  id: null,
  employee: null,
  date: format(new Date(), 'yyyy-MM-dd'),
  attendance_status: 1, // 默认出勤
  check_in_time: null,
  check_out_time: null,
  description: ''
})

const attendanceDetail = ref({})
// -------------------------- 下拉选项配置 --------------------------
const employeeOptions = ref([])
const statusOptions = ref([
  { label: '全部', value: null },
  { label: 'P-出勤', value: 1 },
  { label: 'L-请假', value: 2 },
  { label: 'R-轮休', value: 3 },
  { label: 'S-停工待命', value: 4 },
  { label: 'D-节假日双倍工资', value: 5 },
  { label: 'J-休假返回', value: 9 }
])

const attendanceStatusOptions = ref([
  { label: 'P-出勤', value: 1 },
  { label: 'L-请假', value: 2 },
  { label: 'R-轮休', value: 3 },
  { label: 'S-停工待命', value: 4 },
  { label: 'D-节假日双倍工资', value: 5 },
  { label: 'J-休假返回', value: 9 }
])

// -------------------------- 删除选项 --------------------------
const isSoftDelete = ref('true')
// -------------------------- 表格配置 --------------------------
const columns = ref([
  { name: 'index', label: '序号', field: '', align: 'left', sortable: true, width: '80px' },
  { name: 'employee', label: '员工', field: 'employee_name', align: 'left', sortable: true },
  { name: 'date', label: '考勤日期', field: 'date', align: 'left', sortable: true, format: formatDate },
  { name: 'attendance_status', label: '出勤状态', field: 'attendance_status', align: 'left', sortable: true },
  { name: 'check_in_time', label: '上班时间', field: 'check_in_time', align: 'left', sortable: true },
  { name: 'check_out_time', label: '下班时间', field: 'check_out_time', align: 'left', sortable: true },
  { name: 'working_hours', label: '工作时长', field: 'working_hours', align: 'left', sortable: true },
  { name: 'created_by_name', label: '创建人', field: 'created_by_name', align: 'left', sortable: true },
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

// 获取考勤状态颜色
const getAttendanceStatusColor = (status) => {
  switch (status) {
    case 1: return 'positive'  // 出勤
    case 2: return 'warning'   // 请假
    case 3: return 'info'      // 轮休
    case 4: return 'negative'  // 停工待命
    case 5: return 'purple'    // 节假日双倍工资
    case 9: return 'teal'      // 休假返回
    default: return 'grey'
  }
}

// -------------------------- 操作方法 --------------------------
const openFormDialog = (mode, attendance = null) => {
  formMode.value = mode
  isFormDialogOpen.value = true

  if (mode === 'edit' && attendance) {
    currentAttendance.value = { ...attendance }
  } else {
    // 重置为默认值
    currentAttendance.value = {
      id: null,
      employee: null,
      date: format(new Date(), 'yyyy-MM-dd'),
      attendance_status: 1,
      check_in_time: null,
      check_out_time: null,
      description: ''
    }
    console.log('reset currentAttendance', currentAttendance.value)
  }
}

// -------------------------- 数据加载函数 --------------------------
// 工具函数：统一转成 YYYY-MM-DD
function formatFilterDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toISOString().split('T')[0]
}
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
  if (filters.value.employee) {
    params.append('employee', filters.value.employee)
  }

  if (filters.value.attendanceStatus) {
    params.append('attendance_status', filters.value.attendanceStatus)
  }

  if (filters.value.startDate) {
    params.append('start_date', formatFilterDate(filters.value.startDate))
  }
  if (filters.value.endDate) {
    params.append('end_date', formatFilterDate(filters.value.endDate))
  }

  return params
}

// 获取考勤列表
const fetchAttendances = async () => {
  try {
    tableLoading.value = true
    const params = buildFilterParams()
    const response = await getAttendances(params)

    if (response.status === 200) {
      attendances.value = response.data.results
      pagination.value.rowsNumber = response.data.count
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '获取考勤失败',
      position: 'top'
    })
  } finally {
    tableLoading.value = false
  }
}

const viewAttendanceDetail = async (attendance) => {
  isDetailDialogOpen.value = true
  try {
    const response = await getAttendanceDetail(attendance.id)
    if (response.status === 200) {
      attendanceDetail.value = response.data
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '获取考勤详情失败',
      position: 'top'
    })
  }
}

// 获取员工选项
async function fetchEmployeeOptions() {
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
  if (!currentAttendance.value.employee) {
    $q.notify({
      color: 'negative',
      message: '请选择员工',
      position: 'top'
    })
    return false
  }

  if (!currentAttendance.value.date) {
    $q.notify({
      color: 'negative',
      message: '请选择考勤日期',
      position: 'top'
    })
    return false
  }

  if (currentAttendance.value.attendance_status === null || currentAttendance.value.attendance_status === undefined) {
    $q.notify({
      color: 'negative',
      message: '请选择出勤状态',
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
      await handleAddAttendance()
    } else if (formMode.value === 'edit') {
      await handleEditAttendance(currentAttendance.value.id)
    }
  } finally {
    isFormDialogOpen.value = false
  }
}

// 添加考勤
const handleAddAttendance = async () => {
  try {
    const formData = {
      employee: currentAttendance.value.employee,
      date: currentAttendance.value.date,
      attendance_status: currentAttendance.value.attendance_status,
      check_in_time: currentAttendance.value.check_in_time,
      check_out_time: currentAttendance.value.check_out_time,
      description: currentAttendance.value.description
    }
    const response = await createAttendance(formData)
    if (response.status === 201) {
      $q.notify({
        color: 'positive',
        message: '添加考勤成功',
        position: 'top'
      })
      fetchAttendances()
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '添加考勤失败',
      position: 'top'
    })
  }
}

// 编辑考勤
const editAttendance = async (attendance) => {
  formMode.value = 'edit'
  isFormDialogOpen.value = true
  try {
    const response = await getAttendanceDetail(attendance.id)
    if (response.status === 200) {
      currentAttendance.value = {
        id: response.data.id,
        employee: response.data.employee,
        date: response.data.date,
        attendance_status: response.data.attendance_status,
        check_in_time: response.data.check_in_time,
        check_out_time: response.data.check_out_time,
        description: response.data.description
      }
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '获取考勤详情失败',
      position: 'top'
    })
  }
}

// 更新考勤
const handleEditAttendance = async (attendanceId) => {
  try {
    const formData = {
      employee: currentAttendance.value.employee,
      date: currentAttendance.value.date,
      attendance_status: currentAttendance.value.attendance_status,
      check_in_time: currentAttendance.value.check_in_time,
      check_out_time: currentAttendance.value.check_out_time,
      description: currentAttendance.value.description
    }

    const response = await updateAttendance(attendanceId, formData)
    if (response.status === 200) {
      $q.notify({
        color: 'positive',
        message: '更新考勤成功',
        position: 'top'
      })
      fetchAttendances()
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '更新考勤失败',
      position: 'top'
    })
  }
}

// -------------------------- 删除处理 --------------------------
const handleDeleteAttendance = async (attendance) => {
  currentAttendance.value.id = attendance.id
  currentAttendance.value.employee_name = attendance.employee_name
  isDeleteDialogOpen.value = true
}

// 确认删除考勤
const confirmDeleteAttendance = async () => {
  try {
    const deleteMode = isSoftDelete.value === 'true'
    let response
    if (deleteMode) {
      response = await softDeleteAttendance(currentAttendance.value.id)
    } else {
      response = await deleteAttendance(currentAttendance.value.id)
    }
    if (response.status === 204) {
      $q.notify({
        color: 'positive',
        message: deleteMode ? '软删除成功' : '硬删除成功',
        position: 'top'
      })
      fetchAttendances()
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '删除考勤失败',
      position: 'top'
    })
  } finally {
    isDeleteDialogOpen.value = false
  }
}

// -------------------------- 筛选与分页处理 --------------------------
const applyFilters = () => {
  pagination.value.page = 1
  fetchAttendances()
}

// 筛选条件变化
function handleFilterChange() {
  pagination.value.page = 1
}

// 重置筛选
function resetFilters() {
  filters.value = {
    employee: null,
    attendanceStatus: null,
    startDate: null,
    endDate: null
  }

  pagination.value.page = 1

  // 添加防抖处理
  clearTimeout(filterTimer)
  filterTimer = setTimeout(() => {
    fetchAttendances()
  }, 300)
}

// 表格排序/分页请求
function onRequest(props) {
  const { page, rowsPerPage, sortBy, descending } = props.pagination

  pagination.value.page = page
  pagination.value.rowsPerPage = rowsPerPage
  pagination.value.sortBy = sortBy
  pagination.value.descending = descending

  fetchAttendances()
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
    const response = await downloadAttendanceTemplate('init')
    handleFileDownload(response, '考勤初始化导入模板.xlsx')
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
    const response = await downloadAttendanceTemplate('normal')
    handleFileDownload(response, '考勤普通导入模板.xlsx')
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
      message: '确定要清空所有考勤数据吗？此操作将删除所有考勤记录，且无法恢复！',
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
    let clearExisting = false
    if (showInitImportDialog.value) {
      clearExisting = initClearExisting.value
    }

    const response = await importAttendances(selectedFile.value, clearExisting)

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
        fetchAttendances()
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
async function handleExportAttendances(exportType = 'all') {
  try {
    tableLoading.value = true

    // 构建导出参数
    let includeInactive = false

    // 如果是导出筛选结果，则使用当前筛选条件
    if (exportType === 'filtered') {
      // 根据当前筛选条件设置导出参数
      includeInactive = filters.value.isActive === false
    }

    const response = await exportAttendances(includeInactive)

    // 处理文件下载
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `考勤_${format(new Date(), 'yyyyMMddHHmmss')}.xlsx`
    document.body.appendChild(a)
    a.click()
    URL.revokeObjectURL(url)
    document.body.removeChild(a)

  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '导出考勤失败',
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

  exportExcel(exportData, `考勤导入错误详情_${format(new Date(), 'yyyyMMddHHmmss')}.xlsx`)
}

// -------------------------- 页面初始化 --------------------------
onMounted(() => {
  fetchEmployeeOptions()
  fetchAttendances()
})

onUnmounted(() => {
  if (filterTimer) {
    clearTimeout(filterTimer)
  }
})
</script>

<style scoped></style>
