<template>
  <q-page class="q-pa-md">
    <!-- 页面标题与说明 -->
    <div class="row col-12 flex justify-between items-center">
      <div>
        <h5 class="text-h5 q-ma-none">库位-SKU关系管理</h5>
        <p class="text-subtitle2 text-secondary">一个库位可存放多个SKU，一个SKU可存放在多个库位</p>
      </div>
      <!-- 卡片头部：标题+新增按钮 -->
      <div class="flex gap-2">
        <!-- 导入按钮 -->
        <q-btn-dropdown color="primary" label="导入" icon="upload">
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
        <!-- 导出按钮 -->
        <q-btn label="导出" color="primary" icon="download" @click="handleExportRelations" />
        <q-btn color="primary" label="新增库位-SKU关联" @click="openLocationSkuDialog(false)" icon="add" />
      </div>
    </div>

    <!-- 筛选栏：库位+SKU双维度搜索 -->
    <div class="row flex flex-wrap gap-4 mb-4">
      <q-select v-model="filters.warehouse" label="选择仓库" :options="warehouseOptions" option-label="name"
        option-value="id" clearable dense class="w-56" @update:model-value="onFilterChange"
        style="width: 160px;margin-right: 12px;" />
      <q-input v-model="searchParams.location" label="搜索库位（名称/编码）" placeholder="输入库位名称或编码" dense clearable
        style="width: 300px; margin-left: 24px;" @update:model-value="filterLocationSkuList" />

      <q-input v-model="searchParams.sku" label="搜索SKU（编码/规格）" placeholder="输入SKU编码或规格" dense clearable
        style="width: 300px; margin-left: 24px;" @update:model-value="filterLocationSkuList" />

      <q-btn color="grey-6" label="重置搜索" @click="resetSearchParams" style="width: 120px;margin-left: 24px;" />
      <q-btn color="teal" label="开始筛选" @click="filterLocationSkuList" style="width: 120px;margin-left: 24px;" />
    </div>

    <!-- 库位-SKU列表表格 -->
    <div class="col-12 bg-white rounded-borders shadow-sm">
      <q-table :rows="locationSkus" :columns="locationSkuColumns" v-model:pagination="locationSkuPagination"
        row-key="id" :loading="loadingLocationSkus" dense no-data-label="暂无库位-SKU关联数据" class="q-mt-md" bordered
        :rows-per-page-options="[10, 20, 50, 100]" @request="onLocationSkuTableRequest">
        <template v-slot:body-cell-index="props">
          <q-td :props="props">
            <q-badge color="primary">
              {{ (locationSkuPagination.page - 1) * locationSkuPagination.rowsPerPage + props.pageIndex + 1 }}
            </q-badge>
          </q-td>
        </template>
        <!-- 操作列：编辑+删除 -->
        <template #body-cell-actions="props">
          <q-td :props="props">
            <q-btn v-for="action in locationSkuActions" :key="action.label" :label="action.label" :color="action.color"
              :icon="action.icon" @click="action.handler(props.row)" :title="action.title" dense class="q-ml-xs" flat
              :disabled="action.disabled(props.row)" />
          </q-td>
        </template>

        <template #body-cell-created_at="props">
          <q-td :props="props">
            {{ formatDate(props.row.created_at) }}
          </q-td>
        </template>

        <template #body-cell-location_name="props">
          <q-td :props="props">
            {{ props.row.location_name }}
          </q-td>
        </template>

        <template #body-cell-location_code="props">
          <q-td :props="props">
            <span class="text-primary">{{ props.row.location_code }}</span>
          </q-td>
        </template>

        <template #body-cell-warehouse_name="props">
          <q-td :props="props">
            {{ props.row.warehouse_name }}
          </q-td>
        </template>

        <template #body-cell-product_name="props">
          <q-td :props="props">
            {{ props.row.product_name }}
          </q-td>
        </template>

      </q-table>
    </div>
    <!-- 2. 新增/编辑库位-SKU关联弹窗 -->
    <q-dialog v-model="locationSkuDialog.show" :maximized="false">
      <q-card style="width: 700px; max-width: 90vw;">
        <q-card-section class="q-pa-md">
          <!-- 弹窗标题 -->
          <h5 class="text-subtitle1 mb-4">
            {{ locationSkuDialog.isEdit ? `编辑关联（${locationSkuDialog.currentRow?.sku_code || ''}）` : '新增库位-SKU关联'
            }}
          </h5>

          <!-- 关联表单 -->
          <q-form ref="locationSkuFormRef" @submit.prevent="saveLocationSku" class="space-y-4">
            <!-- 所属库位（必填） -->
            <q-select v-model="locationSkuFormData.location_code" label="所属库位 *" :options="filteredLocationOptions"
              option-label="label" option-value="code" emit-value map-options use-input @filter="filterLocationOptions"
              hide-selected fill-input :rules="[val => !!val || '请选择所属库位']" dense class="w-full" />

            <!-- 关联SKU（必填） -->
            <q-select v-model="locationSkuFormData.sku_code" label="关联SKU *" :options="filteredSkuOptions"
              @update:model-value="handleSkuChange" use-input @filter="filterSkuOptions" hide-selected fill-input
              :rules="[val => !!val || '请选择关联SKU']" dense class="w-full" />

            <!-- 库存数量相关 -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- 当前库存 -->
              <q-input v-model.number="locationSkuFormData.quantity" label="当前库存" type="number" min="0" disable
                :rules="[val => val >= 0 || '当前库存不能为负数']" dense class="w-full" />
            </div>

            <!-- 表单底部按钮 -->
            <div class="flex justify-end mt-6">
              <q-btn label="取消" @click="locationSkuDialog.show = false" class="mr-2" dense />
              <q-btn label="保存" type="submit" color="primary" :loading="submitting" dense
                :disable="!locationSkuFormData.sku_code || !locationSkuFormData.location_code" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- 3. 图片预览弹窗 -->
    <q-dialog v-model="imagePreviewDialog.show" :maximized="false">
      <q-card style="width: 800px; max-width: 90vw;">
        <q-card-section class="q-pa-md">
          <h5 class="text-subtitle1 mb-4">图片预览</h5>
          <div class="flex justify-center items-center">
            <q-img :src="imagePreviewDialog.url" style="max-width: 100%; max-height: 500px;" class="rounded"
              fit="contain" />
          </div>
          <div class="flex justify-end mt-6">
            <q-btn label="关闭" @click="imagePreviewDialog.show = false" dense />
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- 4. 导入弹窗 -->
    <!-- 初始化导入弹窗 -->
    <q-dialog v-model="showInitImportDialog" max-width="700px">
      <q-card>
        <q-card-section class="row items-center justify-between">
          <h5 class="text-h5 text-negative">⚠️ 关系初始化导入</h5>
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
                <li>1. 初始化导入将<span class="font-medium text-negative">覆盖现有关系数据</span>，适用于系统首次上线或全量数据重置</li>
                <li>2. 若勾选"清空现有数据"，将删除所有关系记录，<span class="font-medium text-negative">操作不可撤销</span></li>
                <li>3. 请确保导入文件包含"库位编码、SKU编码"等必填字段（建议先下载模板）</li>
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
              <q-checkbox v-model="initClearExisting" label="清空现有关系数据" color="negative"
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
                <li>成功创建关系记录：{{ initImportResult.success_count }} 条</li>
                <li>失败记录：{{ initImportResult.error_count }} 条</li>
              </ul>
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md">
          <q-btn label="取消" color="secondary" @click="resetImportState" />
          <q-btn label="开始初始化" color="negative" class="ml-2" @click="handleInitImport"
            :disabled="!selectedFile || importLoading" :loading="importLoading" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 增量导入弹窗 -->
    <q-dialog v-model="showNormalImportDialog" max-width="700px">
      <q-card>
        <q-card-section class="row items-center justify-between">
          <h5 class="text-h5">关系增量导入</h5>
          <q-btn icon="close" flat round @click="showNormalImportDialog = false" />
        </q-card-section>
        <q-card-section class="q-pa-md">
          <div class="space-y-4">
            <p class="text-sm">增量导入仅新增/更新关系记录，不删除现有数据，适用于日常批量更新</p>
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
  </q-page>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { format } from 'date-fns'

