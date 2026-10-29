import { defineStore } from 'pinia'
import { getUserInfo, getUserMenu } from 'src/services/authApi'
import { Notify } from 'quasar'

export const useUserStore = defineStore('user', {
  state: () => ({
    // ✅ 刷新页面时从 localStorage 读取 token
    token: localStorage.getItem('token') || '',
    userInfo: null,
    permissions: [],
    menu: [],
    authError: null,
  }),

  getters: {
    isLoggedIn: (state) => !!state.token && !!state.userInfo,
    hasPermission: (state) => (permission) => state.permissions.includes(permission),
    isAdmin: (state) => state.userInfo?.role_code === 'admin',
    avatarUrl: (state) => {
      const baseURL = 'http://127.0.0.1:8000'
      if (!state.userInfo?.avatar) return ''
      return baseURL + state.userInfo.avatar
    },
  },

  actions: {
    // ✅ 初始化方法（页面加载时调用）
    async init() {
      const token = localStorage.getItem('token')
      if (token) {
        this.token = token
        try {
          await this.getUserInfo()
          if (this.menu.length === 0) {
            await this.getUserMenu()
          }
        } catch (err) {
          Notify.create({ message: '初始化用户信息失败' + err.message, type: 'negative' })
          this.logout()
        }
      }
    },

    setToken(token) {
      this.token = token
      localStorage.setItem('token', token)
    },

    setRefreshToken(refreshToken) {
      this.refreshToken = refreshToken
      localStorage.setItem('refresh_token', refreshToken)
    },

    updateUserInfo(userInfo) {
      this.userInfo = userInfo
      this.permissions = userInfo.permissions
    },

    async getUserInfo() {
      try {
        const res = await getUserInfo()
        this.userInfo = res.user
        this.permissions = res.permissions
      } catch (err) {
        Notify.create({ message: '获取用户信息失败', type: 'negative' })
        this.logout()
        throw err
      }
    },

    async getUserMenu() {
      try {
        const res = await getUserMenu()
        this.menu = res.data
      } catch (err) {
        Notify.create({ message: '获取菜单失败', type: 'negative' })
        throw err
      }
    },

    logout() {
      this.token = ''
      this.userInfo = null
      this.permissions = []
      this.menu = []
      localStorage.removeItem('token')
      localStorage.removeItem('refresh_token')
      Notify.create({ message: '已退出登录', type: 'info' })
    },
  },
})
