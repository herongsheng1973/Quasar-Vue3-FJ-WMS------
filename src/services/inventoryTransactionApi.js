import axios from 'axios'
import { useUserStore } from 'src/stores/userStore'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

// 创建带认证的axios实例（Token从本地存储获取）
const inventoryTransactionApi = axios.create({
  baseURL: `${API_BASE_URL}/inventory/inventory-transactions/`,
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('access_token')}`,
  },
})
console.log('API_BASE_URL:', API_BASE_URL)
// 请求拦截器：刷新Token（如果使用JWT）
inventoryTransactionApi.interceptors.request.use(
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

// 响应拦截器：错误提示
inventoryTransactionApi.interceptors.response.use(
  (response) => response,
  (error) => {
    // 只抛出错误，不直接调用 $q.notify
    // 可以自定义错误对象内容
    const customError = new Error(error.response?.data?.error || '操作失败，请重试')
    customError.response = error.response
    return Promise.reject(customError)
  },
)
// 10. 获取库存事务列表（支持分页、过滤、搜索、排序）
export const getInventoryTransactions = (params) => inventoryTransactionApi.get('', { params })
export const createInventoryTransaction = (data) => inventoryTransactionApi.post('', data)
export const updateInventoryTransaction = (id, data) => inventoryTransactionApi.put(`${id}/`, data)
export const patchInventoryTransaction = (id, data) => inventoryTransactionApi.patch(`${id}/`, data)
export const deleteInventoryTransaction = (id) => inventoryTransactionApi.delete(`${id}/`)
export const getInventoryTransaction = (id) => inventoryTransactionApi.get(`${id}/`)
export const importInventoryTransactions = (file) => inventoryTransactionApi.post('import', file)
export const adjustInventoryTransaction = (id, data) =>
  inventoryTransactionApi.put(`${id}/adjust/`, data)
export const uploadInventoryTransaction = (formData) =>
  inventoryTransactionApi.post('upload/', formData)
export const downloadInventoryTransaction = () =>
  inventoryTransactionApi.get('/download/', { responseType: 'blob' })

export const exportInventoryTransactions = (params) =>
  inventoryTransactionApi.get('export/', { ...params, responseType: 'blob' })
export default {
  getInventoryTransactions,
  createInventoryTransaction,
  updateInventoryTransaction,
  patchInventoryTransaction,
  deleteInventoryTransaction,
  getInventoryTransaction,
  importInventoryTransactions,
  adjustInventoryTransaction,
  uploadInventoryTransaction,
  downloadInventoryTransaction,
  exportInventoryTransactions,
}
