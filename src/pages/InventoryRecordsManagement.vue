<template>
  <q-page class="q-pa-md">
    <!-- 页面标题和操作按钮 -->
    <div class="col-12 flex justify-between items-center mb-6 flex-wrap gap-4">
      <div>
        <h5 class="text-h5 q-ma-none">库存记录管理</h5>
        <p class="text-grey text-subtitle2">管理所有库存记录信息</p>
      </div>
      <div class="flex gap-2 flex-wrap">
        <!-- 将原来的两个导入按钮替换为以下代码 -->
        <q-btn-dropdown color="secondary" label="库存导入" icon="upload">
          <q-list>
            <q-item clickable v-close-popup @click="showInitImportDialog = true">
              <q-item-section avatar>
                <q-icon name="database" />
              </q-item-section>
              <q-item-section>
                <q-item-label>初始导入</q-item-label>
                <q-item-label caption>覆盖现有数据</q-item-label>
              </q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="showNormalImportDialog = true">
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
        <!-- 将原来的导出库存按钮替换为以下代码 -->
        <q-btn-dropdown color="primary" label="导出库存" icon="download">
          <q-list>
            <q-item clickable v-close-popup @click="handleExportInventoryRecords('all')">
              <q-item-section avatar>
                <q-icon name="file_download" />
              </q-item-section>
              <q-item-section>
                <q-item-label>导出全部</q-item-label>
                <q-item-label caption>导出所有库存记录</q-item-label>
              </q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="handleExportInventoryRecords('filtered')">
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
      <q-form @submit="fetchInventoryRecords">
        <div class="row q-col-gutter-md">
          <!-- 第一行筛选条件 -->
          <div class="col-12">
            <div class="row q-col-gutter-md items-end">
              <div class="col-md-3 col-sm-6 col-xs-12">
                <q-select v-model="filters.warehouseId" label="仓库" :options="warehouseOptions" option-label="name"
                  option-value="id" clearable emit-value map-options @update:model-value="handleWarehouseFilterChange"
                  dense />
              </div>

              <div class="col-md-3 col-sm-6 col-xs-12">
                <q-select v-model="filters.categoryId" label="商品分类" :options="categoryOptions" option-label="name"
                  option-value="id" emit-value map-options clearable @update:model-value="handleFilterChange" dense />
              </div>

              <div class="col-md-3 col-sm-6 col-xs-12">
                <q-select v-model="filters.productId" label="商品" :options="productOptions" option-label="name"
                  option-value="id" emit-value map-options clearable @update:model-value="handleCategoryFilterChange"
                  dense />
              </div>


              <div class="col-md-3 col-sm-6 col-xs-12">
                <q-select v-model="filters.locationId" label="库位" :options="locationOptions" option-label="code"
                  option-value="id" emit-value map-options clearable @update:model-value="handleFilterChange" dense />
              </div>
            </div>
          </div>

          <!-- 第二行筛选条件 -->
          <div class="col-12 q-mt-md">
            <div class="row q-col-gutter-md items-end">
              <div class="col-md-3 col-sm-6 col-xs-12">
                <q-select v-model="filters.stockStatus" label="库存状态" :options="stockStatusOptions" clearable map-options
                  emit-value option-label="label" option-value="value" @update:model-value="handleFilterChange" dense />
              </div>

              <div class="col-md-3 col-sm-6 col-xs-12">
                <q-input v-model="filters.batchNumber" label="批次号" placeholder="输入批次号" clearable
                  @update:model-value="handleFilterChange" dense />
              </div>
              <q-input v-model="searchQuery" placeholder="搜索商品名称/编码/批次号..." class="w-64" clearable
                @keyup.enter="fetchInventoryRecords">
                <template #append>
                  <q-icon name="search" class="cursor-pointer" @click="fetchInventoryRecords" />
                </template>
              </q-input>

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
          </div>
        </div>
      </q-form>
    </div>

    <!-- 库存记录列表 -->
    <div class="col-12 bg-white rounded-borders shadow-sm">
      <q-table :rows="inventoryRecords" :columns="columns" v-model:pagination="pagination"
        :rows-per-page-options="[10, 20, 30, 50, 100]" :filter="filters" @request="onRequest" row-key="id"
        :loading="tableLoading">
        <template #body-cell-index="props">
          <q-td :props="props" align="center">
            <q-badge color="primary">
              {{ (pagination.page - 1) * pagination.rowsPerPage + props.pageIndex + 1 }}
            </q-badge>
          </q-td>
        </template>
        <template #body-cell-product_name="props">
          <q-td :props="props">
            <div>
              <div>{{ props.row.product_name }}</div>
              <div class="text-caption text-grey">
                {{ props.row.product_code }}
              </div>
            </div>
          </q-td>
        </template>

        <template #body-cell-location_code="props">
          <q-td :props="props">
            <div>
              <div>{{ props.row.warehouse_name }}</div>
              <div class="text-caption text-grey">
                {{ props.row.location_code }}
              </div>
            </div>
          </q-td>
        </template>
        <template #body-cell-sku_code="props">
          <q-td :props="props">
            <div>
              <div>{{ props.row.sku_code }}</div>
              <div class="text-caption text-grey">
                {{ props.row.sku_spec }}
              </div>
            </div>
          </q-td>
        </template>
        <template #body-cell-stock_status="props">
          <q-td :props="props">
            <q-badge :color="getStockStatusColor(props.row)" :label="getStockStatusLabel(props.row)" />
          </q-td>
        </template>
        <template #body-cell-quantity="props">
          <q-td :props="props">
            <q-badge color="primary">
              {{ props.row.quantity }}
            </q-badge>
          </q-td>
        </template>
        <template #body-cell-actions="props">
          <q-td :props="props">
            <q-btn size="sm" color="info" icon="visibility" class="q-mr-1" @click="viewRecord(props.row)" label="查看" />
            <q-btn size="sm" color="accent" icon="edit" @click="openAdjustmentDialog(props.row)" label="调整" />
          </q-td>
        </template>

        <template #loading>
          <div class="row items-center justify-center q-pa-md">
            <q-spinner size="40px" color="primary" />
            <span class="q-ml-md text-subtitle1">加载库存记录中...</span>
          </div>
        </template>
      </q-table>
    </div>

    <!-- 查看记录详情弹窗 -->
    <q-dialog v-model="isDetailDialogOpen" maximized>
      <q-card>
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">库存记录详情</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <div class="row q-col-gutter-md">
            <!-- 基本信息 -->
            <div class="col-12">
              <q-card flat bordered>
                <q-card-section>
                  <div class="text-subtitle1 text-weight-bold">基本信息</div>
                  <q-separator class="q-mb-sm" />
                  <div class="row q-col-gutter-md">
                    <div class="col-md-3 col-sm-6 col-xs-12">
                      <div class="text-caption text-grey">记录ID</div>
                      <div>{{ currentRecord?.id }}</div>
                    </div>
                    <div class="col-md-3 col-sm-6 col-xs-12">
                      <div class="text-caption text-grey">批次号</div>
                      <div>{{ currentRecord?.batch_number || '无' }}</div>
                    </div>
                    <div class="col-md-3 col-sm-6 col-xs-12">
                      <div class="text-caption text-grey">生产日期</div>
                      <div>{{ formatDate(currentRecord?.manufacture_date) || '无' }}</div>
                    </div>
                    <div class="col-md-3 col-sm-6 col-xs-12">
                      <div class="text-caption text-grey">过期日期</div>
                      <div>{{ formatDate(currentRecord?.expiration_date) || '无' }}</div>
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>

            <!-- 商品信息 -->
            <div class="col-12">
              <q-card flat bordered>
                <q-card-section>
                  <div class="text-subtitle1 text-weight-bold">商品信息</div>
                  <q-separator class="q-mb-sm" />
                  <div class="row q-col-gutter-md">
                    <div class="col-md-3 col-sm-6 col-xs-12">
                      <div class="text-caption text-grey">商品名称</div>
                      <div>{{ currentRecord?.product_name }}</div>
                    </div>
                    <div class="col-md-3 col-sm-6 col-xs-12">
                      <div class="text-caption text-grey">商品编码</div>
                      <div>{{ currentRecord?.product_code }}</div>
                    </div>
                    <div class="col-md-3 col-sm-6 col-xs-12">
                      <div class="text-caption text-grey">SKU编码</div>
                      <div>{{ currentRecord?.sku_code }}</div>
                    </div>
                    <div class="col-md-3 col-sm-6 col-xs-12">
                      <div class="text-caption text-grey">规格型号</div>
                      <div>{{ currentRecord?.sku_spec }}</div>
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>

            <!-- 仓库信息 -->
            <div class="col-12">
              <q-card flat bordered>
                <q-card-section>
                  <div class="text-subtitle1 text-weight-bold">仓库信息</div>
                  <q-separator class="q-mb-sm" />
                  <div class="row q-col-gutter-md">
                    <div class="col-md-3 col-sm-6 col-xs-12">
                      <div class="text-caption text-grey">仓库</div>
                      <div>{{ currentRecord?.warehouse_name }}</div>
                    </div>
                    <div class="col-md-3 col-sm-6 col-xs-12">
                      <div class="text-caption text-grey">库位</div>
                      <div>{{ currentRecord?.location_name }}</div>
                    </div>
                    <div class="col-md-3 col-sm-6 col-xs-12">
                      <div class="text-caption text-grey">库位编码</div>
                      <div>{{ currentRecord?.location_code }}</div>
                    </div>
                    <div class="col-md-3 col-sm-6 col-xs-12">
                      <div class="text-caption text-grey">当前库存</div>
                      <div>{{ currentRecord?.quantity }} {{ currentRecord?.unit }}</div>
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>

            <!-- 库存策略 -->
            <div class="col-12">
              <q-card flat bordered>
                <q-card-section>
                  <div class="text-subtitle1 text-weight-bold">库存策略</div>
                  <q-separator class="q-mb-sm" />
                  <div class="row q-col-gutter-md">
                    <div class="col-md-3 col-sm-6 col-xs-12">
                      <div class="text-caption text-grey">最低库存</div>
                      <div>{{ currentRecord?.sku_min_stock || 0 }} {{ currentRecord?.sku_unit }}</div>
                    </div>
                    <div class="col-md-3 col-sm-6 col-xs-12">
                      <div class="text-caption text-grey">最高库存</div>
                      <div>{{ currentRecord?.sku_max_stock || 0 }} {{ currentRecord?.sku_unit }}</div>
                    </div>
                    <div class="col-md-3 col-sm-6 col-xs-12">
                      <div class="text-caption text-grey">库存状态</div>
                      <q-badge :color="getStockStatusColor(currentRecord)"
                        :label="getStockStatusLabel(currentRecord)" />
                    </div>
                    <div class="col-md-3 col-sm-6 col-xs-12">
                      <div class="text-caption text-grey">单位</div>
                      <div>{{ currentRecord?.sku_unit }}</div>
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>

            <!-- 操作信息 -->
            <div class="col-12">
              <q-card flat bordered>
                <q-card-section>
                  <div class="text-subtitle1 text-weight-bold">操作信息</div>
                  <q-separator class="q-mb-sm" />
                  <div class="row q-col-gutter-md">
                    <div class="col-md-3 col-sm-6 col-xs-12">
                      <div class="text-caption text-grey">最后更新人</div>
                      <div>{{ currentRecord?.updated_by_name || '未知' }}</div>
                    </div>
                    <div class="col-md-3 col-sm-6 col-xs-12">
                      <div class="text-caption text-grey">最后更新时间</div>
                      <div>{{ formatDate(currentRecord?.updated_at) }}</div>
                    </div>
                    <div class="col-md-3 col-sm-6 col-xs-12">
                      <div class="text-caption text-grey">创建时间</div>
                      <div>{{ formatDate(currentRecord?.created_at) }}</div>
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>

          </div>
        </q-card-section>

        <!-- 查看详情弹窗按钮 -->
        <q-card-actions align="right" class="q-pa-md">
          <q-btn label="关闭" color="secondary" @click="isDetailDialogOpen = false" />
          <q-btn label="调整库存" color="accent" class="ml-2"
            @click="() => { isDetailDialogOpen = false; openAdjustmentDialog(currentRecord); }" />
        </q-card-actions>
        <q-card-actions align="right" class="q-pa-md">
          <div class="col-12">
            <q-img :src="currentRecord?.main_image" fit="contain" class="q-mb-md" />
          </div>
        </q-card-actions>

      </q-card>
    </q-dialog>


    <!-- 库存调整弹窗 -->
    <q-dialog v-model="isAdjustmentDialogOpen" max-width="600px">
      <q-card>
        <q-card-section class="row items-center justify-between">
          <h5 class="text-h5">库存调整</h5>
          <q-btn icon="close" flat round @click="isAdjustmentDialogOpen = false" />
        </q-card-section>
        <q-card-section class="q-pa-md">
          <div v-if="adjustmentRecord" class="space-y-4">
            <div class="bg-gray-50 p-3 rounded">
              <p class="text-sm"><span class="text-gray-500">商品：</span>{{
                adjustmentRecord.location_sku_detail?.sku?.product?.name }}</p>
              <p class="text-sm"><span class="text-gray-500">库位：</span>{{
                adjustmentRecord.location_sku_detail?.location?.name }}</p>
              <p class="text-sm"><span class="text-gray-500">当前库存：</span>{{ adjustmentRecord.quantity }} {{
                adjustmentRecord.location_sku_detail?.sku?.unit }}</p>
            </div>
            <q-input v-model="newQuantity" label="调整后库存数量" type="number" min="0"
              :rules="[val => val !== null && val >= 0 || '库存数量不能为负数']" dense />
            <q-input v-model="adjustmentReason" label="调整原因" type="textarea" rows="3"
              :rules="[val => !!val || '请填写调整原因']" dense placeholder="例：库存盘点差异调整/损坏报废..." />
          </div>
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md">
          <q-btn label="取消" color="secondary" @click="isAdjustmentDialogOpen = false" />
          <q-btn label="确认调整" color="primary" class="ml-2" @click="confirmAdjustment"
            :disabled="!adjustmentRecord || !newQuantity || !adjustmentReason" />
        </q-card-actions>
      </q-card>

    </q-dialog>

    <!-- 1. 库存初始化导入弹窗（新增） -->
    <q-dialog v-model="showInitImportDialog" max-width="700px">
      <q-card>
        <q-card-section class="row items-center justify-between">
          <h5 class="text-h5 text-negative">⚠️ 库存初始化导入</h5>
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
                <li>1. 初始化导入将<span class="font-medium text-negative">覆盖现有库存数据</span>，适用于系统首次上线或全量数据重置</li>
                <li>2. 若勾选"清空现有数据"，将删除所有库存记录及变动记录，<span class="font-medium text-negative">操作不可撤销</span></li>
                <li>3. 请确保导入文件包含"库位编码、SKU编码、库存数量、批次号"等必填字段（建议先下载模板）</li>
              </ul>
            </div>

            <!-- 模板下载 -->
            <div class="flex justify-between items-center">
              <p class="text-sm">请下载模板并按格式填写数据</p>
              <q-btn label="下载初始化模板" color="secondary" icon="file_download" size="sm" @click="downloadInitTemplate" />
            </div>

            <!-- 文件上传 -->
            <q-uploader label="选择初始化文件（仅支持.xlsx/.xls）" accept=".xlsx, .xls" :max-files="1" @added="handleFileSelected"
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
              <q-checkbox v-model="initClearExisting" label="清空现有库存数据（含变动记录）" color="negative"
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
                <li>成功创建库存记录：{{ initImportResult.inventory_success_count }} 条</li>
                <li>成功生成初始化变动记录：{{ initImportResult.transaction_success_count }} 条</li>
                <li>失败记录：{{ initImportResult.error_count }} 条</li>
              </ul>
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md">
          <q-btn label="取消" color="secondary" @click="resetInitImportState" />
          <q-btn label="开始初始化" color="negative" class="ml-2" @click="handleInitImport"
            :disable="!selectedFile || importLoading" :loading="importLoading" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 2. 普通导入弹窗（保留原功能，区分初始化） -->
    <q-dialog v-model="showNormalImportDialog" max-width="700px">
      <q-card>
        <q-card-section class="row items-center justify-between">
          <h5 class="text-h5">普通库存导入</h5>
          <q-btn icon="close" flat round @click="showNormalImportDialog = false" />
        </q-card-section>
        <q-card-section class="q-pa-md">
          <div class="space-y-4">
            <p class="text-sm">普通导入仅新增/更新库存记录，不删除现有数据，适用于日常批量更新</p>
            <div class="flex justify-between items-center">
              <p class="text-sm">请下载模板并按格式填写数据</p>
              <q-btn label="下载普通导入模板" color="secondary" icon="file_download" size="sm"
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
            :disable="!selectedFile || importLoading" :loading="importLoading" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import { format, parseISO } from 'date-fns'
