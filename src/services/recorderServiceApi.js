import recorderRequest from 'src/utils/request'

// 仪器
export function getRecorderList(params) {
  return recorderRequest.get('/recorders/', { params })
}
export function createRecorder(data) {
  return recorderRequest.post('/recorders/', data)
}
export function updateRecorder(id, data) {
  return recorderRequest.put(`/recorders/${id}/`, data)
}
export function deleteRecorder(id) {
  return recorderRequest.delete(`/recorders/${id}/`)
}
export function changeRecorderStatus(id, data) {
  return recorderRequest.put(`/recorders/${id}/change-status/`, data)
}
export function printRecorderPdf(ids) {
  return recorderRequest.get(`/recorders/print/?ids=${ids}`, {
    responseType: 'blob',
  })
}
export function getRecorderDetail(id) {
  return recorderRequest.get(`/recorders/${id}/`)
}
// 组件
export function getComponentList(params) {
  return recorderRequest.get('/components/', { params })
}
export function createComponent(data) {
  return recorderRequest.post('/components/', data)
}
export function updateComponent(id, data) {
  return recorderRequest.put(`/components/${id}/`, data)
}
export function deleteComponent(id) {
  return recorderRequest.delete(`/components/${id}/`)
}

export function getRecorderAccessoryList(params) {
  return recorderRequest.get('/accessories/', { params })
}
export function createRecorderAccessory(data) {
  return recorderRequest.post('/accessories/', data)
}
export function updateRecorderAccessory(id, data) {
  return recorderRequest.put(`/accessories/${id}/`, data)
}
export function deleteRecorderAccessory(id) {
  return recorderRequest.delete(`/accessories/${id}/`)
}
// 日志
export function getLogList(params) {
  return recorderRequest.get('/logs/', { params })
}
export function createLog(data) {
  return recorderRequest.post('/logs/', data)
}

// 密码验证
export function checkPassword(data) {
  return recorderRequest.post('/user/check-password/', data)
}
