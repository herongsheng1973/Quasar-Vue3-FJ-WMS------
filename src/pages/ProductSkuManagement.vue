<template>
  <q-page class="q-pa-md">
    <!-- 页面标题 -->
    <div class="row flex items-center q-mx-md">
      <!-- 顶部操作栏：新增 + 导入 + 导出 -->
      <div class="col-3">
        <h5 class="text-h5 q-ma-none">产品-SKU关系管理</h5>
        <p class="text-grey text-subtitle2">一个产品可关联多个SKU，一个SKU仅归属一个产品</p>
      </div>
      <!-- 卡片头部：标题+新增按钮 -->
      <div class="col-9 flex flex-wrap justify-end items-center mb-4 gap-2">
        <div class="flex gap-2">
          <q-btn color="primary" label="新增SKU" @click="openSkuDialog(false)" />
          <!-- 导入导出按钮 -->
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
          <q-btn label="导出" color="primary" icon="download" @click="handleExportSkus" />
          <!-- 批量操作按钮：明确区分"批量导入"（Excel解析）和"批量创建"（JSON提交） -->
          <q-btn color="secondary" label="批量导入" icon="file_upload" @click="showBatchImportDialog = true" dense />
        </div>
      </div>

    </div>

    <!-- 1. 产品-SKU关联管理卡片 -->
    <q-card class="col-12">
      <q-card-section>
        <!-- 筛选栏：补充库存状态筛选，支持多维度精准查询 -->
        <div class="row items-center flex gap-4">
          <q-select class="col-2 q-mr-md" v-model="filters.product_category" label="选择产品分类"
            :options="productCategoryOptions" option-label="name" option-value="id" clearable dense
            @update:model-value="onFilterChange" style="width: 160px;margin-right: 12px;" />
          <q-input class="col-2 q-mr-md" v-model="searchParams.product_name_code" label="搜索产品（名称/编码）"
            placeholder="输入产品名称或编码" @update:model-value="onFilterChange" dense />
          <q-input class="col-2 q-mr-md" v-model="searchParams.sku_name_code" label="搜索SKU(编码/规格）"
            placeholder="输入SKU编码或规格" @update:model-value="onFilterChange" dense />
          <!-- 库存状态筛选：与后端is_low_stock字段对应 -->
          <q-select class="col-2 q-mr-md" v-model="filters.stock_status" label="库存状态" :options="stockStatusOptions"
            clearable dense option-label="label" option-value="value" @update:model-value="onFilterChange" />
          <!-- 产品筛选：替换原来的库位筛选 -->
          <q-select class="col-3 q-mr-md" v-model="filters.product" label="筛选产品" :options="productOptions"
            option-label="label" option-value="id" clearable dense @update:model-value="onFilterChange" />
          <!-- 重置筛选按钮：恢复初始筛选状态 -->
          <q-btn label="重置筛选" color="teal" dense @click="resetSearchParams" />
        </div>

        <!-- 产品-SKU列表表格：适配后端排序字段（stock_quantity） -->
        <q-table class="row q-my-md" :rows="skuList" :columns="skuColumns" row-key="id" :loading="loadingSKUs"
          :rows-per-page-options="[10, 20, 50, 100]" no-data-label="暂无产品-SKU关联数据" bordered dense
          v-model:pagination="pagination" @request="handleTableRequest">
          <template v-slot:body-cell-index="props">
            <q-td :props="props">
              <q-badge color="primary">
                {{ (pagination.page - 1) * pagination.rowsPerPage + props.pageIndex + 1 }}
              </q-badge>
            </q-td>
          </template>
          <!-- 创建时间列：格式化日期显示 -->
          <template #body-cell-created_at="props">
            <q-td :props="props">
              {{ formatDate(props.row.created_at) }}
            </q-td>
          </template>
          <!-- 操作列：编辑+删除+库存详情 -->
          <template #body-cell-actions="props">
            <q-td :props="props">
              <q-btn color="primary" size="sm" icon="edit" round flat class="q-ml-xs"
                @click="openSkuDialog(true, props.row)" title="编辑SKU" dense />
              <q-btn color="accent" size="sm" icon="visibility" round flat class="q-ml-xs"
                @click="openStockDetailDialog(props.row)" title="查看库存详情" dense />
              <q-btn color="negative" size="sm" icon="delete" round flat class="q-ml-xs"
                @click="handleDeleteSku(props.row.id)" title="删除SKU" dense
                :disabled="props.row.total_stock > 0" /><!-- 有库存时禁止删除，匹配后端关联约束 -->
            </q-td>
          </template>

          <!-- 产品名称/编码列：依赖后端预加载的product_name/code -->
          <template #body-cell-product_name="props">
            <q-td :props="props">
              {{ props.row.product_name }}
            </q-td>
          </template>
          <template #body-cell-product_code="props">
            <q-td :props="props">
              <span class="text-primary font-medium">{{ props.row.product_code }}</span>
            </q-td>
          </template>

          <!-- 图片列：仅详情/库存接口加载，减少带宽 -->
          <template #body-cell-image="props">
            <q-td :props="props">
              <q-img v-if="props.row.image" :src="props.row.image" style="width: 40px; height: 40px; object-fit: cover;"
                rounded class="cursor-pointer" @click="previewImage(props.row.image)" />
              <span v-else class="text-grey">无图</span>
            </q-td>
          </template>

          <!-- 库存状态列：匹配后端is_low_stock字段 -->
          <template #body-cell-stock_status="props">
            <q-td :props="props" class="text-center">
              <q-badge :color="props.row.is_low_stock ? 'negative' : 'positive'"
                :label="props.row.is_low_stock ? '低库存' : '正常'" />
            </q-td>
          </template>

          <!-- 库位列：匹配后端返回的location_mapping关联信息 -->
          <template #body-cell-location_info="props">
            <q-td :props="props">
              <span v-if="props.row.location_name">
                {{ props.row.location_name }}（{{ props.row.location_quantity }} {{ props.row.unit }}）
              </span>
              <span v-else class="text-grey text-sm">未关联库位</span>
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <!-- 2. 新增/编辑SKU弹窗：适配后端字段校验和错误返回 -->
    <q-dialog v-model="skuDialog.show" :maximized="false">
      <q-card style="width: 700px; max-width: 90vw;">
        <q-card-section class="q-pa-md">
          <!-- 弹窗标题：显示SKU编码（编辑模式） -->
          <h5 class="text-subtitle1 mb-4">
            {{ skuDialog.isEdit ? `编辑SKU（${skuDialog.currentRow?.sku_code || ''}）` : '新增产品-SKU关联' }}
          </h5>

          <!-- 编辑模式：显示后端返回的库存状态和库位信息 -->
          <div v-if="skuDialog.isEdit && skuDialog.currentRow" class="mb-4">
            <div class="bg-grey-50 p-3 rounded border border-grey-200">
              <p class="text-sm">
                <span class="text-grey-600">当前库存：</span>
                <span class="font-medium">{{ skuDialog.currentRow.total_stock }} {{ skuDialog.currentRow.unit }}</span>
                <q-badge :color="skuDialog.currentRow.is_low_stock ? 'negative' : 'positive'" class="ml-2"
                  :label="skuDialog.currentRow.is_low_stock ? '低库存' : '正常'" />
              </p>
              <p class="text-sm mt-1">
                <span class="text-grey-600">关联库位：</span>
                <span class="font-medium">
                  {{ skuDialog.currentRow.location_code ? skuDialog.currentRow.location_code : '未关联' }}
                </span>
              </p>
            </div>
          </div>

          <!-- SKU表单：适配后端ProductSKUCreateSerializer字段 -->
          <q-form ref="skuFormRef" @submit.prevent="saveSku" class="space-y-4">
            <!-- 所属产品：仅加载启用产品，支持模糊筛选 -->
            <q-select v-model="skuFormData.product_code" label="所属产品 *" :options="filteredProductOptions"
              option-label="name" option-value="code" emit-value map-options use-input @filter="filterProductOptions"
              hide-selected fill-input :rules="[val => !!val || '请选择所属产品']" dense class="w-full"
              @update:model-value="handleProductChange" :error-message="formErrors.product_code" /> <!-- 字段级错误提示 -->

            <!-- SKU编码：后端校验前缀，编辑时不可改 -->
            <q-input v-model="skuFormData.sku_code" label="SKU编码 *" placeholder="如：PROD-001-BLK-42（需以产品编码为前缀）"
              :disabled="skuDialog.isEdit" :rules="[
                val => !!val || '请输入SKU编码',
                val => val.length <= 100 || '编码长度不能超过100字符',
                val => skuFormData.product_id ? val.startsWith(currentProductCode) : true || `编码需以产品编码[${currentProductCode}]为前缀`
              ]" dense class="w-full" :error-message="formErrors.sku_code" /><!-- 字段级错误提示 -->

            <!-- 核心字段：规格、条形码、单位（后端必填/可选规则） -->
            <q-input v-model="skuFormData.specification" label="SKU规格 *" placeholder="如：黑色-42码 / 128GB-银色" :rules="[
              val => !!val || '请输入SKU规格',
              val => val.length <= 200 || '规格长度不能超过200字符'
            ]" dense class="w-full" :error-message="formErrors.specification" />
            <q-input v-model="skuFormData.barcode" label="条形码（可选，唯一）" placeholder="输入13位EAN码或自定义条形码" :rules="[
              val => !val || val.length <= 100 || '条形码长度不能超过100字符'
            ]" dense class="w-full" :error-message="formErrors.barcode" />
            <q-input v-model="skuFormData.unit" label="单位 *" placeholder="如：个、双、台" :value="skuFormData.unit || '个'"
              :rules="[
                val => !!val || '请输入单位',
                val => val.length <= 20 || '单位长度不能超过20字符'
              ]" dense class="w-full" :error-message="formErrors.unit" />

            <!-- 价格与库存阈值：后端MinValueValidator约束 -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <q-input v-model.number="skuFormData.purchase_price" label="采购价 *" type="number" min="0" step="0.01"
                :value="skuFormData.purchase_price || 0" :rules="[val => val >= 0 || '采购价不能为负数']" dense class="w-full"
                :error-message="formErrors.purchase_price" />
              <q-input v-model.number="skuFormData.selling_price" label="销售价 *" type="number" min="0" step="0.01"
                :value="skuFormData.selling_price || 0" :rules="[val => val >= 0 || '销售价不能为负数']" dense class="w-full"
                :error-message="formErrors.selling_price" />
              <q-input v-model.number="skuFormData.min_stock" label="最低库存 *" type="number" min="0"
                :value="skuFormData.min_stock || 0" :rules="[val => val >= 0 || '最低库存不能为负数']" dense class="w-full"
                hint="低于此值将标记为低库存" :error-message="formErrors.min_stock" />
              <q-input v-model.number="skuFormData.max_stock" label="最高库存" type="number" min="0"
                :value="skuFormData.max_stock || 0" :rules="[val => val >= 0 || '最高库存不能为负数']" dense class="w-full"
                hint="可选，用于库存上限控制" :error-message="formErrors.max_stock" />
            </div>

            <!-- SKU图片上传：限制单文件 + 确保v-model为单个文件对象 -->
            <!-- 关键：限制只能选择一个文件 -->
            <!-- 关键：手动处理文件，确保为单个对象 -->
            <!-- 优化删除逻辑 -->
            <q-uploader v-model="skuFormData.image" label="SKU图片（可选，支持JPG/PNG，最大2MB）" accept="image/*"
              :max-file-size="2097152" dense class="w-full" :multiple="false" @added="handleAddFile"
              @remove-file="handleRemoveFile" :error-message="formErrors.image">
              <template #file="{ file, remove }">
                <div class="flex items-center justify-between bg-grey-50 p-2 rounded">
                  <div class="flex items-center">
                    <q-icon name="image" color="teal" class="mr-2" />
                    <span class="text-sm">{{ file.name }}</span>
                  </div>
                  <q-btn icon="close" size="sm" flat @click="remove" />
                </div>
              </template>
            </q-uploader>

            <!-- 图片预览（编辑模式）：回显后端返回的image_url -->
            <div v-if="skuDialog.isEdit && skuFormData.image_url" class="mt-2">
              <p class="text-sm text-grey-600 mb-1">当前图片预览：</p>
              <q-img :src="skuFormData.image_url" style="width: 100px; height: 100px;" rounded fit="contain"
                class="cursor-pointer" @click="previewImage(skuFormData.image_url)" />
            </div>

            <!-- 全局错误提示 -->
            <div v-if="formErrors.non_field_errors" class="text-negative text-sm">
              {{ formErrors.non_field_errors }}
            </div>

            <!-- 表单按钮：加载状态控制 -->
            <div class="flex justify-end mt-6">
              <q-btn label="取消" @click="closeSkuDialog()" class="mr-2" dense :disabled="submitting" />
              <q-btn label="保存" type="submit" color="primary" dense :loading="submitting" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- 库存详情弹窗 -->
    <q-dialog v-model="stockDetailDialog.show" :maximized="false">
      <q-card style="width: 800px; max-width: 90vw;">
        <q-card-section class="q-pa-md">
          <h5 class="text-subtitle1 mb-4">SKU库存详情</h5>
          <div v-if="currentStockDetail" class="space-y-4">
            <!-- 基础信息：匹配后端sku_basic结构 -->
            <div class="row">
              <div class="col-6">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p class="text-sm text-grey-600">
                      SKU编码:<span class="font-medium">{{ currentStockDetail.sku_basic.sku_code }}</span>
                    </p>

                  </div>
                  <div>
                    <p class="text-sm text-grey-600">
                      所属产品:<span class="font-medium">{{ currentStockDetail.sku_basic.product_name }}</span>
                    </p>
                  </div>
                  <div>
                    <p class="text-sm text-grey-600">
                      规格:<span class="font-medium">{{ currentStockDetail.sku_basic.specification }}</span>
                    </p>

                  </div>
                  <div>
                    <p class="text-sm text-grey-600">关联库位</p>
                    <div v-if="filters.warehouse">
                      <!-- 如果选择了特定仓库，显示该仓库的库存信息 -->
                      <p class="font-medium">
                        {{ getWarehouseStockInfo()?.location_info || '未关联' }}
                      </p>
                    </div>
                    <div v-else>
                      <!-- 如果没有选择仓库，显示所有关联库位 -->
                      <div v-if="currentStockDetail.warehouse_stocks && currentStockDetail.warehouse_stocks.length > 0">
                        <p v-for="stock in currentStockDetail.warehouse_stocks" :key="stock.warehouse_id"
                          class="font-medium">
                          {{ stock.location_info || '未关联' }}
                        </p>
                      </div>
                      <p v-else class="font-medium">未关联</p>
                    </div>
                  </div>
                  <div>
                    <p class="text-sm text-grey-600">
                      当前库存:<span class="font-medium">
                        {{ getCurrentStockQuantity() }} {{ currentStockDetail.sku_basic.unit }}
                      </span>
                    </p>
                  </div>

                  <div>
                    <p class="text-sm text-grey-600">
                      库存状态:<span class="font-medium">
                        <q-badge :color="getCurrentStockStatus() ? 'negative' : 'positive'"
                          :label="getCurrentStockStatus() ? '低库存' : '正常'" />
                      </span>
                    </p>

                  </div>
                </div>

                <!-- 库存阈值：从sku_basic获取min_stock/max_stock -->
                <div class="bg-grey-50 p-3 rounded">
                  <p class="text-sm">
                    <span class="text-grey-600">库存阈值：</span>
                    最低 {{ currentStockDetail.sku_basic.min_stock }} {{ currentStockDetail.sku_basic.unit }}
                    <span class="mx-2">/</span>
                    最高 {{ currentStockDetail.sku_basic.max_stock || '无限制' }} {{ currentStockDetail.sku_basic.unit }}
                  </p>
                </div>
              </div>
              <div class="col-6">
                <q-img :src="currentStockDetail.image_url || ''" style="max-width: 100%; max-height: 320px;"
                  fit="contain" class="rounded" />
              </div>
            </div>


            <!-- 仓库库存详情 -->
            <div v-if="!filters.warehouse && currentStockDetail.warehouse_stocks.length > 0">
              <h6 class="text-subtitle2 mb-2">各仓库库存详情</h6>
              <q-table :rows="currentStockDetail.warehouse_stocks" :columns="warehouseStockColumns"
                :rows-per-page-options="[10, 20, 30, 50]" row-key="warehouse_id" dense flat bordered>
                <template #body-cell-is_low_stock="props">
                  <q-td :props="props" class="text-center">
                    <q-badge :color="props.row.is_low_stock ? 'negative' : 'positive'"
                      :label="props.row.is_low_stock ? '低库存' : '正常'" />
                  </q-td>
                </template>
              </q-table>
            </div>

            <!-- 批次记录：匹配后端batch_records结构 -->
            <div v-if="currentStockDetail.batch_records.length > 0">
              <h6 class="text-subtitle2 mb-2">批次详情</h6>
              <q-table :rows="currentStockDetail.batch_records" :columns="batchColumns" row-key="batch_number" dense
                flat bordered>
                <template #body-cell-is_low_stock="props">
                  <q-td :props="props" class="text-center">
                    <q-badge :color="props.row.is_low_stock ? 'negative' : 'positive'"
                      :label="props.row.is_low_stock ? '低库存' : '正常'" />
                  </q-td>
                </template>
              </q-table>
            </div>

            <!-- 操作按钮 -->
            <div class="flex justify-end">
              <q-btn label="关闭" @click="stockDetailDialog.show = false" dense />
              <q-btn label="调整库存" color="accent" class="ml-2" dense
                @click="() => { stockDetailDialog.show = false; openStockAdjustDialog(currentStockDetail.sku_basic); }" />
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- 4. 图片预览弹窗 -->
    <q-dialog v-model="imagePreviewDialog.show" :maximized="false">
      <q-card style="width: 800px; max-width: 90vw;">
        <q-card-section class="q-pa-md">
          <h5 class="text-subtitle1 mb-4">图片预览</h5>
          <div class="flex justify-center items-center">
            <q-img :src="imagePreviewDialog.url" style="max-width: 100%; max-height: 500px;" fit="contain"
              class="rounded" />
          </div>
          <div class="flex justify-end mt-6">
            <q-btn label="关闭" @click="imagePreviewDialog.show = false" dense />
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- 5. 批量导入弹窗：适配后端batch-create接口（前端解析Excel） -->
    <q-dialog v-model="showBatchImportDialog" :maximized="false">
      <q-card style="width: 600px; max-width: 90vw;">
        <q-card-section class="q-pa-md">
          <h5 class="text-subtitle1 mb-4">SKU批量导入</h5>
          <p class="text-sm text-grey-600 mb-4">
            请上传Excel文件，系统将解析数据后批量创建SKU（仅新增，不覆盖现有数据）
          </p>

          <!-- 模板下载：匹配后端模板下载接口 -->
          <div class="flex justify-between items-center mb-4">
            <p class="text-sm">支持字段：产品编码、SKU编码、规格、条形码、单位、采购价、销售价、最低库存</p>
            <q-btn label="下载模板" color="secondary" icon="file_download" dense @click="downloadSkuImportTemplate" />
          </div>

          <!-- 文件上传：前端解析Excel，不直接传文件给后端 -->
          <q-uploader v-model="batchImportFile" label="选择Excel文件（.xlsx/.xls）" accept=".xlsx,.xls" :max-files="1" dense
            class="w-full" @remove-file="() => { batchImportFile = null; batchImportResult = null; }"
            @add-file="handleExcelUpload" /><!-- 上传后立即解析 -->

          <!-- 解析结果预览 -->
          <div v-if="batchPreviewData.length > 0" class="mt-4">
            <h6 class="text-subtitle2 mb-2">解析结果（共{{ batchPreviewData.length }}条）</h6>
            <div class="max-h-60 overflow-auto">
              <q-table :rows="batchPreviewData" :columns="batchPreviewColumns" row-key="sku_code" dense flat bordered />
            </div>
            <div class="flex justify-end mt-2">
              <q-btn label="确认导入" color="primary" dense @click="submitBatchImport" :disabled="batchImportLoading"
                :loading="batchImportLoading" />
            </div>
          </div>

          <!-- 导入结果提示 -->
          <div v-if="batchImportResult" class="mt-4">
            <div v-if="batchImportResult.success" class="text-positive">
              <p>导入成功：新增 {{ batchImportResult.count }} 个SKU</p>
            </div>
            <div v-else class="text-negative">
              <p>导入失败：{{ batchImportResult.error }}</p>
              <div v-if="batchImportResult.field_errors" class="mt-2 text-sm">
                <p>字段错误：</p>
                <ul class="list-disc pl-4 mt-1">
                  <li v-for="(errs, field) in batchImportResult.field_errors" :key="field">
                    {{ field }}：{{ errs.join('；') }}
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="flex justify-end mt-6" v-if="!batchPreviewData.length">
            <q-btn label="取消" @click="showBatchImportDialog = false" class="mr-2" dense />
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- 6. 库存调整弹窗：适配后端库存调整接口 -->
    <q-dialog v-model="stockAdjustDialog.show" :maximized="false">
      <q-card style="width: 500px; max-width: 90vw;">
        <q-card-section class="q-pa-md">
          <h5 class="text-subtitle1 mb-4">库存调整</h5>
          <div v-if="currentAdjustSku" class="space-y-4">
            <div class="bg-grey-50 p-3 rounded">
              <p class="text-sm">
                <span class="text-grey-600">SKU：</span>
                {{ currentAdjustSku.sku_code }}（{{ currentAdjustSku.product_name }}）
              </p>
              <p class="text-sm mt-1">
                <span class="text-grey-600">当前库存：</span>
                {{ currentAdjustSku.total_stock }} {{ currentAdjustSku.unit }}
              </p>
            </div>

            <q-input v-model.number="adjustQuantity" label="调整后库存 *" type="number" min="0"
              :rules="[val => val >= 0 || '库存不能为负数']" dense class="w-full" :error-message="adjustErrors.new_quantity" />
            <q-input v-model="adjustReason" label="调整原因 *" type="textarea" rows="2" :rules="[val => !!val || '请填写调整原因']"
              dense class="w-full" placeholder="如：盘点差异、损坏报废、补货..." :error-message="adjustErrors.reason" />

            <!-- 全局错误 -->
            <div v-if="adjustErrors.non_field_errors" class="text-negative text-sm">
              {{ adjustErrors.non_field_errors }}
            </div>

            <div class="flex justify-end">
              <q-btn label="取消" @click="stockAdjustDialog.show = false" class="mr-2" dense />
              <q-btn label="确认调整" color="primary" dense @click="confirmStockAdjust"
                :disabled="!adjustQuantity || !adjustReason || adjustLoading" :loading="adjustLoading" />
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- 7. 导入弹窗 -->
    <!-- 初始化导入弹窗 -->
    <q-dialog v-model="showInitImportDialog" max-width="700px">
      <q-card>
        <q-card-section class="row items-center justify-between">
          <h5 class="text-h5 text-negative">⚠️ SKU初始化导入</h5>
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
                <li>1. 初始化导入将<span class="font-medium text-negative">覆盖现有SKU数据</span>，适用于系统首次上线或全量数据重置</li>
                <li>2. 若勾选"清空现有数据"，将删除所有SKU记录，<span class="font-medium text-negative">操作不可撤销</span></li>
                <li>3. 请确保导入文件包含"产品编码、SKU编码、规格"等必填字段（建议先下载模板）</li>
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
              <q-checkbox v-model="initClearExisting" label="清空现有SKU数据" color="negative"
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
                <li>成功创建SKU记录：{{ initImportResult.success_count }} 条</li>
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
          <h5 class="text-h5">SKU增量导入</h5>
          <q-btn icon="close" flat round @click="showNormalImportDialog = false" />
        </q-card-section>
        <q-card-section class="q-pa-md">
          <div class="space-y-4">
            <p class="text-sm">增量导入仅新增/更新SKU记录，不删除现有数据，适用于日常批量更新</p>
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
import * as XLSX from 'xlsx'  // 新增：前端解析Excel依赖
import { format } from 'date-fns'

