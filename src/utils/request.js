import axios from 'axios'
import { useUserStore } from 'src/stores/userStore'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

// 创建带认证的axios实例（Token从本地存储获取）
const recorderRequest = axios.create({
  baseURL: `${API_BASE_URL}/recorders`,
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('access_token')}`,
  },
})
console.log('API_BASE_URL:', API_BASE_URL)
// 请求拦截器：刷新Token（如果使用JWT）
recorderRequest.interceptors.request.use(
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
recorderRequest.interceptors.response.use(
  (response) => response,
  (error) => {
    // 如果是 blob 文件下载，直接 reject，不解析错误信息
    if (error.config.responseType === 'blob') {
      return Promise.reject(new Error('下载失败'))
    }

    const msg = error.response?.data?.error || '操作失败，请重试'
    const customError = new Error(msg)
    customError.response = error.response
    return Promise.reject(customError)
  },
)

export default recorderRequest