import { exportExcel } from 'src/utils/excel-utils' // 假设已有Excel导出工具函数

// API导入
import {
  getInventoryRecords,
  importInventoryRecords,
  exportInventoryRecords,
  getProductCategories,
  getWarehouses,
  getProductOptions,
  downloadInventoryImportTemplate
} from 'src/services/productServiceApi'
import { getLocations } from 'src/services/settingsServiceApi'
import { adjustInventoryRecord } from 'src/services/inventoryServiceApi'
// 初始化Quasar
const $q = useQuasar()

// -------------------------- 基础状态变量 --------------------------
const inventoryRecords = ref([])
const tableLoading = ref(false)
const searchQuery = ref('')
const selectedRecords = ref([])
const isDetailDialogOpen = ref(false)
const currentRecord = ref(null)
const isAdjustmentDialogOpen = ref(false)
const adjustmentRecord = ref(null)
const newQuantity = ref(null)
const adjustmentReason = ref('')

// 导入相关状态（区分初始化和普通导入）
const showInitImportDialog = ref(false) // 初始化导入弹窗
const showNormalImportDialog = ref(false) // 普通导入弹窗
const selectedFile = ref(null)
const importLoading = ref(false)
const importErrors = ref([])
const initClearExisting = ref(false) // 初始化是否清空现有数据
const initImportResult = ref(null) // 初始化导入结果

