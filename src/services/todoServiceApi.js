import axios from 'axios'
import { useUserStore } from 'src/stores/userStore'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

// 创建 Axios 实例
const todoApi = axios.create({
  baseURL: `${API_BASE_URL}/todos/`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器：自动注入 Token
todoApi.interceptors.request.use((config) => {
  const userStore = useUserStore()
  const token = userStore.token

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截
todoApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const msg = error.response?.data?.detail || error.message || '操作失败'
    return Promise.reject(new Error(msg))
  },
)

// ==================== 任务 API ====================
export const fetchTasks = () => todoApi.get('tasks/')

export const createTask = (data) => todoApi.post('tasks/', data)

export const updateTask = (id, data) => todoApi.put(`tasks/${id}/`, data)

export const deleteTask = (id) => todoApi.delete(`tasks/${id}/`)

export default todoApi
