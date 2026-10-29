import axios from 'axios'
import { useUserStore } from 'src/stores/userStore'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
// 创建 axios 实例
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false, // 允许携带cookie（session登录必须）
  headers: {
    Accept: 'application/json',
  },
})
// =========================================
// 请求拦截器：自动携带 Token
// =========================================
api.interceptors.request.use(
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

// =========================================
// 响应拦截器：401 自动登出
// =========================================
api.interceptors.response.use(
  (response) => {
    // 如果是导出 blob / 跳过拦截器 → 直接返回原始响应
    if (response.config.skipInterceptor || response.config.responseType === 'blob') {
      return response
    }

    // ✅ 必须加这一行：正常接口返回 response
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      const userStore = useUserStore()
      userStore.logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)
// 工作日志接口服务
const workLogApi = {
  // ==================== 核心：获取时间线数据 ====================
  getTimeline(params) {
    return api.get('/logs/timeline/', { params })
  },

  // ==================== 新增日志 ====================
  createLog(formData) {
    return api.post('/logs/', formData)
  },

  // ==================== 修改日志 ====================
  updateLog(id, formData) {
    return api.put(`/logs/${id}/`, formData)
  },

  // ==================== 删除日志 ====================
  deleteLog(id) {
    return api.delete(`/logs/${id}/`)
  },

  // ==================== 获取单条日志详情（可选） ====================
  getLogDetail(id) {
    return api.get(`/logs/${id}/`)
  },
}

export default workLogApi
