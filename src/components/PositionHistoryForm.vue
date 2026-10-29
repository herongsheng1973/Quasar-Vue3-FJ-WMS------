<template>
  <q-page class="q-px-md">
    <!-- 页面标题和操作按钮 -->
    <div class="col-12 flex justify-between items-center mb-6 flex-wrap gap-4">
      <div>
        <h5 class="text-h5 q-ma-none">岗位变动管理</h5>
        <p class="text-grey text-subtitle2">管理员工岗位变动记录</p>
      </div>
      <div class="flex gap-2 flex-wrap">
        <!-- 新增岗位变动按钮 -->
        <q-btn color="primary" label="新增岗位变动" @click="openFormDialog('add')" />
        <!-- 岗位变动导入 -->
        <q-btn-dropdown color="secondary" label="岗位变动导入" icon="upload">
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
        <!-- 导出岗位变动 -->
        <q-btn-dropdown color="primary" label="导出岗位变动" icon="download">
          <q-list>
            <q-item clickable v-close-popup @click="handleExportPositionHistories('all')">
              <q-item-section avatar>
                <q-icon name="file_download" />
              </q-item-section>
              <q-item-section>
                <q-item-label>导出全部</q-item-label>
                <q-item-label caption>导出所有岗位变动记录</q-item-label>
              </q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="handleExportPositionHistories('filtered')">
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

          <!-- 是否激活筛选 -->
          <div class="col-md-2 col-sm-4 col-xs-12">
            <q-select v-model="filters.isActive" label="是否激活" :options="statusOptions" option-label="label"
              option-value="value" emit-value map-options clearable @update:model-value="handleFilterHistory" dense />
          </div>

          <!-- 变动日期范围 -->
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

    <!-- 岗位变动记录列表 -->
    <div class="col-12 bg-white rounded-borders shadow-sm">
      <q-table :rows="positionHistories" :columns="columns" v-model:pagination="pagination"
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

        <!-- 部门变动 -->
        <template #body-cell-department_change="props">
          <q-td :props="props">
            <div>{{ props.row.old_department_name }} → {{ props.row.new_department_name }}</div>
          </q-td>
        </template>

        <!-- 班组变动 -->
        <template #body-cell-team_change="props">
          <q-td :props="props">
            <div>{{ props.row.old_team_name }} → {{ props.row.new_team_name }}</div>
          </q-td>
        </template>

        <!-- 岗位变动 -->
        <template #body-cell-position_change="props">
          <q-td :props="props">
            <div>{{ props.row.old_position_name }} → {{ props.row.new_position_name }}</div>
          </q-td>
        </template>

        <template #body-cell-is_active="props">
          <q-td :props="props">
            <q-badge :color="getPositionStatusColor(props.row)" :label="getPositionStatusLabel(props.row)" />
          </q-td>
        </template>

        <template #body-cell-actions="props">
          <q-td :props="props">
            <q-btn size="sm" color="info" icon="visibility" class="q-mr-1" @click="viewPositionHistoryDetail(props.row)"
              label="查看" />
            <q-btn size="sm" color="accent" icon="edit" @click="editPositionHistory(props.row)" label="编辑" />
            <q-btn size="sm" color="warning" icon="delete" @click="handleDeletePositionHistory(props.row)" label="删除" />
          </q-td>
        </template>

        <template #loading>
          <div class="row items-center justify-center q-pa-md">
            <q-spinner size="40px" color="primary" />
            <span class="q-ml-md text-subtitle1">加载岗位变动记录中...</span>
          </div>
        </template>
      </q-table>
    </div>

    <!-- 查看记录详情弹窗 -->
    <q-dialog v-model="isDetailDialogOpen" persistent>
      <q-card style="width: 700px; max-width: 90vw;">
        <q-card-section>
          <div class="row items-center justify-between">
            <h5 class="text-h5">岗位变动详情</h5>
            <q-btn icon="close" flat round @click="isDetailDialogOpen = false" />
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pt-none">
          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">员工:</div>
            <div class="col-8">{{ positionHistoryDetail.employee_detail?.employee_name }}
              ({{ positionHistoryDetail.employee_detail?.wbc }})</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">原部门:</div>
            <div class="col-8">{{ positionHistoryDetail.old_department_detail?.department_name }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">新部门:</div>
            <div class="col-8">{{ positionHistoryDetail.new_department_detail?.department_name }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">原班组:</div>
            <div class="col-8">{{ positionHistoryDetail.old_team_detail?.team_name }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">新班组:</div>
            <div class="col-8">{{ positionHistoryDetail.new_team_detail?.team_name }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">原岗位:</div>
            <div class="col-8">{{ positionHistoryDetail.old_position_detail?.position_name }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">新岗位:</div>
            <div class="col-8">{{ positionHistoryDetail.new_position_detail?.position_name }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">变动日期:</div>
            <div class="col-8">{{ positionHistoryDetail.changed_date ? formatDate(positionHistoryDetail.changed_date)
              : '-'
            }}
            </div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">生效时间:</div>
            <div class="col-8">{{ positionHistoryDetail.effective_datetime ?
              formatDate(positionHistoryDetail.effective_datetime) : '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">是否激活:</div>
            <div class="col-8">
              <q-badge :color="positionHistoryDetail.is_active ? 'positive' : 'negative'"
                :label="positionHistoryDetail.is_active ? '正常' : '停用'" />
            </div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">变动原因:</div>
            <div class="col-8">{{ positionHistoryDetail.description || '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">操作人:</div>
            <div class="col-8">{{ positionHistoryDetail.created_by_detail?.username || '-' }}</div>
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
          <p>确定要删除 {{ currentPositionHistory.employee_name }} 的岗位变动记录吗？</p>
          <div class="q-mt-sm">
            <q-radio v-model="isSoftDelete" val="true" label="软删除" class="q-mr-md" />
            <q-radio v-model="isSoftDelete" val="false" label="硬删除" />
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn label="取消" @click="isDeleteDialogOpen = false" color="secondary" />
          <q-btn label="删除" @click="confirmDeletePositionHistory" color="warning" class="text-blue" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 新增/编辑表单对话框 -->
    <q-dialog v-model="isFormDialogOpen">
      <q-card style="width: 700px; max-width: 90vw;">
        <q-card-section>
          <div class="row items-center justify-between">
            <h5 class="text-h5">{{ formMode === 'add' ? '新增岗位变动' : '编辑岗位变动' }}</h5>
            <q-btn icon="close" flat round @click="isFormDialogOpen = false" />
          </div>
        </q-card-section>
        <q-card-section>
          <q-form @submit="handleSubmit">
            <div class="row q-col-gutter-md">
              <!-- 员工选择 -->
              <div class="col-12">
                <q-select v-model="currentPositionHistory.employee" label="员工" :options="employeeOptions"
                  option-label="employee_name" option-value="id" map-options emit-value clearable dense outlined
                  :rules="[val => !!val || '请选择员工']" />
              </div>

              <!-- 原部门和新部门 -->
              <div class="col-6">
                <q-select v-model="currentPositionHistory.old_department" label="原部门" :options="departmentOptions"
                  option-label="department_name" option-value="id" map-options emit-value clearable dense outlined
                  :rules="[val => !!val || '请选择原部门']" />
              </div>

              <div class="col-6">
                <q-select v-model="currentPositionHistory.new_department" label="新部门" :options="departmentOptions"
                  option-label="department_name" option-value="id" map-options emit-value clearable dense outlined
                  :rules="[val => !!val || '请选择新部门']" />
              </div>

              <!-- 原班组和新班组 -->
              <div class="col-6">
                <q-select v-model="currentPositionHistory.old_team" label="原班组" :options="teamOptions"
                  option-label="team_name" option-value="id" map-options emit-value clearable dense outlined
                  :rules="[val => !!val || '请选择原班组']" />
              </div>

              <div class="col-6">
                <q-select v-model="currentPositionHistory.new_team" label="新班组" :options="teamOptions"
                  option-label="team_name" option-value="id" map-options emit-value clearable dense outlined
                  :rules="[val => !!val || '请选择新班组']" />
              </div>

              <!-- 原岗位和新岗位 -->
              <div class="col-6">
                <q-select v-model="currentPositionHistory.old_position" label="原岗位" :options="positionOptions"
                  option-label="position_name" option-value="id" map-options emit-value clearable dense outlined
                  :rules="[val => !!val || '请选择原岗位']" />
              </div>

              <div class="col-6">
                <q-select v-model="currentPositionHistory.new_position" label="新岗位" :options="positionOptions"
                  option-label="position_name" option-value="id" map-options emit-value clearable dense outlined
                  :rules="[val => !!val || '请选择新岗位']" />
              </div>

              <!-- 变动日期 -->
              <div class="col-12">
                <q-input v-model="currentPositionHistory.changed_date" label="变动日期" dense outlined mask="date"
                  :rules="['date']">
                  <template #append>
                    <q-icon name="event" class="cursor-pointer">
                      <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                        <q-date v-model="currentPositionHistory.changed_date" mask="YYYY-MM-DD">
                          <div class="row items-center justify-end">
                            <q-btn v-close-popup label="关闭" color="primary" flat />
                          </div>
                        </q-date>
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
              </div>

              <!-- 变动原因 -->
              <div class="col-12">
                <q-input v-model="currentPositionHistory.description" label="变动原因" dense outlined type="textarea"
                  rows="3" />
              </div>

              <div class="col-12">
                <q-checkbox v-model="currentPositionHistory.is_active" label="是否激活" left-label />
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
          <h5 class="text-h5 text-negative">⚠️ 岗位变动初始化导入</h5>
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
                <li>1. 初始化导入将<span class="font-medium text-negative">覆盖现有岗位变动数据</span>，适用于系统首次上线或全量数据重置</li>
                <li>2. 若勾选"清空现有数据"，将删除所有岗位变动记录及变动记录，<span class="font-medium text-negative">操作不可撤销</span></li>
                <li>3. 请确保导入文件包含必要字段（建议先下载模板）</li>
              </ul>
            </div>

            <!-- 模板下载 -->
            <div class="flex justify-between items-center">
              <p class="text-sm">请下载模板并按格式填写数据</p>
              <q-btn label="下载岗位变动初始化模板" color="secondary" icon="file_download" size="sm"
                @click="downloadInitTemplate" />
            </div>

            <!-- 文件上传 -->
            <q-uploader label="选择岗位变动初始化文件（仅支持.xlsx/.xls）" accept=".xlsx, .xls" :max-files="1"
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
              <q-checkbox v-model="initClearExisting" label="清空现有岗位变动数据" color="negative"
                @update:model-value="handleClearConfirm" />
            </div>

            <!-- 导入结果/错误展示 -->
            <div v-if="importErrors.length > 0" class="mt-4">
              <h6 class="text-negative text-sm font-medium">导入失败记录（共{{ importErrors.length }}条）</h6>
              <div class="bg-white border border-gray-200 rounded mt-2 max-h-60 overflow-auto">
                <q-table :rows="importErrors" :columns="importErrorColumns" row-key="row" dense hide-header flat />
              </div>
              <q-btn label="下载岗位变动错误详情" color="negative" size="sm" class="mt-2" @click="downloadImportErrors" dense />
            </div>

            <!-- 初始化成功统计 -->
            <div v-if="importResult" class="mt-4 bg-positive/10 p-3 rounded">
              <h6 class="text-positive font-medium">岗位变动初始化导入成功</h6>
              <ul class="text-sm mt-2 space-y-1">
                <li>成功创建岗位变动记录：{{ importResult.position_success_count }} 条</li>
                <li>失败记录：{{ importResult.error_count }} 条</li>
              </ul>
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md">
          <q-btn label="取消" color="secondary" @click="resetInitImportState" />
          <q-btn label="开始岗位变动初始化" color="negative" class="ml-2" @click="handleImport"
            :disable="!selectedFile || importLoading" :loading="importLoading" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 2. 普通导入弹窗 -->
    <q-dialog v-model="showNormalImportDialog" max-width="700px">
      <q-card>
        <q-card-section class="row items-center justify-between">
          <h5 class="text-h5">普通岗位变动导入</h5>
          <q-btn icon="close" flat round @click="closeImportDialogs" />
        </q-card-section>
        <q-card-section class="q-pa-md">
          <div class="space-y-4">
            <p class="text-sm">普通岗位变动导入仅新增/更新岗位变动记录，不删除现有数据，适用于日常批量更新</p>
            <div class="flex justify-between items-center">
              <p class="text-sm">请下载模板并按格式填写数据</p>
              <q-btn label="下载普通岗位变动导入模板" color="secondary" icon="file_download" size="sm"
                @click="downloadNormalTemplate" />
            </div>
            <q-uploader label="选择岗位变动普通导入文件（仅支持.xlsx/.xls）" accept=".xlsx, .xls" :max-files="1"
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
          <q-btn label="开始岗位变动普通导入" color="primary" class="ml-2" @click="handleImport"
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
import { fileUtils } from 'src/services/employeeServiceApi'
// 添加防抖计时器引用
let filterTimer = null

// API导入 - 修改为岗位变动相关接口
import {
  getEmployees,
  getDepartments,
  getTeams,
  getPositions,
  getPositionHistories,
  getPositionHistoryDetail,
  createPositionHistory,
  updatePositionHistory,
  deletePositionHistory,
  softDeletePositionHistory,
  exportPositionHistories,
  importPositionHistories,
  downloadPositionHistoryTemplate
} from 'src/services/employeeServiceApi'

// 初始化Quasar
const $q = useQuasar()

// -------------------------- 基础状态变量 --------------------------
const positionHistories = ref([])
const tableLoading = ref(false)
const isDetailDialogOpen = ref(false)
const isDeleteDialogOpen = ref(false)
const isFormDialogOpen = ref(false)
const formMode = ref('add')

// -------------------------- 筛选与分页 --------------------------
const filters = ref({
  employeeSearch: '',
  isActive: true,
  startDate: null,
  endDate: null
})

const pagination = ref({
  page: 1,
  rowsPerPage: 10,
  sortBy: 'effective_datetime',
  descending: true,
  rowsNumber: 0
})

// -------------------------- 数据模型 --------------------------
const currentPositionHistory = ref({
  id: null,
  employee: null,
  old_department: null,
  new_department: null,
  old_team: null,
  new_team: null,
  old_position: null,
  new_position: null,
  changed_date: format(new Date(), 'yyyy-MM-dd'),
  description: '',
  is_active: true
})

const positionHistoryDetail = ref({})
// -------------------------- 下拉选项配置 --------------------------
const employeeOptions = ref([])
const departmentOptions = ref([])
const teamOptions = ref([])
const positionOptions = ref([])

const statusOptions = ref([
  { label: '全部', value: null },
  { label: '是', value: true },
  { label: '否', value: false },
])
// -------------------------- 删除选项 --------------------------
const isSoftDelete = ref('true')
// -------------------------- 表格配置 --------------------------
const columns = ref([
  { name: 'index', label: '序号', field: '', align: 'left', sortable: true, width: '80px' },
  { name: 'employee', label: '员工', field: 'employee_name', align: 'left', sortable: true },
  { name: 'department_change', label: '部门变动', field: 'department_change', align: 'left', sortable: true },
  { name: 'team_change', label: '班组变动', field: 'team_change', align: 'left', sortable: true },
  { name: 'position_change', label: '岗位变动', field: 'position_change', align: 'left', sortable: true },
  { name: 'changed_date', label: '变动日期', field: 'changed_date', align: 'left', sortable: true, format: formatDate },
  { name: 'effective_datetime', label: '生效时间', field: 'effective_datetime', align: 'left', sortable: true, format: formatDate },
  { name: 'is_active', label: '是否激活', field: 'is_active', align: 'left', sortable: true },
  { name: 'created_by_name', label: '操作人', field: 'created_by_name', align: 'left', sortable: true },
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

// 获取岗位变动状态标签
const getPositionStatusLabel = (positionChange) => {
  if (!positionChange || !positionChange.is_active) return '未知'
  return positionChange.is_active ? '正常' : '停用'
}

// 获取岗位变动状态颜色
const getPositionStatusColor = (positionChange) => {
  if (!positionChange || !positionChange.is_active) return 'grey'
  return positionChange.is_active ? 'positive' : 'negative'
}

// -------------------------- 操作方法 --------------------------
const openFormDialog = (mode, positionHistory = null) => {
  formMode.value = mode
  isFormDialogOpen.value = true

  if (mode === 'edit' && positionHistory) {
    currentPositionHistory.value = { ...positionHistory }
  } else {
    // 重置为默认值
    currentPositionHistory.value = {
      id: null,
      employee: null,
      old_department: null,
      new_department: null,
      old_team: null,
      new_team: null,
      old_position: null,
      new_position: null,
      changed_date: format(new Date(), 'yyyy-MM-dd'),
      description: '',
      is_active: true
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

  if (filters.value.isActive !== null) {
    const isActiveValue = filters.value.isActive ? 'True' : 'False'
    params.append('is_active', isActiveValue)
  }

  if (filters.value.startDate) {
    params.append('start_date', filters.value.startDate)
  }

  if (filters.value.endDate) {
    params.append('end_date', filters.value.endDate)
  }

  return params
}

// 获取岗位变动列表
const fetchPositionHistories = async () => {
  try {
    tableLoading.value = true
    const params = buildFilterParams()
    const response = await getPositionHistories(params)

    if (response.status === 200) {
      positionHistories.value = response.data.results
      pagination.value.rowsNumber = response.data.count
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '获取岗位变动失败',
      position: 'top'
    })
  } finally {
    tableLoading.value = false
  }
}

const viewPositionHistoryDetail = async (positionHistory) => {
  isDetailDialogOpen.value = true
  try {
    const response = await getPositionHistoryDetail(positionHistory.id)
    if (response.status === 200) {
      positionHistoryDetail.value = response.data
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '获取岗位变动详情失败',
      position: 'top'
    })
  }
}

// -------------------------- 新增/编辑处理 --------------------------
// 表单验证
const validateForm = () => {
  if (!currentPositionHistory.value.employee) {
    $q.notify({
      color: 'negative',
      message: '请选择员工',
      position: 'top'
    })
    return false
  }

  if (!currentPositionHistory.value.old_department) {
    $q.notify({
      color: 'negative',
      message: '请选择原部门',
      position: 'top'
    })
    return false
  }

  if (!currentPositionHistory.value.new_department) {
    $q.notify({
      color: 'negative',
      message: '请选择新部门',
      position: 'top'
    })
    return false
  }

  if (!currentPositionHistory.value.old_team) {
    $q.notify({
      color: 'negative',
      message: '请选择原班组',
      position: 'top'
    })
    return false
  }

  if (!currentPositionHistory.value.new_team) {
    $q.notify({
      color: 'negative',
      message: '请选择新班组',
      position: 'top'
    })
    return false
  }

  if (!currentPositionHistory.value.old_position) {
    $q.notify({
      color: 'negative',
      message: '请选择原岗位',
      position: 'top'
    })
    return false
  }

  if (!currentPositionHistory.value.new_position) {
    $q.notify({
      color: 'negative',
      message: '请选择新岗位',
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
      await handleAddPositionHistory()
    } else if (formMode.value === 'edit') {
      await handleEditPositionHistory(currentPositionHistory.value.id)
    }
  } finally {
    isFormDialogOpen.value = false
  }
}

// 添加岗位变动
const handleAddPositionHistory = async () => {
  try {
    const formData = {
      employee: currentPositionHistory.value.employee,
      old_department: currentPositionHistory.value.old_department,
      new_department: currentPositionHistory.value.new_department,
      old_team: currentPositionHistory.value.old_team,
      new_team: currentPositionHistory.value.new_team,
      old_position: currentPositionHistory.value.old_position,
      new_position: currentPositionHistory.value.new_position,
      changed_date: currentPositionHistory.value.changed_date,
      description: currentPositionHistory.value.description,
      is_active: currentPositionHistory.value.is_active
    }
    const response = await createPositionHistory(formData)
    if (response.status === 201) {
      $q.notify({
        color: 'positive',
        message: '添加岗位变动成功',
        position: 'top'
      })
      fetchPositionHistories()
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '添加岗位变动失败',
      position: 'top'
    })
  }
}

// 编辑岗位变动
const editPositionHistory = async (positionHistory) => {
  formMode.value = 'edit'
  isFormDialogOpen.value = true
  try {
    const response = await getPositionHistoryDetail(positionHistory.id)
    if (response.status === 200) {
      currentPositionHistory.value = {
        id: response.data.id,
        employee: response.data.employee,
        old_department: response.data.old_department,
        new_department: response.data.new_department,
        old_team: response.data.old_team,
        new_team: response.data.new_team,
        old_position: response.data.old_position,
        new_position: response.data.new_position,
        changed_date: response.data.changed_date,
        description: response.data.description,
        is_active: response.data.is_active
      }
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '获取岗位变动详情失败',
      position: 'top'
    })
  }
}

// 更新岗位变动
const handleEditPositionHistory = async (positionHistoryId) => {
  try {
    const formData = {
      description: currentPositionHistory.value.description,
      is_active: currentPositionHistory.value.is_active
    }

    const response = await updatePositionHistory(positionHistoryId, formData)
    if (response.status === 200) {
      $q.notify({
        color: 'positive',
        message: '更新岗位变动成功',
        position: 'top'
      })
      fetchPositionHistories()
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '更新岗位变动失败',
      position: 'top'
    })
  }
}

// -------------------------- 删除处理 --------------------------
const handleDeletePositionHistory = async (positionHistory) => {
  currentPositionHistory.value.id = positionHistory.id
  currentPositionHistory.value.employee_name = positionHistory.employee_name
  isDeleteDialogOpen.value = true
}

// 确认删除岗位变动
const confirmDeletePositionHistory = async () => {
  try {
    const deleteMode = isSoftDelete.value === 'true'
    let response
    if (deleteMode) {
      response = await softDeletePositionHistory(currentPositionHistory.value.id)
    } else {
      response = await deletePositionHistory(currentPositionHistory.value.id)
    }
    if (response.status === 204) {
      $q.notify({
        color: 'positive',
        message: deleteMode ? '软删除成功' : '硬删除成功',
        position: 'top'
      })
      fetchPositionHistories()
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '删除岗位变动失败',
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

    // 获取部门选项
    const departmentsResponse = await getDepartments()
    if (departmentsResponse.status === 200) {
      departmentOptions.value = departmentsResponse.data.map(item => ({
        id: item.id,
        department_name: item.department_name
      }))
    }

    // 获取班组选项
    const teamsResponse = await getTeams()
    if (teamsResponse.status === 200) {
      teamOptions.value = teamsResponse.data.map(item => ({
        id: item.id,
        team_name: item.team_name
      }))
    }

    // 获取岗位选项
    const positionsResponse = await getPositions()
    if (positionsResponse.status === 200) {
      positionOptions.value = positionsResponse.data.map(item => ({
        id: item.id,
        position_name: item.position_name
      }))
    }
  } catch (error) {
    console.error('获取下拉选项失败:', error)
  }
}

const applyFilters = () => {
  pagination.value.page = 1
  fetchPositionHistories()
}

// 筛选条件变化
function handleFilterHistory() {
  pagination.value.page = 1
}

// 重置筛选
function resetFilters() {
  filters.value = {
    employeeSearch: '',
    isActive: null,
    startDate: null,
    endDate: null
  }

  pagination.value.page = 1

  // 添加防抖处理
  clearTimeout(filterTimer)
  filterTimer = setTimeout(() => {
    fetchPositionHistories()
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
  fetchPositionHistories()
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
    const response = await downloadPositionHistoryTemplate({ type: 'init' })
    fileUtils.downloadBlob(response.data, '岗位变动初始化导入模板.xlsx')
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
    const response = await downloadPositionHistoryTemplate({ type: 'normal' })
    fileUtils.downloadBlob(response.data, '岗位变动普通导入模板.xlsx')
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
      message: '确定要清空所有岗位变动数据吗？此操作将删除所有岗位变动记录，且无法恢复！',
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
    if (showInitImportDialog.value && initClearExisting.value) {
      additionalParams.clear_existing = true
    }

    const response = await importPositionHistories(selectedFile.value, additionalParams)

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
        fetchPositionHistories()
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
async function handleExportPositionHistories(exportType = 'all') {
  try {
    tableLoading.value = true

    // 构建导出参数
    const params = {}

    // 如果是导出筛选结果，则使用当前筛选条件
    if (exportType === 'filtered') {
      // 添加筛选参数到导出请求中
      if (filters.value.employeeSearch) {
        params.search = filters.value.employeeSearch
      }

      if (filters.value.isActive !== null) {
        params.is_active = filters.value.isActive ? 'True' : 'False'
      }

      if (filters.value.startDate) {
        params.start_date = filters.value.startDate
      }

      if (filters.value.endDate) {
        params.end_date = filters.value.endDate
      }
    }

    const response = await exportPositionHistories(params)
    const filename = `岗位变动_${format(new Date(), 'yyyyMMddHHmmss')}.xlsx`
    fileUtils.downloadBlob(response.data, filename)

  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '导出岗位变动失败',
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

  exportExcel(exportData, `岗位变动导入错误详情_${format(new Date(), 'yyyyMMddHHmmss')}.xlsx`)
}

// -------------------------- 页面初始化 --------------------------
onMounted(() => {
  fetchSelectOptions()
  fetchPositionHistories()
})

onUnmounted(() => {
  if (filterTimer) {
    clearTimeout(filterTimer)
  }
})
</script>

<style scoped></style>