// -------------------------- 筛选与分页 --------------------------
const filters = ref({
  categoryId: null,
  productId: null,
  warehouseId: null,
  locationId: null,
  stockStatus: null,
  batchNumber: null,
  search: null
})

const pagination = ref({
  page: 1,
  rowsPerPage: 10,
  sortBy: 'updated_at',
  descending: true,
})

// -------------------------- 下拉选项配置 --------------------------
const categoryOptions = ref([])
const productOptions = ref([])
const warehouseOptions = ref([])
const locationOptions = ref([])
const stockStatusOptions = ref([
  { label: '库存不足', value: 'low' },
  { label: '库存过剩', value: 'over' },
  { label: '正常库存', value: 'normal' }
])

// 导入错误表格列（更清晰的错误展示）
const importErrorColumns = ref([
  { name: 'row', label: '行号', field: 'row', width: '80px' },
  { name: 'data', label: '数据', field: 'data', format: (val) => JSON.stringify(val).slice(0, 50) + '...' },
  { name: 'error', label: '错误原因', field: 'error' }
])

// 库存列表列（新增初始化标识相关字段）
const columns = ref([
  { name: 'index', label: '序号', field: 'index', align: 'center:0px' },
  { name: 'product_name', label: '商品信息', field: 'product_name', align: 'left' },
  { name: 'location_code', label: '仓库库位', field: 'location_code', align: 'left' },
  { name: 'sku_code', label: 'SKU', field: 'sku_code', align: 'left' },
  { name: 'batch_number', label: '批次号', field: 'batch_number', align: 'left', sortable: true },
  { name: 'quantity', label: '库存数量', field: 'quantity', align: 'right', sortable: true },
  { name: 'stock_status', label: '库存状态', field: 'stock_status', align: 'left', sortable: false },
  { name: 'updated_at', label: '更新时间', field: 'updated_at', align: 'left', sortable: true, format: (val) => formatDate(val) },
  { name: 'actions', label: '操作', field: 'actions', align: 'center', width: '180px' }
])

