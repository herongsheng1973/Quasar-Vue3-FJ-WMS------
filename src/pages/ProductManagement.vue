<template>
  <q-page class="q-pa-md">
    <!-- 页面标题 -->
    <div class="row flex items-center q-mx-md">
      <div class="col-3">
        <h5 class="text-h5 q-ma-none">产品管理</h5>
        <p class="text-grey text-subtitle2">管理所有产品信息</p>
      </div>
      <!-- 顶部操作栏：新增 + 导入 + 导出 -->
      <div class="col-9 flex q-px-md items-center justify-end gap-xl vertical-center">

        <q-btn style="width: 140px; margin-right: 5px;" label="新增产品" color="secondary" icon="add"
          @click="openDialog()" />


        <!-- 导入按钮 -->

        <q-file style="width: 160px; margin-right: 5px;" v-model="selectedFile" label="选择Excel文件" accept=".xlsx, .xls"
          outlined dense>
          <template v-slot:append>
            <q-icon name="attach_file" />
          </template>
        </q-file>



        <q-btn style="width: 100px; margin-right: 5px;" label="导入产品" color="secondary" :loading="importLoading"
          @click="handleImport()" :disabled="!selectedFile" dense />


        <!-- 导出按钮 -->

        <q-btn style="width: 120px; margin-right: 5px;" label="导出产品" color="teal" icon="file_download"
          :loading="exportLoading" @click="handleExport()" dense />


        <!-- 导出模板 -->

        <q-btn style="width: 120px; margin-right: 5px;" label="导出模板" color="blue-grey-5" dense icon="file_download"
          :loading="exportLoading" @click="handleExportTemplate()" />

      </div>
    </div>

    <!-- 搜索与过滤区 -->
    <div class="row q-col-gutter-md q-pa-md">
      <!-- 普通搜索（多字段匹配） -->

      <q-input v-model="searchQuery" label="搜索商品（名称/编码）" placeholder="输入关键词..." clearable dense outlined
        @keyup.enter="handleSearch()" @clear="clearSearch" class="col-4">
        <template v-slot:prepend>
          <q-icon name="search" />
        </template>
      </q-input>


      <!-- 过滤条件：分类 + 是否激活 -->

      <q-select class="col-4" v-model="filterParams.category" label="商品分类" :options="categories" option-label="name"
        option-value="id" placeholder="全部分类" clearable dense outlined @update:model-value="handleFilter()" />

      <q-select class="col-4" v-model="filterParams.is_active" label="是否启用" :options="activeOptions"
        option-label="label" option-value="value" dense outlined @update:model-value="handleFilter()" />


    </div>

    <!-- 产品数据表格 -->
    <div class="row">
      <div class="col">
        <q-table ref="tableRef" :rows="productList" :columns="tableColumns" :loading="tableLoading"
          v-model:pagination="pagination" :filter="filterParams.keyword" :rows-per-page-options="[10, 20, 50, 100]"
          @request="handleRequest" row-key="id" flat bordered wrap-cells dense>
          <template v-slot:body-cell-index="props">
            <q-td :props="props">
              <q-badge color="primary">
                {{ (pagination.page - 1) * pagination.rowsPerPage + props.pageIndex + 1 }}
              </q-badge>
            </q-td>
          </template>
          <!-- 操作列模板 -->
          <template v-slot:body-cell-actions="props">
            <q-td :props="props" class="text-center">
              <q-btn size="sm" color="primary" icon="edit" @click="openDialog(props.row.id)" flat dense round>
                <q-tooltip>编辑</q-tooltip>
              </q-btn>
              <q-btn size="sm" color="positive" icon="visibility" @click="handlePreview(props.row.id)" class="q-ml-sm"
                flat dense round>
                <q-tooltip>预览</q-tooltip>
              </q-btn>
              <q-btn size="sm" color="negative" icon="delete" @click="handleDelete(props.row.id)" class="q-ml-sm" flat
                dense round>
                <q-tooltip>删除</q-tooltip>
              </q-btn>
            </q-td>
          </template>

          <!-- 状态列格式化 -->
          <template v-slot:body-cell-is_active="props">
            <q-td :props="props">
              <q-badge :color="props.row.is_active ? 'positive' : 'negative'"
                :label="props.row.is_active ? '激活' : '未激活'" />
            </q-td>
          </template>

          <!-- 分类列格式化 -->
          <template v-slot:body-cell-category="props">
            <q-td :props="props">
              {{ getCategoryName(props.row.category) }}
            </q-td>
          </template>
          <!-- 描述列格式化 -->
          <template v-slot:body-cell-description="props">
            <q-td :props="props">
              <div class="ellipsis" :title="props.row.description">
                {{ props.row.description }}
              </div>
            </q-td>
          </template>

          <!-- 主图列格式化 -->
          <template v-slot:body-cell-main_image="props">
            <q-td :props="props" class="text-center">
              <q-img v-if="props.row.main_image" :src="props.row.main_image" spinner-color="primary"
                style="max-height: 40px; max-width: 40px; cursor: pointer;"
                @click="showImagePreview(props.row.main_image)">
                <template v-slot:error>
                  <div class="absolute-full flex flex-center bg-grey-3 text-grey-7">
                    无图片
                  </div>
                </template>
              </q-img>
              <span v-else>-</span>
            </q-td>
          </template>
          <!-- 空数据提示 -->
          <template v-slot:no-data>
            <div class="full-width text-center q-py-md">
              <q-icon name="info" color="grey" size="xl" class="q-mb-sm" />
              <p class="text-grey">暂无产品数据</p>
            </div>
          </template>

          <!-- 表格顶部工具栏 -->
          <template v-slot:top>
            <div class="full-width row items-center">
              <div class="col text-h6">产品列表</div>
              <div class="col-auto">
                <q-btn flat round dense icon="refresh" @click="refreshData" :loading="tableLoading">
                  <q-tooltip>刷新</q-tooltip>
                </q-btn>
              </div>
            </div>
          </template>
        </q-table>
      </div>
    </div>
    <!-- 图片预览对话框 -->
    <q-dialog v-model="imagePreviewVisible" maximized>
      <q-card>
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">图片预览</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup @click="imagePreviewVisible = false" />
        </q-card-section>

        <q-separator />

        <q-card-section class="flex flex-center" style="height: calc(100vh - 100px)">
          <q-img :src="previewImageUrl" spinner-color="primary" style="max-width: 90%; max-height: 90%" fit="contain">
            <template v-slot:error>
              <div class="absolute-full flex flex-center bg-grey-3 text-grey-7">
                图片加载失败
              </div>
            </template>
          </q-img>
        </q-card-section>
      </q-card>
    </q-dialog>
    <!-- 新增/编辑产品弹窗 -->
    <product-form-dialog v-model="dialogVisible" :current-product="currentProduct" :categories="categories"
      :loading="dialogLoading" @submit="handleFormSubmit" @cancel="dialogVisible = false" />
    <product-preview-dialog v-model="previewVisible" :preview-product="previewProduct" :loading="previewLoading"
      @close="handlePreviewClose" maximized />
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import ProductFormDialog from 'src/components/ProductFormDialog.vue'
import ProductPreviewDialog from 'src/components/ProductPreviewDialog.vue'
import {
  getProductList,
  getProductDetail,
  createProduct,
  updateProduct,
  deleteProduct,
  importProducts,
  exportProducts,
  getProductCategories
} from 'src/services/productServiceApi.js'

