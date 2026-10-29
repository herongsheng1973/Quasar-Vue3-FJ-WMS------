import { defineBoot } from '#q-app/wrappers'
import axios from 'axios'
import { Loading, LocalStorage, Notify, QSpinner } from 'quasar'
// Be careful when using SSR for cross-request state pollution
// due to creating a Singleton instance here;
// If any client changes this (global) instance, it might be a
// good idea to move this instance creation inside of the
// "export default () => {}" function below (which runs individually
// for each client)
const service = axios.create({ baseURL: 'http://localhost:8000' })

export default defineBoot(({ app }) => {
  // for use inside Vue files (Options API) through this.$axios and this.$api

  app.config.globalProperties.$axios = axios
  // ^ ^ ^ this will allow you to use this.$axios (for Vue Options API form)
  //       so you won't necessarily have to import axios in each vue file

  app.config.globalProperties.$api = service
  // ^ ^ ^ this will allow you to use this.$api (for Vue Options API form)
  //       so you can easily perform requests against your app's API
})

// 显示加载动画的函数
const showLoading = () => {
  Loading.show({
    message: '加载中...',
    spinner: QSpinner,
    spinnerColor: 'white',
    backgroundColor: 'primary',
    spinnerSize: 50,
    messageColor: 'white',
    messageStyle: 'font-size: 16px; font-weight: bold;',
    delay: 0,
    cssClass: 'custom-loading',
  })
}
// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 只有当配置中没有disableLoading选项时才显示加载动画
    if (!config.disableLoading) {
      showLoading()
    }

    // 获取token并添加到请求头
    const token = LocalStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      // config.headers.operator = LocalStorage.getItem('user_id')
    }

    return config
  },
  (error) => {
    // 错误处理
    Loading.hide()
    Notify.create({
      message: '请求发送失败',
      color: 'negative',
      icon: 'error',
    })
    return Promise.reject(error)
  },
)

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    // 隐藏加载动画
    Loading.hide()

    // 如果是二进制流，直接返回
    if (response.request?.responseType === 'blob') {
      return response
    }

    // 处理成功响应
    if (response.status >= 200 && response.status < 300) {
      // 只对特定状态码显示通知
      if (response.status === 201 || response.status === 204) {
        Notify.create({
          message: response.data.message || (response.status === 201 ? '创建成功' : '操作成功'),
          type: 'positive',
          icon: 'check',
          position: 'top',
          timeout: 2000,
        })
      }
      return response.data
    }

    // 处理其他状态码
    return handleErrorResponse(response)
  },
  (error) => {
    // 隐藏加载动画
    Loading.hide()

    // 处理HTTP错误
    console.error('响应错误:', error)

    const { response } = error

    if (response) {
      // 已知HTTP状态码错误
      return handleErrorResponse(response)
    } else {
      // 网络错误或其他未知错误
      Notify.create({
        message: '网络连接失败，请检查网络设置',
        type: 'negative',
      })
      return Promise.reject(error)
    }
  },
)

// 统一处理错误响应
const handleErrorResponse = (response) => {
  const { status, data } = response

  switch (status) {
    case 400:
      Notify.create({
        message: data.message || '错误的请求参数',
        type: 'negative',
      })
      break
    case 401:
      Notify.create({
        message: '认证失败，请重新登录',
        type: 'negative',
      })
      // 清除本地存储
      LocalStorage.clear()
      // 跳转到登录页
      window.location.href = '/login'
      break
    case 403:
      Notify.create({
        message: '禁止访问，没有权限',
        type: 'negative',
      })
      break
    case 404:
      Notify.create({
        message: '请求的资源不存在',
        type: 'negative',
      })
      break
    case 500:
      Notify.create({
        message: '服务器内部错误',
        type: 'negative',
      })
      break
    default:
      Notify.create({
        message: data.message || `HTTP错误 ${status}`,
        type: 'negative',
      })
  }

  return Promise.reject(new Error(data.message || `HTTP错误 ${status}`))
}
// 常用请求方法封装
const http = {
  /**
   * GET请求
   * @param {string} url - 请求URL
   * @param {object} params - 请求参数
   * @param {object} config - 请求配置
   */
  get(url, params = {}, config = {}) {
    return service.get(url, { params, ...config })
  },

  /**
   * POST请求
   * @param {string} url - 请求URL
   * @param {object} data - 请求数据
   * @param {object} config - 请求配置
   */
  post(url, data = {}, config = {}) {
    return service.post(url, data, config)
  },

  /**
   * PUT请求
   * @param {string} url - 请求URL
   * @param {object} data - 请求数据
   * @param {object} config - 请求配置
   */
  put(url, data = {}, config = {}) {
    return service.put(url, data, config)
  },

  /**
   * DELETE请求
   * @param {string} url - 请求URL
   * @param {object} params - 请求参数
   * @param {object} config - 请求配置
   */
  delete(url, params = {}, config = {}) {
    return service.delete(url, { params, ...config })
  },

  /**
   * 上传文件
   * @param {string} url - 请求URL
   * @param {object} file - 文件对象
   * @param {object} config - 请求配置
   */
  upload(url, file, config = {}) {
    const formData = new FormData()
    formData.append('file', file)

    return service.post(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      ...config,
    })
  },

  /**
   * 下载文件
   * @param {string} url - 请求URL
   * @param {object} params - 请求参数
   * @param {object} config - 请求配置
   */
  async download(url, params = {}, config = {}) {
    try {
      // 禁用默认的加载动画，使用自定义的
      const response = await service.get(url, {
        params,
        ...config,
        responseType: 'blob',
        disableLoading: true,
      })

      // 显示自定义下载进度
      showLoading()

      const blob = response.data
      const disposition = response.headers['content-disposition']
      let filename = 'downloaded_file.pdf'

      if (disposition) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
        const matches = filenameRegex.exec(disposition)
        if (matches && matches[1]) {
          filename = decodeURIComponent(matches[1].replace(/['"]/g, ''))
        }
      }

      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(link.href)

      // 下载完成后隐藏加载动画
      Loading.hide()

      Notify.create({
        message: `文件 ${filename} 下载成功`,
        type: 'positive',
      })
    } catch (error) {
      Loading.hide()
      throw error
    }
  },
}

// 导出axios实例供非组件使用
export { http }
