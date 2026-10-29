import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'

const $q = useQuasar()
const $router = useRouter()

export function logout() {
  // 1. 清除本地存储的 token 和用户信息
  clearAuthData()

  // 2. 提示
  $q.notify({
    color: 'info',
    position: 'top',
    message: '已安全退出登录',
  })

  // 3. 跳转到登录页
  $router.replace({ path: '/login' })
}
// 存储密钥（保持和你登录一致）
const ACCESS_TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'
const USER_INFO_KEY = 'user_info'

// 清除所有认证信息
export function clearAuthData() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(USER_INFO_KEY)
}
export function setAuthData(accessToken, refreshToken, userInfo) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo))
}
// 获取 token
export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}