const $q = useQuasar()
import { downloadProductTemplate } from 'src/services/productServiceApi.js'

// 1. 页面状态管理
const productList = ref([])
const categories = ref([]) // 保持为响应式数组
const tableLoading = ref(false)
const importLoading = ref(false)
const exportLoading = ref(false)
const dialogVisible = ref(false)
const dialogLoading = ref(false)
const previewVisible = ref(false)
const previewLoading = ref(false)
const previewProduct = ref(null)
const currentProduct = ref(null)
const selectedFile = ref(null)
const tableRef = ref(null)
// 2. 搜索/过滤参数
const searchQuery = ref('')
const filterParams = ref({
  category: null,
  is_active: null
})

// 3. 过滤选项
const activeOptions = [
  { label: '全部', value: null },
  { label: '激活', value: true },
  { label: '未激活', value: false }
]

// 4. 分页与排序
const pagination = ref({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0
})

const tableColumns = [
  { name: 'index', label: '序号', field: 'index', width: '80px', align: 'center', sortable: false },
  {
    name: 'name',
    label: '商品名称',
    field: 'name',
    sortable: true,
    align: 'left'
  },
  {
    name: 'code',
    label: '商品编码',
    field: 'code',
    sortable: true,
    align: 'left'
  },
  {
    name: 'category',
    label: '商品类别',
    field: 'category',
    align: 'left'
  },
  {
    name: 'is_active',
    label: '状态',
    field: 'is_active',
    align: 'center'
  },
  {
    name: 'description',
    label: '描述',
    field: 'description',
    align: 'left',
    style: 'max-width: 200px'
  },
  {
    name: 'main_image',
    label: '主图',
    field: 'main_image',
    align: 'center',
    style: 'width: 80px'
  },
  {
    name: 'created_at',
    label: '创建时间',
    field: 'created_at',
    sortable: true,
    format: (val) => val ? new Date(val).toLocaleString() : '-',
    align: 'center'
  },
  {
    name: 'updated_at',
    label: '更新时间',
    field: 'updated_at',
    sortable: true,
    format: (val) => val ? new Date(val).toLocaleString() : '-',
    align: 'center'
  },
  {
    name: 'actions',
    label: '操作',
    field: 'actions',
    align: 'center'
  }
]
// 添加图片预览相关状态
const imagePreviewVisible = ref(false)
const previewImageUrl = ref('')