// ========================== 1. 依赖导入 ==========================
import {
  getProductSkuOptions,
  getLocationSkus,
  createLocationSkuRelation,
  updateLocationSkuRelation,
  deleteLocationSkuRelation,
  exportLocationSkuData,
  importLocationSkuData,
  downloadLocationSkuTemplate
} from 'src/services/productServiceApi'

import {
  getLocationOptions,
  getWarehouseOptions,
} from 'src/services/settingsServiceApi'

import { exportExcel } from 'src/utils/excel-utils'

// ========================== 2. 基础工具与状态 ==========================
const $q = useQuasar()
const locationSkuFormRef = ref(null)

// 加载状态
const loadingLocationSkus = ref(false)
const loadingLocations = ref(false)
const loadingProductSkus = ref(false)
const submitting = ref(false)

// 导入导出相关状态
const showInitImportDialog = ref(false)
const showNormalImportDialog = ref(false)
const selectedFile = ref(null)
const importLoading = ref(false)
const importErrors = ref([])
const initClearExisting = ref(false)
const initImportResult = ref(null)

// 导入错误表格列
const importErrorColumns = ref([
  { name: 'row', label: '行号', field: 'row', width: '80px' },
  { name: 'data', label: '数据', field: 'data', format: (val) => JSON.stringify(val).slice(0, 50) + '...' },
  { name: 'error', label: '错误原因', field: 'error' }
])