// ========================== 1. 依赖导入（适配优化后后端接口） ==========================
import {
  getProductList,        // 产品列表（含is_active筛选）
  getProductSkus,           // SKU列表（含stock_quantity注解字段）
  createSku,            // 新增SKU（POST /skus/）
  updateSku,            // 更新SKU（PATCH /skus/{id}/）
  deleteSku,            // 删除SKU（DELETE /skus/{id}/）
  downloadProductSkuImportTemplate,  // 下载SKU模板（GET /skus/export-template/）
  batchCreateSku,       // 批量创建SKU（POST /skus/batch-create/）
  getSkuStockDetail,    // SKU库存详情（GET /skus/{id}/stock-detail/）
  adjustSkuStock,       // 调整SKU库存（POST /skus/{id}/adjust-stock/）
  exportSkuData,        // 导出SKU数据
  importSkuData,        // 导入SKU数据
} from 'src/services/productServiceApi'

import { exportExcel } from 'src/utils/excel-utils'
import { getProductCategories } from 'src/services/productServiceApi'  // 新增：获取产品分类列表接口
// ========================== 2. 基础状态与工具 ==========================
const $q = useQuasar()
const skuFormRef = ref(null)  // SKU表单引用

// 加载状态
const loadingSKUs = ref(false)
const loadingProducts = ref(false)
const submitting = ref(false)
const batchImportLoading = ref(false)
const adjustLoading = ref(false)
const loadingProductCategories = ref(false)  // 加载产品分类列表状态

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