// 添加图片预览方法
const showImagePreview = (imageUrl) => {
  previewImageUrl.value = imageUrl
  imagePreviewVisible.value = true
}

// 5. 页面加载时初始化数据
onMounted(async () => {
  await Promise.all([
    fetchCategories(),
    // get initial data from server (1st page)
    tableRef.value.requestServerInteraction()
  ])
})

// 6. 获取产品分类列表
const fetchCategories = async () => {
  try {
    const res = await getProductCategories(
      { page: 1, page_size: 100 }
    )
    // 确保返回的是数组格式
    categories.value = Array.isArray(res.data.results) ? res.data.results : []
  } catch (error) {
    categories.value = [] // 出错时设置为空数组
    $q.notify({
      type: 'negative',
      message: '获取分类失败: ' + (error.message || '未知错误')
    })
  }
}

// 7. 获取产品列表
const fetchProductList = async (props) => {
  tableLoading.value = true
  try {
    // 构建请求参数
    const params = {
      page: props?.pagination?.page || pagination.value.page,
      page_size: props?.pagination?.rowsPerPage || pagination.value.rowsPerPage,
      ...(filterParams.value.category && { category: filterParams.value.category.id || filterParams.value.category }),
      ...(filterParams.value.is_active !== null && { is_active: filterParams.value.is_active.value }),
      ...(searchQuery.value && { search: searchQuery.value })
    }

    // 如果有排序参数
    if (props?.sortBy) {
      params.ordering = `${props.descending ? '-' : ''}${props.sortBy}`
    }

    const res = await getProductList(params)

    // 直接使用返回的产品数据
    productList.value = Array.isArray(res.data.results) ? res.data.results : []
    pagination.value.rowsNumber = res.data.count

    // 更新分页信息
    if (props?.pagination) {
      pagination.value.page = props.pagination.page
      pagination.value.rowsPerPage = props.pagination.rowsPerPage
    }
  } catch (error) {
    productList.value = []
    pagination.value.rowsNumber = 0
    $q.notify({
      type: 'negative',
      message: '获取商品列表失败: ' + (error.message || '未知错误')
    })
  } finally {
    tableLoading.value = false
  }
}

// 8. 处理表格请求（分页、排序）
const handleRequest = (props) => {
  fetchProductList(props)
}

// 9. 搜索事件
const handleSearch = () => {
  pagination.value.page = 1
  fetchProductList()
}

// 清除普通搜索内容并刷新数据
const clearSearch = () => {
  searchQuery.value = ''
  pagination.value.page = 1
  fetchProductList()
}

// 11. 过滤事件
const handleFilter = () => {
  pagination.value.page = 1
  fetchProductList()
}

// 12. 刷新数据
const refreshData = () => {
  fetchProductList()
}

// 13. 打开新增/编辑弹窗（增强调试版）
const openDialog = async (productId = null) => {
  console.log('openDialog called with:', productId)
  dialogVisible.value = true  // 在函数一开始就设置对话框可见
  currentProduct.value = null

  if (productId) {
    console.log('Edit mode for product:', productId)
    // 编辑模式：获取产品详情
    dialogLoading.value = true
    try {
      const res = await getProductDetail(productId)
      currentProduct.value = res.data || null
      console.log('Product data loaded:', currentProduct.value)
    } catch (error) {
      dialogVisible.value = false
      $q.notify({
        type: 'negative',
        message: '获取产品详情失败: ' + (error.message || '未知错误')
      })
    } finally {
      dialogLoading.value = false
    }
  } else {
    console.log('Create new product mode')
    // 新增模式：初始化默认值
    // 新增模式：初始化默认值
    currentProduct.value = {
      name: '',
      code: '',
      category: null,
      description: '',
      main_image: null,
      is_active: true
    }
    console.log('Initialized currentProduct for new product:', currentProduct.value)
  }
}
const handlePreview = async (productId) => {
  previewVisible.value = true
  if (productId) {
    previewLoading.value = true
    const res = await getProductDetail(productId)
    previewProduct.value = res.data || null
  } else {
    previewProduct.value = null
  }
  previewLoading.value = false
}
const handlePreviewClose = () => {
  previewVisible.value = false
}
// 14. 表单提交
const handleFormSubmit = async (formData) => {
  dialogLoading.value = true
  try {
    if (currentProduct.value && currentProduct.value.id) {
      await updateProduct(currentProduct.value.id, formData)
      $q.notify({ type: 'positive', message: '产品编辑成功' })
    } else {
      await createProduct(formData)
      $q.notify({ type: 'positive', message: '产品新增成功' })
    }
    dialogVisible.value = false
    fetchProductList()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: (currentProduct.value ? '编辑' : '新增') + '失败: ' + (error.message || '未知错误')
    })
  } finally {
    dialogLoading.value = false
  }
}

