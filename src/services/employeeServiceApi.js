import axios from 'axios'
import { useUserStore } from 'src/stores/userStore'
// API基础路径
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

// 创建axios实例
const api = axios.create({
  baseURL: `${API_BASE_URL}/employee/`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器添加token
api.interceptors.request.use((config) => {
  const userStore = useUserStore()
  const token = userStore.token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器：错误提示
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // 特别处理 blob 或 arraybuffer 类型响应的错误
    const respType = error.config?.responseType
    if (respType === 'blob' || respType === 'arraybuffer') {
      // 如果是 arraybuffer，把它转换为 Blob 以便读取错误信息
      if (error.response && error.response.data) {
        try {
          const data = error.response.data
          const blob =
            data instanceof Blob
              ? data
              : new Blob([data], {
                  type: error.response.headers?.['content-type'] || 'application/json',
                })
          if (error.response.status >= 400) {
            const errorMsg = await fileUtils.readErrorBlob(blob)
            return Promise.reject(new Error(errorMsg.detail || errorMsg.message || '文件下载失败'))
          }
        } catch (e) {
          return Promise.reject(new Error('请求失败: ' + e.message))
        }
      }
      // 兜底返回通用错误
      return Promise.reject(new Error('文件下载失败'))
    }

    // 普通错误处理（保持原逻辑）
    const customError = new Error(
      error.response?.data?.error || error.response?.data?.detail || '操作失败，请重试',
    )
    customError.response = error.response
    return Promise.reject(customError)
  },
)

// 带进度监控的文件下载函数
export const downloadFileWithProgress = (requestFn, onProgress) => {
  return requestFn({
    onDownloadProgress: (progressEvent) => {
      if (onProgress) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        onProgress(percentCompleted)
      }
    },
  })
}

// 带进度监控的文件上传函数
export const uploadFileWithProgress = (url, file, additionalData = {}, onProgress) => {
  const formData = new FormData()
  formData.append('file', file)

  Object.keys(additionalData).forEach((key) => {
    formData.append(key, additionalData[key])
  })

  return api.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        onProgress(percentCompleted)
      }
    },
  })
}

// 添加文件处理工具函数
export const fileUtils = {
  // 下载文件
  downloadBlob(blob, filename) {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  },

  // 读取错误 blob 内容
  readErrorBlob(blob) {
    return new Promise((resolve, reject) => {
      // 检查 blob 是否存在且有大小
      if (!blob || blob.size === 0) {
        reject(new Error('响应内容为空'))
        return
      }

      // 检查 blob 的类型
      if (blob.type && !blob.type.includes('application/json') && !blob.type.includes('text/')) {
        // 如果不是 JSON 或文本类型，直接 reject
        reject(new Error('响应格式不正确'))
        return
      }

      const reader = new FileReader()
      reader.onload = () => {
        try {
          // 检查读取结果
          if (!reader.result) {
            reject(new Error('无法读取响应内容'))
            return
          }

          const errorMsg = JSON.parse(reader.result)
          resolve(errorMsg)
        } catch (e) {
          reject(new Error('解析错误信息失败: ' + e.message))
        }
      }
      reader.onerror = () => {
        reject(new Error('读取响应内容失败'))
      }
      reader.readAsText(blob)
    })
  },
}
const exportData = async (url, params = {}) => {
  const resp = await api.get(url, {
    params,
    responseType: 'arraybuffer', // 改为 arraybuffer，避免 inspector 尝试读取 responseText 导致错误
  })

  const contentType = resp.headers['content-type'] || 'application/octet-stream'
  const blob = new Blob([resp.data], { type: contentType })
  return { data: blob, headers: resp.headers, status: resp.status }
}

