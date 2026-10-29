<template>
  <q-page class="q-px-md">
    <!-- 页面标题和操作按钮 -->
    <div class="col-12 flex justify-between items-center mb-6 flex-wrap gap-4">
      <div>
        <h5 class="text-h5 q-ma-none">员工通讯录管理</h5>
        <p class="text-grey text-subtitle2">管理员工联系方式信息</p>
      </div>
      <div class="flex gap-2 flex-wrap">
        <!-- 新增通讯录按钮 -->
        <q-btn color="primary" label="新增通讯录" @click="openFormDialog('add')" />
        <!-- 通讯录导入 -->
        <q-btn-dropdown color="secondary" label="通讯录导入" icon="upload">
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
        <!-- 导出通讯录 -->
        <q-btn-dropdown color="primary" label="导出通讯录" icon="download">
          <q-list>
            <q-item clickable v-close-popup @click="handleExportCommunications('all')">
              <q-item-section avatar>
                <q-icon name="file_download" />
              </q-item-section>
              <q-item-section>
                <q-item-label>导出全部</q-item-label>
                <q-item-label caption>导出所有通讯录记录</q-item-label>
              </q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="handleExportCommunications('filtered')">
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
          <!-- 员工姓名/WBC搜索 -->
          <div class="col-md-2 col-sm-6 col-xs-12">
            <q-input v-model="filters.searchQuery" label="搜索员工姓名/WBC" emit-value map-options clearable
              @update:model-value="handleFilterChange" dense />
          </div>

          <!-- 所属机构筛选 -->
          <div class="col-md-2 col-sm-4 col-xs-12">
            <q-select v-model="filters.division" label="所属机构" :options="divisionOptions" option-label="division_name"
              option-value="id" emit-value map-options clearable dense />
          </div>

          <!-- 所属部门筛选 -->
          <div class="col-md-2 col-sm-4 col-xs-12">
            <q-select v-model="filters.department" label="所属部门" :options="departmentOptions"
              option-label="department_name" option-value="id" emit-value map-options clearable dense />
          </div>

          <!-- 删除状态筛选 -->
          <div class="col-md-2 col-sm-4 col-xs-12">
            <q-select v-model="filters.isDelete" label="删除状态" :options="deleteStatusOptions" option-label="label"
              option-value="value" emit-value map-options clearable @update:model-value="handleFilterChange" dense />
          </div>

          <div class="col-md-2 col-sm-4 col-xs-12">
            <q-btn label="重置" color="secondary" @click="resetFilters" class="full-width" unelevated />
          </div>
          <div class="col-md-2 col-sm-4 col-xs-12">
            <q-btn label="筛选" color="primary" type="submit" class="full-width" unelevated />
          </div>
        </div>
      </q-form>
    </div>

    <!-- 通讯录记录列表 -->
    <div class="col-12 bg-white rounded-borders shadow-sm">
      <q-table :rows="communications" :columns="columns" v-model:pagination="pagination"
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
            <div class="row items-center">
              <q-avatar size="32px" class="q-mr-sm">
                <img :src="props.row.employee_avatar || 'https://cdn.quasar.dev/img/boy-avatar.png'" alt="头像">
              </q-avatar>
              <div>
                <div>{{ props.row.employee_name }}</div>
                <div class="text-caption text-grey">{{ props.row.employee_wbc }}</div>
              </div>
            </div>
          </q-td>
        </template>

        <!-- 主要联系方式 -->
        <template #body-cell-main_contact="props">
          <q-td :props="props">
            <div class="column">
              <div>手机: {{ props.row.mobile_no || '-' }}</div>
              <div>邮箱: {{ props.row.email || '-' }}</div>
            </div>
          </q-td>
        </template>

        <!-- 其他联系方式 -->
        <template #body-cell-other_contacts="props">
          <q-td :props="props">
            <div class="column">
              <div>电话: {{ props.row.tel_no || '-' }}</div>
              <div>备用: {{ props.row.backup_no || '-' }}</div>
              <div>微信: {{ props.row.wechat_no || '-' }}</div>
            </div>
          </q-td>
        </template>

        <!-- 删除状态 -->
        <template #body-cell-is_delete="props">
          <q-td :props="props">
            <q-badge :color="props.row.is_delete ? 'negative' : 'positive'"
              :label="props.row.is_delete ? '已删除' : '正常'" />
          </q-td>
        </template>

        <!-- 操作按钮 -->
        <template #body-cell-actions="props">
          <q-td :props="props">
            <q-btn size="sm" color="info" icon="visibility" class="q-mr-1" @click="viewCommunicationDetail(props.row)"
              label="查看" />
            <q-btn size="sm" color="accent" icon="edit" @click="editCommunication(props.row)" label="编辑" />
            <q-btn size="sm" color="warning" icon="delete" @click="handleDeleteCommunication(props.row)"
              :label="props.row.is_delete ? '恢复' : '删除'" />
          </q-td>
        </template>

        <template #loading>
          <div class="row items-center justify-center q-pa-md">
            <q-spinner size="40px" color="primary" />
            <span class="q-ml-md text-subtitle1">加载通讯录记录中...</span>
          </div>
        </template>
      </q-table>
    </div>

    <!-- 查看记录详情弹窗 -->
    <q-dialog v-model="isDetailDialogOpen" persistent>
      <q-card style="width: 600px; max-width: 90vw;">
        <q-card-section>
          <div class="row items-center justify-between">
            <div class="row items-center">
              <q-avatar size="96px" class="q-mr-sm">
                <img :src="communicationDetail.employee_avatar || 'https://cdn.quasar.dev/img/boy-avatar.png'" alt="头像"
                  @error="handleImageError">
              </q-avatar>
              <h5 class="text-h5 q-ma-none">通讯录详情</h5>
            </div>
            <q-btn icon="close" flat round @click="isDetailDialogOpen = false" />
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pt-none">
          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">员工编号:</div>
            <div class="col-8">{{ communicationDetail.employee_wbc || '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">员工姓名:</div>
            <div class="col-8">{{ communicationDetail.employee_name || '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">手机号码:</div>
            <div class="col-8">{{ communicationDetail.mobile_no || '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">电话号码:</div>
            <div class="col-8">{{ communicationDetail.tel_no || '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">备用电话:</div>
            <div class="col-8">{{ communicationDetail.backup_no || '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">Whatsapp:</div>
            <div class="col-8">{{ communicationDetail.whatsapp_no || '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">微信号:</div>
            <div class="col-8">{{ communicationDetail.wechat_no || '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">QQ号:</div>
            <div class="col-8">{{ communicationDetail.qq_no || '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">邮箱:</div>
            <div class="col-8">{{ communicationDetail.email || '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">备用邮箱:</div>
            <div class="col-8">{{ communicationDetail.spare_email || '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">家庭住址:</div>
            <div class="col-8">{{ communicationDetail.home_address || '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">备注:</div>
            <div class="col-8">{{ communicationDetail.description || '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">删除状态:</div>
            <div class="col-8">
              <q-badge :color="communicationDetail.is_delete ? 'negative' : 'positive'"
                :label="communicationDetail.is_delete ? '已删除' : '正常'" />
            </div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">创建时间:</div>
            <div class="col-8">{{ communicationDetail.created_at ? formatDate(communicationDetail.created_at) : '-' }}
            </div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">更新时间:</div>
            <div class="col-8">{{ communicationDetail.updated_at ? formatDate(communicationDetail.updated_at) : '-' }}
            </div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">创建人:</div>
            <div class="col-8">{{ communicationDetail.created_by_name || '-' }}</div>
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
            <h5 class="text-h5">确认{{ isSoftDelete === 'true' ? '删除' : '永久删除' }}</h5>
            <q-btn icon="close" flat round @click="isDeleteDialogOpen = false" />
          </div>
        </q-card-section>
        <q-card-section>
          <p>确定要{{ isSoftDelete === 'true' ? '删除' : '永久删除' }}员工 {{ currentCommunication.employee_name }} ({{
            currentCommunication.employee_wbc }}) 的通讯录记录吗？</p>
          <div class="q-mt-sm">
            <q-radio v-model="isSoftDelete" val="true" label="标记删除" class="q-mr-md" />
            <q-radio v-model="isSoftDelete" val="false" label="永久删除" />
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn label="取消" @click="isDeleteDialogOpen = false" color="secondary" />
          <q-btn label="确认" @click="confirmDeleteCommunication" color="warning" class="text-blue" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 新增/编辑表单对话框 -->
    <q-dialog v-model="isFormDialogOpen" persistent>
      <q-card style="width: 700px; max-width: 90vw;">
        <q-card-section>
          <div class="row items-center justify-between">
            <h5 class="text-h5">{{ formMode === 'add' ? '新增通讯录' : '编辑通讯录' }}</h5>
            <q-btn icon="close" flat round @click="isFormDialogOpen = false" />
          </div>
        </q-card-section>
        <q-card-section>
          <q-form @submit="handleSubmit">
            <div class="row q-col-gutter-md">
              <!-- 员工信息 -->
              <div class="col-12">
                <div class="text-subtitle1 q-mb-sm">员工信息</div>
              </div>

              <div class="col-12" v-if="formMode === 'add'">
                <q-select v-model="currentCommunication.employee" label="员工 *" :options="employeeOptions"
                  option-label="employee_name" option-value="id" map-options emit-value clearable dense outlined
                  :rules="[val => !!val || '请选择员工']" />
              </div>

              <div class="col-12" v-else>
                <q-input v-model="currentCommunication.employee_name" label="员工姓名" dense outlined readonly />
              </div>

              <!-- 主要联系方式 -->
              <div class="col-12 q-mt-md">
                <div class="text-subtitle1 q-mb-sm">主要联系方式</div>
              </div>

              <div class="col-6">
                <q-input v-model="currentCommunication.mobile_no" label="手机号码 *" dense outlined
                  :rules="[val => !!val || '手机号码不能为空']" />
              </div>

              <div class="col-6">
                <q-input v-model="currentCommunication.email" label="邮箱地址" dense outlined type="email" />
              </div>

              <!-- 其他联系方式 -->
              <div class="col-12 q-mt-md">
                <div class="text-subtitle1 q-mb-sm">其他联系方式</div>
              </div>

              <div class="col-6">
                <q-input v-model="currentCommunication.tel_no" label="电话号码" dense outlined />
              </div>

              <div class="col-6">
                <q-input v-model="currentCommunication.backup_no" label="备用电话" dense outlined />
              </div>

              <div class="col-6">
                <q-input v-model="currentCommunication.whatsapp_no" label="Whatsapp号码" dense outlined />
              </div>

              <div class="col-6">
                <q-input v-model="currentCommunication.wechat_no" label="微信号" dense outlined />
              </div>

              <div class="col-6">
                <q-input v-model="currentCommunication.qq_no" label="QQ号码" dense outlined />
              </div>

              <div class="col-6">
                <q-input v-model="currentCommunication.spare_email" label="备用邮箱" dense outlined type="email" />
              </div>

              <!-- 其他信息 -->
              <div class="col-12 q-mt-md">
                <div class="text-subtitle1 q-mb-sm">其他信息</div>
              </div>

              <div class="col-12">
                <q-input v-model="currentCommunication.home_address" label="家庭住址" dense outlined type="textarea"
                  rows="2" />
              </div>

              <div class="col-12">
                <q-input v-model="currentCommunication.description" label="备注" dense outlined type="textarea"
                  rows="3" />
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

    <!-- 1. 通讯录初始化导入弹窗 -->
    <q-dialog v-model="showInitImportDialog" max-width="700px">
      <q-card>
        <q-card-section class="row items-center justify-between">
          <h5 class="text-h5 text-negative">⚠️ 通讯录初始化导入</h5>
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
                <li>1. 初始化导入将<span class="font-medium text-negative">覆盖现有通讯录数据</span>，适用于系统首次上线或全量数据重置</li>
                <li>2. 若勾选"清空现有数据"，将删除所有通讯录记录，<span class="font-medium text-negative">操作不可撤销</span></li>
                <li>3. 请确保导入文件包含员工、手机号等必填字段（建议先下载模板）</li>
              </ul>
            </div>

            <!-- 模板下载 -->
            <div class="flex justify-between items-center">
              <p class="text-sm">请下载模板并按格式填写数据</p>
              <q-btn label="下载通讯录初始化模板" color="secondary" icon="file_download" size="sm"
                @click="downloadInitTemplate" />
            </div>

            <!-- 文件上传 -->
            <q-uploader label="选择通讯录初始化文件（仅支持.xlsx/.xls）" accept=".xlsx, .xls" :max-files="1"
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
              <q-checkbox v-model="initClearExisting" label="清空现有通讯录数据" color="negative"
                @update:model-value="handleClearConfirm" />
            </div>

            <!-- 导入结果/错误展示 -->
            <div v-if="importErrors.length > 0" class="mt-4">
              <h6 class="text-negative text-sm font-medium">导入失败记录（共{{ importErrors.length }}条）</h6>
              <div class="bg-white border border-gray-200 rounded mt-2 max-h-60 overflow-auto">
                <q-table :rows="importErrors" :columns="importErrorColumns" row-key="row" dense hide-header flat />
              </div>
              <q-btn label="下载通讯录错误详情" color="negative" size="sm" class="mt-2" @click="downloadImportErrors" dense />
            </div>

            <!-- 初始化成功统计 -->
            <div v-if="importResult" class="mt-4 bg-positive/10 p-3 rounded">
              <h6 class="text-positive font-medium">通讯录初始化导入成功</h6>
              <ul class="text-sm mt-2 space-y-1">
                <li>成功创建通讯录记录：{{ importResult.communication_success_count }} 条</li>
                <li>失败记录：{{ importResult.error_count }} 条</li>
              </ul>
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md">
          <q-btn label="取消" color="secondary" @click="resetInitImportState" />
          <q-btn label="开始通讯录初始化" color="negative" class="ml-2" @click="handleImport"
            :disable="!selectedFile || importLoading" :loading="importLoading" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 2. 普通导入弹窗 -->
    <q-dialog v-model="showNormalImportDialog" max-width="700px">
      <q-card>
        <q-card-section class="row items-center justify-between">
          <h5 class="text-h5">普通通讯录导入</h5>
          <q-btn icon="close" flat round @click="closeImportDialogs" />
        </q-card-section>
        <q-card-section class="q-pa-md">
          <div class="space-y-4">
            <p class="text-sm">普通通讯录导入仅新增/更新通讯录记录，不删除现有数据，适用于日常批量更新</p>
            <div class="flex justify-between items-center">
              <p class="text-sm">请下载模板并按格式填写数据</p>
              <q-btn label="下载普通通讯录导入模板" color="secondary" icon="file_download" size="sm"
                @click="downloadNormalTemplate" />
            </div>
            <q-uploader label="选择通讯录普通导入文件（仅支持.xlsx/.xls）" accept=".xlsx, .xls" :max-files="1"
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
          <q-btn label="开始通讯录普通导入" color="primary" class="ml-2" @click="handleImport"
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

// API导入 - 通讯录相关接口
import {
  getCommunications,
  getCommunicationDetail,
  createCommunication,
  updateCommunication,
  deleteCommunication,
  softDeleteCommunication,
  downloadCommunicationTemplate,
  exportCommunications,
  importCommunications,
  getEmployees,
  getDivisions,
  getDepartments
} from 'src/services/employeeServiceApi'

// 初始化Quasar
const $q = useQuasar()

// -------------------------- 基础状态变量 --------------------------
const communications = ref([])
const tableLoading = ref(false)
const isDetailDialogOpen = ref(false)
const isDeleteDialogOpen = ref(false)
const isFormDialogOpen = ref(false)
const formMode = ref('add')

// -------------------------- 筛选与分页 --------------------------
const filters = ref({
  searchQuery: '',
  division: null,
  department: null,
  isDelete: false
})

const pagination = ref({
  page: 1,
  rowsPerPage: 10,
  sortBy: 'employee__wbc',
  descending: false,
  rowsNumber: 0
})

// -------------------------- 数据模型 --------------------------
const currentCommunication = ref({
  id: null,
  employee: null,
  employee_name: '',
  employee_wbc: '',
  mobile_no: '',
  tel_no: '',
  backup_no: '',
  whatsapp_no: '',
  wechat_no: '',
  qq_no: '',
  email: '',
  spare_email: '',
  home_address: '',
  description: '',
  is_delete: false
})

const communicationDetail = ref({})
// -------------------------- 下拉选项配置 --------------------------
const employeeOptions = ref([])
const divisionOptions = ref([])
const departmentOptions = ref([])
const deleteStatusOptions = ref([
  { label: '全部', value: null },
  { label: '正常', value: false },
  { label: '已删除', value: true }
])

// -------------------------- 删除选项 --------------------------
const isSoftDelete = ref('true')
// -------------------------- 表格配置 --------------------------
const columns = ref([
  { name: 'index', label: '序号', field: '', align: 'left', sortable: true, width: '60px' },
  { name: 'employee', label: '员工信息', field: 'employee', align: 'left', sortable: true },
  { name: 'main_contact', label: '主要联系方式', field: 'main_contact', align: 'left' },
  { name: 'other_contacts', label: '其他联系方式', field: 'other_contacts', align: 'left' },
  { name: 'email', label: '邮箱', field: 'email', align: 'left', sortable: true },
  { name: 'division_name', label: '所属机构', field: 'division_name', align: 'left', sortable: true },
  { name: 'department_name', label: '所属部门', field: 'department_name', align: 'left', sortable: true },
  { name: 'is_delete', label: '状态', field: 'is_delete', align: 'left', sortable: true },
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

const handleImageError = (event) => {
  event.target.src = 'https://cdn.quasar.dev/img/boy-avatar.png';
};
// -------------------------- 操作方法 --------------------------
const openFormDialog = (mode, communication = null) => {
  formMode.value = mode
  isFormDialogOpen.value = true

  if (mode === 'edit' && communication) {
    currentCommunication.value = { ...communication }
  } else {
    // 重置为默认值
    currentCommunication.value = {
      id: null,
      employee: null,
      employee_name: '',
      employee_wbc: '',
      mobile_no: '',
      tel_no: '',
      backup_no: '',
      whatsapp_no: '',
      wechat_no: '',
      qq_no: '',
      email: '',
      spare_email: '',
      home_address: '',
      description: '',
      is_delete: false
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

  if (filters.value.division) {
    params.append('employee__division', filters.value.division)
  }

  if (filters.value.department) {
    params.append('employee__department', filters.value.department)
  }

  if (filters.value.isDelete !== null) {
    const isDeleteValue = filters.value.isDelete ? 'True' : 'False'
    params.append('is_delete', isDeleteValue)
  }

  return params
}

// 获取通讯录列表
const fetchCommunications = async () => {
  try {
    tableLoading.value = true
    const params = buildFilterParams()
    const response = await getCommunications(params)

    if (response.status === 200) {
      communications.value = response.data.results
      pagination.value.rowsNumber = response.data.count
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '获取通讯录失败',
      position: 'top'
    })
  } finally {
    tableLoading.value = false
  }
}

const viewCommunicationDetail = async (communication) => {
  isDetailDialogOpen.value = true
  try {
    const response = await getCommunicationDetail(communication.id)
    if (response.status === 200) {
      communicationDetail.value = response.data
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '获取通讯录详情失败',
      position: 'top'
    })
  }
}

// 获取下拉选项数据
async function fetchSelectOptions() {
  try {
    // 获取员工选项
    const employeesResponse = await getEmployees()
    if (employeesResponse.status === 200) {
      employeeOptions.value = employeesResponse.data.results
    }

    // 获取机构选项
    const divisionsResponse = await getDivisions()
    if (divisionsResponse.status === 200) {
      divisionOptions.value = divisionsResponse.data.results
    }

    // 获取部门选项
    const departmentsResponse = await getDepartments()
    if (departmentsResponse.status === 200) {
      departmentOptions.value = departmentsResponse.data.results
    }
  } catch (error) {
    console.error('获取下拉选项失败:', error)
  }
}

// -------------------------- 新增/编辑处理 --------------------------
// 表单验证
const validateForm = () => {
  if (formMode.value === 'add' && !currentCommunication.value.employee) {
    $q.notify({
      color: 'negative',
      message: '请选择员工',
      position: 'top'
    })
    return false
  }

  if (!currentCommunication.value.mobile_no?.trim()) {
    $q.notify({
      color: 'negative',
      message: '请输入手机号码',
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
      await handleAddCommunication()
    } else if (formMode.value === 'edit') {
      await handleEditCommunication(currentCommunication.value.id)
    }
  } finally {
    isFormDialogOpen.value = false
  }
}

// 添加通讯录
const handleAddCommunication = async () => {
  try {
    // 清理空字符串字段
    const formData = { ...currentCommunication.value }
    Object.keys(formData).forEach(key => {
      if (typeof formData[key] === 'string' && formData[key].trim() === '') {
        formData[key] = null
      }
    })

    const response = await createCommunication(formData)
    if (response.status === 201) {
      $q.notify({
        color: 'positive',
        message: '添加通讯录成功',
        position: 'top'
      })
      fetchCommunications()
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '添加通讯录失败',
      position: 'top'
    })
  }
}

// 编辑通讯录
const editCommunication = async (communication) => {
  formMode.value = 'edit'
  isFormDialogOpen.value = true
  try {
    const response = await getCommunicationDetail(communication.id)
    if (response.status === 200) {
      currentCommunication.value = response.data
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '获取通讯录详情失败',
      position: 'top'
    })
  }
}

// 更新通讯录
const handleEditCommunication = async (communicationId) => {
  try {
    // 清理空字符串字段
    const formData = { ...currentCommunication.value }
    Object.keys(formData).forEach(key => {
      if (typeof formData[key] === 'string' && formData[key].trim() === '') {
        formData[key] = null
      }
    })

    const response = await updateCommunication(communicationId, formData)
    if (response.status === 200) {
      $q.notify({
        color: 'positive',
        message: '更新通讯录成功',
        position: 'top'
      })
      fetchCommunications()
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '更新通讯录失败',
      position: 'top'
    })
  }
}

// -------------------------- 删除处理 --------------------------
const handleDeleteCommunication = async (communication) => {
  currentCommunication.value.id = communication.id
  currentCommunication.value.employee_name = communication.employee_name
  currentCommunication.value.employee_wbc = communication.employee_wbc
  isDeleteDialogOpen.value = true
}

// 确认删除通讯录
const confirmDeleteCommunication = async () => {
  try {
    const deleteMode = isSoftDelete.value === 'true'
    let response
    if (deleteMode) {
      response = await softDeleteCommunication(currentCommunication.value.id)
    } else {
      response = await deleteCommunication(currentCommunication.value.id)
    }
    if (response.status === 204 || response.status === 200) {
      $q.notify({
        color: 'positive',
        message: deleteMode ? '标记删除成功' : '永久删除成功',
        position: 'top'
      })
      fetchCommunications()
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '删除通讯录失败',
      position: 'top'
    })
  } finally {
    isDeleteDialogOpen.value = false
  }
}

// -------------------------- 筛选与分页处理 --------------------------
const applyFilters = () => {
  pagination.value.page = 1
  fetchCommunications()
}

// 筛选条件变化
function handleFilterChange() {
  pagination.value.page = 1
}

// 重置筛选
function resetFilters() {
  filters.value = {
    searchQuery: '',
    division: null,
    department: null,
    isDelete: null
  }

  pagination.value.page = 1

  // 添加防抖处理
  clearTimeout(filterTimer)
  filterTimer = setTimeout(() => {
    fetchCommunications()
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
  fetchCommunications()
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
    const response = await downloadCommunicationTemplate({ template_type: 'init' })
    fileUtils.downloadBlob(response.data, '通讯录初始化导入模板.xlsx')
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
    const response = await downloadCommunicationTemplate({ template_type: 'normal' })
    fileUtils.downloadBlob(response.data, '通讯录普通导入模板.xlsx')
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
      message: '确定要清空所有通讯录数据吗？此操作将删除所有通讯录记录，且无法恢复！',
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

    const response = await importCommunications(selectedFile.value, additionalParams)

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
          fetchCommunications()
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

// 6. 导出处理 - 使用优化后的接口参数传递方式
async function handleExportCommunications(exportType = 'all') {
  try {
    tableLoading.value = true

    // 构建导出参数
    let params = {}

    // 如果是导出筛选结果，则使用当前筛选条件
    if (exportType === 'filtered') {
      if (filters.value.searchQuery) {
        params.search = filters.value.searchQuery
      }
      if (filters.value.division) {
        params.employee__division = filters.value.division
      }
      if (filters.value.department) {
        params.employee__department = filters.value.department
      }
      if (filters.value.isDelete !== null) {
        params.is_delete = filters.value.isDelete ? 'True' : 'False'
      }
    }

    const response = await exportCommunications(params)
    const filename = `通讯录_${format(new Date(), 'yyyyMMddHHmmss')}.xlsx`
    fileUtils.downloadBlob(response.data, filename)

  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '导出通讯录失败',
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

  exportExcel(exportData, `通讯录导入错误详情_${format(new Date(), 'yyyyMMddHHmmss')}.xlsx`)
}

// -------------------------- 页面初始化 --------------------------
onMounted(() => {
  fetchSelectOptions()
  fetchCommunications()
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