// 15. 删除产品
const handleDelete = async (productId) => {
  $q.dialog({
    title: '确认删除',
    message: '确定要删除该产品吗？此操作不可撤销！',
    cancel: true,
    persistent: true,
    color: 'negative'
  }).onOk(async () => {
    try {
      await deleteProduct(productId)
      $q.notify({ type: 'positive', message: '产品删除成功' })
      fetchProductList()
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: '删除失败: ' + (error.message || '未知错误')
      })
    }
  })
}

// 16. 导入产品
const handleImport = async () => {
  if (!selectedFile.value) {
    $q.notify({ type: 'warning', message: '请先选择Excel文件' })
    return
  }

  importLoading.value = true
  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    console.log('Importing products...', selectedFile.value[0])
    const res = await importProducts(selectedFile.value)

    // 显示导入结果
    const result = res.data || {}
    $q.dialog({
      title: '导入结果',
      message: `
        <div>
          <p>成功：${result.success_count || 0} 条</p>
          <p>失败：${result.fail_count || 0} 条</p>
          ${result.errors && result.errors.length > 0 ?
          `<p class="text-negative">错误详情：${result.errors[0].error || '未知错误'}</p>` :
          ''}
        </div>
      `,
      html: true
    })

    fetchProductList()
    selectedFile.value = null
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: '导入失败: ' + (error.message || '未知错误')
    })
  } finally {
    importLoading.value = false
  }
}

// 17. 导出产品
const handleExport = async () => {
  exportLoading.value = true
  try {
    // 构建参数（更简洁写法）
    const params = {}
    if (filterParams.value.category) {
      params.category = filterParams.value.category.id ?? filterParams.value.category
    }
    if (filterParams.value.is_active !== null && filterParams.value.is_active !== undefined) {
      params.is_active = filterParams.value.is_active
    }
    if (searchQuery.value?.trim()) {
      params.search = searchQuery.value.trim()
    }

    // 请求导出接口
    const res = await exportProducts(params)
    const blob = res.data

    // 解析文件名（兼容前后端所有格式）
    let filename = `products_${new Date().toISOString().slice(0, 10)}.xlsx`
    const disposition = res.headers?.['content-disposition']
    if (disposition) {
      const matches = disposition.match(/filename\*?=(?:UTF-8'')?([^;\n]+)/i) || disposition.match(/filename="?([^"]+)"?/i)
      if (matches?.[1]) {
        filename = decodeURIComponent(matches[1].replace(/['"]/g, ''))
      }
    }

    // 下载（标准、简洁）
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)

    $q.notify({ type: 'positive', message: '导出成功' })
  } catch (err) {
    console.error('导出失败', err)
    $q.notify({
      type: 'negative',
      message: '导出失败：' + (err.message || '服务器异常')
    })
  } finally {
    exportLoading.value = false
  }
}
// 18. 导出模板
const handleExportTemplate = async () => {
  downloadProductTemplate().then(response => {
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '商品模板.xlsx'
    document.body.appendChild(a)
    a.click()
    URL.revokeObjectURL(url)
  })

}


// 根据分类ID获取分类名称
const getCategoryName = (categoryId) => {
  if (!categoryId) return '-'

  const category = categories.value.find(cat => cat.id === categoryId)
  return category ? category.name : categoryId.toString()
}
</script>

<style scoped>
/* 响应式布局优化 */
@media (max-width: 768px) {
  .q-table__top {
    flex-direction: column;
    align-items: stretch;
  }

  .q-table__top>.col {
    margin-bottom: 10px;
  }

  .q-table__top>.col-auto {
    align-self: flex-end;
  }

  /* 文字超出省略 */
  .ellipsis {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