// 错误状态：字段级错误提示
const formErrors = ref({})    // SKU表单错误
const adjustErrors = ref({})  // 库存调整错误

// ========================== 3. 数据列表与筛选（适配后端字段） ==========================
// 原始数据：接收后端返回的annotate字段（stock_quantity）
const skuList = ref([])
const productOptions = ref([])  // 所有产品选项
const filteredProductOptions = ref([])  // 筛选后的产品选项
const productCategoryOptions = ref([])

// 筛选参数：与后端filterset_class字段对应
const filters = reactive({
  product_category: null,  // 产品分类ID
  product: null,  // 产品ID
  location: null,  // 库位ID
  stock_status: null,  // 库存状态
  is_low_stock: null,
  sku: null,
  is_active: true,  // 是否启用
})
// 产品名称/编码（模糊匹配）
const searchParams = reactive({
  product_name_code: '', // 产品名称/编码（模糊匹配）
  sku_name_code: '', // SKU名称/编码（模糊匹配）

})
// 分页配置：与后端StandardResultsSetPagination对应
// 修改分页配置，添加筛选参数
const pagination = ref({
  page: 1,
  rowsPerPage: 10,
  sortBy: 'sku_code',
  descending: false,
})

// 库存状态选项：与后端is_low_stock字段对应，添加"全部"选项
const stockStatusOptions = reactive([
  { label: '全部', value: null },
  { label: '低库存', value: "true" },
  { label: '正常库存', value: "false" }
])