// ========================== 3. 数据列表与筛选 ==========================
const locationSkus = ref([])
const locationOptions = ref([])
const warehouseOptions = ref([])
const skuOptions = ref([])

// 【筛选：下拉选择 → 全用 null】
const filters = reactive({
  warehouse: null,
  location: null,
  sku: null
})

// 【搜索：输入框 → 全用 ''】
const searchParams = reactive({
  location: '',
  sku: ''
})

const locationSkuPagination = ref({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
  sortBy: 'location__code',
  descending: false
})
const filteredLocationOptions = ref([])
const filteredSkuOptions = ref([])

// 表格列配置
const locationSkuColumns = [
  { name: 'index', label: '序号', field: 'index', width: '50px' },
  { name: 'warehouse_name', label: '仓库名称', field: 'warehouse_name', sortable: true, width: '180px' },
  { name: 'location_name', label: '库位名称', field: 'location_name', sortable: true, width: '180px' },
  { name: 'location_code', label: '库位编码', field: 'location_code', sortable: true, width: '150px' },
  { name: 'product_name', label: '产品名称', field: 'product_name', sortable: true, width: '180px' },
  { name: 'sku_code', label: 'SKU编码', field: 'sku_code', sortable: true, width: '180px' },
  { name: 'quantity', label: '当前库存', field: 'quantity', sortable: true, width: '100px', align: 'right' },
  { name: 'created_at', label: '创建时间', field: 'created_at', sortable: true, width: '180px' },
  { name: 'actions', label: '操作', field: 'actions', width: '120px', align: 'center' }
]

const locationSkuActions = [
  {
    label: '编辑',
    icon: 'edit',
    color: 'primary',
    title: '编辑关联',
    disabled: (row) => Number(row.quantity) !== 0,
    handler: (row) => openLocationSkuDialog(true, row)
  },
  {
    label: '删除',
    icon: 'delete',
    color: 'negative',
    title: '删除关联',
    disabled: (row) => Number(row.quantity) !== 0,
    handler: (row) => handleDeleteLocationSku(row)
  }
]


// ========================== 4. 弹窗配置 ==========================
const locationSkuDialog = ref({
  show: false,
  isEdit: false,
  currentId: null,
  currentRow: null
})

const imagePreviewDialog = ref({
  show: false,
  url: ''
})

const locationSkuFormData = reactive({
  id: null,
  location_id: null,
  location_code: null,
  sku_id: null,
  sku_code: null,
  quantity: 0
})

// ========================== 5. 数据加载函数 ==========================

/**
 * 加载仓库列表
 */
const fetchWarehouseOptions = async () => {
  try {
    const params = {
      page: 1,
      page_size: 1000,
      ordering: 'code'
    }
    const res = await getWarehouseOptions(params)
    warehouseOptions.value = res.data
  } catch (err) {
    $q.notify({
      color: 'negative',
      message: `加载仓库列表失败：${err.message || '网络异常'}`
    })
  }
}
/**
 * 加载库位列表 - 修改为支持分页和搜索 支持按仓库筛选
 */

