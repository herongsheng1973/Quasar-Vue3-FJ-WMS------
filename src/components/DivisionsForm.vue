<template>
  <q-page class="q-px-md">
    <!-- 页面标题和操作按钮 -->
    <div class="col-12 flex justify-between items-center mb-6 flex-wrap gap-4">
      <div>
        <h5 class="text-h5 q-ma-none">分支机构管理</h5>
        <p class="text-grey text-subtitle2">管理所有分支机构信息</p>
      </div>
      <div class="flex gap-2 flex-wrap">
        <!-- 新增机构按钮 -->
        <q-btn color="primary" label="新增分支机构" @click="openFormDialog('add')" />
        <!-- 查看树形结构按钮 -->
        <q-btn color="info" label="查看树形结构" @click="viewDivisionTree" />
        <!-- 分支机构导入 -->
        <q-btn-dropdown color="secondary" label="分支机构导入" icon="upload">
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
        <!-- 导出分支机构 -->
        <q-btn-dropdown color="primary" label="导出分支机构" icon="download">
          <q-list>
            <q-item clickable v-close-popup @click="handleExportDivisions('all')">
              <q-item-section avatar>
                <q-icon name="file_download" />
              </q-item-section>
              <q-item-section>
                <q-item-label>导出全部</q-item-label>
                <q-item-label caption>导出所有分支机构记录</q-item-label>
              </q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="handleExportDivisions('filtered')">
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
            <q-select v-model="filters.parent_division" label="上级部门" :options="parentDivisionOptions"
              option-label="division_name" option-value="id" emit-value map-options clearable dense />
          </div>

          <div class="col-md-3 col-sm-6 col-xs-12">
            <q-input v-model="filters.searchQuery" label="搜索分支机构/描述" emit-value map-options clearable
              @update:model-value="handleFilterChange" dense />
          </div>

          <div class="col-md-3 col-sm-6 col-xs-12">
            <q-select v-model="filters.isActive" label="是否激活" :options="statusOptions" option-label="label"
              option-value="value" emit-value map-options clearable @update:model-value="handleFilterChange" dense />
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

    <!-- 分支机构记录列表 -->
    <div class="col-12 bg-white rounded-borders shadow-sm">
      <q-table :rows="divisions" :columns="columns" v-model:pagination="pagination"
        :rows-per-page-options="[10, 20, 30, 50, 100]" :filter="filters" @request="onRequest" row-key="index"
        :loading="tableLoading">
        <!-- 序号显示模板保持不变或者可以优化为 -->
        <template #body-cell-index="props">
          <q-td :props="props">
            <div>{{ props.rowIndex + 1 }}</div>
          </q-td>
        </template>

        <template #body-cell-is_active="props">
          <q-td :props="props">
            <q-badge :color="getDivisionStatusColor(props.row)" :label="getDivisionStatusLabel(props.row)" />
          </q-td>
        </template>

        <template #body-cell-actions="props">
          <q-td :props="props">
            <q-btn size="sm" color="info" icon="visibility" class="q-mr-1" @click="viewDivisionDetail(props.row)"
              label="查看" />
            <q-btn size="sm" color="accent" icon="edit" @click="editDivision(props.row)" label="编辑" />
            <q-btn size="sm" color="warning" icon="delete" @click="handleDeleteDivision(props.row)" label="删除" />
          </q-td>
        </template>

        <template #loading>
          <div class="row items-center justify-center q-pa-md">
            <q-spinner size="40px" color="primary" />
            <span class="q-ml-md text-subtitle1">加载分支机构记录中...</span>
          </div>
        </template>
      </q-table>
    </div>

    <!-- 查看记录详情弹窗 -->
    <q-dialog v-model="isDetailDialogOpen" persistent>
      <q-card style="width: 500px;">
        <q-card-section>
          <div class="row items-center justify-between">
            <h5 class="text-h5">分支机构详情</h5>
            <q-btn icon="close" flat round @click="isDetailDialogOpen = false" />
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pt-none">
          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">部门名称:</div>
            <div class="col-8">{{ divisionDetail.division_name || '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">部门代码:</div>
            <div class="col-8">{{ divisionDetail.division_code || '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">上级部门:</div>
            <div class="col-8">{{ divisionDetail.parent_division_name || '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">部门描述:</div>
            <div class="col-8">{{ divisionDetail.description || '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">是否激活:</div>
            <div class="col-8">
              <q-badge :color="divisionDetail.is_active ? 'positive' : 'negative'"
                :label="divisionDetail.is_active ? '正常' : '停用'" />
            </div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">创建时间:</div>
            <div class="col-8">{{ divisionDetail.created_at ? formatDate(divisionDetail.created_at) : '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">创建人:</div>
            <div class="col-8">{{ divisionDetail.created_by_name || '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">更新时间:</div>
            <div class="col-8">{{ divisionDetail.updated_at ? formatDate(divisionDetail.updated_at) : '-' }}</div>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn label="关闭" color="primary" @click="isDetailDialogOpen = false" />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <!-- 分支机构树形结构弹窗 -->
    <q-dialog v-model="isTreeDialogOpen" maximized>
      <q-card>
        <q-card-section>
          <div class="row items-center justify-between">
            <h5 class="text-h5">分支机构树形结构</h5>
            <q-btn icon="close" flat round @click="isTreeDialogOpen = false" />
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pa-md">
          <q-tree :nodes="divisionTreeData" node-key="id" label-key="division_name" children-key="children"
            default-expand-all>
            <template #default-header="props">
              <div class="row items-center">
                <q-icon :name="props.node.is_active ? 'business' : 'business_off'"
                  :color="props.node.is_active ? 'positive' : 'negative'" class="q-mr-sm" />
                <span>{{ props.node.division_name }}</span>
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
          <p>确定要删除分支机构 {{ currentDivision.division_name }} 吗？</p>
          <div class="q-mt-sm">
            <q-radio v-model="isSoftDelete" val="true" label="软删除" class="q-mr-md" />
            <q-radio v-model="isSoftDelete" val="false" label="硬删除" />
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn label="取消" @click="isDeleteDialogOpen = false" color="secondary" />
          <q-btn label="删除" @click="confirmDeleteDivision" color="warning" class="text-blue" />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <!-- 新增/编辑表单对话框 -->
    <q-dialog v-model="isFormDialogOpen">
      <q-card style="width: 500px;">
        <q-card-section>
          <div class="row items-center justify-between">
            <h5 class="text-h5">{{ formMode === 'add' ? '新增分支机构' : '编辑分支机构' }}</h5>
            <q-btn icon="close" flat round @click="isFormDialogOpen = false" />
          </div>
        </q-card-section>
        <q-card-section>
          <q-form @submit="handleSubmit">
            <div class="row q-col-gutter-md">
              <div class="col-12">
                <q-input v-model="currentDivision.division_name" label="部门名称" dense outlined
                  :rules="[val => !!val || '部门名称不能为空']" />
              </div>

              <div class="col-12">
                <q-input v-model="currentDivision.division_code" label="部门代码" dense outlined
                  :rules="[val => !!val || '部门代码不能为空']" />
              </div>

              <div class="col-12">
                <q-input v-model="currentDivision.description" label="部门描述" dense outlined type="textarea" rows="3" />
              </div>

              <div class="col-12">
                <q-select v-model="currentDivision.parent_division" label="上级部门" :options="parentDivisionOptions"
                  option-label="division_name" option-value="id" map-options emit-value clearable dense outlined />
              </div>

              <div class="col-12">
                <q-checkbox v-model="currentDivision.is_active" label="是否激活" left-label />
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

    <!-- 1. 分支机构初始化导入弹窗（新增） -->
    <q-dialog v-model="showInitImportDialog" max-width="700px">
      <q-card>
        <q-card-section class="row items-center justify-between">
          <h5 class="text-h5 text-negative">⚠️ 分支机构初始化导入</h5>
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
                <li>1. 初始化导入将<span class="font-medium text-negative">覆盖现有分支机构数据</span>，适用于系统首次上线或全量数据重置</li>
                <li>2. 若勾选"清空现有数据"，将删除所有分支机构记录及变动记录，<span class="font-medium text-negative">操作不可撤销</span></li>
                <li>3. 请确保导入文件包含"分支机构编码、分支机构名称、上级部门"等必填字段（建议先下载模板）</li>
              </ul>
            </div>

            <!-- 模板下载 -->
            <div class="flex justify-between items-center">
              <p class="text-sm">请下载模板并按格式填写数据</p>
              <q-btn label="下载分支机构初始化模板" color="secondary" icon="file_download" size="sm"
                @click="downloadInitTemplate" />
            </div>

            <!-- 文件上传 -->
            <q-uploader label="选择分支机构初始化文件（仅支持.xlsx/.xls）" accept=".xlsx, .xls" :max-files="1"
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
              <q-checkbox v-model="initClearExisting" label="清空现有分支机构数据" color="negative"
                @update:model-value="handleClearConfirm" />
            </div>

            <!-- 导入结果/错误展示 -->
            <div v-if="importErrors.length > 0" class="mt-4">
              <h6 class="text-negative text-sm font-medium">导入失败记录（共{{ importErrors.length }}条）</h6>
              <div class="bg-white border border-gray-200 rounded mt-2 max-h-60 overflow-auto">
                <q-table :rows="importErrors" :columns="importErrorColumns" row-key="row" dense hide-header flat />
              </div>
              <q-btn label="下载分支机构错误详情" color="negative" size="sm" class="mt-2" @click="downloadImportErrors" dense />
            </div>

            <!-- 初始化成功统计 -->
            <div v-if="importResult" class="mt-4 bg-positive/10 p-3 rounded">
              <h6 class="text-positive font-medium">分支机构初始化导入成功</h6>
              <ul class="text-sm mt-2 space-y-1">
                <li>成功创建分支机构记录：{{ importResult.division_success_count }} 条</li>
                <li>失败记录：{{ importResult.error_count }} 条</li>
              </ul>
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md">
          <q-btn label="取消" color="secondary" @click="resetInitImportState" />
          <q-btn label="开始分支机构初始化" color="negative" class="ml-2" @click="handleImport"
            :disable="!selectedFile || importLoading" :loading="importLoading" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 2. 普通导入弹窗（保留原功能，区分初始化） -->
    <q-dialog v-model="showNormalImportDialog" max-width="700px">
      <q-card>
        <q-card-section class="row items-center justify-between">
          <h5 class="text-h5">普通分支机构导入</h5>
          <q-btn icon="close" flat round @click="closeImportDialogs" />
        </q-card-section>
        <q-card-section class="q-pa-md">
          <div class="space-y-4">
            <p class="text-sm">普通分支机构导入仅新增/更新分支机构记录，不删除现有数据，适用于日常批量更新</p>
            <div class="flex justify-between items-center">
              <p class="text-sm">请下载模板并按格式填写数据</p>
              <q-btn label="下载普通分支机构导入模板" color="secondary" icon="file_download" size="sm"
                @click="downloadNormalTemplate" />
            </div>
            <q-uploader label="选择分支机构普通导入文件（仅支持.xlsx/.xls）" accept=".xlsx, .xls" :max-files="1"
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
          <q-btn label="取消" color="secondary" @click="closeImportDialogs" />
          <q-btn label="开始分支机构普通导入" color="primary" class="ml-2" @click="handleImport"
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
  getDivisions,
  getDivisionDetail,
  createDivision,
  updateDivision,
  deleteDivision,
  downloadDivisionTemplate,
  exportDivisions,
  importDivisions,
  getDivisionTree,
  softDeleteDivision,
  fileUtils
} from 'src/services/employeeServiceApi'

// 初始化Quasar
const $q = useQuasar()

// -------------------------- 基础状态变量 --------------------------
const divisions = ref([])
const tableLoading = ref(false)
const isDetailDialogOpen = ref(false)
const isDeleteDialogOpen = ref(false)
const isFormDialogOpen = ref(false)
const formMode = ref('add')

// -------------------------- 筛选与分页 --------------------------
const filters = ref({
  parent_division: null,
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
const currentDivision = ref({
  id: null,
  division_name: '',
  division_code: '',
  description: '',
  parent_division: null,
  is_active: true
})

const divisionDetail = ref({})

// -------------------------- 下拉选项配置 --------------------------
const parentDivisionOptions = ref([])
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
  { name: 'division_name', label: '部门名称', field: 'division_name', align: 'left', sortable: true },
  { name: 'parent_division', label: '上级部门', field: 'parent_division_name', align: 'left', sortable: true },
  { name: 'division_code', label: '部门编码', field: 'division_code', align: 'left', sortable: true },
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

// -------------------------- 树形机构相关状态变量 --------------------------
const isTreeDialogOpen = ref(false)
const divisionTreeData = ref([])
// -------------------------- 工具函数 --------------------------
// 日期格式化
function formatDate(dateString) {
  if (!dateString) return ''
  return format(parseISO(dateString), 'yyyy-MM-dd HH:mm')
}

// 获取分支机构状态标签
const getDivisionStatusLabel = (division) => {
  if (!division || !division.is_active) return '未知'
  return division.is_active ? '正常' : '停用'
}

// 获取分支机构状态颜色
const getDivisionStatusColor = (division) => {
  if (!division || !division.is_active) return 'grey'
  return division.is_active ? 'positive' : 'negative'
}

// -------------------------- 操作方法 --------------------------
const openFormDialog = (mode, division = null) => {
  formMode.value = mode
  isFormDialogOpen.value = true

  if (mode === 'edit' && division) {
    currentDivision.value = { ...division }
  } else {
    // 重置为默认值
    currentDivision.value = {
      id: null,
      division_name: '',
      division_code: '',
      description: '',
      parent_division: null,
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

  if (filters.value.parent_division) {
    params.append('parent_division', filters.value.parent_division)
  }

  if (filters.value.isActive !== null) {
    const isActiveValue = filters.value.isActive ? 'True' : 'False'
    params.append('is_active', isActiveValue)
  }

  return params
}

// 获取分支机构列表
const fetchDivisions = async () => {
  try {
    tableLoading.value = true
    const params = buildFilterParams()
    const response = await getDivisions(params)

    if (response.status === 200) {
      divisions.value = response.data.results
      pagination.value.rowsNumber = response.data.count
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '获取分支机构失败',
      position: 'top'
    })
  } finally {
    tableLoading.value = false
  }
}

// 获取分支机构详情
async function fetchDivisionDetail(divisionId) {
  try {
    const response = await getDivisionDetail(divisionId)
    if (response.status === 200) {
      return response.data
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '获取分支机构详情失败',
      position: 'top'
    })
  }
}

const viewDivisionDetail = async (division) => {
  try {
    tableLoading.value = true
    divisionDetail.value = await fetchDivisionDetail(division.id)
    isDetailDialogOpen.value = true
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '获取分支机构详情失败',
      position: 'top'
    })
  } finally {
    tableLoading.value = false
  }
}

// 获取上级部门
async function fetchParentDivisions() {
  try {
    const params = new URLSearchParams()
    params.append('parent_division', 'null')
    params.append('is_active', 'True')

    const response = await getDivisions(params)
    if (response.status === 200) {
      parentDivisionOptions.value = response.data.results
    }
  } catch (error) {
    console.error('获取上级部门失败:', error)
  }
}

// -------------------------- 新增/编辑处理 --------------------------
// 表单验证
const validateForm = () => {
  if (!currentDivision.value.division_name?.trim()) {
    $q.notify({
      color: 'negative',
      message: '请输入部门名称',
      position: 'top'
    })
    return false
  }

  if (!currentDivision.value.division_code?.trim()) {
    $q.notify({
      color: 'negative',
      message: '请输入部门代码',
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
      await handleAddDivision()
    } else if (formMode.value === 'edit') {
      await handleEditDivision(currentDivision.value.id)
    }
  } finally {
    isFormDialogOpen.value = false
  }
}

// 添加分支机构
const handleAddDivision = async () => {
  try {
    const response = await createDivision(currentDivision.value)
    if (response.status === 201) {
      $q.notify({
        color: 'positive',
        message: '添加分支机构成功',
        position: 'top'
      })
      fetchDivisions()
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '添加分支机构失败',
      position: 'top'
    })
  }
}

// 编辑分支机构
const editDivision = (division) => {
  currentDivision.value = { ...division }
  // 查找并设置上级部门的ID
  const parentDivision = parentDivisionOptions.value.find(
    item => item.division_name === division.parent_division_name
  )
  currentDivision.value.parent_division = parentDivision ? parentDivision.id : null
  formMode.value = 'edit'
  isFormDialogOpen.value = true
}

// 更新分支机构
const handleEditDivision = async (divisionId) => {
  try {
    const formData = {
      division_name: currentDivision.value.division_name,
      division_code: currentDivision.value.division_code,
      description: currentDivision.value.description,
      parent_division: currentDivision.value.parent_division,
      is_active: currentDivision.value.is_active
    }

    const response = await updateDivision(divisionId, formData)
    if (response.status === 200) {
      $q.notify({
        color: 'positive',
        message: '更新分支机构成功',
        position: 'top'
      })
      fetchDivisions()
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '更新分支机构失败',
      position: 'top'
    })
  }
}
// -------------------------- 获取树形结构 --------------------------

// 转换树形结构数据格式
const transformTreeData = (data) => {
  return data.map(item => ({
    ...item,
    children: item.sub_divisions ? transformTreeData(item.sub_divisions) : []
  }))
}
// 获取分支机构树形结构
const fetchDivisionTree = async () => {
  try {
    const response = await getDivisionTree()
    if (response.status === 200) {
      divisionTreeData.value = transformTreeData(response.data)
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '获取分支机构树形结构失败',
      position: 'top'
    })
  }
}

// 查看分支机构树形结构
const viewDivisionTree = async () => {
  await fetchDivisionTree()
  isTreeDialogOpen.value = true
}
// -------------------------- 删除处理 --------------------------
const handleDeleteDivision = async (division) => {
  currentDivision.value.id = division.id
  currentDivision.value.division_name = division.division_name
  isDeleteDialogOpen.value = true
}

// 确认删除分支机构
const confirmDeleteDivision = async () => {
  try {
    const deleteMode = isSoftDelete.value === 'true'
    let response
    if (deleteMode) {
      response = await softDeleteDivision(currentDivision.value.id)
    } else {
      response = await deleteDivision(currentDivision.value.id)
    }
    if (response.status === 204) {
      $q.notify({
        color: 'positive',
        message: deleteMode ? '软删除成功' : '硬删除成功',
        position: 'top'
      })
      fetchDivisions()
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '删除分支机构失败',
      position: 'top'
    })
  } finally {
    isDeleteDialogOpen.value = false
  }
}

// -------------------------- 筛选与分页处理 --------------------------
const applyFilters = () => {
  pagination.value.page = 1
  fetchDivisions()
}

// 筛选条件变化
function handleFilterChange() {
  pagination.value.page = 1
}

// 重置筛选
function resetFilters() {
  filters.value = {
    parent_division: null,
    isActive: null,
    searchQuery: '',
  }

  pagination.value.page = 1

  // 添加防抖处理
  clearTimeout(filterTimer)
  filterTimer = setTimeout(() => {
    fetchDivisions()
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
  fetchDivisions()
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
    const response = await downloadDivisionTemplate({ template_type: 'init' })
    fileUtils.downloadBlob(response.data, '分支机构初始化导入模板.xlsx')

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
    const response = await downloadDivisionTemplate({ template_type: 'normal' })
    fileUtils.downloadBlob(response.data, '分支机构普通导入模板.xlsx')
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
      message: '确定要清空所有分支机构数据吗？此操作将删除所有分支机构记录，且无法恢复！',
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
    const response = await importDivisions(selectedFile.value, additionalParams)

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
        fetchDivisions()
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
async function handleExportDivisions(exportType = 'all') {
  try {
    tableLoading.value = true

    // 构建导出参数
    let params = {}

    // 如果是导出筛选结果，则使用当前筛选条件
    if (exportType === 'filtered') {
      if (filters.value.searchQuery) {
        params.search = filters.value.searchQuery
      }
      if (filters.value.parent_division) {
        params.parent_division = filters.value.parent_division
      }
      if (filters.value.isActive !== null) {
        params.is_active = filters.value.isActive
      }
    }

    // 使用优化后的接口参数传递方式
    const response = await exportDivisions(params)

    // 使用优化后的文件工具函数处理下载
    fileUtils.downloadBlob(
      response.data,
      `分支机构_${format(new Date(), 'yyyyMMddHHmmss')}.xlsx`
    )

  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '导出分支机构失败',
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

  exportExcel(exportData, `分支机构导入错误详情_${format(new Date(), 'yyyyMMddHHmmss')}.xlsx`)
}

// -------------------------- 页面初始化 --------------------------
onMounted(() => {
  fetchDivisions()
  fetchParentDivisions()
})

onUnmounted(() => {
  if (filterTimer) {
    clearTimeout(filterTimer)
  }
})
</script>

<style scoped>
.text-gray-500 {
  color: var(--q-color-gray-500);
}

.q-uploader__content {
  min-height: 120px !important;
}

.import-error-table {
  font-size: 12px;
}
</style>