// 表格列配置：适配后端排序字段（stock_quantity）
const skuColumns = ref([
  { name: 'index', label: '序号', field: 'index', width: '80px', align: 'center', sortable: false },
  { name: 'product_name', label: '产品名称', field: 'product_name', sortable: true, width: '180px' },
  { name: 'product_code', label: '产品编码', field: 'product_code', sortable: true, width: '150px' },
  { name: 'sku_code', label: 'SKU编码', field: 'sku_code', sortable: true, width: '180px' },
  { name: 'specification', label: 'SKU规格', field: 'specification', sortable: true, width: '200px' },
  { name: 'image', label: 'SKU图片', field: 'image', width: '80px', align: 'center' },
  { name: 'barcode', label: '条形码', field: 'barcode', sortable: true, width: '150px' },
  {
    name: 'purchase_price',
    label: '采购价',
    field: 'purchase_price',
    sortable: true,
    width: '100px',
    align: 'right',
    format: (val) => `¥${Number(val).toFixed(2)}`
  },
  {
    name: 'selling_price',
    label: '销售价',
    field: 'selling_price',
    sortable: true,
    width: '100px',
    align: 'right',
    format: (val) => `¥${Number(val).toFixed(2)}`
  },
  {
    name: 'total_stock',
    label: '当前库存',
    field: 'total_stock',
    sortable: true,
    width: '100px',
    align: 'right',
    // 排序时传递后端注解字段名
    sortKey: 'stock_quantity'
  },
  { name: 'stock_status', label: '库存状态', field: 'is_low_stock', sortable: true, width: '100px', align: 'center' },
  { name: 'location_code', label: '关联库位', field: 'location_code', sortable: true, width: '200px' },
  { name: 'created_at', label: '创建时间', field: 'created_at', sortable: true, width: '180px' },
  { name: 'actions', label: '操作', field: 'actions', width: '180px', align: 'center' }
])

