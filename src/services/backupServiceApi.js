import axios from 'axios'
import { useUserStore } from 'src/stores/userStore'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

// 创建 axios 实例
const backupApi = axios.create({
  baseURL: `${API_BASE_URL}/db-backup/`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ==========================
// 请求拦截器：统一注入 Token
// ==========================
backupApi.interceptors.request.use((config) => {
  const userStore = useUserStore()
  if (userStore.token) {
    config.headers.Authorization = `Bearer ${userStore.token}`
  }
  return config
})

// ==========================
// 响应拦截器：统一错误处理
// ==========================
// 响应拦截器：⚠️ 关键：blob 请求不处理，直接返回
backupApi.interceptors.response.use(
  (response) => {
    // 如果是 blob 下载，直接返回，不做任何处理
    if (response.config.responseType === 'blob') {
      return response
    }
    return response
  },
  (error) => {
    // 下载类错误也封装成标准错误
    const msg = error.response?.data?.error || '操作失败'
    return Promise.reject(new Error(msg))
  },
)

// ==============================================
// 备份接口（全部自动带 Token，无需手动加 headers）
// ==============================================
// 1. 创建备份
export const createDbBackup = () => backupApi.post('create_backup/')

// 2. 恢复
export const restoreDbBackup = (recordId) => backupApi.post(`${recordId}/restore/`)

// 3. 获取列表
export const getDbBackupList = () => backupApi.get()

// 4. ⚠️ 下载（核心修复：单独封装，确保 responseType=blob）
// 下载：⚠️ 关键优化：使用 fetch 替代 axios 下载，彻底消灭报错
export const downloadDbBackup = async (recordId) => {
  const userStore = useUserStore()
  const token = userStore.token

  const response = await fetch(`${API_BASE_URL}/db-backup/${recordId}/download/`, {
    method: 'GET',
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    },
  })

  if (!response.ok) throw new Error('下载失败')

  const blob = await response.blob()
  const filename =
    response.headers.get('content-disposition')?.match(/filename=(?:"([^"]+)"|([^;\n]+))/)?.[1] ||
    'backup.tar.gz'

  return { blob, filename }
}

// 5. 删除
export const deleteDbBackup = (recordId) => backupApi.delete(`${recordId}/delete_backup_file/`)

export default backupApi
