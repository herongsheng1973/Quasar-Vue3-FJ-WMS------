import axios from 'axios'
import { useUserStore } from 'src/stores/userStore'
// API基础路径
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

// 创建axios实例
const api = axios.create({
  baseURL: `${API_BASE_URL}/operations/`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器添加token
api.interceptors.request.use((config) => {
  const userStore = useUserStore()
  const token = userStore.token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
// 响应拦截器：错误提示
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 可以自定义错误对象内容
    const customError = new Error(error.response?.data?.error || '操作失败，请重试')
    customError.response = error.response
    return Promise.reject(customError)
  },
)
// 入库单相关API
export const getStockInOrders = (params) => api.get('stock-in/', { params })
export const getStockInOrderDetail = (id) => api.get(`stock-in/${id}/`)
export const createStockInOrder = (data) => api.post('stock-in/', data)
export const updateStockInOrder = (id, data) => api.put(`stock-in/${id}/`, data)
export const submitStockInOrder = (id) => api.post(`stock-in/${id}/submit/`)
export const approveStockInOrder = (id, approved = false, approval_notes = '通过入库单申请') =>
  api.post(`stock-in/${id}/approve/`, { approved, approval_notes })
export const rejectStockInOrder = (id, rejected = false, rejection_notes = '驳回入库单申请') =>
  api.post(`stock-in/${id}/reject/`, { rejected, rejection_notes })
export const completeStockInOrder = (id) => api.post(`stock-in/${id}/complete_and_generate_check/`)
export const cancelStockInOrder = (id) => api.post(`stock-in/${id}/cancel/`)
export const deleteStockInOrder = (id) => api.delete(`stock-in/${id}/`)
export const restoreStockInOrder = (id) => api.post(`stock-in/${id}/restore/`)
export const exportStockInOrder = (params) =>
  api.get('stock-in/export-data/', { params, responseType: 'blob' })

export const exportStockInTemplate = (templateType) =>
  api.get('stock-in/export-template/', {
    params: templateType ? { template_type: templateType } : {},
    responseType: 'blob',
  })
export const importStockInOrder = (formData) =>
  api.post('stock-in/import-data/', formData, {
    headers: {
      'Content-Type': 'undefined', // 让浏览器自动设置Content-Type和boundary
    },
  })
export const printStockInOrder = (id) =>
  api.get(`stock-in/${id}/print_pdf/`, { responseType: 'blob' })

// 出库单相关API
export const getStockOutOrders = (params) => api.get('stock-out/', { params })
export const getStockOutOrderDetail = (id) => api.get(`stock-out/${id}/`)
export const createStockOutOrder = (data) => api.post('stock-out/', data)
export const updateStockOutOrder = (id, data) => api.put(`stock-out/${id}/`, data)
export const submitStockOutOrder = (id) => api.post(`stock-out/${id}/submit/`)
export const approveStockOutOrder = (id, approved = false, approval_notes = '通过出库单申请') =>
  api.post(`stock-out/${id}/approve/`, { approved, approval_notes })
export const rejectStockOutOrder = (id, rejected = false, rejection_notes = '驳回出库单申请') =>
  api.post(`stock-out/${id}/reject/`, { rejected, rejection_notes })
export const completeStockOutOrder = (id) =>
  api.post(`stock-out/${id}/complete_and_generate_check/`)
export const cancelStockOutOrder = (id) => api.post(`stock-out/${id}/cancel/`)
export const deleteStockOutOrder = (id) => api.delete(`stock-out/${id}/`)
export const restoreStockOutOrder = (id) => api.post(`stock-out/${id}/restore/`)
export const exportStockOutOrder = (params) =>
  api.get('stock-out/export-data/', { params, responseType: 'blob' })

export const exportStockOutTemplate = () =>
  api.get('stock-out/export-template/', { responseType: 'blob' })
export const importStockOutOrder = (data) => api.post('stock-out/import-data/', data)
export const printStockOutOrder = (id) =>
  api.get(`stock-out/${id}/print_pdf/`, { responseType: 'blob' })

// 移库单相关API
export const getTransfers = (params) => api.get('transfers/', { params })
export const getTransferDetail = (id) => api.get(`transfers/${id}/`)
export const createTransfer = (data) => api.post('transfers/', data)
export const updateTransfer = (id, data) => api.put(`transfers/${id}/`, data)
export const completeTransfer = (id) => api.patch(`transfers/${id}/`, { status: 'completed' })
export const cancelTransfer = (id) => api.patch(`transfers/${id}/`, { status: 'cancelled' })

// 盘库单相关API
export const getAllChecks = (params) => api.get('stock-checks/', { params })
export const getCheckDetail = (id) => api.get(`stock-checks/${id}/`)
export const createCheck = (data) => api.post('stock-checks/', data)
export const createCheckbyInventoryId = (data) =>
  api.post('stock-checks/generate_by_inventory/', data)
export const updateCheck = (id, data) => api.put(`stock-checks/${id}/`, data)
export const completeCheck = (id, data) =>
  api.post(`stock-checks/${id}/complete/`, { ...data, status: 'completed' })
export const cancelCheck = (id) => api.patch(`stock-checks/${id}/`, { status: 'cancelled' })
// 调整库存记录
export const adjustInventoryRecord = (id, data) => {
  return api.post(`inventory-adjust/${id}/adjust_inventory/`, data)
}
// 移库单相关API
export const getStockTransfers = (params) => api.get('stock-transfer/', { params })
export const getStockTransferDetail = (id) => api.get(`stock-transfer/${id}/`)
export const createStockTransfer = (data) => api.post('stock-transfer/', data)
export const updateStockTransfer = (id, data) => api.put(`stock-transfer/${id}/`, data)
export const pendingStockTransfer = (id) => api.post(`stock-transfer/${id}/pending/`)
export const approveStockTransfer = (id, approved, approval_notes) =>
  api.post(`stock-transfer/${id}/approve/`, { approved, approval_notes })
export const completeStockTransfer = (id) => api.post(`stock-transfer/${id}/complete/`)
export const cancelStockTransfer = (id) => api.post(`stock-transfer/${id}/cancel/`)
export const exportStockTransfers = (params) =>
  api.post('stock-transfer/export/', params, { responseType: 'blob' })