// -------------------------- 计算属性 --------------------------

// 监听选中记录变化，自动填充调整表单
watch(selectedRecords, (newVal) => {
  if (newVal.length === 1) {
    adjustmentRecord.value = { ...newVal[0] }
    newQuantity.value = newVal[0].quantity
  } else {
    adjustmentRecord.value = null
    newQuantity.value = null
  }
})

// -------------------------- 工具函数 --------------------------
// 日期格式化
const formatDate = (dateString) => {
  if (!dateString) return ''
  return format(parseISO(dateString), 'yyyy-MM-dd HH:mm')
}

// 获取库存状态标签
const getStockStatusLabel = (record) => {
  if (!record || !record.quantity) return '未知'

  if (record.min_stock && record.quantity < record.min_stock) {
    return '库存不足'
  } else if (record.max_stock && record.quantity > record.max_stock) {
    return '库存过剩'
  } else {
    return '正常'
  }
}

// 获取库存状态颜色
const getStockStatusColor = (record) => {
  if (!record || !record.quantity) return 'grey'

  if (record.min_stock && record.quantity < record.min_stock) {
    return 'negative'
  } else if (record.max_stock && record.quantity > record.max_stock) {
    return 'warning'
  } else {
    return 'positive'
  }
}

// 重置初始化导入状态
const resetInitImportState = () => {
  showInitImportDialog.value = false
  selectedFile.value = null
  importErrors.value = []
  initClearExisting.value = false
  initImportResult.value = null
  importLoading.value = false
}


