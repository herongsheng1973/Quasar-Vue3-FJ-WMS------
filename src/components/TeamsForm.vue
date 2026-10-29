<template>
  <q-page class="q-px-md">
    <!-- 页面标题和操作按钮 -->
    <div class="col-12 flex justify-between items-center mb-6 flex-wrap gap-4">
      <div>
        <h5 class="text-h5 q-ma-none">班组管理</h5>
        <p class="text-grey text-subtitle2">管理所有班组信息</p>
      </div>
      <div class="flex gap-2 flex-wrap">
        <!-- 新增班组按钮 -->
        <q-btn color="primary" label="新增班组" @click="openFormDialog('add')" />
        <!-- 查看树形结构按钮 -->
        <q-btn color="info" label="查看树形结构" @click="viewTeamTree" />
        <!-- 班组导入 -->
        <q-btn-dropdown color="secondary" label="班组导入" icon="upload">
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
        <!-- 导出班组 -->
        <q-btn-dropdown color="primary" label="导出班组" icon="download">
          <q-list>
            <q-item clickable v-close-popup @click="handleExportTeams('all')">
              <q-item-section avatar>
                <q-icon name="file_download" />
              </q-item-section>
              <q-item-section>
                <q-item-label>导出全部</q-item-label>
                <q-item-label caption>导出所有班组记录</q-item-label>
              </q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="handleExportTeams('filtered')">
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
          <!-- 所属部门筛选 -->
          <div class="col-md-2 col-sm-4 col-xs-12">
            <q-select v-model="filters.department" label="所属部门" :options="departmentOptions"
              option-label="department_name" option-value="id" emit-value map-options clearable dense />
          </div>

          <div class="col-md-2 col-sm-4 col-xs-12">
            <q-select v-model="filters.parent_team" label="上级班组" :options="parentTeamOptions" option-label="team_name"
              option-value="id" emit-value map-options clearable dense />
          </div>

          <div class="col-md-3 col-sm-6 col-xs-12">
            <q-input v-model="filters.searchQuery" label="搜索班组/描述" emit-value map-options clearable
              @update:model-value="handleFilterChange" dense />
          </div>

          <div class="col-md-2 col-sm-4 col-xs-12">
            <q-select v-model="filters.isActive" label="是否激活" :options="statusOptions" option-label="label"
              option-value="value" emit-value map-options clearable @update:model-value="handleFilterChange" dense />
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

    <!-- 班组记录列表 -->
    <div class="col-12 bg-white rounded-borders shadow-sm">
      <q-table :rows="teams" :columns="columns" v-model:pagination="pagination"
        :rows-per-page-options="[10, 20, 30, 50, 100]" :filter="filters" @request="onRequest" row-key="id"
        :loading="tableLoading">
        <!-- 序号显示模板 -->
        <template #body-cell-index="props">
          <q-td :props="props">
            <div>{{ (pagination.page - 1) * pagination.rowsPerPage + props.rowIndex + 1 }}</div>
          </q-td>
        </template>

        <template #body-cell-is_active="props">
          <q-td :props="props">
            <q-badge :color="getTeamStatusColor(props.row)" :label="getTeamStatusLabel(props.row)" />
          </q-td>
        </template>

        <template #body-cell-actions="props">
          <q-td :props="props">
            <q-btn size="sm" color="info" icon="visibility" class="q-mr-1" @click="viewTeamDetail(props.row)"
              label="查看" />
            <q-btn size="sm" color="accent" icon="edit" @click="editTeam(props.row)" label="编辑" />
            <q-btn size="sm" color="warning" icon="delete" @click="handleDeleteTeam(props.row)" label="删除" />
          </q-td>
        </template>

        <template #loading>
          <div class="row items-center justify-center q-pa-md">
            <q-spinner size="40px" color="primary" />
            <span class="q-ml-md text-subtitle1">加载班组记录中...</span>
          </div>
        </template>
      </q-table>
    </div>

    <!-- 查看记录详情弹窗 -->
    <q-dialog v-model="isDetailDialogOpen" persistent>
      <q-card style="width: 500px;">
        <q-card-section>
          <div class="row items-center justify-between">
            <h5 class="text-h5">班组详情</h5>
            <q-btn icon="close" flat round @click="isDetailDialogOpen = false" />
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pt-none">
          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">班组名称:</div>
            <div class="col-8">{{ teamDetail.team_name || '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">上级班组:</div>
            <div class="col-8">{{ teamDetail.parent_team_name || '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">所属部门:</div>
            <div class="col-8">{{ teamDetail.department_name || '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">班组描述:</div>
            <div class="col-8">{{ teamDetail.description || '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">是否激活:</div>
            <div class="col-8">
              <q-badge :color="teamDetail.is_active ? 'positive' : 'negative'"
                :label="teamDetail.is_active ? '正常' : '停用'" />
            </div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">创建时间:</div>
            <div class="col-8">{{ teamDetail.created_at ? formatDate(teamDetail.created_at) : '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">创建人:</div>
            <div class="col-8">{{ teamDetail.created_by_name || '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">更新时间:</div>
            <div class="col-8">{{ teamDetail.updated_at ? formatDate(teamDetail.updated_at) : '-' }}</div>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn label="关闭" color="primary" @click="isDetailDialogOpen = false" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 班组树形结构弹窗 -->
    <q-dialog v-model="isTreeDialogOpen" maximized>
      <q-card>
        <q-card-section>
          <div class="row items-center justify-between">
            <h5 class="text-h5">班组树形结构</h5>
            <q-btn icon="close" flat round @click="isTreeDialogOpen = false" />
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pa-md">
          <q-tree :nodes="teamTreeData" node-key="id" label-key="team_name" children-key="children" default-expand-all>
            <template #default-header="props">
              <div class="row items-center">
                <q-icon :name="props.node.is_active ? 'group' : 'group_off'"
                  :color="props.node.is_active ? 'positive' : 'negative'" class="q-mr-sm" />
                <span>{{ props.node.team_name }}</span>
                <q-badge v-if="!props.node.is_active" color="negative" class="q-ml-sm">
                  停用
                </q-badge>
              </div>
            </template>
          </q-tree>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn label="关闭" color="primary" @click="isTreeDialogOpen = false" />
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
          <p>确定要删除班组 {{ currentTeam.team_name }} 吗？</p>
          <div class="q-mt-sm">
            <q-radio v-model="isSoftDelete" val="true" label="软删除" class="q-mr-md" />
            <q-radio v-model="isSoftDelete" val="false" label="硬删除" />
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn label="取消" @click="isDeleteDialogOpen = false" color="secondary" />
          <q-btn label="删除" @click="confirmDeleteTeam" color="warning" class="text-blue" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 新增/编辑表单对话框 -->
    <q-dialog v-model="isFormDialogOpen">
      <q-card style="width: 500px;">
        <q-card-section>
          <div class="row items-center justify-between">
            <h5 class="text-h5">{{ formMode === 'add' ? '新增班组' : '编辑班组' }}</h5>
            <q-btn icon="close" flat round @click="isFormDialogOpen = false" />
          </div>
        </q-card-section>
        <q-card-section>
          <q-form @submit="handleSubmit">
            <div class="row q-col-gutter-md">
              <div class="col-12">
                <q-input v-model="currentTeam.team_name" label="班组名称" dense outlined
                  :rules="[val => !!val || '班组名称不能为空']" />
              </div>

              <div class="col-12">
                <q-input v-model="currentTeam.description" label="班组描述" dense outlined type="textarea" rows="3" />
              </div>

              <div class="col-12">
                <q-select v-model="currentTeam.parent_team" label="上级班组" :options="parentTeamOptions"
                  option-label="team_name" option-value="id" map-options emit-value clearable dense outlined />
              </div>

              <!-- 所属部门 -->
              <div class="col-12">
                <q-select v-model="currentTeam.department" label="所属部门" :options="departmentOptions"
                  option-label="department_name" option-value="id" map-options clearable dense outlined
                  :rules="[val => !!val || '请选择所属部门']" />
              </div>

              <div class="col-12">
                <q-checkbox v-model="currentTeam.is_active" label="是否激活" left-label />
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
          <h5 class="text-h5 text-negative">⚠️ 班组初始化导入</h5>
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
                <li>1. 初始化导入将<span class="font-medium text-negative">覆盖现有班组数据</span>，适用于系统首次上线或全量数据重置</li>
                <li>2. 若勾选"清空现有数据"，将删除所有班组记录及变动记录，<span class="font-medium text-negative">操作不可撤销</span></li>
                <li>3. 请确保导入文件包含"班组名称、上级班组、所属部门"等必填字段（建议先下载模板）</li>
              </ul>
            </div>

            <!-- 模板下载 -->
            <div class="flex justify-between items-center">
              <p class="text-sm">请下载模板并按格式填写数据</p>
              <q-btn label="下载班组初始化模板" color="secondary" icon="file_download" size="sm" @click="downloadInitTemplate" />
            </div>

            <!-- 文件上传 -->
            <q-uploader label="选择班组初始化文件（仅支持.xlsx/.xls）" accept=".xlsx, .xls" :max-files="1" @added="handleFileSelected"
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
              <q-checkbox v-model="initClearExisting" label="清空现有班组数据" color="negative"
                @update:model-value="handleClearConfirm" />
            </div>

            <!-- 导入结果/错误展示 -->
            <div v-if="importErrors.length > 0" class="mt-4">
              <h6 class="text-negative text-sm font-medium">导入失败记录（共{{ importErrors.length }}条）</h6>
              <div class="bg-white border border-gray-200 rounded mt-2 max-h-60 overflow-auto">
                <q-table :rows="importErrors" :columns="importErrorColumns" row-key="row" dense hide-header flat />
              </div>
              <q-btn label="下载班组错误详情" color="negative" size="sm" class="mt-2" @click="downloadImportErrors" dense />
            </div>

            <!-- 初始化成功统计 -->
            <div v-if="importResult" class="mt-4 bg-positive/10 p-3 rounded">
              <h6 class="text-positive font-medium">班组初始化导入成功</h6>
              <ul class="text-sm mt-2 space-y-1">
                <li>成功创建班组记录：{{ importResult.team_success_count }} 条</li>
                <li>失败记录：{{ importResult.error_count }} 条</li>
              </ul>
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md">
          <q-btn label="取消" color="secondary" @click="resetInitImportState" />
          <q-btn label="开始班组初始化" color="negative" class="ml-2" @click="handleImport"
            :disable="!selectedFile || importLoading" :loading="importLoading" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 2. 普通导入弹窗（保留原功能，区分初始化） -->
    <q-dialog v-model="showNormalImportDialog" max-width="700px">
      <q-card>
        <q-card-section class="row items-center justify-between">
          <h5 class="text-h5">普通班组导入</h5>
          <q-btn icon="close" flat round @click="closeImportDialogs" />
        </q-card-section>
        <q-card-section class="q-pa-md">
          <div class="space-y-4">
            <p class="text-sm">普通班组导入仅新增/更新班组记录，不删除现有数据，适用于日常批量更新</p>
            <div class="flex justify-between items-center">
              <p class="text-sm">请下载模板并按格式填写数据</p>
              <q-btn label="下载普通班组导入模板" color="secondary" icon="file_download" size="sm"
                @click="downloadNormalTemplate" />
            </div>
            <q-uploader label="选择班组普通导入文件（仅支持.xlsx/.xls）" accept=".xlsx, .xls" :max-files="1"
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
          <q-btn label="开始班组普通导入" color="primary" class="ml-2" @click="handleImport"
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

// API导入 - 修改为班组相关接口
import {
  getTeams,
  getTeamDetail,
  createTeam,
  updateTeam,
  deleteTeam,
  getTeamTree,
  softDeleteTeam,
  getDepartments,
  exportTeams,
  importTeams,
  downloadTeamTemplate,
  fileUtils
} from 'src/services/employeeServiceApi'

// 初始化Quasar
const $q = useQuasar()

// -------------------------- 基础状态变量 --------------------------
const teams = ref([])
const tableLoading = ref(false)
const isDetailDialogOpen = ref(false)
const isDeleteDialogOpen = ref(false)
const isFormDialogOpen = ref(false)
const formMode = ref('add')

// -------------------------- 筛选与分页 --------------------------
const filters = ref({
  parent_team: null,
  department: null,
  isActive: null,
  searchQuery: '',
})

const pagination = ref({
  page: 1,
  rowsPerPage: 10,
  sortBy: 'id',
  descending: true,
  rowsNumber: 0
})

// -------------------------- 数据模型 --------------------------
const currentTeam = ref({
  id: null,
  team_name: '',
  description: '',
  parent_team: null,
  department: null,
  is_active: true
})

const teamDetail = ref({})
// -------------------------- 下拉选项配置 --------------------------
const parentTeamOptions = ref([])
const departmentOptions = ref([])
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
  { name: 'team_name', label: '班组名称', field: 'team_name', align: 'left', sortable: true },
  { name: 'parent_team', label: '上级班组', field: 'parent_team_name', align: 'left', sortable: true },
  { name: 'department_name', label: '所属部门', field: 'department_name', align: 'left', sortable: true },
  { name: 'is_active', label: '是否激活', field: 'is_active', align: 'left', sortable: true },
  { name: 'created_at', label: '创建时间', field: 'created_at', align: 'left', sortable: true, format: formatDate },
  { name: 'created_by_name', label: '创建人', field: 'created_by_name', align: 'left', sortable: true },
  { name: 'updated_at', label: '更新时间', field: 'updated_at', align: 'left', sortable: true, format: formatDate },
  { name: 'actions', label: '操作', field: 'actions', align: 'center', width: '180px' }
])
// 导入错误表格列
const importErrorColumns = ref([
  { name: 'row', label: '行号', field: 'row', width: '80px' },
  { name: 'data', label: '数据', field: 'data', format: (val) => JSON.stringify(val).slice(0, 50) + '...' },
  { name: 'error', label: '错误原因', field: 'error' }
])

// -------------------------- 树形班组相关状态变量 --------------------------
const isTreeDialogOpen = ref(false)
const teamTreeData = ref([])

// -------------------------- 工具函数 --------------------------
// 日期格式化
function formatDate(dateString) {
  if (!dateString) return ''
  return format(parseISO(dateString), 'yyyy-MM-dd HH:mm')
}

// 获取班组状态标签
const getTeamStatusLabel = (team) => {
  if (!team || !team.is_active) return '未知'
  return team.is_active ? '正常' : '停用'
}

// 获取班组状态颜色
const getTeamStatusColor = (team) => {
  if (!team || !team.is_active) return 'grey'
  return team.is_active ? 'positive' : 'negative'
}

// -------------------------- 操作方法 --------------------------
const openFormDialog = (mode, team = null) => {
  formMode.value = mode
  isFormDialogOpen.value = true

  if (mode === 'edit' && team) {
    currentTeam.value = { ...team }
  } else {
    // 重置为默认值
    currentTeam.value = {
      id: null,
      team_name: '',
      description: '',
      parent_team: null,
      department: null,
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
  if (filters.value.searchQuery) {
    params.append('search', filters.value.searchQuery)
  }

  if (filters.value.parent_team) {
    params.append('parent_team', filters.value.parent_team)
  }

  if (filters.value.department) {
    params.append('department', filters.value.department)
  }

  if (filters.value.isActive !== null) {
    const isActiveValue = filters.value.isActive ? 'True' : 'False'
    params.append('is_active', isActiveValue)
  }

  return params
}

// 获取班组列表
const fetchTeams = async () => {
  try {
    tableLoading.value = true
    const params = buildFilterParams()
    const response = await getTeams(params)

    if (response.status === 200) {
      teams.value = response.data.results
      pagination.value.rowsNumber = response.data.count
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '获取班组失败',
      position: 'top'
    })
  } finally {
    tableLoading.value = false
  }
}

const viewTeamDetail = async (team) => {
  isDetailDialogOpen.value = true
  try {
    const response = await getTeamDetail(team.id)
    if (response.status === 200) {
      teamDetail.value = response.data
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '获取班组详情失败',
      position: 'top'
    })
  }
}

// 获取上级班组
async function fetchParentTeams() {
  try {
    const params = new URLSearchParams()
    params.append('parent_team', 'null')
    params.append('is_active', 'True')

    const response = await getTeams(params)
    if (response.status === 200) {
      parentTeamOptions.value = response.data.results
    }
  } catch (error) {
    console.error('获取上级班组失败:', error)
  }
}

// 获取所有部门
async function fetchDepartments() {
  try {
    const response = await getDepartments()
    if (response.status === 200) {
      departmentOptions.value = response.data.results
    }
  } catch (error) {
    console.error('获取部门列表失败:', error)
  }
}

// -------------------------- 新增/编辑处理 --------------------------
// 表单验证
const validateForm = () => {
  if (!currentTeam.value.team_name?.trim()) {
    $q.notify({
      color: 'negative',
      message: '请输入班组名称',
      position: 'top'
    })
    return false
  }

  if (!currentTeam.value.department) {
    $q.notify({
      color: 'negative',
      message: '请选择所属部门',
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
      await handleAddTeam()
    } else if (formMode.value === 'edit') {
      await handleEditTeam(currentTeam.value.id)
    }
  } finally {
    isFormDialogOpen.value = false
  }
}

// 添加班组
const handleAddTeam = async () => {
  try {
    const formData = {
      team_name: currentTeam.value.team_name.trim(),
      description: currentTeam.value.description?.trim(),
      parent_team: currentTeam.value.parent_team,
      department: currentTeam.value.department.id,
      is_active: currentTeam.value.is_active
    }
    const response = await createTeam(formData)
    if (response.status === 201) {
      $q.notify({
        color: 'positive',
        message: '添加班组成功',
        position: 'top'
      })
      fetchTeams()
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '添加班组失败',
      position: 'top'
    })
  }
}

// 编辑班组
const editTeam = async (team) => {
  formMode.value = 'edit'
  isFormDialogOpen.value = true
  try {
    const response = await getTeamDetail(team.id)
    if (response.status === 200) {
      currentTeam.value = {
        ...response.data,
        department: response.data.department_id
      }
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '获取班组详情失败',
      position: 'top'
    })
  }
}

// 更新班组
const handleEditTeam = async (teamId) => {
  try {
    const formData = {
      team_name: currentTeam.value.team_name,
      description: currentTeam.value.description,
      parent_team: currentTeam.value.parent_team,
      department: currentTeam.value.department,
      is_active: currentTeam.value.is_active
    }

    const response = await updateTeam(teamId, formData)
    if (response.status === 200) {
      $q.notify({
        color: 'positive',
        message: '更新班组成功',
        position: 'top'
      })
      fetchTeams()
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '更新班组失败',
      position: 'top'
    })
  }
}

// -------------------------- 获取树形结构 --------------------------

// 转换树形结构数据格式
const transformTreeData = (data) => {
  return data.map(item => ({
    ...item,
    children: item.sub_teams ? transformTreeData(item.sub_teams) : []
  }))
}

// 获取班组树形结构
const fetchTeamTree = async () => {
  try {
    const response = await getTeamTree()
    if (response.status === 200) {
      teamTreeData.value = transformTreeData(response.data)
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '获取班组树形结构失败',
      position: 'top'
    })
  }
}

// 查看班组树形结构
const viewTeamTree = async () => {
  await fetchTeamTree()
  isTreeDialogOpen.value = true
}

// -------------------------- 删除处理 --------------------------
const handleDeleteTeam = async (team) => {
  currentTeam.value.id = team.id
  currentTeam.value.team_name = team.team_name
  isDeleteDialogOpen.value = true
}

// 确认删除班组
const confirmDeleteTeam = async () => {
  try {
    const deleteMode = isSoftDelete.value === 'true'
    let response
    if (deleteMode) {
      response = await softDeleteTeam(currentTeam.value.id)
    } else {
      response = await deleteTeam(currentTeam.value.id)
    }
    if (response.status === 204) {
      $q.notify({
        color: 'positive',
        message: deleteMode ? '软删除成功' : '硬删除成功',
        position: 'top'
      })
      fetchTeams()
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '删除班组失败',
      position: 'top'
    })
  } finally {
    isDeleteDialogOpen.value = false
  }
}

// -------------------------- 筛选与分页处理 --------------------------
const applyFilters = () => {
  pagination.value.page = 1
  fetchTeams()
}

// 筛选条件变化
function handleFilterChange() {
  pagination.value.page = 1
}

// 重置筛选
function resetFilters() {
  filters.value = {
    parent_team: null,
    department: null,
    isActive: null,
    searchQuery: '',
  }

  pagination.value.page = 1

  // 添加防抖处理
  clearTimeout(filterTimer)
  filterTimer = setTimeout(() => {
    fetchTeams()
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
  fetchTeams()
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
    const response = await downloadTeamTemplate({ template_type: 'init' })
    fileUtils.downloadBlob(response.data, '班组初始化导入模板.xlsx')
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
    const response = await downloadTeamTemplate({ template_type: 'normal' })
    fileUtils.downloadBlob(response.data, '班组普通导入模板.xlsx')
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
      message: '确定要清空所有班组数据吗？此操作将删除所有班组记录，且无法恢复！',
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
    const response = await importTeams(selectedFile.value, additionalParams)

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
        fetchTeams()
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
  initClearExisting.value = false
}

// 关闭导入对话框
function closeImportDialogs() {
  showInitImportDialog.value = false
  showNormalImportDialog.value = false
  selectedFile.value = null
  importErrors.value = []
  importResult.value = null
  initClearExisting.value = false
}

// 5. 重置导入状态
const resetInitImportState = () => {
  closeImportDialogs()
  selectedFile.value = null
  importErrors.value = []
  importResult.value = null
  initClearExisting.value = false
}

// 6. 导出处理 - 使用优化后的接口参数传递方式
async function handleExportTeams(exportType = 'all') {
  try {
    tableLoading.value = true

    // 构建导出参数
    let params = {}

    // 如果是导出筛选结果，则使用当前筛选条件
    if (exportType === 'filtered') {
      if (filters.value.searchQuery) {
        params.search = filters.value.searchQuery
      }
      if (filters.value.parent_team) {
        params.parent_team = filters.value.parent_team
      }
      if (filters.value.department) {
        params.department = filters.value.department
      }
      if (filters.value.isActive !== null) {
        params.is_active = filters.value.isActive
      }
    }

    // 使用优化后的接口参数传递方式
    const response = await exportTeams(params)

    // 使用优化后的文件工具函数处理下载
    fileUtils.downloadBlob(
      response.data,
      `班组_${format(new Date(), 'yyyyMMddHHmmss')}.xlsx`
    )

  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '导出班组失败',
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

  exportExcel(exportData, `班组导入错误详情_${format(new Date(), 'yyyyMMddHHmmss')}.xlsx`)
}

// -------------------------- 页面初始化 --------------------------
onMounted(() => {
  fetchDepartments()
  fetchTeams()
  fetchParentTeams()
})

onUnmounted(() => {
  if (filterTimer) {
    clearTimeout(filterTimer)
  }
})
</script>

<style scoped></style>
