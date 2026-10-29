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

// ====================== 设备总表 ======================
export const deviceTotalApi = {
  list: (params) => api.get('/cableshop/device-total/', { params }),
  create: (data) => api.post('/cableshop/device-total/', data),
  update: (id, data) => api.put(`/cableshop/device-total/${id}/`, data),
  delete: (id) => api.delete(`/cableshop/device-total/${id}/`),
  export: () => api.get('/cableshop/device-total/export/', { responseType: 'blob' }),
}

// ====================== 设备总表月度统计 ======================
export const monthlySummaryApi = {
  list: (params) => api.get('/cableshop/monthly-summary/', { params }),
  create: (data) => api.post('/cableshop/monthly-summary/', data),
  update: (id, data) => api.put(`/cableshop/monthly-summary/${id}/`, data),
  delete: (id) => api.delete(`/cableshop/monthly-summary/${id}/`),
  export: () => api.get('/cableshop/monthly-summary/export/', { responseType: 'blob' }),
}
// ====================== 设备丢失明细 ======================
export const equipmentLostDetailApi = {
  list: (params) => api.get('/cableshop/equipment-lost-detail/', { params }),
  create: (data) => api.post('/cableshop/equipment-lost-detail/', data),
  update: (id, data) => api.put(`/cableshop/equipment-lost-detail/${id}/`, data),
  delete: (id) => api.delete(`/cableshop/equipment-lost-detail/${id}/`),
  export: () => api.get('/cableshop/equipment-lost-detail/export/', { responseType: 'blob' }),
}

// ====================== 设备丢失月度统计 ======================
export const equipmentLostSummaryApi = {
  list: (params) => api.get('/cableshop/equipment-lost-summary/', { params }),
  export: () => api.get('/cableshop/equipment-lost-summary/export/', { responseType: 'blob' }),
}

// ====================== 丢失设备站号 ======================
export const lostEquipmentStationApi = {
  list: (params) => api.get('/cableshop/lost-equipment-station/', { params }),
  create: (data) => api.post('/cableshop/lost-equipment-station/', data),
  update: (id, data) => api.put(`/cableshop/lost-equipment-station/${id}/`, data),
  delete: (id) => api.delete(`/cableshop/lost-equipment-station/${id}/`),
  export: () => api.get('/cableshop/lost-equipment-station/export/', { responseType: 'blob' }),
}

// ====================== CableShop 生产管理 ======================
export const cableshopProductionApi = {
  list: (params) => api.get('/cableshop/cableshop-production/', { params }),
  create: (data) => api.post('/cableshop/cableshop-production/', data),
  update: (id, data) => api.put(`/cableshop/cableshop-production/${id}/`, data),
  delete: (id) => api.delete(`/cableshop/cableshop-production/${id}/`),
  export: () => api.get('/cableshop/cableshop-production/export/', { responseType: 'blob' }),
}

// ====================== 仓库出入库 ======================
export const warehouseInOutApi = {
  list: (params) => api.get('/cableshop/warehouse-in-out/', { params }),
  create: (data) => api.post('/cableshop/warehouse-in-out/', data),
  update: (id, data) => api.put(`/cableshop/warehouse-in-out/${id}/`, data),
  delete: (id) => api.delete(`/cableshop/warehouse-in-out/${id}/`),
  export: () => api.get('/cableshop/warehouse-in-out/export/', { responseType: 'blob' }),
}

// ====================== Excel 导入导出 ======================
export const excelApi = {
  import: (formData) =>
    api.post('/cableshop/excel/excel-import/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  export: () => api.get('/cableshop/excel/excel_export/', { responseType: 'blob' }),
}

export default api