// 获取库存记录
// 修改获取库存记录的函数，使用正确的分页参数
// 获取库存记录
async function fetchInventoryRecords() {
  try {
    tableLoading.value = true
    const params = new URLSearchParams()

    // 分页参数
    params.append('page', pagination.value.page)
    params.append('page_size', pagination.value.rowsPerPage)

    // 排序参数
    if (pagination.value.sortBy) {
      params.append('ordering', pagination.value.descending ? `-${pagination.value.sortBy}` : pagination.value.sortBy)
    }

    // 搜索与筛选参数
    if (searchQuery.value) params.append('search', searchQuery.value)
    if (filters.value.categoryId) params.append('location_sku__sku__product__category', filters.value.categoryId)
    if (filters.value.productId) params.append('product', filters.value.productId)
    if (filters.value.warehouseId) params.append('location_sku__location__warehouse', filters.value.warehouseId)
    if (filters.value.locationId) params.append('location_sku__location', filters.value.locationId)
    if (filters.value.batchNumber) params.append('batch_number', filters.value.batchNumber)
    if (filters.value.stockStatus === 'low') params.append('is_low_stock', 'True')
    if (filters.value.stockStatus === 'over') params.append('is_over_stock', 'True')
    if (filters.value.stockStatus === 'normal') {
      params.append('is_low_stock', 'False')
      params.append('is_over_stock', 'False')
    }

    const response = await getInventoryRecords(params)
    if (response.status === 200) {
      // 转换数据结构以适配表格展示
      inventoryRecords.value = response.data.results
      // 更新分页信息
      pagination.value.rowsNumber = response.data.count
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '获取库存记录失败',
      position: 'top'
    })
  } finally {
    tableLoading.value = false
  }
}