// 批次表格列：适配后端batch_records结构
const batchColumns = ref([
  { name: 'batch_number', label: '批次号', field: 'batch_number', width: '150px' },
  { name: 'quantity', label: '数量', field: 'quantity', align: 'right', width: '100px' },
  { name: 'production_date', label: '生产日期', field: 'production_date', width: '150px' },
  { name: 'expiry_date', label: '过期日期', field: 'expiry_date', width: '150px' },
  { name: 'is_low_stock', label: '库存状态', field: 'is_low_stock', align: 'center', width: '120px' }
])

// 批量导入预览列：Excel解析后展示
const batchPreviewColumns = ref([
  { name: 'product_code', label: '产品编码', field: 'product_code', width: '120px' },
  { name: 'sku_code', label: 'SKU编码', field: 'sku_code', width: '150px' },
  { name: 'specification', label: '规格', field: 'specification', width: '180px' },
  { name: 'unit', label: '单位', field: 'unit', width: '80px' },
  { name: 'purchase_price', label: '采购价', field: 'purchase_price', width: '100px' },
  { name: 'selling_price', label: '销售价', field: 'selling_price', width: '100px' }
])
// 仓库库存表格列定义
const warehouseStockColumns = ref([
  { name: 'warehouse_name', label: '仓库名称', field: 'warehouse_name', align: 'left' },
  { name: 'location_info', label: '库位信息', field: 'location_info', align: 'left' },
  { name: 'quantity', label: '库存数量', field: 'quantity', align: 'right' },
  { name: 'is_low_stock', label: '库存状态', field: 'is_low_stock', align: 'center' }
])

// 筛选后的SKU列表：实时响应筛选参数
// 添加日期格式化函数
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
// 当前产品编码：用于SKU编码前缀校验
const currentProductCode = ref('')

// ========================== 4. 弹窗状态（适配后端数据结构） ==========================
const skuDialog = ref({ show: false, isEdit: false, currentId: null, currentRow: null })
const imagePreviewDialog = ref({ show: false, url: '' })
const stockDetailDialog = ref({ show: false })
const currentStockDetail = ref(null)  // 接收后端stock-detail接口数据
const showBatchImportDialog = ref(false)
const batchImportFile = ref(null)
const batchPreviewData = ref([])  // Excel解析后的预览数据
const batchImportResult = ref(null)
const stockAdjustDialog = ref({ show: false })
const currentAdjustSku = ref(null)  // 待调整的SKU信息
const adjustQuantity = ref(0)      // 调整后库存
const adjustReason = ref('')       // 调整原因

// ========================== 3. 表单数据（适配后端数据结构） ==========================
// SKU表单数据：与后端ProductSKUCreateSerializer字段严格对应
const skuFormData = reactive({
  id: 0,
  product_code: null,
  sku_code: '',
  specification: '',
  barcode: '',
  unit: '个',
  purchase_price: 0,
  selling_price: 0,
  min_stock: 0,
  max_stock: 0,
  image: null,
  image_url: ''
})

// ========================== 5. 数据加载函数（适配后端新字段） ==========================
/**
 * 加载产品列表：仅启用产品，用于下拉选择
 */
const fetchProducts = async () => {
  loadingProducts.value = true
  try {
    const res = await getProductList({ page_size: 1000, is_active: true })
    productOptions.value = res.data.results.map(prod => ({
      id: prod.id,
      label: `${prod.name}（${prod.code}）`,
      name: prod.name,
      code: prod.code
    }))
    filteredProductOptions.value = [...productOptions.value]
  } catch (err) {
    $q.notify({ color: 'negative', message: `加载产品失败：${err.message || '网络异常'}` })
  } finally {
    loadingProducts.value = false
  }
}
/**
 * 构建请求参数（安全、规范、无异常）
 * 1. 下拉筛选 → 只传有效值，不传 null/undefined
 * 2. 搜索内容 → 自动去空格 + URL安全拼接
 * 3. 排序分页 → 健壮默认值
 * 4. 全部使用可选链 ?. 防崩溃
 */
const buildRequestParams = () => {
  const { page, rowsPerPage, sortBy, descending } = pagination.value

  // 排序（安全默认值）
  const sortField = sortBy || 'sku_code'
  const ordering = descending ? `-${sortField}` : sortField

  // 基础分页参数
  const params = {
    page,
    page_size: rowsPerPage,
    ordering
  }

  // ==========================
  // 精确筛选（下拉/选择类型）
  // ==========================

  // 产品分类
  if (filters.product_category?.id) {
    params.product_category = filters.product_category.id
  }

  // 产品
  if (filters.product?.id) {
    params.product = filters.product.id
  }

  // 库位
  if (filters.location?.id) {
    params.location_id = filters.location.id
  }

  // SKU
  if (filters.sku?.id) {
    params.sku_id = filters.sku.id
  }

  // 库存状态（低库存 / 全部）
  if (filters.stock_status !== null && filters.stock_status !== undefined) {
    params.is_low_stock = filters.stock_status
  }

  // 是否启用（固定传，因为默认 true）
  if (filters.is_active !== null) {
    params.is_active = filters.is_active
  }

  // ==========================
  // 模糊搜索（输入框类型）
  // ==========================
  const searchTerms = [
    searchParams.product_name_code?.trim(),
    searchParams.sku_name_code?.trim()
  ].filter(Boolean) // 过滤空、null、undefined、纯空格

  // 搜索词用【空格】连接 → Axios 自动编码，永不混淆
  if (searchTerms.length > 0)
    params.search = searchTerms.join(' ')

  return params
}
// 修改 fetchProductSkus 函数中的数据处理逻辑，确保正确显示总库存
const fetchProductSkus = async () => {
  loadingSKUs.value = true
  try {
    // 构建请求参数，包含分页、排序和筛选条件
    const params = buildRequestParams()

    // 传递分页、排序和筛选参数
    const res = await getProductSkus(params)

    // 处理后端返回数据：根据仓库筛选条件显示相应库存数量
    skuList.value = res.data.results.map(sku => {
      let displayQuantity = sku.total_stock
      let locationInfo = null

      // 如果选择了特定仓库，显示该仓库的库存数量
      if (filters.warehouse) {
        const warehouseLocation = sku.location_mapping?.find(
          location => location.warehouse_id === filters.warehouse.id
        )
        if (warehouseLocation) {
          displayQuantity = warehouseLocation.quantity
          locationInfo = {
            name: warehouseLocation.name,
            code: warehouseLocation.code,
            quantity: warehouseLocation.quantity,
            warehouse: warehouseLocation.warehouse
          }
        } else {
          displayQuantity = 0
          locationInfo = null
        }
      } else {
        // 没有选择仓库时，显示总库存和第一个库位信息
        displayQuantity = sku.total_stock
        locationInfo = sku.location_mapping?.length > 0 ? {
          name: sku.location_mapping[0].name,
          code: sku.location_mapping[0].code,
          quantity: sku.location_mapping[0].quantity,
          warehouse: sku.location_mapping[0].warehouse
        } : null
      }

      return {
        ...sku,
        // ✅ 新序列化器是扁平化结构，直接取值，不需要 .product
        product_id: sku.product_id,
        product_name: sku.product_name,
        product_code: sku.product_code,

        // 显示根据仓库筛选条件计算的库存数量
        total_stock: displayQuantity,

        // 库位信息
        location_name: locationInfo?.name || null,
        location_code: locationInfo?.code || null,
        location_quantity: locationInfo?.quantity || 0,
        location_warehouse_name: locationInfo?.warehouse || null,

        stock_quantity: sku.stock_quantity || 0,
        image: sku.image || ''
      }
    })

    pagination.value.rowsNumber = res.data.count
  } catch (err) {
    $q.notify({ color: 'negative', message: `加载SKU失败：${err.message || '网络异常'}` })
  } finally {
    loadingSKUs.value = false
  }
}
// 获取当前选择仓库的库存信息
const getWarehouseStockInfo = () => {
  if (!filters.warehouse || !currentStockDetail.value) return null

  return currentStockDetail.value.warehouse_stocks.find(
    stock => stock.warehouse_id === filters.warehouse.id
  )
}

