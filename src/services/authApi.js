import axios from 'axios'
import { useUserStore } from 'src/stores/userStore'

/**
 * 接口服务统一出口
 * 功能分类：
 * 1. Axios 实例配置 + 拦截器
 * 2. 认证相关（登录、注册、登出、清除缓存）
 * 3. 用户信息相关（获取、更新资料）
 * 4. 用户管理（管理员：增删改查）
 * 5. 头像相关
 * 6. 密码相关
 * 7. 权限与角色相关
 * 8. 菜单相关
 */

const API_BASE_URL = import.meta.env.VITE_APP_BASE_URL || '/api'

// =========================================
// 1. 创建 Axios 实例
// =========================================
const authAxios = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
})

// =========================================
// 请求拦截器：自动携带 Token
// =========================================
authAxios.interceptors.request.use(
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
authAxios.interceptors.response.use(
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
// =========================================
// 2. 认证相关
// =========================================

/**
 * 登录
 * @param {string} username
 * @param {string} password
 * @returns {Promise}
 */
export const login = async (username, password) => {
  const userStore = useUserStore()
  try {
    const res = await authAxios.post('/api/accounts/login/', {
      username,
      password,
    })

    const { token, refresh, user, permissions } = res.data
    userStore.setToken(token)
    userStore.setRefreshToken(refresh)
    userStore.userInfo = user
    userStore.permissions = permissions

    return user
  } catch (error) {
    throw error.response?.data || error
  }
}

/**
 * 用户注册
 */
export const register = async (data) => {
  try {
    const res = await authAxios.post('/api/accounts/users/register/', data)
    return res.data
  } catch (error) {
    throw error.response?.data || error
  }
}

/**
 * 清除本地认证缓存
 */
export const clearAuthStorage = () => {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('user_info')
  localStorage.removeItem('is_authenticated')
  localStorage.removeItem('privateDocumentAccess')
}

// =========================================
// 3. 用户信息（个人中心）
// =========================================

/**
 * 获取当前登录用户信息
 */
export const getUserInfo = async () => {
  try {
    const res = await authAxios.get('/api/accounts/user/info/')
    return res.data
  } catch (error) {
    throw error.response?.data || error
  }
}

/**
 * 更新个人资料
 */
export const updateProfile = async (profileData) => {
  try {
    const res = await authAxios.put(`/api/accounts/user/profile/`, profileData)
    const updatedUser = res.data

    const userStore = useUserStore()
    userStore.updateUserInfo(updatedUser)
    localStorage.setItem('user_info', JSON.stringify(updatedUser))

    return updatedUser
  } catch (error) {
    throw error.response?.data || error
  }
}

// =========================================
// 4. 头像管理
// =========================================

/**
 * 上传头像
 */
export const updateAvatar = async (userId, file) => {
  try {
    const formData = new FormData()
    formData.append('avatar', file)

    const res = await authAxios.patch(`/api/accounts/users/${userId}/avatar/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    const userStore = useUserStore()
    userStore.updateUserInfo({
      ...userStore.userInfo,
      avatar: res.data.avatar,
    })

    return res.data
  } catch (error) {
    throw error.response?.data || error
  }
}

/**
 * 删除头像
 */
export const removeAvatar = async (userId) => {
  try {
    const res = await authAxios.delete(`/api/accounts/user/${userId}/delete_avatar/`)

    const userStore = useUserStore()
    userStore.updateUserInfo({
      ...userStore.userInfo,
      avatar: '',
    })

    return res.data
  } catch (error) {
    throw error.response?.data || error
  }
}

// =========================================
// 5. 密码管理
// =========================================

/**
 * 修改密码
 */
export const changePassword = async (formData) => {
  try {
    const res = await authAxios.post('/api/accounts/user/change_password/', formData)
    return res.data
  } catch (error) {
    throw error.response?.data || error
  }
}

/**
 * 管理员重置用户密码
 */
export const resetPassword = async (userId, newPassword, resetMode) => {
  try {
    const res = await authAxios.patch(`/api/accounts/users/${userId}/reset-password/`, {
      new_password: newPassword,
      reset_mode: resetMode,
    })
    return res.data
  } catch (error) {
    throw error.response?.data || error
  }
}

// =========================================
// 6. 管理员 - 用户管理
// =========================================

/**
 * 获取用户列表
 */
export const getUsers = async (params) => {
  try {
    const res = await authAxios.get('/api/accounts/users/', { params })
    return res.data
  } catch (error) {
    throw error.response?.data || error
  }
}

/**
 * 获取单个用户信息
 */
export const getUser = async (userId) => {
  try {
    const res = await authAxios.get(`/api/accounts/users/${userId}/`)
    return res.data
  } catch (error) {
    throw error.response?.data || error
  }
}

/**
 * 管理员创建用户
 */
export const createUser = async (userData) => {
  try {
    const res = await authAxios.post('/api/accounts/users/', userData)
    return res.data
  } catch (error) {
    throw error.response?.data || error
  }
}

/**
 * 更新用户信息
 */
export const updateUser = async (userId, userData) => {
  try {
    const res = await authAxios.patch(`/api/accounts/users/${userId}/`, userData)
    return res.data
  } catch (error) {
    throw error.response?.data || error
  }
}

/**
 * 启用用户
 */
export const enableUser = async (userId) => {
  try {
    const res = await authAxios.patch(`/api/accounts/users/${userId}/restore/`)
    return res.data
  } catch (error) {
    throw error.response?.data || error
  }
}

/**
 * 禁用用户
 */
export const disableUser = async (userId) => {
  try {
    const res = await authAxios.delete(`/api/accounts/users/${userId}/`)
    return res.data
  } catch (error) {
    throw error.response?.data || error
  }
}

// =========================================
// 7. 菜单
// =========================================

/**
 * 获取当前用户菜单
 */
export const getUserMenu = async () => {
  try {
    const res = await authAxios.get('/api/accounts/user/menu/')
    return res
  } catch (error) {
    throw error.response?.data || error
  }
}

export const fetchAllMenus = async () => {
  return await authAxios.get('/api/accounts/menus/')
}

export const createMenu = async (data) => {
  return await authAxios.post('/api/accounts/menus/', data)
}

export const updateMenu = async (id, data) => {
  return await authAxios.put(`/api/accounts/menus/${id}/`, data)
}

export const deleteMenu = async (id) => {
  return await authAxios.delete(`/api/accounts/menus/${id}/`)
}
// =========================================
// 8. 权限与角色
// =========================================

/**
 * 获取所有角色
 */
export const getRolesList = async () => {
  try {
    const res = await authAxios.get('/api/accounts/roles/')
    return res
  } catch (error) {
    throw error.response?.data || error
  }
}

/**
 * 获取所有权限
 */
export const fetchAllPermissions = async () => {
  try {
    const res = await authAxios.get('/api/accounts/permissions/')
    return res
  } catch (error) {
    throw error.response?.data || error
  }
}

/**
 * 获取用户权限
 */
export const fetchUserPermissions = async (userId) => {
  try {
    const res = await authAxios.get(`/api/accounts/users/${userId}/permissions/`)
    return res.data.results
  } catch (error) {
    throw error.response?.data || error
  }
}

/**
 * 获取角色权限
 */
export const fetchRolePermissions = async (roleId) => {
  try {
    const res = await authAxios.get('/api/accounts/permissions/', { params: { roleId } })
    return res.data
  } catch (error) {
    throw error.response?.data || error
  }
}

/**
 * 创建角色权限
 */
export const createRolePermissions = async (roleId, permission) => {
  try {
    const res = await authAxios.post(`/api/accounts/users/${roleId}/permission/`, permission)
    return res.data
  } catch (error) {
    throw error.response?.data || error
  }
}

/**
 * 更新角色权限
 */
export const updateRolePermissions = async (roleId, permission) => {
  try {
    const res = await authAxios.put(`/api/accounts/roles/${roleId}/permissions/`, permission)
    return res.data
  } catch (error) {
    throw error.response?.data || error
  }
}

/**
 * 删除角色权限
 */
export const deleteRolePermissions = async (roleId, permissionId) => {
  try {
    const res = await authAxios.delete(`/api/accounts/roles/${roleId}/permission/${permissionId}/`)
    return res.data
  } catch (error) {
    throw error.response?.data || error
  }
}
// 新增角色
export const createRole = (data) => authAxios.post('/api/accounts/roles/', data)

// 编辑角色
export const updateRole = (id, data) => authAxios.put(`/api/accounts/roles/${id}/`, data)
// =========================================
// 默认导出
// =========================================
export default {
  // 认证
  login,
  register,
  clearAuthStorage,

  // 用户信息
  getUserInfo,
  updateProfile,

  // 头像
  updateAvatar,
  removeAvatar,

  // 密码
  changePassword,
  resetPassword,

  // 用户管理
  getUser,
  getUsers,
  createUser,
  updateUser,
  enableUser,
  disableUser,

  // 菜单
  getUserMenu,

  // 权限
  fetchAllPermissions,
  fetchUserPermissions,
  fetchRolePermissions,
  createRolePermissions,
  updateRolePermissions,
  deleteRolePermissions,
}
export { authAxios }