const fetchLocationOptions = async (searchTerm = '') => {
  loadingLocations.value = true
  try {
    const params = {
      page: 1,
      page_size: 1000,
      ordering: 'code',
      warehouse_id: filters.warehouse?.id || null,
      search: ''
    }

    // 如果有搜索词，则添加到参数中
    if (searchTerm) {
      params.search = searchTerm
    }

    const res = await getLocationOptions(params)
    // 映射为下拉选项格式
    const locations = res.data.map(loc => ({
      id: loc.id,
      label: `${loc.name} - ${loc.code}`,
      name: loc.name,
      code: loc.code
    }))

    locationOptions.value = [...locations]
    filteredLocationOptions.value = [...locations]
  } catch (err) {
    $q.notify({
      color: 'negative',
      message: `加载库位列表失败：${err.message || '网络异常'}`
    })
  } finally {
    loadingLocations.value = false
  }
}

/**
 * 重置搜索参数
 */
const resetSearchParams = () => {
  searchParams.location = ''
  searchParams.sku = ''
  // 重新筛选以显示所有数据
  fetchLocationSkus()
}

/**
 * 加载SKU列表 - 修改为支持分页和搜索
 */
const fetchProductSkuOptions = async (searchTerm = '') => {
  loadingProductSkus.value = true
  try {
    const params = {
      page: 1,
      page_size: 1000,
      ordering: 'sku_code',
      search: ''
    }

    // 如果有搜索词，则添加到参数中
    if (searchTerm) {
      // 假设后端支持search参数进行模糊搜索
      params.search = searchTerm
    }

    const res = await getProductSkuOptions(params)


    // 映射为下拉选项格式
    skuOptions.value = res.data.map(sku => ({
      id: sku.id,
      label: `Product:${sku.sku_code} - SKU:${sku.specification}`,
      sku_code: sku.sku_code,
      max_stock: sku.max_stock,
      min_stock: sku.min_stock,
      specification: sku.specification,
      image: sku.image
    }))

    filteredSkuOptions.value = [...skuOptions.value]
  } catch (err) {
    $q.notify({
      color: 'negative',
      message: `加载SKU列表失败：${err.message || '网络异常'}`
    })
  } finally {
    loadingProductSkus.value = false
  }
}

/**
 * 构建库位-SKU查询参数
 * 统一处理：分页、排序、筛选、搜索
 */
/**
 * 构建库位-SKU 列表查询参数
 */
const buildRequestParams = () => {
  const { page, rowsPerPage, sortBy, descending } = locationSkuPagination.value

  // 排序
  const sortField = sortBy || 'location__code'
  const ordering = descending ? `-${sortField}` : sortField

  const params = {
    page: page,
    page_size: rowsPerPage,
    ordering: ordering
  }

  // ✅ 仓库筛选（安全获取 id，过滤 null/undefined）
  if (filters.warehouse?.id) {
    params.warehouse_id = filters.warehouse.id
  }

  // ✅ 搜索条件（自动过滤空字符串、null、undefined）
  const searchItems = [
    searchParams.location?.trim(),
    searchParams.sku?.trim()
  ].filter(Boolean)

  if (searchItems.length > 0) {
    params.search = searchItems.join(' ').trim()
  }

  return params
}/**
 * 加载库位-SKU关联列表（服务端分页/排序/筛选）
 * @param {Object} rps - 表格分页、排序参数（来自 @request）
 */
const fetchLocationSkus = async () => {
  loadingLocationSkus.value = true


  try {

    // 2. 构建参数并请求
    const params = buildRequestParams()
    const res = await getLocationSkus(params)

    // 3. 更新数据
    locationSkus.value = res.data.results ?? []
    locationSkuPagination.value.rowsNumber = res.data.count ?? 0

  } catch (err) {
    $q.notify({
      color: 'negative',
      message: `加载库位-SKU关联失败：${err.message || '网络异常'}`
    })
  } finally {
    loadingLocationSkus.value = false
  }
}
const onLocationSkuTableRequest = async (props) => {
  locationSkuPagination.value.page = props.pagination.page
  locationSkuPagination.value.rowsPerPage = props.pagination.rowsPerPage
  await fetchLocationSkus()
}

const filterLocationSkuList = () => {
  // 重置到第一页
  locationSkuPagination.value.page = 1
  // 重新加载数据
  fetchLocationSkus()
}

/**
 * 筛选条件变化处理
 */
const onFilterChange = () => {
  // 重置到第一页
  locationSkuPagination.value.page = 1
  // 重新加载数据
  fetchLocationSkus()

  // 如果仓库筛选条件变化，也需要重新加载库位选项
  if (filters.warehouse) {

    fetchLocationOptions()
  }
}