// 获取当前显示的库存数量
const getCurrentStockQuantity = () => {
  if (!currentStockDetail.value) return 0

  // 如果选择了特定仓库，显示该仓库的库存数量
  if (filters.warehouse) {
    const warehouseStock = getWarehouseStockInfo()
    return warehouseStock ? warehouseStock.quantity : 0
  }

  // 否则显示总库存数量
  return currentStockDetail.value.stock_summary.total_stock
}

// 获取当前库存状态（是否低库存）
const getCurrentStockStatus = () => {
  if (!currentStockDetail.value) return false

  // 如果选择了特定仓库，显示该仓库的库存状态
  if (filters.warehouse) {
    const warehouseStock = getWarehouseStockInfo()
    return warehouseStock ? warehouseStock.is_low_stock : true // 默认为低库存
  }

  // 否则显示总库存状态
  return currentStockDetail.value.stock_summary.is_low_stock
}
// 搜索防抖定时器
let searchDebounceTimer = null
const SEARCH_DEBOUNCE_DELAY = 300 // 300毫秒防抖延迟


/**
 * 带防抖的筛选变化处理函数
 */
const onFilterChange = () => {
  // 清除之前的定时器
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer)
  }

  // 设置新的定时器
  searchDebounceTimer = setTimeout(() => {
    // 重置到第一页并重新加载数据
    pagination.value.page = 1
    fetchProductSkus()
  }, SEARCH_DEBOUNCE_DELAY)
}

/**
 * 立即执行的筛选变化处理函数（用于重置筛选等场景）
 */
const onFilterChangeImmediate = () => {
  // 清除防抖定时器
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer)
  }

  // 立即执行
  pagination.value.page = 1
  fetchProductSkus()
}


// 修改重置筛选参数函数，使用立即执行版本
const resetSearchParams = () => {
  // 重置搜索参数
  Object.assign(searchParams, {
    product_name_code: '',
    sku_name_code: ''
  })

  // 重置筛选器
  Object.assign(filters, {
    product_code: null,
    stock_status: null
  })

  // 使用立即执行版本
  onFilterChangeImmediate()
}

/**
 * 加载库存列表：适配后端annotate的stock_quantity字段
 */

const fetchProductCategories = async () => {
  loadingProductCategories.value = true
  try {
    const res = await getProductCategories()
    productCategoryOptions.value = res.data.results.map(category => ({
      id: category.id,
      name: category.name,
      value: category.id
    }))
  } catch (err) {
    $q.notify({ color: 'negative', message: `加载产品分类失败：${err.message || '网络异常'}` })
  } finally {
    loadingProductCategories.value = false
  }
}
/**
 * 构建请求参数：适配后端annotate的stock_quantity字段
 */

// 页面挂载初始化
onMounted(async () => {
  await Promise.all([fetchProductCategories(), fetchProducts(), fetchProductSkus()])
})

// ========================== 6. 表格交互（适配后端排序/分页） ==========================
/**
 * 表格排序/分页请求：传递正确的排序字段（stock_quantity）
 */
const handleTableRequest = async (props) => {
  pagination.value = {
    ...pagination.value,
    page: props.pagination.page,
    rowsPerPage: props.pagination.rowsPerPage,
    sortBy: props.pagination.sortBy || 'sku_code',
    descending: props.pagination.descending
  }
  await fetchProductSkus()
}

/**
 * 产品下拉筛选：防抖动，提升体验
 */
const filterProductOptions = (val, update) => {
  setTimeout(() => {
    update(() => {
      const keyword = val.toLowerCase()
      filteredProductOptions.value = productOptions.value.filter(prod =>
        prod.label.toLowerCase().includes(keyword)
      )
    })
  }, 300)
}

/**
 * 筛选触发：空函数（依赖computed自动响应）
 */


/**
 * 产品切换：自动填充SKU编码前缀
 */
const handleProductChange = (productId) => {
  if (!productId) {
    currentProductCode.value = ''
    return
  }
  const product = productOptions.value.find(p => p.id === productId)
  currentProductCode.value = product?.code || ''
  // 新增模式：自动生成前缀
  if (!skuDialog.value.isEdit && currentProductCode.value && !skuFormData.sku_code) {
    skuFormData.sku_code = `${currentProductCode.value}-`
  }
  // 清空产品相关错误
  formErrors.value.product_id = ''
}

// ========================== 7. 弹窗操作（适配后端接口） ==========================
/**
 * 打开新增/编辑SKU弹窗
 */
const openSkuDialog = (isEdit, row = null) => {
  // 重置表单与错误状态
  Object.assign(skuFormData, {
    id: 0,
    product_code: null,
    sku_code: '',
    specification: '',
    barcode: '',
    unit: '个',
    purchase_price: 0,
    selling_price: 0,
    min_stock: 0,
    max_stock: 0,
    image: null,
    image_url: ''
  })
  formErrors.value = {}
  currentProductCode.value = ''

  // 设置弹窗状态
  skuDialog.value = { show: true, isEdit, currentId: isEdit ? row.id : null, currentRow: isEdit ? row : null }

  // 编辑模式：回显后端数据
  if (isEdit && row) {
    Object.assign(skuFormData, {
      id: row.id,
      product_code: row.product_code || null,
      sku_code: row.sku_code,
      specification: row.specification,
      barcode: row.barcode || '',
      unit: row.unit || '个',
      purchase_price: Number(row.purchase_price) || 0,
      selling_price: Number(row.selling_price) || 0,
      min_stock: Number(row.min_stock) || 0,
      max_stock: Number(row.max_stock) || 0,
      image_url: row.image || ''
    })
    currentProductCode.value = row.product_code || ''
    // 通过 product_code 找到完整的产品对象，让 q-select 显示名称
    if (skuFormData.value.product_code) {
      const targetProduct = filteredProductOptions.value.find(
        (item) => item.code === skuFormData.value.product_code
      )
      if (targetProduct) {
        // 直接赋值对象，q-select 自动显示 name，提交时自动发 code
        skuFormData.value.product_code = targetProduct.name
      }
    }
  }
}

