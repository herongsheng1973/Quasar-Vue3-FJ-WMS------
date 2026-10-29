import axios from 'axios'
import { useUserStore } from 'src/stores/userStore'
// API基础路径
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

// 创建axios实例
const api = axios.create({
  baseURL: `${API_BASE_URL}/sys-logs/`,
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
// 日志相关API
export const getLogList = (params) => api.get('list/', { params })
export const getLogDetail = (id) => api.get(`list/${id}/`)
export const clearLogs = () => api.post('clean/')
export const exportLogs = (params) => api.get('export/', { params, responseType: 'blob' })
