import * as XLSX from 'xlsx'

/**
 * 将JSON数据导出为Excel文件
 * @param {Array} data - 要导出的数据数组，每个元素为一个对象
 * @param {String} filename - 导出的文件名（不含扩展名）
 * @param {Object} [headerMap] - 表头映射，键为数据字段名，值为Excel列名，如 {id: '编号', name: '名称'}
 * @param {String} [sheetName='Sheet1'] - Excel工作表名称
 */
export function exportExcel(data, filename, headerMap = null, sheetName = 'Sheet1') {
  // 处理空数据
  if (!data || data.length === 0) {
    console.warn('导出数据为空')
    return
  }

  // 复制数据避免修改原数组
  let exportData = [...data]

  // 处理表头映射
  if (headerMap) {
    // 转换数据字段名
    exportData = exportData.map((item) => {
      const newItem = {}
      Object.keys(item).forEach((key) => {
        // 使用映射的列名，若无映射则保留原字段名
        const headerKey = headerMap[key] || key
        newItem[headerKey] = item[key]
      })
      return newItem
    })
  }

  // 创建工作簿和工作表
  const worksheet = XLSX.utils.json_to_sheet(exportData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

  // 生成Excel文件并下载
  try {
    // 生成二进制数据
    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    })

    // 转换为Blob并创建下载链接
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    // 处理文件名（确保包含扩展名）
    const fullFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`

    // 创建下载链接
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fullFilename
    document.body.appendChild(a)
    a.click()

    // 清理资源
    setTimeout(() => {
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, 100)
  } catch (error) {
    console.error('Excel导出失败:', error)
    throw new Error(`导出Excel失败: ${error.message}`)
  }
}

/**
 * 导出错误记录专用方法（简化调用）
 * @param {Array} errors - 错误记录数组，包含row、data、error字段
 * @param {String} filename - 导出的文件名（不含扩展名）
 */
export function exportErrorRecords(errors, filename) {
  const headerMap = {
    row: '行号',
    error: '错误原因',
    data: '原始数据',
  }
  // 处理原始数据为字符串
  const formattedErrors = errors.map((item) => ({
    ...item,
    data: typeof item.data === 'object' ? JSON.stringify(item.data, null, 2) : item.data,
  }))
  exportExcel(formattedErrors, filename, headerMap, '错误记录')
}