// 页面挂载时初始化数据
onMounted(async () => {
  await Promise.all([
    fetchLocationSkus(),
    fetchWarehouseOptions(),
    fetchLocationOptions(),
    fetchProductSkuOptions(),

  ])
})

// ========================== 6. 筛选与弹窗操作 ==========================
/**
 * 库位下拉筛选 - 修改为从后端获取数据
 */
const filterLocationOptions = (val, update) => {

  // 防抖处理
  clearTimeout(filterLocationOptions.timer)
  filterLocationOptions.timer = setTimeout(async () => {
    await fetchLocationOptions(val || '')
    update(() => {
      filteredLocationOptions.value = [...locationOptions.value]
    })
  }, 300)
}


/**
 * SKU下拉筛选 - 修改为从后端获取数据
 */
const filterSkuOptions = (val, update) => {

  // 防抖处理
  clearTimeout(filterSkuOptions.timer)
  filterSkuOptions.timer = setTimeout(async () => {
    await fetchProductSkuOptions(val || '')
    update(() => {
      filteredSkuOptions.value = [...skuOptions.value] // 这里现在可以正常工作了
    })
  }, 300)
}

/**
 * 打开新增/编辑关联弹窗
 */
const openLocationSkuDialog = (isEdit, row = null) => {
  // 重置表单数据
  Object.assign(locationSkuFormData, {
    id: null,
    location_code: '',
    sku_code: '',
    quantity: 0
  })

  // 设置弹窗状态
  locationSkuDialog.value = {
    show: true,
    isEdit,
    currentId: isEdit ? row.id : null,
    currentRow: isEdit ? row : null
  }

  // 编辑模式：回显数据
  if (isEdit && row) {
    Object.assign(locationSkuFormData, {
      id: row.id || null,
      location_code: row.location_code || '',
      sku_code: row.sku_code || '',
      quantity: Number(row.quantity) || 0
    })
  }
}


// ========================== 7. 表单提交 ==========================
/**
 * 保存库位-SKU关联
 */
const saveLocationSku = async () => {
  const isValid = await locationSkuFormRef.value.validate()
  if (!isValid) return
  if (submitting.value) return

  submitting.value = true
  const foundLocation = filteredLocationOptions.value.find(loc => loc.code === locationSkuFormData.location_code)
  if (!foundLocation) {
    $q.notify({ color: 'negative', message: '请选择有效的库位' })
    submitting.value = false
    return
  }
  const foundSku = filteredSkuOptions.value.find(sku => sku.sku_code === locationSkuFormData.sku_code)
  if (!foundSku) {
    $q.notify({ color: 'negative', message: '请选择有效的SKU' })
    submitting.value = false
    return
  }

  try {
    const submitData = {
      location_id: foundLocation.id,
      location_code: foundLocation.code,
      sku_id: foundSku.id,
      sku_code: foundSku.sku_code,
    }

    if (locationSkuDialog.value.isEdit) {
      await updateLocationSkuRelation(locationSkuDialog.value.currentId, submitData)
      $q.notify({ color: 'positive', message: '库位-SKU关联更新成功' })
    } else {
      await createLocationSkuRelation(submitData)
      $q.notify({ color: 'positive', message: '库位-SKU关联创建成功' })
    }

    await fetchLocationSkus()
    locationSkuDialog.value.show = false
  } catch (err) {
    const errMsg =
      err.response?.data?.error ||          // 你后端返回的格式
      err.response?.data?.non_field_errors?.[0] ||
      err.response?.data?.detail ||
      '操作失败，请重试'

    $q.notify({ color: 'negative', message: errMsg })
  } finally {
    submitting.value = false
  }
}

// ========================== 8. 删除关联 ==========================
/**
 * 删除库位-SKU关联
 */
const handleDeleteLocationSku = (row) => {
  $q.dialog({
    title: '确认删除',
    message: `确定删除库位 ${row.location_code} 与 SKU ${row.sku_code} 的关联吗？`,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      await deleteLocationSkuRelation(row.id)
      await fetchLocationSkus()
      $q.notify({
        type: 'positive',
        message: '删除成功'
      })
    } catch (err) {
      $q.notify({
        color: 'negative',
        message: `删除失败：${err.message || '网络异常'}`
      })
    }
  })
}

/**
 * 处理SKU选择变化
 */
const handleSkuChange = (selectedSku) => {
  if (selectedSku) {
    locationSkuFormData.sku_code = selectedSku.sku_code || ''
  } else {
    locationSkuFormData.sku_code = null
  }
}

