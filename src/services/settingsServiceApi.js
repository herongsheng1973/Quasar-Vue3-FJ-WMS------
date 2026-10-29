import axios from 'axios'
import { useUserStore } from '../stores/userStore'
// API基础路径
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

// 创建axios实例
const settingsApi = axios.create({
  baseURL: `${API_BASE_URL}/settings/`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器添加token
settingsApi.interceptors.request.use((config) => {
  const userStore = useUserStore()
  const token = userStore.token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器：错误提示
settingsApi.interceptors.response.use(
  (response) => response,
  (error) => {
    // 可以自定义错误对象内容
    const customError = new Error(error.response?.data?.error || '操作失败，请重试')
    customError.response = error.response
    return Promise.reject(customError)
  },
)

/*******************************************************************************************
 * 仓库管理接口
 *****************************************************************************************/
// 通用数据获取API
export const getWarehouses = (params) => settingsApi.get('warehouses/', { params })
export const getWarehouseOptions = (params) =>
  settingsApi.get(`warehouses/warehouse-options/`, { params })
export const exportWarehouseData = () =>
  settingsApi.get('warehouses/export-data/', {
    headers: {
      'Content-Type': undefined,
    },
    responseType: 'blob', // 关键：处理二进制文件
  })

export const deleteWarehouse = (warehouseId) => settingsApi.delete(`warehouses/${warehouseId}/`)
export const createWarehouse = (data) => settingsApi.post('warehouses/', data)
export const updateWarehouse = (warehouseId, data) =>
  settingsApi.patch(`warehouses/${warehouseId}/`, data)

export const downloadWarehouseTemplate = (templateType) =>
  settingsApi.get('warehouses/download-template/', {
    params: { template_type: templateType },
    headers: {
      'Content-Type': undefined,
    },
    responseType: 'blob', // 关键：处理二进制文件
  })
export const importWarehouseData = (formData) =>
  settingsApi.post('warehouses/import-data/', formData, {
    headers: {
      'Content-Type': undefined,
    },
  })

/*******************************************************************************************
 * 库位管理接口
 *****************************************************************************************/
export const getLocations = (params) => settingsApi.get('locations/', { params })
export const getLocationOptions = (params) =>
  settingsApi.get(`locations/location-options/`, { params })
export const createLocation = (data) => settingsApi.post('locations/', data)
export const updateLocation = (locationId, data) =>
  settingsApi.patch(`locations/${locationId}/`, data)

export const updateLocationStatus = (locationId, data) =>
  settingsApi.patch(`locations/${locationId}/status/`, data)

export const deleteLocation = (locationId) => settingsApi.delete(`locations/${locationId}/`)
export const getLocation = (locationId) => settingsApi.get(`locations/${locationId}/`)
export const exportLocations = () =>
  settingsApi.get('locations/export-data/', {
    headers: {
      'Content-Type': undefined,
    },
    responseType: 'blob', // 关键：处理二进制文件
  })

export const downloadLocationTemplate = (templateType) =>
  settingsApi.get('locations/download-template/', {
    params: { template_type: templateType },
    headers: {
      'Content-Type': undefined,
    },
    responseType: 'blob', // 关键：处理二进制文件
  })
export const importLocations = (formData) =>
  settingsApi.post('locations/import-data/', formData, {
    headers: {
      'Content-Type': undefined,
    },
  })
export const getOccupiedLocations = (warehouseId) =>
  settingsApi.get(`locations/?warehouse=${warehouseId}`)

/******************************************************************************************
 * 供应商管理接口
 *****************************************************************************************/
export const getSuppliers = (params) => settingsApi.get('suppliers/', { params })
export const getSupplierOptions = (params) => settingsApi.get(`suppliers/supplier_options/`, params)
export const deleteSupplier = (supplierId) => settingsApi.delete(`suppliers/${supplierId}/`)
export const downloadSuppliers = () =>
  settingsApi.get('suppliers/export-data/', {
    headers: {
      'Content-Type': undefined,
    },
    responseType: 'blob', // 关键：处理二进制文件
  })
export const createSupplier = (data) => settingsApi.post('suppliers/', data)
export const updateSupplier = (supplierId, data) =>
  settingsApi.patch(`suppliers/${supplierId}/`, data)
export const downloadSupplierTemplate = (templateType) =>
  settingsApi.get('suppliers/download-template/', {
    params: { template_type: templateType },
    headers: {
      'Content-Type': undefined,
    },
    responseType: 'blob', // 关键：处理二进制文件
  })
export const importSupplier = (formData) =>
  settingsApi.post('suppliers/import-data/', formData, {
    headers: {
      'Content-Type': undefined,
    },
  })

// 供应商详情
export function getSupplierDetail(id) {
  return settingsApi.get(`suppliers/${id}/detail/`)
}

// 供应商业务记录
export function getSupplierBusinessRecords(id) {
  return settingsApi.get(`suppliers/${id}/business-records/`)
}

// 供应商联系记录
export function getSupplierContactRecords(id) {
  return settingsApi.get(`suppliers/${id}/contact-records/`)
}

// 供应商日志
export function getSupplierLogs(id) {
  return settingsApi.get(`suppliers/${id}/logs/`)
}

/******************************************************************************************
 * 客户管理接口（优化请求头和配置）
 *****************************************************************************************/
export const getCustomers = (params) => settingsApi.get('customers/', { params })
export const getCustomerOptions = (params) =>
  settingsApi.get(`customers/customer-options/`, { params })
export const deleteCustomer = (customerId) => settingsApi.delete(`customers/${customerId}/`)

// 优化导出接口（修复Content-Type，增加状态码校验）
export const downloadCustomers = (filterActive = true) =>
  settingsApi.get('customers/export-data/', {
    params: { filter_active: filterActive }, // 传递筛选参数
    headers: {
      Accept: '*/*', // 允许所有类型，后端根据请求处理
    },
    responseType: 'blob',
    validateStatus: (status) => status >= 200 && status < 600, // 兼容错误状态码
  })

export const createCustomer = (data) => settingsApi.post('customers/', data)
export const updateCustomer = (customerId, data) =>
  settingsApi.patch(`customers/${customerId}/`, data)

// 优化模板下载接口（移除无效Content-Type，增加配置）
export const downloadCustomerTemplate = (templateType) =>
  settingsApi.get('customers/download-template/', {
    params: { template_type: templateType },
    headers: {
      Accept: '*/*', // 允许所有类型，后端根据请求处理
    },
    responseType: 'blob',
    validateStatus: (status) => status >= 200 && status < 600,
  })

// 优化导入接口（明确Content-Type）
export const importCustomers = (formData) => {
  return settingsApi.post('customers/import-data/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}
// 客户详情
export function getCustomerDetail(id) {
  return settingsApi.get(`customers/${id}/detail/`)
}

// 业务记录
export function getCustomerBusinessRecords(id) {
  return settingsApi.get(`customers/${id}/business-records/`)
}

// 联系记录
export function getCustomerContactRecords(id) {
  return settingsApi.get(`customers/${id}/contact-records/`)
}

// 日志
export function getCustomerLogRecords(id) {
  return settingsApi.get(`customers/${id}/logs/`)
}
/******************************************************************************************
 *系统设置管理接口
 *****************************************************************************************/
export const getSystemSettings = () => settingsApi.get('system-settings/')
export const updateSystemSetting = (settingId, data) =>
  settingsApi.patch(`system-settings/${settingId}/`, data)
export const updateSystemSettings = (data) => settingsApi.patch('system-settings/', data)
export const getSystemSettingsByKey = (key) => settingsApi.get(`system-settings/${key}/`)
export const createSystemSetting = (data) => settingsApi.post('system-settings/', data)
export const updateSystemSettingsByKey = (key, data) =>
  settingsApi.patch(`system-settings/${key}/`, data)
export const getSystemSettingsByKeys = (keys) =>
  settingsApi.post('system-settings/batch/', { keys })
export const updateSystemSettingsByKeys = (keys, data) =>
  settingsApi.patch('system-settings/batch/', { keys, data })
export const batchUpdateSystemSettings = (keys, data) =>
  settingsApi.patch('system-settings/batch/', { keys, data })
export const restoreDefaultSettings = () => settingsApi.post('system-settings/restore-defaults/')
export default settingsApi