// 获取商品分类
async function fetchProductCategories() {
  try {
    const response = await getProductCategories()
    if (response.status === 200) {
      categoryOptions.value = response.data.results
    }
  } catch (error) {
    console.error('获取商品分类失败:', error)
  }
}

// 获取仓库
async function fetchWarehouses() {
  try {
    const response = await getWarehouses()
    if (response.status === 200) {
      warehouseOptions.value = response.data.results
    }
  } catch (error) {
    console.error('获取仓库失败:', error)
  }
}

// 获取商品选项列表
async function fetchProductOptions(params) {
  try {
    const response = await getProductOptions(params)
    if (response.status === 200) {
      productOptions.value = response.data
    }
  } catch (error) {
    console.error('获取商品选项列表失败:', error)
  }
}
// 获取库位（根据仓库筛选）
async function fetchLocations(formData) {
  try {
    const response = await getLocations(formData)
    if (response.status === 200) {
      locationOptions.value = response.data.results
    }
  } catch (error) {
    console.error('获取库位失败:', error)
  }
}

// -------------------------- 筛选与分页处理 --------------------------
// 筛选条件变化
function handleFilterChange() {
  // 重置页码到第一页
  pagination.value.page = 1
  fetchProductOptions({ location_sku__sku__product__category: filters.value.categoryId })
}
// 商品分类筛选变化（联动加载商品选项）
function handleCategoryFilterChange() {
  if (filters.value.categoryId) {
    fetchProductOptions({ location_sku__sku__product__category: filters.value.categoryId })
  } else {
    productOptions.value = []
  }
}
// 仓库筛选变化（联动加载库位）
function handleWarehouseFilterChange() {
  if (filters.value.warehouseId) {

    const formData = new FormData()
    formData.append('warehouse_id', filters.value.warehouseId)
    fetchLocations(formData)
  } else {
    locationOptions.value = []
  }
  // 重置页码到第一页
  pagination.value.page = 1
}