/**
 * 关闭SKU弹窗：重置状态
 */
const closeSkuDialog = () => {
  skuDialog.value.show = false
  formErrors.value = {}
  skuFormData.image = null
}

/**
 * 打开库存详情弹窗：调用后端stock-detail接口
 */
const openStockDetailDialog = async (row) => {
  try {
    const res = await getSkuStockDetail(row.id, { warehouse_id: filters.warehouse?.id })
    currentStockDetail.value = res.data.data  // 直接接收后端结构（sku_basic/stock_summary/batch_records）
    currentStockDetail.value.image_url = row.image || ''
    stockDetailDialog.value = { show: true }
  } catch (err) {
    $q.notify({ color: 'negative', message: `获取库存详情失败：${err.message}` })
  }
}

/**
 * 打开库存调整弹窗
 */
const openStockAdjustDialog = (sku) => {
  currentAdjustSku.value = { ...sku }
  adjustQuantity.value = sku.total_stock || 0
  adjustReason.value = ''
  adjustErrors.value = {}
  stockAdjustDialog.value = { show: true }
}

/**
 * 图片预览
 */
const previewImage = (url) => {
  imagePreviewDialog.value = { show: true, url }
}

// ========================== 8. 核心业务逻辑（适配后端新接口） ==========================
/**
 * 保存SKU：新增/编辑，适配后端字段级错误返回
 */
// 处理文件添加：确保skuFormData.image是单个文件对象（非数组）
const handleAddFile = (files) => {
  // files是数组，取第一个元素（因为限制了multiple=false）
  if (files && files.length > 0) {
    skuFormData.image = files[0]  // 覆盖为单个文件对象
    console.log('已选择图片：', skuFormData.image.name)
  }
}

// 处理文件删除：重置为null
const handleRemoveFile = () => {
  skuFormData.image = null
  console.log('已移除图片')
}

const saveSku = async () => {
  // 1. 表单校验
  const valid = await skuFormRef.value.validate()
  if (!valid) return
  if (submitting.value) return
  submitting.value = true
  formErrors.value = {}

  try {
    // 2. 构造请求数据（FormData：支持图片上传）
    const formData = new FormData()
    // 必选字段
    formData.append('product_id', productOptions.value.find(p => p.code === skuFormData.product_code)?.id || '')
    formData.append('sku_code', skuFormData.sku_code)
    formData.append('specification', skuFormData.specification)
    formData.append('unit', skuFormData.unit)
    formData.append('purchase_price', skuFormData.purchase_price)
    formData.append('selling_price', skuFormData.selling_price)
    formData.append('min_stock', skuFormData.min_stock)
    // 可选字段
    if (skuDialog.value.isEdit) {
      formData.append('id', skuDialog.value.currentId)
    }
    if (skuFormData.barcode) formData.append('barcode', skuFormData.barcode)
    if (skuFormData.max_stock) formData.append('max_stock', skuFormData.max_stock)
    // 👇 新增：验证 skuFormData.image 是否为有效图片
    if (skuFormData.image) {
      const file = skuFormData.image
      // 1. 确认是 File 类型
      const isFile = file instanceof File
      // 2. 确认是图片格式（type 以 image/ 开头，如 image/png、image/jpeg）
      const isImageType = file.type.startsWith('image/')
      // 3. 确认文件大小 > 0（避免空文件）
      const isNotEmpty = file.size > 0

      console.log('是否为File类型：', isFile)
      console.log('是否为图片格式：', isImageType)
      console.log('文件大小是否有效：', isNotEmpty)

      // 只有全部满足才添加到FormData
      if (isFile && isImageType && isNotEmpty) {
        formData.append('image', file)
        formData.append('keep_image', 'false')
        console.log('✅ 有效图片已添加到FormData')
      } else {
        console.error('❌ 无效图片：',
          !isFile ? '不是File类型' :
            !isImageType ? `文件类型错误（当前：${file.type}）` :
              '文件为空'
        )
      }
    } else {
      console.log('ℹ️ 未选择图片（编辑模式可能保留原图片）')
    }
    // 编辑模式：保留原图片，不选图片则保留原图片
    if (skuDialog.value.isEdit && skuFormData.image_url && !skuFormData.image) {
      formData.append('keep_image', 'true')
    }
    // 打印FormData中所有字段（含图片）
    console.log('FormData完整内容：')
    for (const [key, value] of formData.entries()) {
      // 图片字段单独标注，其他字段正常打印
      if (key === 'image' && value instanceof File) {
        console.log(`- ${key}: [图片文件] ${value.name}（${value.size}字节，${value.type}）`)
      } else {
        console.log(`- ${key}: ${value}`)
      }
    }
    // 3. 调用后端接口
    let res
    if (skuDialog.value.isEdit) {

      res = await updateSku(skuDialog.value.currentId, formData)
      // 更新列表数据
      const idx = skuList.value.findIndex(sku => sku.id === skuDialog.value.currentId)
      if (idx > -1) {
        skuList.value[idx] = {
          ...skuList.value[idx],
          ...res.data,
          product_name: productOptions.value.find(p => p.id === res.data.product_id)?.name || skuList.value[idx].product_name,
          product_code: productOptions.value.find(p => p.id === res.data.product_id)?.code || skuList.value[idx].product_code,
          image: res.data.image || skuFormData.image_url
        }
      }
      $q.notify({ color: 'positive', message: 'SKU更新成功' })
    } else {
      res = await createSku(formData)
      // 添加到列表
      skuList.value.push({
        ...res.data,
        product_name: productOptions.value.find(p => p.id === res.data.product_id)?.name || '未知产品',
        product_code: productOptions.value.find(p => p.id === res.data.product_id)?.code || '未知编码',
        total_stock: 0,
        is_low_stock: false,
        location_name: null
      })
      $q.notify({ color: 'positive', message: 'SKU创建成功' })
    }

    // 4. 关闭弹窗
    closeSkuDialog()
  } catch (err) {
    // 解析后端字段级错误
    if (err.response?.data) {
      formErrors.value = err.response.data
    } else {
      formErrors.value.non_field_errors = err.message || '操作失败，请重试'
    }
  } finally {
    submitting.value = false
  }
}

/**
 * 删除SKU：适配后端关联约束（有库存禁止删除）
 */
