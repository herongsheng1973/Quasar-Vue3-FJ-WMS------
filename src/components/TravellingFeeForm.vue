<template>
  <q-page class="q-px-md">
    <!-- 页面标题和操作按钮 -->
    <div class="col-12 flex justify-between items-center mb-6 flex-wrap gap-4">
      <div>
        <h5 class="text-h5 q-ma-none">差旅费标准管理</h5>
        <p class="text-grey text-subtitle2">管理所有差旅费标准信息</p>
      </div>
      <div class="flex gap-2 flex-wrap">
        <!-- 新增差旅费标准按钮 -->
        <q-btn color="primary" label="新增差旅费标准" @click="openFormDialog('add')" />
        <!-- 差旅费标准导入 -->
        <q-btn-dropdown color="secondary" label="差旅费标准导入" icon="upload">
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
        <!-- 导出差旅费标准 -->
        <q-btn-dropdown color="primary" label="导出差旅费标准" icon="download">
          <q-list>
            <q-item clickable v-close-popup @click="handleExportTravellingFees('all')">
              <q-item-section avatar>
                <q-icon name="file_download" />
              </q-item-section>
              <q-item-section>
                <q-item-label>导出全部</q-item-label>
                <q-item-label caption>导出所有差旅费标准记录</q-item-label>
              </q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="handleExportTravellingFees('filtered')">
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
          <!-- 员工等级筛选 -->
          <div class="col-md-2 col-sm-4 col-xs-12">
            <q-select v-model="filters.employee_grade" label="员工等级" :options="employeeGradeOptions" option-label="label"
              option-value="value" emit-value map-options clearable dense />
          </div>

          <!-- 工作地点筛选 -->
          <div class="col-md-2 col-sm-4 col-xs-12">
            <q-select v-model="filters.work_city" label="工作地点" :options="cityOptions" option-label="name"
              option-value="id" emit-value map-options clearable dense />
          </div>

          <!-- 家庭地址筛选 -->
          <div class="col-md-2 col-sm-4 col-xs-12">
            <q-select v-model="filters.home_city" label="家庭地址" :options="cityOptions" option-label="name"
              option-value="id" emit-value map-options clearable dense />
          </div>

          <div class="col-md-3 col-sm-6 col-xs-12">
            <q-input v-model="filters.searchQuery" label="搜索差旅费代码" emit-value map-options clearable
              @update:model-value="handleFilterChange" dense />
          </div>

          <div class="col-md-2 col-sm-4 col-xs-12">
            <q-select v-model="filters.isActive" label="是否生效" :options="statusOptions" option-label="label"
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

    <!-- 差旅费标准记录列表 -->
    <div class="col-12 bg-white rounded-borders shadow-sm">
      <q-table :rows="travellingFees" :columns="columns" v-model:pagination="pagination"
        :rows-per-page-options="[10, 20, 30, 50, 100]" :filter="filters" @request="onRequest" row-key="id"
        :loading="tableLoading">
        <!-- 序号显示模板 -->
        <template #body-cell-index="props">
          <q-td :props="props">
            <div>{{ (pagination.page - 1) * pagination.rowsPerPage + props.rowIndex + 1 }}</div>
          </q-td>
        </template>

        <template #body-cell-employee_grade="props">
          <q-td :props="props">
            <q-badge :color="getEmployeeGradeColor(props.row)" :label="getEmployeeGradeLabel(props.row)" />
          </q-td>
        </template>

        <template #body-cell-is_active="props">
          <q-td :props="props">
            <q-badge :color="getTravellingFeeStatusColor(props.row)" :label="getTravellingFeeStatusLabel(props.row)" />
          </q-td>
        </template>

        <template #body-cell-actions="props">
          <q-td :props="props">
            <q-btn size="sm" color="info" icon="visibility" class="q-mr-1" @click="viewTravellingFeeDetail(props.row)"
              label="查看" />
            <q-btn size="sm" color="accent" icon="edit" @click="editTravellingFee(props.row)" label="编辑" />
            <q-btn size="sm" color="warning" icon="delete" @click="handleDeleteTravellingFee(props.row)" label="删除" />
          </q-td>
        </template>

        <template #loading>
          <div class="row items-center justify-center q-pa-md">
            <q-spinner size="40px" color="primary" />
            <span class="q-ml-md text-subtitle1">加载差旅费标准记录中...</span>
          </div>
        </template>
      </q-table>
    </div>

    <!-- 查看记录详情弹窗 -->
    <q-dialog v-model="isDetailDialogOpen" persistent>
      <q-card style="width: 500px;">
        <q-card-section>
          <div class="row items-center justify-between">
            <h5 class="text-h5">差旅费标准详情</h5>
            <q-btn icon="close" flat round @click="isDetailDialogOpen = false" />
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pt-none">
          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">差旅费代码:</div>
            <div class="col-8">{{ travellingFeeDetail.travel_code || '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">员工等级:</div>
            <div class="col-8">{{ getEmployeeGradeLabel(travellingFeeDetail) || '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">工作地点:</div>
            <div class="col-8">{{ travellingFeeDetail.work_site_name || '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">家庭地址:</div>
            <div class="col-8">{{ travellingFeeDetail.home_city_name || '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">差旅费标准:</div>
            <div class="col-8">{{ travellingFeeDetail.travel_rate || '-' }} 元/天</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">城市间距离:</div>
            <div class="col-8">{{ travellingFeeDetail.distance || '-' }} km</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">是否生效:</div>
            <div class="col-8">
              <q-badge :color="travellingFeeDetail.is_active ? 'positive' : 'negative'"
                :label="travellingFeeDetail.is_active ? '生效' : '失效'" />
            </div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">创建时间:</div>
            <div class="col-8">{{ travellingFeeDetail.created_at ? formatDate(travellingFeeDetail.created_at) : '-' }}
            </div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">创建人:</div>
            <div class="col-8">{{ travellingFeeDetail.created_by_name || '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">更新时间:</div>
            <div class="col-8">{{ travellingFeeDetail.updated_at ? formatDate(travellingFeeDetail.updated_at) : '-' }}
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
          <p>确定要删除差旅费标准 {{ currentTravellingFee.travel_code }} 吗？</p>
          <div class="q-mt-sm">
            <q-radio v-model="isSoftDelete" val="true" label="软删除" class="q-mr-md" />
            <q-radio v-model="isSoftDelete" val="false" label="硬删除" />
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn label="取消" @click="isDeleteDialogOpen = false" color="secondary" />
          <q-btn label="删除" @click="confirmDeleteTravellingFee" color="warning" class="text-blue" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 新增/编辑表单对话框 -->
    <q-dialog v-model="isFormDialogOpen">
      <q-card style="width: 500px;">
        <q-card-section>
          <div class="row items-center justify-between">
            <h5 class="text-h5">{{ formMode === 'add' ? '新增差旅费标准' : '编辑差旅费标准' }}</h5>
            <q-btn icon="close" flat round @click="isFormDialogOpen = false" />
          </div>
        </q-card-section>
        <q-card-section>
          <q-form @submit="handleSubmit">
            <div class="row q-col-gutter-md">
              <div class="col-12">
                <q-select v-model="currentTravellingFee.employee_grade" label="员工等级 *" :options="employeeGradeOptions"
                  option-label="label" option-value="value" emit-value map-options dense outlined
                  :rules="[val => val !== null && val !== undefined || '请选择员工等级']" />
              </div>

              <div class="col-12">
                <q-select v-model="currentTravellingFee.work_site" label="工作地点 *" :options="cityOptions"
                  option-label="name" option-value="id" emit-value map-options dense outlined
                  :rules="[val => !!val || '请选择工作地点']" />
              </div>

              <div class="col-12">
                <q-select v-model="currentTravellingFee.home_city" label="家庭地址 *" :options="cityOptions"
                  option-label="name" option-value="id" emit-value map-options dense outlined
                  :rules="[val => !!val || '请选择家庭地址']" />
              </div>

              <div class="col-12">
                <q-input v-model="currentTravellingFee.travel_rate" label="差旅费标准(元/天) *" dense outlined type="number"
                  step="0.01" :rules="[val => val !== null && val !== '' || '请输入差旅费标准']" />
              </div>

              <div class="col-12">
                <q-input v-model="currentTravellingFee.distance" label="城市间距离(km)" dense outlined type="number"
                  step="1" />
              </div>

              <div class="col-12">
                <q-checkbox v-model="currentTravellingFee.is_active" label="是否生效" left-label />
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

    <!-- 1. 差旅费标准初始化导入弹窗 -->
    <q-dialog v-model="showInitImportDialog" max-width="700px">
      <q-card>
        <q-card-section class="row items-center justify-between">
          <h5 class="text-h5 text-negative">⚠️ 差旅费标准初始化导入</h5>
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
                <li>1. 初始化导入将<span class="font-medium text-negative">覆盖现有差旅费标准数据</span>，适用于系统首次上线或全量数据重置</li>
                <li>2. 若勾选"清空现有数据"，将删除所有差旅费标准记录及变动记录，<span class="font-medium text-negative">操作不可撤销</span></li>
                <li>3. 请确保导入文件包含"差旅费代码、员工等级、工作地点、家庭地址"等必填字段（建议先下载模板）</li>
              </ul>
            </div>

            <!-- 模板下载 -->
            <div class="flex justify-between items-center">
              <p class="text-sm">请下载模板并按格式填写数据</p>
              <q-btn label="下载差旅费标准初始化模板" color="secondary" icon="file_download" size="sm"
                @click="downloadInitTemplate" />
            </div>

            <!-- 文件上传 -->
            <q-uploader label="选择差旅费标准初始化文件（仅支持.xlsx/.xls）" accept=".xlsx, .xls" :max-files="1"
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
              <q-checkbox v-model="initClearExisting" label="清空现有差旅费标准数据" color="negative"
                @update:model-value="handleClearConfirm" />
            </div>

            <!-- 导入结果/错误展示 -->
            <div v-if="importErrors.length > 0" class="mt-4">
              <h6 class="text-negative text-sm font-medium">导入失败记录（共{{ importErrors.length }}条）</h6>
              <div class="bg-white border border-gray-200 rounded mt-2 max-h-60 overflow-auto">
                <q-table :rows="importErrors" :columns="importErrorColumns" row-key="row" dense hide-header flat />
              </div>
              <q-btn label="下载差旅费标准错误详情" color="negative" size="sm" class="mt-2" @click="downloadImportErrors" dense />
            </div>

            <!-- 初始化成功统计 -->
            <div v-if="importResult" class="mt-4 bg-positive/10 p-3 rounded">
              <h6 class="text-positive font-medium">差旅费标准初始化导入成功</h6>
              <ul class="text-sm mt-2 space-y-1">
                <li>成功创建差旅费标准记录：{{ importResult.travelling_fee_success_count }} 条</li>
                <li>失败记录：{{ importResult.error_count }} 条</li>
              </ul>
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md">
          <q-btn label="取消" color="secondary" @click="resetInitImportState" />
          <q-btn label="开始差旅费标准初始化" color="negative" class="ml-2" @click="handleImport"
            :disable="!selectedFile || importLoading" :loading="importLoading" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 2. 普通导入弹窗 -->
    <q-dialog v-model="showNormalImportDialog" max-width="700px">
      <q-card>
        <q-card-section class="row items-center justify-between">
          <h5 class="text-h5">普通差旅费标准导入</h5>
          <q-btn icon="close" flat round @click="closeImportDialogs" />
        </q-card-section>
        <q-card-section class="q-pa-md">
          <div class="space-y-4">
            <p class="text-sm">普通差旅费标准导入仅新增/更新差旅费标准记录，不删除现有数据，适用于日常批量更新</p>
            <div class="flex justify-between items-center">
              <p class="text-sm">请下载模板并按格式填写数据</p>
              <q-btn label="下载普通差旅费标准导入模板" color="secondary" icon="file_download" size="sm"
                @click="downloadNormalTemplate" />
            </div>
            <q-uploader label="选择差旅费标准普通导入文件（仅支持.xlsx/.xls）" accept=".xlsx, .xls" :max-files="1"
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
          <q-btn label="开始差旅费标准普通导入" color="primary" class="ml-2" @click="handleImport"
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

// API导入 - 修改为差旅费标准相关接口
import {
  getTravellingFees,
  getTravellingFeeDetail,
  createTravellingFee,
  updateTravellingFee,
  deleteTravellingFee,
  downloadTravellingFeeTemplate,
  exportTravellingFees,
  importTravellingFees,
  softDeleteTravellingFee,
  getCities
} from 'src/services/employeeServiceApi'

// 初始化Quasar
const $q = useQuasar()

// -------------------------- 基础状态变量 --------------------------
const travellingFees = ref([])
const tableLoading = ref(false)
const isDetailDialogOpen = ref(false)
const isDeleteDialogOpen = ref(false)
const isFormDialogOpen = ref(false)
const formMode = ref('add')

// -------------------------- 筛选与分页 --------------------------
const filters = ref({
  employee_grade: null,
  work_city: null,
  home_city: null,
  isActive: true,
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
const currentTravellingFee = ref({
  id: null,
  travel_code: '',
  employee_grade: null,
  work_site: null,
  home_city: null,
  travel_rate: null,
  distance: null,
  is_active: true
})

const travellingFeeDetail = ref({})

// -------------------------- 下拉选项配置 --------------------------
const cityOptions = ref([])
const employeeGradeOptions = ref([
  { label: '高级员工', value: 1 },
  { label: '初级及中级员工', value: 2 }
])
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
  { name: 'travel_code', label: '差旅费代码', field: 'travel_code', align: 'left', sortable: true },
  { name: 'employee_grade', label: '员工等级', field: 'employee_grade', align: 'left', sortable: true },
  { name: 'work_site_name', label: '工作地点', field: 'work_site_name', align: 'left', sortable: true },
  { name: 'home_city_name', label: '家庭地址', field: 'home_city_name', align: 'left', sortable: true },
  { name: 'travel_rate', label: '差旅费标准(元/天)', field: 'travel_rate', align: 'left', sortable: true },
  { name: 'distance', label: '城市间距离(km)', field: 'distance', align: 'left', sortable: true },
  { name: 'is_active', label: '是否生效', field: 'is_active', align: 'left', sortable: true },
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

// -------------------------- 工具函数 --------------------------
// 日期格式化
function formatDate(dateString) {
  if (!dateString) return ''
  return format(parseISO(dateString), 'yyyy-MM-dd HH:mm')
}

// 获取员工等级标签
const getEmployeeGradeLabel = (travellingFee) => {
  if (!travellingFee || travellingFee.employee_grade === null) return '未知'
  return travellingFee.employee_grade === 1 ? '高级员工' : '初级及中级员工'
}

// 获取员工等级颜色
const getEmployeeGradeColor = (travellingFee) => {
  if (!travellingFee || travellingFee.employee_grade === null) return 'grey'
  return travellingFee.employee_grade === 1 ? 'primary' : 'secondary'
}

// 获取差旅费标准状态标签
const getTravellingFeeStatusLabel = (travellingFee) => {
  if (!travellingFee || !travellingFee.is_active) return '未知'
  return travellingFee.is_active ? '生效' : '失效'
}

// 获取差旅费标准状态颜色
const getTravellingFeeStatusColor = (travellingFee) => {
  if (!travellingFee || !travellingFee.is_active) return 'grey'
  return travellingFee.is_active ? 'positive' : 'negative'
}

// -------------------------- 操作方法 --------------------------
const openFormDialog = (mode, travellingFee = null) => {
  formMode.value = mode
  isFormDialogOpen.value = true

  if (mode === 'edit' && travellingFee) {
    currentTravellingFee.value = { ...travellingFee }
  } else {
    // 重置为默认值
    currentTravellingFee.value = {
      id: null,
      travel_code: '',
      employee_grade: null,
      work_site: null,
      home_city: null,
      travel_rate: null,
      distance: null,
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

  if (filters.value.employee_grade !== null) {
    params.append('employee_grade', filters.value.employee_grade)
  }

  if (filters.value.work_city) {
    params.append('work_site', filters.value.work_city)
  }

  if (filters.value.home_city) {
    params.append('home_city', filters.value.home_city)
  }

  if (filters.value.isActive !== null) {
    const isActiveValue = filters.value.isActive ? 'True' : 'False'
    params.append('is_active', isActiveValue)
  }

  return params
}

// 获取差旅费标准列表
const fetchTravellingFees = async () => {
  try {
    tableLoading.value = true
    const params = buildFilterParams()
    const response = await getTravellingFees(params)

    if (response.status === 200) {
      travellingFees.value = response.data.results
      pagination.value.rowsNumber = response.data.count
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '获取差旅费标准失败',
      position: 'top'
    })
  } finally {
    tableLoading.value = false
  }
}

const viewTravellingFeeDetail = async (travellingFee) => {
  isDetailDialogOpen.value = true
  try {
    const response = await getTravellingFeeDetail(travellingFee.id)
    if (response.status === 200) {
      travellingFeeDetail.value = response.data
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '获取差旅费标准详情失败',
      position: 'top'
    })
  }
}

// 获取所有城市
async function fetchCities() {
  try {
    const response = await getCities()
    if (response.status === 200) {
      cityOptions.value = response.data.results
    }
  } catch (error) {
    console.error('获取城市列表失败:', error)
  }
}

// -------------------------- 新增/编辑处理 --------------------------
// 表单验证
const validateForm = () => {
  if (currentTravellingFee.value.employee_grade === null || currentTravellingFee.value.employee_grade === undefined) {
    $q.notify({
      color: 'negative',
      message: '请选择员工等级',
      position: 'top'
    })
    return false
  }

  if (!currentTravellingFee.value.work_site) {
    $q.notify({
      color: 'negative',
      message: '请选择工作地点',
      position: 'top'
    })
    return false
  }

  if (!currentTravellingFee.value.home_city) {
    $q.notify({
      color: 'negative',
      message: '请选择家庭地址',
      position: 'top'
    })
    return false
  }

  if (currentTravellingFee.value.work_site === currentTravellingFee.value.home_city) {
    $q.notify({
      color: 'negative',
      message: '工作地点和家庭地址不能相同',
      position: 'top'
    })
    return false
  }

  if (currentTravellingFee.value.travel_rate === null || currentTravellingFee.value.travel_rate === '') {
    $q.notify({
      color: 'negative',
      message: '请输入差旅费标准',
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
      await handleAddTravellingFee()
    } else if (formMode.value === 'edit') {
      await handleEditTravellingFee(currentTravellingFee.value.id)
    }
  } finally {
    isFormDialogOpen.value = false
  }
}

// 添加差旅费标准
const handleAddTravellingFee = async () => {
  try {
    const formData = {
      employee_grade: currentTravellingFee.value.employee_grade,
      work_site: currentTravellingFee.value.work_site,
      home_city: currentTravellingFee.value.home_city,
      travel_rate: parseFloat(currentTravellingFee.value.travel_rate),
      distance: currentTravellingFee.value.distance ? parseInt(currentTravellingFee.value.distance) : null,
      is_active: currentTravellingFee.value.is_active
    }

    const response = await createTravellingFee(formData)
    if (response.status === 201) {
      $q.notify({
        color: 'positive',
        message: '添加差旅费标准成功',
        position: 'top'
      })
      fetchTravellingFees()
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '添加差旅费标准失败',
      position: 'top'
    })
  }
}

// 编辑差旅费标准
const editTravellingFee = async (travellingFee) => {
  formMode.value = 'edit'
  isFormDialogOpen.value = true
  try {
    const response = await getTravellingFeeDetail(travellingFee.id)
    if (response.status === 200) {
      currentTravellingFee.value = response.data
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '获取差旅费标准详情失败',
      position: 'top'
    })
  }
}

// 更新差旅费标准
const handleEditTravellingFee = async (travellingFeeId) => {
  try {
    const formData = {
      employee_grade: currentTravellingFee.value.employee_grade,
      work_site: currentTravellingFee.value.work_site,
      home_city: currentTravellingFee.value.home_city,
      travel_rate: parseFloat(currentTravellingFee.value.travel_rate),
      distance: currentTravellingFee.value.distance ? parseInt(currentTravellingFee.value.distance) : null,
      is_active: currentTravellingFee.value.is_active
    }

    const response = await updateTravellingFee(travellingFeeId, formData)
    if (response.status === 200) {
      $q.notify({
        color: 'positive',
        message: '更新差旅费标准成功',
        position: 'top'
      })
      fetchTravellingFees()
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '更新差旅费标准失败',
      position: 'top'
    })
  }
}

// -------------------------- 删除处理 --------------------------
const handleDeleteTravellingFee = async (travellingFee) => {
  currentTravellingFee.value.id = travellingFee.id
  currentTravellingFee.value.travel_code = travellingFee.travel_code
  isDeleteDialogOpen.value = true
}

// 确认删除差旅费标准
const confirmDeleteTravellingFee = async () => {
  try {
    const deleteMode = isSoftDelete.value === 'true'
    let response
    if (deleteMode) {
      response = await softDeleteTravellingFee(currentTravellingFee.value.id)
    } else {
      response = await deleteTravellingFee(currentTravellingFee.value.id)
    }
    if (response.status === 204) {
      $q.notify({
        color: 'positive',
        message: deleteMode ? '软删除成功' : '硬删除成功',
        position: 'top'
      })
      fetchTravellingFees()
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '删除差旅费标准失败',
      position: 'top'
    })
  } finally {
    isDeleteDialogOpen.value = false
  }
}

// -------------------------- 筛选与分页处理 --------------------------
const applyFilters = () => {
  pagination.value.page = 1
  fetchTravellingFees()
}

// 筛选条件变化
function handleFilterChange() {
  pagination.value.page = 1
}

// 重置筛选
function resetFilters() {
  filters.value = {
    employee_grade: null,
    work_city: null,
    home_city: null,
    isActive: null,
    searchQuery: '',
  }

  pagination.value.page = 1

  // 添加防抖处理
  clearTimeout(filterTimer)
  filterTimer = setTimeout(() => {
    fetchTravellingFees()
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
  fetchTravellingFees()
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
    const response = await downloadTravellingFeeTemplate({ type: 'init' })
    fileUtils.downloadBlob(response.data, '差旅费标准初始化导入模板.xlsx')
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
    const response = await downloadTravellingFeeTemplate({ type: 'normal' })
    fileUtils.downloadBlob(response.data, '差旅费标准普通导入模板.xlsx')
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
      message: '确定要清空所有差旅费标准数据吗？此操作将删除所有差旅费标准记录，且无法恢复！',
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

    const response = await importTravellingFees(selectedFile.value, additionalParams)

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
        fetchTravellingFees()
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
async function handleExportTravellingFees(exportType = 'all') {
  try {
    tableLoading.value = true

    // 构建导出参数
    const params = {}

    // 如果是导出筛选结果，则使用当前筛选条件
    if (exportType === 'filtered') {
      // 添加筛选参数到导出请求中
      if (filters.value.searchQuery) {
        params.search = filters.value.searchQuery
      }

      if (filters.value.employee_grade !== null) {
        params.employee_grade = filters.value.employee_grade
      }

      if (filters.value.work_city) {
        params.work_city = filters.value.work_city
      }

      if (filters.value.home_city) {
        params.home_city = filters.value.home_city
      }

      if (filters.value.isActive !== null) {
        params.is_active = filters.value.isActive ? 'True' : 'False'
      }
    }

    const response = await exportTravellingFees(params)
    const filename = `差旅费标准_${format(new Date(), 'yyyyMMddHHmmss')}.xlsx`
    fileUtils.downloadBlob(response.data, filename)

  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '导出差旅费标准失败',
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

  exportExcel(exportData, `差旅费标准导入错误详情_${format(new Date(), 'yyyyMMddHHmmss')}.xlsx`)
}

// -------------------------- 页面初始化 --------------------------
onMounted(() => {
  fetchCities()
  fetchTravellingFees()
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
