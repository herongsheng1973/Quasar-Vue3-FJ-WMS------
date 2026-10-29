import axios from 'axios'
import { useUserStore } from 'src/stores/userStore'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

// 创建带认证的axios实例（Token从本地存储获取）
const documentApi = axios.create({
  baseURL: `${API_BASE_URL}/docs/`,
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('access_token')}`,
  },
})
console.log('API_BASE_URL:', API_BASE_URL)
// 请求拦截器：刷新Token（如果使用JWT）
documentApi.interceptors.request.use(
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
documentApi.interceptors.response.use(
  (response) => response,
  (error) => {
    // 只抛出错误，不直接调用 $q.notify
    // 可以自定义错误对象内容
    const customError = new Error(error.response?.data?.error || '操作失败，请重试')
    customError.response = error.response
    return Promise.reject(customError)
  },
)
// 方法 - 加载所有分类
export const getCategories = async () => {
  return await documentApi.get('categories/')
}
// 方法 - 加载所有文档
export const getAllDocuments = async () => {
  return await documentApi.get('/documents/')
}
// 方法 - 加载单个文档
export const getDocument = async (id) => {
  return await documentApi.get(`documents/${id}/`)
}
// 方法 - 创建分类
export const createCategory = async (formData) => {
  return await documentApi.post('categories/', formData)
}

export const uploadDocument = async (formData) => {
  return await documentApi.post('documents/', formData, {
    headers: { 'Content-Type': undefined }, // 关键：不手动设置，让浏览器自动处理
  })
}
// 方法 - 更新文档
export const updateDocument = async (id, data) => {
  return await documentApi.patch(`documents/${id}/`, data)
}
export const deleteCategory = async (id) => {
  return await documentApi.delete(`categories/${id}/`)
}
// 方法 - 下载文档
export const downloadDocument = async (id) => {
  return await documentApi.get(`documents/${id}/download/`, {
    responseType: 'blob', // 关键：指定响应类型为blob
  })
}
// 方法 - 删除文档
export const deleteDocument = async (id) => {
  return await documentApi.delete(`documents/${id}/`)
}
// 下载前验证密码
export const verifyPasswordBeforeDownload = (data) =>
  documentApi.post('documents/verify-download/', data)

export default {
  getCategories,
  verifyPasswordBeforeDownload,
  getAllDocuments,
  getDocument,
  createCategory,
  uploadDocument,
  downloadDocument,
  deleteDocument,
  updateDocument,
  deleteCategory,
}
export { documentApi }