const handleDeleteSku = async (skuId) => {
  const sku = skuList.value.find(item => item.id === skuId)
  if (sku?.total_stock > 0) {
    $q.notify({ color: 'negative', message: '该SKU存在库存，无法删除' })
    return
  }

  // 确认弹窗
  const confirm = await $q.dialog({
    title: '确认删除',
    message: `确定删除SKU[${sku?.sku_code}]？删除后将同步删除关联的库位记录`,
    cancel: true,
    persistent: true,
    color: 'negative'
  }).onOk

  if (!confirm) return

  try {
    await deleteSku(skuId)
    // 刷新列表
    skuList.value = skuList.value.filter(item => item.id !== skuId)
    $q.notify({ color: 'positive', message: 'SKU删除成功' })
  } catch (err) {
    $q.notify({ color: 'negative', message: `删除失败：${err.message || '存在关联数据'}` })
  }
}

/**
 * 批量导入：前端解析Excel，调用后端batch-create接口
 */
// 下载模板
const downloadSkuImportTemplate = async () => {
  try {
    const response = await downloadProductSkuImportTemplate()
    handleFileDownload(response, 'SKU导入模板.xlsx')

    $q.notify({ color: 'positive', message: '模板下载成功' })
  } catch (err) {
    $q.notify({ color: 'negative', message: `模板下载失败：${err.message}` })
  }
}

// 解析Excel文件
const handleExcelUpload = (files) => {
  if (!files || files.length === 0) return
  const file = files[0]
  const reader = new FileReader()

  reader.onload = (e) => {
    try {
      // 解析Excel
      const data = new Uint8Array(e.target.result)
      const workbook = XLSX.read(data, { type: 'array' })
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      // 转成JSON（表头对应模板字段）
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: ['product_code', 'sku_code', 'specification', 'barcode', 'unit', 'purchase_price', 'selling_price', 'min_stock'],
        skipHeader: 1  // 跳过表头行
      })

      // 数据清洗（去除空行、转换数值类型）
      const cleanData = jsonData.filter(item => item.product_code && item.sku_code && item.specification)
        .map(item => ({
          ...item,
          purchase_price: Number(item.purchase_price) || 0,
          selling_price: Number(item.selling_price) || 0,
          min_stock: Number(item.min_stock) || 0
        }))

      batchPreviewData.value = cleanData
      batchImportResult.value = null
    } catch (err) {
      $q.notify({ color: 'negative', message: `Excel解析失败：${err.message}` })
    }
  }

  reader.readAsArrayBuffer(file)
}

// 提交批量导入（调用后端batch-create接口）
const submitBatchImport = async () => {
  if (batchPreviewData.value.length === 0) return
  batchImportLoading.value = true
  batchImportResult.value = null

  try {
    // 构造请求参数：与后端batch-create接口对应（{"skus": [...]}）
    const requestData = { skus: batchPreviewData.value }
    const res = await batchCreateSku(requestData)

    batchImportResult.value = {
      success: true,
      count: res.data.count
    }
    // 刷新SKU列表
    await fetchProductSkus()
    $q.notify({ color: 'positive', message: `批量导入成功，新增${res.data.count}个SKU` })
    // 重置预览
    setTimeout(() => {
      batchPreviewData.value = []
      batchImportFile.value = null
    }, 1500)
  } catch (err) {
    // 解析后端错误
    batchImportResult.value = {
      success: false,
      error: err.message || '导入失败',
      field_errors: err.response?.data || {}
    }
  } finally {
    batchImportLoading.value = false
  }
}

/**
 * 确认库存调整：调用后端adjust-stock接口
 */
const confirmStockAdjust = async () => {
  if (!currentAdjustSku.value || !adjustQuantity.value || !adjustReason.value) return
  adjustLoading.value = true
  adjustErrors.value = {}

  try {
    await adjustSkuStock(currentAdjustSku.value.id, {
      new_quantity: adjustQuantity.value,
      reason: adjustReason.value
    })

    $q.notify({ color: 'positive', message: '库存调整成功' })
    // 刷新列表和库存详情
    await fetchProductSkus()
    if (currentStockDetail.value) {
      await openStockDetailDialog(currentAdjustSku.value)
    }
    stockAdjustDialog.value = false
  } catch (err) {
    // 解析字段级错误
    if (err.response?.data) {
      adjustErrors.value = err.response.data
    } else {
      adjustErrors.value.non_field_errors = err.message || '调整失败，请重试'
    }
  } finally {
    adjustLoading.value = false
  }
}

// ========================== 9. 导入导出功能 ==========================
/**
 * 导出SKU数据
 */
const handleExportSkus = async () => {
  try {
    loadingSKUs.value = true
    const res = await exportSkuData({
      product: searchParams.product_name_code,
      sku: searchParams.sku_name_code,
      stock_status: filters.is_low_stock?.value
    })

    // 处理Excel文件下载
    const blob = new Blob([res.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `SKU数据_${format(new Date(), 'yyyyMMddHHmmss')}.xlsx`
    document.body.appendChild(a)
    a.click()
    URL.revokeObjectURL(url)
    document.body.removeChild(a)

    $q.notify({ type: 'positive', message: 'SKU数据导出成功' })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: '导出失败：' + (error.response?.data?.error || error.message)
    })
  } finally {
    loadingSKUs.value = false
  }
}

/**
 * 下载初始化模板
 */
async function downloadInitTemplate() {
  try {
    const response = await downloadProductSkuImportTemplate('init')
    handleFileDownload(response, 'SKU初始化导入模板.xlsx')
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
    const response = await downloadProductSkuImportTemplate('normal')
    handleFileDownload(response, 'SKU增量导入模板.xlsx')
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
    const confirm = await $q.dialog({
      title: '危险操作确认',
      message: '确定要清空所有SKU数据吗？此操作将删除所有SKU记录，且无法恢复！',
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
 * SKU初始化导入（核心功能）
 */
async function handleInitImport() {
  if (!selectedFile.value) return

  try {
    importLoading.value = true
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    formData.append('clear_existing', initClearExisting.value) // 传递清空参数
    formData.append('import_type', 'init')

    const response = await importSkuData(formData)

    if (response.status === 200) {
      const result = response.data
      initImportResult.value = result
      importErrors.value = result.errors || []

      // 提示结果
      $q.notify({
        color: 'positive',
        message: `初始化成功！SKU记录：${result.success_count}条`,
        position: 'top'
      })

      // 无错误则关闭弹窗并刷新
      if (result.error_count === 0) {
        setTimeout(() => {
          resetImportState()
          fetchProductSkus()
        }, 1500)
      }
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || 'SKU初始化失败',
      position: 'top'
    })
  } finally {
    importLoading.value = false
  }
}

/**
 * SKU增量导入
 */
async function handleNormalImport() {
  if (!selectedFile.value) return

  try {
    importLoading.value = true
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    formData.append('clear_existing', false) // 增量导入不清空

    const response = await importSkuData(formData)
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
        fetchProductSkus()
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
  exportExcel(exportData, `SKU导入错误详情_${format(new Date(), 'yyyyMMddHHmmss')}.xlsx`)
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

/* 表单间距与错误提示 */
.space-y-4>div {
  margin-bottom: 1rem;
}

.space-y-4>div:last-child {
  margin-bottom: 0;
}

.q-input--error .q-field__control,
.q-select--error .q-field__control {
  border-color: var(--q-color-negative);
}

.text-negative {
  color: var(--q-color-negative);
}

/* 弹窗内容间距 */
.q-dialog .q-card-section {
  padding: 1.5rem;
}
</style>
