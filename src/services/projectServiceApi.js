import axios from 'axios'
import { useUserStore } from 'src/stores/userStore'
import { Notify } from 'quasar'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

// 创建 axios 实例
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器：自动携带 token
api.interceptors.request.use((config) => {
  const userStore = useUserStore()
  if (userStore.token) {
    config.headers.Authorization = `Bearer ${userStore.token}`
  }
  return config
})

// 响应拦截器：统一错误处理
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.message || err.response?.data?.error || '操作失败'
    Notify.create({ type: 'negative', message: msg })
    return Promise.reject(err)
  },
)

export const projectSettingApi = {
  list: (params) => api.get('/projects/project-settings/', { params }),
  create: (data) => api.post('/projects/project-settings/', data),
  update: (id, data) => api.put(`/projects/project-settings/${id}/`, data),
  delete: (id) => api.delete(`/projects/project-settings/${id}/`),
  export: () => api.get('/projects/project-settings/export/', { responseType: 'blob' }),
}

// ====================== 接收线汇总 ======================
export const receiverLineApi = {
  list: (params) => api.get('/projects/receiver-lines/', { params }),
  create: (data) => api.post('/projects/receiver-lines/', data),
  update: (id, data) => api.put(`/projects/receiver-lines/${id}/`, data),
  delete: (id) => api.delete(`/projects/receiver-lines/${id}/`),
  options: (params) => api.get('/projects/receiver-lines/options/', { params }),
  export: () => api.get('/projects/receiver-lines/export/', { responseType: 'blob' }),
}

// ====================== 检波点明细 + 收放线功能 ======================
export const receiverPointApi = {
  list: (params) => api.get('/projects/receiver-points/', { params }),
  create: (data) => api.post('/projects/receiver-points/', data),
  update: (id, data) => api.put(`/projects/receiver-points/${id}/`, data),
  delete: (id) => api.delete(`/projects/receiver-points/${id}/`),
  export: () => api.get('/projects/receiver-points/export/', { responseType: 'blob' }),

  // 原有：收放线日期导入
  layout: (formData) =>
    api.post('/projects/receiver-points/layout-pickup/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // 🔥 新增：收放线列表（管理页面用）
  getLayoutList: (params) => api.get('/projects/receiver-points/layout-list/', { params }),

  // 🔥 新增：按日期统计（曲线图）
  statsByDate: (params) => api.get('/projects/receiver-points/stats-by-date/', { params }),

  // 🔥 新增：按线号统计（柱状图）
  statsByLine: (params) => api.get('/projects/receiver-points/stats-by-line/', { params }),
}

// ====================== 激发线汇总 ======================
export const sourceLineApi = {
  list: (params) => api.get('/projects/source-lines/', { params }),
  create: (data) => api.post('/projects/source-lines/', data),
  update: (id, data) => api.put(`/projects/source-lines/${id}/`, data),
  delete: (id) => api.delete(`/projects/source-lines/${id}/`),
  export: () => api.get('/projects/source-lines/export/', { responseType: 'blob' }),
}

// ====================== 激发点明细 ======================
export const sourcePointApi = {
  list: (params) => api.get('/projects/source-points/', { params }),
  importExcel: (formData) =>
    api.post('/projects/source-points/import-excel/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  importSPSs: (formData) =>
    api.post('/projects/source-points/import-sps-s/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  projectProgress: (params) => api.get('/projects/source-points/project-progress/', { params }),
  statsByDate: (params) => api.get('/projects/source-points/stats-by-date/', { params }),
  statsByBlock: (params) => api.get('/projects/source-points/stats-by-block/', { params }),
  statsByLine: (params) => api.get('/projects/source-points/stats-by-line/', { params }),
  statsReshotByBlock: (params) =>
    api.get('/projects/source-points/stats-reshot-by-block/', { params }),
}
// ====================== 项目数据 Excel 导入 ======================
export const projectExcelApi = {
  import: (formData) =>
    api.post('/projects/imports/import-excel/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
}

export default api