// 通用导入函数
const importData = (url, file, additionalParams = {}) => {
  const formData = new FormData()
  formData.append('file', file)

  Object.keys(additionalParams).forEach((key) => {
    formData.append(key, additionalParams[key])
  })

  return api.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

// 通用模板下载函数
const downloadTemplate = async (url, params = {}) => {
  try {
    const resp = await api.get(url, {
      params,
      responseType: 'arraybuffer',
    })
    const contentType = resp.headers['content-type'] || 'application/octet-stream'
    const blob = new Blob([resp.data], { type: contentType })
    return { data: blob, headers: resp.headers, status: resp.status }
  } catch (error) {
    // 特别处理模板下载的错误（兼容 arraybuffer / blob）
    if (
      error.response &&
      (error.response.data instanceof Blob || error.response.data instanceof ArrayBuffer)
    ) {
      try {
        const errBlob =
          error.response.data instanceof ArrayBuffer
            ? new Blob([error.response.data], {
                type: error.response.headers?.['content-type'] || 'application/json',
              })
            : error.response.data

        const errMsg = await fileUtils.readErrorBlob(errBlob)
        throw new Error(errMsg.detail || errMsg.message || '模板下载失败')
      } catch (e) {
        throw new Error('模板下载失败: ' + e.message)
      }
    }
    throw error
  }
}
// Division API
export const getDivisions = (params) => {
  return api.get('divisions/', { params })
}

export const getDivisionDetail = (id) => {
  return api.get(`divisions/${id}/`)
}

export const getDivisionTree = () => {
  return api.get('divisions/tree/')
}

export const createDivision = (data) => {
  return api.post('divisions/', data)
}

export const updateDivision = (id, data) => {
  return api.put(`divisions/${id}/`, data)
}

export const patchDivision = (id, data) => {
  return api.patch(`divisions/${id}/`, data)
}

export const softDeleteDivision = (id) => {
  return api.post(`divisions/${id}/soft-delete/`)
}

export const deleteDivision = (id) => {
  return api.delete(`divisions/${id}/`)
}

export const getActiveDivisions = () => {
  return api.get('divisions/active-list/')
}

export const downloadDivisionTemplate = (params = {}) => {
  return downloadTemplate('divisions/download-template/', params)
}

export const importDivisions = (file, additionalParams = {}) => {
  return importData('divisions/import-data/', file, additionalParams)
}

export const exportDivisions = (params = {}) => {
  return exportData('divisions/export-data/', params)
}

// Department API
export const getDepartments = (params) => {
  return api.get('departments/', { params })
}

export const createDepartment = (data) => {
  return api.post('departments/', data)
}

export const getDepartmentDetail = (id) => {
  return api.get(`departments/${id}/`)
}

export const updateDepartment = (id, data) => {
  return api.put(`departments/${id}/`, data)
}

export const patchDepartment = (id, data) => {
  return api.patch(`departments/${id}/`, data)
}

export const deleteDepartment = (id) => {
  return api.delete(`departments/${id}/`)
}

export const getDepartmentTree = () => {
  return api.get('departments/tree/')
}

export const softDeleteDepartment = (id) => {
  return api.post(`departments/${id}/soft-delete/`)
}

export const getActiveDepartments = () => {
  return api.get('departments/active-list/')
}

export const downloadDepartmentTemplate = (params = {}) => {
  return downloadTemplate('departments/download-template/', params)
}

export const importDepartments = (file, additionalParams = {}) => {
  return importData('departments/import-data/', file, additionalParams)
}

export const exportDepartments = (params = {}) => {
  return exportData('departments/export-data/', params)
}

// Team API
export const getTeams = (params) => {
  return api.get('teams/', { params })
}

export const getActiveTeams = () => {
  return api.get('teams/active-list/')
}

export const createTeam = (data) => {
  return api.post('teams/', data)
}

export const getTeamDetail = (id) => {
  return api.get(`teams/${id}/`)
}

export const updateTeam = (id, data) => {
  return api.put(`teams/${id}/`, data)
}

export const patchTeam = (id, data) => {
  return api.patch(`teams/${id}/`, data)
}

export const deleteTeam = (id) => {
  return api.delete(`teams/${id}/`)
}

export const getTeamTree = () => {
  return api.get('teams/tree/')
}

export const softDeleteTeam = (id) => {
  return api.post(`teams/${id}/soft-delete/`)
}

export const downloadTeamTemplate = (params = {}) => {
  return downloadTemplate('teams/download-template/', params)
}

export const importTeams = (file, additionalParams = {}) => {
  return importData('teams/import-data/', file, additionalParams)
}

export const exportTeams = (params = {}) => {
  return exportData('teams/export-data/', params)
}

// Position API
export const getPositions = (params) => {
  return api.get('positions/', { params })
}

export const getActivePositions = () => {
  return api.get('positions/active-list/')
}

export const createPosition = (data) => {
  return api.post('positions/', data)
}

export const getPositionDetail = (id) => {
  return api.get(`positions/${id}/`)
}

export const updatePosition = (id, data) => {
  return api.put(`positions/${id}/`, data)
}

export const patchPosition = (id, data) => {
  return api.patch(`positions/${id}/`, data)
}

export const deletePosition = (id) => {
  return api.delete(`positions/${id}/`)
}

export const getPositionTree = () => {
  return api.get('positions/tree/')
}

export const softDeletePosition = (id) => {
  return api.post(`positions/${id}/soft-delete/`)
}

export const downloadPositionTemplate = (params = {}) => {
  return downloadTemplate('positions/download-template/', params)
}

export const importPositions = (file, additionalParams = {}) => {
  return importData('positions/import-data/', file, additionalParams)
}

export const exportPositions = (params = {}) => {
  return exportData('positions/export-data/', params)
}

// SalaryGrade API
export const getSalaryGrades = (params) => {
  return api.get('salary-grades/', { params })
}

export const getSalaryGradeDetail = (id) => {
  return api.get(`salary-grades/${id}/`)
}

export const createSalaryGrade = (data) => {
  return api.post('salary-grades/', data)
}

export const updateSalaryGrade = (id, data) => {
  return api.put(`salary-grades/${id}/`, data)
}

export const patchSalaryGrade = (id, data) => {
  return api.patch(`salary-grades/${id}/`, data)
}

export const deleteSalaryGrade = (id) => {
  return api.delete(`salary-grades/${id}/`)
}

export const softDeleteSalaryGrade = (id) => {
  return api.post(`salary-grades/${id}/soft-delete/`)
}

export const exportSalaryGrades = (params = {}) => {
  return exportData('salary-grades/export-data/', params)
}

export const importSalaryGrades = (file, additionalParams = {}) => {
  return importData('salary-grades/import-data/', file, additionalParams)
}

export const downloadSalaryGradeTemplate = (params = {}) => {
  return downloadTemplate('salary-grades/download-template/', params)
}

// City API
export const getCities = (params) => {
  return api.get('cities/', { params })
}

export const getCityDetail = (id) => {
  return api.get(`cities/${id}/`)
}

export const createCity = (data) => {
  return api.post('cities/', data)
}

export const updateCity = (id, data) => {
  return api.put(`cities/${id}/`, data)
}

export const patchCity = (id, data) => {
  return api.patch(`cities/${id}/`, data)
}

export const deleteCity = (id) => {
  return api.delete(`cities/${id}/`)
}

export const softDeleteCity = (id) => {
  return api.post(`cities/${id}/soft-delete/`)
}

export const exportCities = (params = {}) => {
  return exportData('cities/export-data/', params)
}

export const importCities = (file, additionalParams = {}) => {
  return importData('cities/import-data/', file, additionalParams)
}

export const downloadCityTemplate = (params = {}) => {
  return downloadTemplate('cities/download-template/', params)
}

// TravellingFee API
export const getTravellingFees = (params) => {
  return api.get('travelling-fees/', { params })
}

export const getTravellingFeeDetail = (id) => {
  return api.get(`travelling-fees/${id}/`)
}

export const createTravellingFee = (data) => {
  return api.post('travelling-fees/', data)
}

export const updateTravellingFee = (id, data) => {
  return api.put(`travelling-fees/${id}/`, data)
}

export const patchTravellingFee = (id, data) => {
  return api.patch(`travelling-fees/${id}/`, data)
}

export const deleteTravellingFee = (id) => {
  return api.delete(`travelling-fees/${id}/`)
}

export const softDeleteTravellingFee = (id) => {
  return api.post(`travelling-fees/${id}/soft-delete/`)
}

export const exportTravellingFees = (params = {}) => {
  return exportData('travelling-fees/export-data/', params)
}

export const importTravellingFees = (file, additionalParams = {}) => {
  return importData('travelling-fees/import-data/', file, additionalParams)
}

export const downloadTravellingFeeTemplate = (params = {}) => {
  return downloadTemplate('travelling-fees/download-template/', params)
}

// PositionChanges API
export const getPositionHistories = (params) => {
  return api.get('position-histories/', { params })
}

export const getPositionHistoryDetail = (id) => {
  return api.get(`position-histories/${id}/`)
}

export const createPositionHistory = (data) => {
  return api.post('position-histories/', data)
}

export const updatePositionHistory = (id, data) => {
  return api.put(`position-histories/${id}/`, data)
}

export const patchPositionHistory = (id, data) => {
  return api.patch(`position-histories/${id}/`, data)
}

export const deletePositionHistory = (id) => {
  return api.delete(`position-histories/${id}/`)
}

export const softDeletePositionHistory = (id) => {
  return api.post(`position-histories/${id}/soft-delete/`)
}

export const exportPositionHistories = (params = {}) => {
  return exportData('position-histories/export-data/', params)
}

export const importPositionHistories = (file, additionalParams = {}) => {
  return importData('position-histories/import-data/', file, additionalParams)
}

export const downloadPositionHistoryTemplate = (params = {}) => {
  return downloadTemplate('position-histories/download-template/', params)
}

// Employee API
export const getEmployees = (params) => {
  return api.get('employees/', { params })
}

export const getEmployeeDetail = (id) => {
  return api.get(`employees/${id}/`)
}

export const createEmployee = (data) => {
  return api.post('employees/', data)
}

export const updateEmployee = (id, data) => {
  return api.put(`employees/${id}/`, data)
}

export const patchEmployee = (id, data) => {
  return api.patch(`employees/${id}/`, data)
}

export const deleteEmployee = (id) => {
  return api.delete(`employees/${id}/`)
}

export const softDeleteEmployee = (id) => {
  return api.post(`employees/${id}/soft-delete/`)
}

export const exportEmployees = (params = {}) => {
  return exportData('employees/export-data/', params)
}

export const importEmployees = (file, additionalParams = {}) => {
  return importData('employees/import-data/', file, additionalParams)
}

export const downloadEmployeeTemplate = (params = {}) => {
  return downloadTemplate('employees/download-template/', params)
}

// SalaryHistory API
export const getSalaryHistories = (params) => {
  return api.get('salary-histories/', { params })
}

export const getSalaryHistoryDetail = (id) => {
  return api.get(`salary-histories/${id}/`)
}

export const createSalaryHistory = (data) => {
  return api.post('salary-histories/', data)
}

export const updateSalaryHistory = (id, data) => {
  return api.put(`salary-histories/${id}/`, data)
}

export const patchSalaryHistory = (id, data) => {
  return api.patch(`salary-histories/${id}/`, data)
}

export const deleteSalaryHistory = (id) => {
  return api.delete(`salary-histories/${id}/`)
}

export const softDeleteSalaryHistory = (id) => {
  return api.post(`salary-histories/${id}/soft-delete/`)
}

export const exportSalaryHistories = (params = {}) => {
  return exportData('salary-histories/export-data/', params)
}

export const importSalaryHistories = (file, additionalParams = {}) => {
  return importData('salary-histories/import-data/', file, additionalParams)
}

export const downloadSalaryHistoryTemplate = (params = {}) => {
  return downloadTemplate('salary-histories/download-template/', params)
}

// Attendance API
export const getAttendances = (params) => {
  return api.get('attendances/', { params })
}

export const getAttendanceDetail = (id) => {
  return api.get(`attendances/${id}/`)
}

export const createAttendance = (data) => {
  return api.post('attendances/', data)
}

export const updateAttendance = (id, data) => {
  return api.put(`attendances/${id}/`, data)
}

export const patchAttendance = (id, data) => {
  return api.patch(`attendances/${id}/`, data)
}

export const deleteAttendance = (id) => {
  return api.delete(`attendances/${id}/`)
}

export const softDeleteAttendance = (id) => {
  return api.post(`attendances/${id}/soft-delete/`)
}

export const exportAttendances = (params = {}) => {
  return exportData('attendances/export-data/', params)
}

export const importAttendances = (file, additionalParams = {}) => {
  return importData('attendances/import-data/', file, additionalParams)
}

export const downloadAttendanceTemplate = (params = {}) => {
  return downloadTemplate('attendances/download-template/', params)
}

// MonthlyAttendance API
export const getMonthlyAttendances = (params) => {
  return api.get('monthly-attendances/', { params })
}

export const getMonthlyAttendanceDetail = (id) => {
  return api.get(`monthly-attendances/${id}/`)
}

export const createMonthlyAttendance = (data) => {
  return api.post('monthly-attendances/', data)
}

export const updateMonthlyAttendance = (id, data) => {
  return api.put(`monthly-attendances/${id}/`, data)
}

export const patchMonthlyAttendance = (id, data) => {
  return api.patch(`monthly-attendances/${id}/`, data)
}

export const deleteMonthlyAttendance = (id) => {
  return api.delete(`monthly-attendances/${id}/`)
}

export const softDeleteMonthlyAttendance = (id) => {
  return api.post(`monthly-attendances/${id}/soft-delete/`)
}

export const exportMonthlyAttendances = (params = {}) => {
  return exportData('monthly-attendances/export-data/', params)
}

export const importMonthlyAttendances = (file, additionalParams = {}) => {
  return importData('monthly-attendances/import-data/', file, additionalParams)
}

export const downloadMonthlyAttendanceTemplate = (params = {}) => {
  return downloadTemplate('monthly-attendances/download-template/', params)
}

export const generateMonthlyAttendance = (params) => {
  return api.post('monthly-attendances/generate/', params)
}

export const generateMonthlyAttendanceReport = (params) => {
  return api.get('monthly-attendances/generate-monthly-attendance-report/', { params })
}

// Communication API
export const getCommunications = (params) => {
  return api.get('communications/', { params })
}

export const getCommunicationDetail = (id) => {
  return api.get(`communications/${id}/`)
}

export const createCommunication = (data) => {
  return api.post('communications/', data)
}

export const updateCommunication = (id, data) => {
  return api.put(`communications/${id}/`, data)
}

export const patchCommunication = (id, data) => {
  return api.patch(`communications/${id}/`, data)
}

export const deleteCommunication = (id) => {
  return api.delete(`communications/${id}/`)
}

export const softDeleteCommunication = (id) => {
  return api.post(`communications/${id}/soft-delete/`)
}

export const exportCommunications = (params = {}) => {
  return exportData('communications/export-data/', params)
}

export const importCommunications = (file, additionalParams = {}) => {
  return importData('communications/import-data/', file, additionalParams)
}

export const downloadCommunicationTemplate = (params = {}) => {
  return downloadTemplate('communications/download-template/', params)
}

// Salary API
export const getSalaries = (params) => {
  return api.get('salaries/', { params })
}

export const getSalaryDetail = (id) => {
  return api.get(`salaries/${id}/`)
}

export const createSalary = (data) => {
  return api.post('salaries/', data)
}

export const updateSalary = (id, data) => {
  return api.put(`salaries/${id}/`, data)
}

export const patchSalary = (id, data) => {
  return api.patch(`salaries/${id}/`, data)
}

export const deleteSalary = (id) => {
  return api.delete(`salaries/${id}/`)
}

export const softDeleteSalary = (id) => {
  return api.post(`salaries/${id}/soft-delete/`)
}

export const exportSalaries = (params = {}) => {
  return exportData('salaries/export-data/', params)
}

export const importSalaries = (file, additionalParams = {}) => {
  return importData('salaries/import-data/', file, additionalParams)
}

export const downloadSalaryTemplate = (params = {}) => {
  return downloadTemplate('salaries/download-template/', params)
}

export const generateSalary = (params) => {
  return api.post('salaries/generate/', params)
}
// EmployeeSalaryInfo API
export const getEmployeeSalaryInfos = (params) => {
  return api.get('employee-salary-infos/', { params })
}
export const getEmployeeSalaryInfoDetail = (id) => {
  return api.get(`employee-salary-infos/${id}/`)
}
export const createEmployeeSalaryInfo = (data) => {
  return api.post('employee-salary-infos/', data)
}
export const updateEmployeeSalaryInfo = (id, data) => {
  return api.put(`employee-salary-infos/${id}/`, data)
}
export const patchEmployeeSalaryInfo = (id, data) => {
  return api.patch(`employee-salary-infos/${id}/`, data)
}
export const deleteEmployeeSalaryInfo = (id) => {
  return api.delete(`employee-salary-infos/${id}/`)
}
export const softDeleteEmployeeSalaryInfo = (id) => {
  return api.post(`employee-salary-infos/${id}/soft-delete/`)
}
export const exportEmployeeSalaryInfos = (params = {}) => {
  return exportData('employee-salary-infos/export-data/', params)
}
export const importEmployeeSalaryInfos = (file, additionalParams = {}) => {
  return importData('employee-salary-infos/import-data/', file, additionalParams)
}
export const downloadEmployeeSalaryInfoTemplate = (params = {}) => {
  return downloadTemplate('employee-salary-infos/download-template/', params)
}