// 重置筛选
// 重置筛选
function resetFilters() {
  filters.value = {
    categoryId: null,
    productId: null,
    warehouseId: null,
    locationId: null,
    stockStatus: null,
    batchNumber: null,
    search: null
  }
  locationOptions.value = []
  // 重置页码到第一页
  pagination.value.page = 1
  fetchInventoryRecords()
}


// 表格排序/分页请求
function onRequest(props) {
  const { page, rowsPerPage, sortBy, descending } = props.pagination

  pagination.value.page = page
  pagination.value.rowsPerPage = rowsPerPage
  pagination.value.sortBy = sortBy
  pagination.value.descending = descending

  fetchInventoryRecords()
}

// -------------------------- 库存详情与调整 --------------------------
// 查看库存详情
function viewRecord(record) {
  currentRecord.value = { ...record }
  isDetailDialogOpen.value = true
}

// 打开库存调整弹窗
function openAdjustmentDialog(record) {
  if (record) {
    adjustmentRecord.value = { ...record }
    newQuantity.value = record.quantity
  } else if (selectedRecords.value.length === 1) {
    adjustmentRecord.value = { ...selectedRecords.value[0] }
    newQuantity.value = selectedRecords.value[0].quantity
  } else {
    $q.notify({
      color: 'warning',
      message: '请选择一条记录进行调整',
      position: 'top'
    })
    return
  }
  adjustmentReason.value = ''
  isAdjustmentDialogOpen.value = true
}

// 确认库存调整
async function confirmAdjustment() {
  if (!adjustmentRecord.value || newQuantity.value === null || !adjustmentReason.value) return

  try {
    importLoading.value = true
    const response = await adjustInventoryRecord(adjustmentRecord.value.id, {
      inventory_record_id: adjustmentRecord.value.id,
      new_quantity: newQuantity.value,
      reason: adjustmentReason.value
    })
    if (response.status === 400) {
      $q.notify({
        color: 'negative',
        message: response.data.message || '库存调整失败',
        position: 'top'
      })
      return
    }
    if (response.status === 200) {
      $q.notify({
        color: 'positive',
        message: '库存调整成功',
        position: 'top'
      })
      isAdjustmentDialogOpen.value = false
      fetchInventoryRecords()
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '库存调整失败',
      position: 'top'
    })
  } finally {
    importLoading.value = false
  }
}

