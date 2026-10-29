import { defineStore } from 'pinia'
import axios from 'axios'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    userInfo: null,
    permissions: [],
    menu: [],
  }),
  actions: {
    setToken(token) {
      this.token = token
      localStorage.setItem('token', token)
    },
    async getUserInfo() {
      const res = await axios.get('/api/user/info')
      this.userInfo = res.data.user
      this.permissions = res.data.permissions
    },
    async getUserMenu() {
      const res = await axios.get('/api/user/menu')
      this.menu = res.data
    },
    logout() {
      this.token = ''
      this.userInfo = null
      this.permissions = []
      localStorage.removeItem('token')
    },
  },
})
