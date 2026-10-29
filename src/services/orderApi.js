import { authAxios } from './authApi'

// 获取订单列表
export const getOrderList = (params) => {
  return authAxios.get('/api/order/orders/', { params })
}

// 创建订单
export const createOrder = (data) => {
  return authAxios.post('/api/order/orders/', data)
}

// 修改订单
export const updateOrder = (id, data) => {
  return authAxios.put(`/api/order/orders/${id}/`, data)
}

// 删除订单
export const deleteOrder = (id) => {
  return authAxios.delete(`/api/order/orders/${id}/`)
}

// 导出订单

export const exportOrder = (params) => {
  return authAxios({
    url: '/api/order/orders/export/',
    method: 'post',
    data: params,
    responseType: 'blob',
    // 跳过拦截器解析（关键！避免报错）
    skipInterceptor: true,
  })
}
// 获取商品SKU（库房已有商品）
export const getSkuList = () => {
  return authAxios.get('/api/order/orders/sku_list/')
}
// 获取单个订单详情（含商品明细）
export const getOrderDetail = (id) => {
  return authAxios.get(`/api/order/orders/${id}/details/`)
}
