import axios from 'axios'
import { useUserStore } from 'src/stores/userStore'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

// 创建 axios 实例
const reportApi = axios.create({
  baseURL: `${API_BASE_URL}/reports/`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器：自动从 userStore 拿 token
reportApi.interceptors.request.use((config) => {
  const userStore = useUserStore()
  const token = userStore.token

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器
reportApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const msg = error.response?.data?.error || '操作失败'
    const err = new Error(msg)
    err.response = error.response
    return Promise.reject(err)
  },
)

// ==================== 报表接口 ====================

// 获取报表历史
export const fetchReportHistory = (params) => reportApi.get('', { params })

// 生成报表
export const generateReport = (params) => reportApi.post('generate/', params)

// 下载报表
export const downloadReport = (id) =>
  reportApi.get(`${id}/download/`, { responseType: 'blob', observe: 'response' })

// 删除报表
export const deleteReport = (id) => reportApi.post(`${id}/delete_report/`)

export default reportApi
