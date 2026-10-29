import axios from 'axios'
import { useUserStore } from 'src/stores/userStore'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

// 创建带认证的axios实例（Token从本地存储获取）
const mediaApi = axios.create({
  baseURL: `${API_BASE_URL}/media_app/`,
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('access_token')}`,
  },
})
console.log('API_BASE_URL:', API_BASE_URL)
// 请求拦截器：刷新Token（如果使用JWT）
mediaApi.interceptors.request.use(
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
mediaApi.interceptors.response.use(
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
  return await mediaApi.get('media_categories/')
}
// 方法 - 加载所有文档
export const getAllMusic = async () => {
  return await mediaApi.get('/musics/')
}
// 方法 - 加载单个文档
export const getMusic = async (id) => {
  return await mediaApi.get(`musics/${id}/`)
}
// 方法 - 加载所有视频
export const getAllVideos = async () => {
  return await mediaApi.get('videos/')
}
// 方法 - 加载单个视频
export const getVideo = async (id) => {
  return await mediaApi.get(`videos/${id}/`)
}
// 方法 - 创建分类
export const createCategory = async (formData) => {
  return await mediaApi.post('media_categories/', formData)
}

export const uploadMusic = async (formData) => {
  return await mediaApi.post('musics/', formData, {
    headers: { 'Content-Type': undefined }, // 关键：不手动设置，让浏览器自动处理
  })
}
export const uploadVideo = async (formData) => {
  return await mediaApi.post('videos/', formData, {
    headers: { 'Content-Type': undefined }, // 关键：不手动设置，让浏览器自动处理
  })
}
// 方法 - 更新文档
export const updateMusic = async (id, data) => {
  return await mediaApi.patch(`musics/${id}/`, data)
}
export const updateVideo = async (id, data) => {
  return await mediaApi.patch(`videos/${id}/`, data)
}
// 方法 - 删除分类
export const deleteCategory = async (id) => {
  return await mediaApi.delete(`media_categories/${id}/`)
}
// 方法 - 下载文档
export const downloadMusic = async (id) => {
  return await mediaApi.get(`musics/${id}/download/`, {
    responseType: 'blob', // 关键：指定响应类型为blob
  })
}
export const downloadVideo = async (id) => {
  return await mediaApi.get(`videos/${id}/download/`, {
    responseType: 'blob', // 关键：指定响应类型为blob
  })
}
// 方法 - 删除文档
export const deleteMusic = async (id) => {
  return await mediaApi.delete(`musics/${id}/`)
}
export const deleteVideo = async (id) => {
  return await mediaApi.delete(`videos/${id}/`)
}
// 方法 - 批量移动媒体
export const bulkMoveMedia = async (data) => {
  return await mediaApi.post('musics/bulk_move/', data)
}

export default {
  getCategories,
  getAllMusic,
  getMusic,
  createCategory,
  uploadMusic,
  downloadMusic,
  deleteMusic,
  updateMusic,
  deleteCategory,
  bulkMoveMedia,
  getAllVideos,
  getVideo,
  uploadVideo,
  downloadVideo,
  deleteVideo,
  updateVideo,
}
export { mediaApi }