/**
 * 格式化日期显示
 */
const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// ========================== 9. 导入导出功能 ==========================
/**
 * 导出库位-SKU关系数据
 */
const handleExportRelations = async () => {
  try {
    loadingLocationSkus.value = true
    const res = await exportLocationSkuData({
      location: searchParams.location,
      sku: searchParams.sku
    })

    // 处理Excel文件下载
    const blob = new Blob([res.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `库位-SKU关系数据_${format(new Date(), 'yyyyMMddHHmmss')}.xlsx`
    document.body.appendChild(a)
    a.click()
    URL.revokeObjectURL(url)
    document.body.removeChild(a)

    $q.notify({ type: 'positive', message: '关系数据导出成功' })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: '导出失败：' + (error.response?.data?.error || error.message)
    })
  } finally {
    loadingLocationSkus.value = false
  }
}

/**
 * 下载初始化模板
 */
async function downloadInitTemplate() {
  try {
    const response = await downloadLocationSkuTemplate('init')
    handleFileDownload(response, '库位-SKU关系初始化导入模板.xlsx')
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '初始化模板下载失败',
      position: 'top'
    })
  }
}

/**
 * 下载增量导入模板
 */
async function downloadNormalTemplate() {
  try {
    const response = await downloadLocationSkuTemplate('normal')
    handleFileDownload(response, '库位-SKU关系增量导入模板.xlsx')
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '增量导入模板下载失败',
      position: 'top'
    })
  }
}

/**
 * 通用文件下载处理函数
 */
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

/**
 * 文件选择处理
 */
function handleFileSelected(files) {
  if (files && files.length > 0) {
    selectedFile.value = files[0]
    importErrors.value = []
    initImportResult.value = null
  }
}

/**
 * 初始化导入确认（清空数据的二次确认）
 */
async function handleClearConfirm(checked) {
  if (checked) {
    const confirm = $q.dialog({
      title: '危险操作确认',
      message: '确定要清空所有关系数据吗？此操作将删除所有关系记录，且无法恢复！',
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

/**
 * 关系初始化导入（核心功能）
 */
async function handleInitImport() {
  if (!selectedFile.value) return

  try {
    importLoading.value = true
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    formData.append('clear_existing', initClearExisting.value) // 传递清空参数
    formData.append('import_type', 'init')

    const response = await importLocationSkuData(formData)

    if (response.status === 200) {
      const result = response.data
      initImportResult.value = result
      importErrors.value = result.errors || []

      // 提示结果
      $q.notify({
        color: 'positive',
        message: `初始化成功！关系记录：${result.success_count}条`,
        position: 'top'
      })

      // 无错误则关闭弹窗并刷新
      if (result.error_count === 0) {
        setTimeout(() => {
          resetImportState()
          fetchLocationSkus()
        }, 1500)
      }
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '关系初始化失败',
      position: 'top'
    })
  } finally {
    importLoading.value = false
  }
}

/**
 * 关系增量导入
 */
async function handleNormalImport() {
  if (!selectedFile.value) return

  try {
    importLoading.value = true
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    formData.append('clear_existing', false) // 增量导入不清空

    const response = await importLocationSkuData(formData)
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
        fetchLocationSkus()
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

/**
 * 下载导入错误详情
 */
function downloadImportErrors() {
  if (importErrors.value.length === 0) return
  // 转换错误数据为Excel格式
  const exportData = importErrors.value.map(err => ({
    '行号': err.row,
    '错误原因': err.error,
    '原始数据': JSON.stringify(err.data)
  }))
  exportExcel(exportData, `关系导入错误详情_${format(new Date(), 'yyyyMMddHHmmss')}.xlsx`)
}

/**
 * 重置导入状态
 */
const resetImportState = () => {
  showInitImportDialog.value = false
  showNormalImportDialog.value = false
  selectedFile.value = null
  importErrors.value = []
  initClearExisting.value = false
  initImportResult.value = null
  importLoading.value = false
}
</script>

<style scoped>
/* 图片预览 hover 效果 */
.q-img.cursor-pointer:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* 表格单元格垂直居中 */
.q-table__cell {
  vertical-align: middle;
}

/* 表单间距调整 */
.space-y-4>div {
  margin-bottom: 1rem;
}

.space-y-4>div:last-child {
  margin-bottom: 0;
}
</style>
