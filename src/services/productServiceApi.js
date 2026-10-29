import axios from 'axios'
import { useUserStore } from 'src/stores/userStore'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

// ==============================================
// 创建 Axios 实例：库存/商品模块统一请求实例
// ==============================================
const productApi = axios.create({
  baseURL: `${API_BASE_URL}/inventory/`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ==============================================
// 请求拦截器：自动携带 Token
// ==============================================
productApi.interceptors.request.use(
  (config) => {
    const userStore = useUserStore()
    const token = userStore.token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// ==============================================
// 响应拦截器：统一错误处理
// ==============================================
productApi.interceptors.response.use(
  (response) => {
    if (response.config.responseType === 'blob' || response.config.skipParse) {
      return response
    }
    return response
  },

  (error) => {
    let errorMessage = '操作失败，请重试'
    if (error.config?.responseType === 'blob' || error.config?.skipParse) {
      return Promise.reject(error)
    }
    if (error.response?.data) {
      if (Array.isArray(error.response.data) && error.response.data.length > 0) {
        errorMessage = error.response.data.join('; ')
      } else if (typeof error.response.data === 'string') {
        errorMessage = error.response.data
      }
    }

    if (error.response?.status === 401) {
      errorMessage = '登录过期，请重新登录'
    }

    const customError = new Error(errorMessage)
    customError.response = error.response
    return Promise.reject(customError)
  },
)

// ==============================================
// 1. 仓库管理（归属 settings 模块）
// ==============================================
export const getWarehouses = () => {
  return productApi.get('warehouses/', {
    baseURL: `${API_BASE_URL}/settings/`,
  })
}

// ==============================================
// 2. 商品分类管理
// ==============================================
export const getProductCategories = (params) => {
  return productApi.get('categories/', { params })
}
export const getCategoryOptions = (params) => {
  return productApi.get('categories/categories_options/', { params })
}
export const createProductCategory = (data) => {
  return productApi.post('categories/', data)
}
export const updateProductCategory = (id, data) => {
  return productApi.patch(`categories/${id}/`, data)
}
export const deleteProductCategory = (id) => {
  return productApi.patch(`categories/${id}/`, { is_active: false })
}

// 导入/导出/模板
export const importProductCategoryApi = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return productApi.post('categories/import-data/', formData, {
    headers: { 'Content-Type': undefined },
  })
}
export const importProductCategory = (formData) => {
  return productApi.post('categories/import-data/', formData, {
    headers: { 'Content-Type': undefined },
  })
}
export const downloadProductCategoryTemplate = (templateType) => {
  return productApi.get(`categories/download-template/?template_type=${templateType}`, {
    responseType: 'blob',
  })
}
export const downloadProductCategory = () => {
  return productApi.get('categories/export-data/', { responseType: 'blob' })
}
export const uploadProductCategory = (formData) => {
  return productApi.post('categories/import-data/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

// ==============================================
// 3. 商品（主产品）管理
// ==============================================
export const getProductList = (params) => {
  return productApi.get('products/', { params })
}
export const getProductDetail = (id) => {
  return productApi.get(`products/${id}/`)
}
export const createProduct = (formData) => {
  return productApi.post('products/', formData, { headers: { 'Content-Type': undefined } })
}
export const updateProduct = (id, formData) => {
  return productApi.put(`products/${id}/`, formData, { headers: { 'Content-Type': undefined } })
}
export const deleteProduct = (id) => {
  return productApi.delete(`products/${id}/`)
}

// 选项/搜索
export const getProductOptions = (params) => {
  return productApi.get('products/product_options/', { params })
}
export const searchProductByBarcode = (barcode) => {
  return productApi.get('search_by_barcode/', { params: { barcode } })
}

// 导入/导出/模板
export const importProducts = (file, additionalData = {}) => {
  const formData = new FormData()
  formData.append('file', file)
  Object.keys(additionalData).forEach((key) => formData.append(key, additionalData[key]))
  return productApi.post('products/import-data/', formData, {
    headers: { 'Content-Type': undefined },
  })
}
export const exportProducts = (params) => {
  return productApi.get('products/export-data/', { params, responseType: 'blob' })
}
export const downloadProductTemplate = () => {
  return productApi.get('products/download-template/', { responseType: 'blob' })
}

// ==============================================
// 4. SKU 管理
// ==============================================
export const getProductSkuList = (params) => {
  return productApi.get('product-skus/', { params })
}
export const getProductSkus = (params) => {
  return productApi.get('product-skus/', { params })
}
export const getSkuDetail = (id) => {
  return productApi.get(`product-skus/${id}/`)
}
export const createSku = (data) => {
  return productApi.post('product-skus/', data, { headers: { 'Content-Type': undefined } })
}
export const updateSku = (id, formData) => {
  return productApi.put(`product-skus/${id}/`, formData, { headers: { 'Content-Type': undefined } })
}
export const deleteSku = (id) => {
  return productApi.delete(`product-skus/${id}/`)
}

// 关联查询
export const getSkuOptionsbyProductId = (pid) => {
  return productApi.get(`products/${pid}/product-sku-options/`)
}
export const getProductSkusByProductId = (productId) => {
  return productApi.get(`products/${productId}/product-sku-options/`)
}
export const getProductSkuOptions = (params) => {
  return productApi.get('product-skus/product_skus_options/', { params })
}

// 图片/库存
export const uploadSkuImage = (id, file) => {
  const formData = new FormData()
  formData.append('file', file)
  return productApi.post(`product-skus/${id}/upload_image/`, formData, {
    headers: { 'Content-Type': undefined },
  })
}
export const adjustSkuStock = (id, data) => {
  return productApi.post(`product-skus/${id}/adjust_stock/`, data)
}
export const getSkuStockDetail = (id, params) => {
  return productApi.get(`product-skus/${id}/stock-detail/`, { params })
}

// 批量
export const batchCreateSku = (data) => {
  return productApi.post('product-skus/batch_create/', data)
}
export const batchImportSku = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return productApi.post('product-skus/import_data/', formData, {
    headers: { 'Content-Type': undefined },
  })
}
export const importSkuData = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return productApi.post('product-skus/import_data/', formData, {
    headers: { 'Content-Type': undefined },
  })
}
export const batchExportSku = (params) => {
  return productApi.get('product-skus/export_data/', { params, responseType: 'blob' })
}
export const exportSkuData = (params) => {
  return productApi.get('product-skus/export_data/', { params, responseType: 'blob' })
}
export const downloadProductSkuImportTemplate = (templateType) => {
  return productApi.get('product-skus/download_template/', {
    params: { template_type: templateType },
    responseType: 'blob',
  })
}

// ==============================================
// 5. 库位商品关联（LocationSKU）
// ==============================================
export const getLocationSkus = (params) => {
  return productApi.get('location-skus/', { params })
}
export const getLocationSkuDetail = (id) => {
  return productApi.get(`location-skus/${id}/`)
}
export const createLocationSkuRelation = (data) => {
  return productApi.post('location-skus/', data)
}
export const updateLocationSkuRelation = (id, data) => {
  return productApi.put(`location-skus/${id}/`, data)
}
export const deleteLocationSkuRelation = (id) => {
  return productApi.delete(`location-skus/${id}/`)
}

export const getLocationSkuBySkuId = (params) => {
  return productApi.get('location-skus/by_sku/', { params })
}

// 导入/导出/模板
export const importLocationSkuData = (formData) => {
  return productApi.post('location-skus/import_data/', formData, {
    headers: { 'Content-Type': undefined },
  })
}
export const exportLocationSkuData = (params) => {
  return productApi.get('location-skus/export_data/', { params, responseType: 'blob' })
}
export const downloadLocationSkuTemplate = () => {
  return productApi.get('location-skus/download_template/', { responseType: 'blob' })
}

// ==============================================
// 6. 库位商品（旧版，兼容）
// ==============================================
export const getLocationProducts = (params) => {
  return productApi.get('location-products/', { params })
}
export const createLocationProduct = (data) => {
  return productApi.post('location-products/', data)
}
export const deleteLocationProduct = (id) => {
  return productApi.delete(`location-products/${id}/`)
}

// ==============================================
// 7. 库存记录管理
// ==============================================
export const getInventoryRecords = (params) => {
  return productApi.get('inventory-records/', { params })
}
export const createInventoryRecord = (data) => {
  return productApi.post('inventory-records/', data)
}

// 库存查询
export const getInventoryByProductName = (params) => {
  return productApi.get('inventory-records/get_inventory_by_productName/', { params })
}
export const getInventoryByLocationId = (params) => {
  return productApi.get('inventory-records/get_inventory_by_locations/', { params })
}
export const getSkuBatchOptionsBySkuId = (params) => {
  return productApi.get('inventory-records/batch-numbers-options/', { params })
}

// 导入/导出/模板
export const importInventoryRecords = (file, clear_existing = false) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('clear_existing', clear_existing)
  return productApi.post('inventory-records/import-data/', formData, {
    headers: { 'Content-Type': undefined },
  })
}
export const exportInventoryRecords = (params) => {
  return productApi.get('inventory-records/export-data/', {
    params,
    responseType: 'blob',
    skipParse: true,
  })
}
export const downloadInventoryImportTemplate = (templateType) => {
  return productApi.get(`inventory-records/download-template/?template=${templateType}`, {
    responseType: 'blob',
  })
}

export default productApi
