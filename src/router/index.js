import {
  createRouter,
  createMemoryHistory,
  createWebHistory,
  createWebHashHistory,
} from 'vue-router'
import routes from './routes'
import { route } from 'quasar/wrappers'
import { jwtDecode } from 'jwt-decode'
import { useUserStore } from 'src/stores/userStore'

export default route(function () {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(process.env.VUE_ROUTER_BASE),
  })

  // 判断 token 是否过期
  function isTokenExpired(token) {
    if (!token) return true
    try {
      const decoded = jwtDecode(token)
      return decoded.exp * 1000 < Date.now()
    } catch {
      return true
    }
  }

  Router.beforeEach(async (to, from, next) => {
    const store = useUserStore()
    const token = store.token
    const menu = store.menu
    const userInfo = store.userInfo

    // 1. 无 token
    if (!token) {
      if (to.path === '/login') return next()
      return next('/login')
    }

    // 2. token 过期
    if (isTokenExpired(token)) {
      store.logout()
      return next('/login')
    }

    if (to.path === '/login') {
      return next()
    }

    // ✅ 正确：判断数组长度是否为 0
    if (menu.length === 0) {
      await store.getUserMenu()
    }

    // ✅ 获取用户信息
    if (!userInfo) {
      try {
        await store.getUserInfo()
      } catch {
        store.logout()
        return next('/login')
      }
    }

    // 管理员判断
    if (to.meta.requiresAdmin) {
      if (store.userInfo.role_code !== 'admin') {
        return next('/')
      }
    }

    next()
  })

  return Router
})