// -------------------------- 导入导出功能 --------------------------

// 1. 模板下载（区分初始化和普通模板）
async function downloadInitTemplate() {
  try {
    const response = await downloadInventoryImportTemplate('init')
    handleFileDownload(response, '库存初始化导入模板.xlsx')
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
    const response = await downloadInventoryImportTemplate('normal')
    handleFileDownload(response, '库存普通导入模板.xlsx')
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '普通导入模板下载失败',
      position: 'top'
    })
  }
}

// 通用文件下载处理函数
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

// 2. 文件选择处理
function handleFileSelected(files) {
  if (files && files.length > 0) {
    selectedFile.value = files[0]
    console.log('选中文件:', selectedFile.value)
    importErrors.value = []
    initImportResult.value = null
  }
}

// 3. 初始化导入确认（清空数据的二次确认）
async function handleClearConfirm(checked) {
  if (checked) {
    const confirm = await $q.dialog({
      title: '危险操作确认',
      message: '确定要清空所有库存数据吗？此操作将删除所有库存记录和变动记录，且无法恢复！',
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

// 4. 库存初始化导入（核心功能）
async function handleInitImport() {
  if (!selectedFile.value) return

  try {
    importLoading.value = true

    const response = await importInventoryRecords(selectedFile.value, initClearExisting.value) // 第二个参数标识初始化导入

    if (response.status === 200) {
      const result = response.data
      initImportResult.value = result
      importErrors.value = result.errors || []

      // 提示结果
      $q.notify({
        color: 'positive',
        message: `初始化成功！库存记录：${result.inventory_success_count}条，变动记录：${result.transaction_success_count}条`,
        position: 'top'
      })

      // 无错误则关闭弹窗并刷新
      if (result.error_count === 0) {
        setTimeout(() => {
          resetInitImportState()
          fetchInventoryRecords()
        }, 1500)
      }
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '库存初始化失败',
      position: 'top'
    })
  } finally {
    importLoading.value = false
  }
}

// 5. 普通库存导入
async function handleNormalImport() {
  if (!selectedFile.value) return

  try {
    importLoading.value = true

    const response = await importInventoryRecords(selectedFile.value, false) // 第二个参数标识非初始化导入
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
        fetchInventoryRecords()
      }
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '普通导入失败',
      position: 'top'
    })
  } finally {
    importLoading.value = false
  }
}

// 6. 导出库存记录
async function handleExportInventoryRecords(exportType = 'all') {
  try {
    tableLoading.value = true
    let exportFilters = {}

    // 如果是导出筛选结果，则使用当前筛选条件
    if (exportType === 'filtered') {
      exportFilters = { ...filters.value }

      // ✅【关键修复】清理所有 null / undefined / 空字符串参数
      exportFilters = Object.fromEntries(
        Object.entries(exportFilters).filter(([, v]) =>
          v !== null && v !== undefined && v !== ''
        )
      )

      // 添加搜索查询
      if (searchQuery.value?.trim()) {
        exportFilters.search = searchQuery.value.trim()
      }
    }

    // 调用导出接口
    const response = await exportInventoryRecords(exportFilters)

    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `库存记录_${format(new Date(), 'yyyyMMddHHmmss')}.xlsx`
    document.body.appendChild(a)
    a.click()
    URL.revokeObjectURL(url)
    document.body.removeChild(a)

    $q.notify({
      color: 'positive',
      message: '导出成功',
      position: 'top'
    })
  } catch (error) {
    console.error('导出报错：', error)
    $q.notify({
      color: 'negative',
      message: error.message || '导出失败，请重试',
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
  exportExcel(exportData, `库存导入错误详情_${format(new Date(), 'yyyyMMddHHmmss')}.xlsx`)
}

// -------------------------- 页面初始化 --------------------------
onMounted(() => {
  fetchInventoryRecords()
  fetchProductCategories()
  fetchProductOptions()
  fetchWarehouses()
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
