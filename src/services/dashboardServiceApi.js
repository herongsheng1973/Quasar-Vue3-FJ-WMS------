import { authAxios } from 'src/services/authApi'

export const getDashboard = (params) => authAxios.get('/api/dashboard/', { params })

// 获取WMS数据看板
export function getWmsDashboard() {
  return authAxios.get('/api/dashboard/wms/')
}
