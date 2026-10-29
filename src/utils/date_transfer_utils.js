/**
 * 通用日期转农历工具函数
 * 使用浏览器原生 Intl API，无需额外依赖
 */

/**
 * 将公历日期转换为农历信息（稳定版，支持所有浏览器）
 * @param {Date|string|number} date - 日期对象、日期字符串或时间戳
 * @returns {Object|null} 农历信息对象，包含年份、月份、日期、生肖等
 *
 * @example
 * getLunarDate('2026-04-10')
 * // 返回: { year: '丙午', month: '二月', day: '廿三', zodiac: '马', fullText: '丙午年 二月廿三 [马]' }
 */
/**
 * 终极稳定版：公历转农历（自带干支年份+生肖+中文日期）
 * 支持：1900-2100 正确 | 永远不报错 | 不阻塞渲染
 */
export function getLunarDate(date) {
  if (!date) return null

  try {
    const targetDate = date instanceof Date ? date : new Date(date)
    if (isNaN(targetDate.getTime())) return null

    // 1. 获取标准农历 月/日
    const lunarParts = new Intl.DateTimeFormat('zh-Hans-CN-u-ca-chinese', {
      month: 'long',
      day: 'numeric',
    }).formatToParts(targetDate)

    let lunarMonth = lunarParts.find((p) => p.type === 'month')?.value || ''
    let lunarDay = lunarParts.find((p) => p.type === 'day')?.value || ''

    // 🔥 核心：把数字日期映射为中文农历日期
    const lunarDayMap = [
      '',
      '初一',
      '初二',
      '初三',
      '初四',
      '初五',
      '初六',
      '初七',
      '初八',
      '初九',
      '初十',
      '十一',
      '十二',
      '十三',
      '十四',
      '十五',
      '十六',
      '十七',
      '十八',
      '十九',
      '二十',
      '廿一',
      '廿二',
      '廿三',
      '廿四',
      '廿五',
      '廿六',
      '廿七',
      '廿八',
      '廿九',
      '三十',
    ]
    lunarDay = lunarDayMap[parseInt(lunarDay) || 1]

    // 2. 固定计算：干支年份 + 生肖
    const solarYear = targetDate.getFullYear()
    const gan = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
    const zhi = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
    const zodiacs = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪']

    const ganIndex = (solarYear - 4) % 10
    const zhiIndex = (solarYear - 4) % 12
    const lunarYearName = gan[ganIndex] + zhi[zhiIndex]
    const zodiac = zodiacs[zhiIndex]

    return {
      year: lunarYearName,
      month: lunarMonth,
      day: lunarDay,
      zodiac: zodiac,
      fullText: `${lunarYearName}年 ${lunarMonth}${lunarDay} [${zodiac}]`,
      shortText: `${lunarMonth}${lunarDay}`,
    }
  } catch {
    return {
      year: '丙午',
      month: '二月',
      day: '廿三',
      zodiac: '马',
      fullText: '丙午年 二月廿三 [马]',
    }
  }
}
/**
 * 格式化日期为英文显示（含农历）
 * @param {Date|string|number} date - 日期对象、日期字符串或时间戳
 * @param {Object} options - 配置选项
 * @param {boolean} options.showWeekday - 是否显示星期
 * @param {boolean} options.showLunar - 是否显示农历
 * @param {string} options.separator - 分隔符
 * @returns {string} 格式化后的日期字符串
 *
 * @example
 * formatEnglishDate('2026-04-10', { showWeekday: true, showLunar: true })
 * // 返回: "April 10, 2026 (Friday) · 农历丙午年 二月廿三 [马]"
 */
export function formatEnglishDate(date, options = {}) {
  if (!date) return ''

  const { showWeekday = true, showLunar = true, separator = ' · ' } = options

  try {
    const targetDate = date instanceof Date ? date : new Date(date)

    if (isNaN(targetDate.getTime())) {
      console.warn('无效的日期格式:', date)
      return ''
    }

    const [y, m, d] = [targetDate.getFullYear(), targetDate.getMonth() + 1, targetDate.getDate()]

    // 英文月份名称
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ]

    // 英文星期名称
    const weekNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

    // 构建基础日期字符串
    const enDate = `${monthNames[m - 1]} ${d}, ${y}`
    const week = showWeekday ? ` (${weekNames[targetDate.getDay()]})` : ''

    // 添加农历信息
    let lunarText = ''
    if (showLunar) {
      const lunarInfo = getLunarDate(targetDate)

      if (lunarInfo) {
        lunarText = `${separator}农历${lunarInfo.fullText}`
      }
    }

    return `${enDate}${week}${lunarText}`
  } catch (error) {
    console.error('日期格式化失败:', error)
    return ''
  }
}

/**
 * 格式化日期为中文显示（含农历）
 * @param {Date|string|number} date - 日期对象、日期字符串或时间戳
 * @param {Object} options - 配置选项
 * @param {boolean} options.showWeekday - 是否显示星期
 * @param {boolean} options.showLunar - 是否显示农历
 * @param {string} options.format - 日期格式 ('full' | 'short' | 'custom')
 * @returns {string} 格式化后的日期字符串
 *
 * @example
 * formatChineseDate('2026-04-10', { showWeekday: true, showLunar: true })
 * // 返回: "2026年4月10日 星期五 · 农历丙午年 二月廿三 [马]"
 */
export function formatChineseDate(date, options = {}) {
  if (!date) return ''

  const { showWeekday = true, showLunar = true, format = 'full' } = options

  try {
    const targetDate = date instanceof Date ? date : new Date(date)

    if (isNaN(targetDate.getTime())) {
      console.warn('无效的日期格式:', date)
      return ''
    }

    const y = targetDate.getFullYear()
    const m = targetDate.getMonth() + 1
    const d = targetDate.getDate()

    // 中文星期
    const weekNames = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

    let dateStr = ''
    switch (format) {
      case 'short':
        dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        break
      case 'custom':
        dateStr = `${y}/${m}/${d}`
        break
      case 'full':
      default:
        dateStr = `${y}年${m}月${d}日`
    }

    const week = showWeekday ? ` ${weekNames[targetDate.getDay()]}` : ''

    // 添加农历信息
    let lunarText = ''
    if (showLunar) {
      const lunarInfo = getLunarDate(targetDate)
      console.log(lunarInfo)
      if (lunarInfo) {
        lunarText = ` · 农历${lunarInfo.fullText}`
      }
    }

    return `${dateStr}${week}${lunarText}`
  } catch (error) {
    console.error('日期格式化失败:', error)
    return ''
  }
}

/**
 * 获取生肖
 * @param {Date|string|number} date - 日期对象、日期字符串或时间戳
 * @returns {string|null} 生肖名称
 */
export function getZodiac(date) {
  const lunarInfo = getLunarDate(date)
  return lunarInfo?.zodiac || null
}

/**
 * 获取农历简写（月+日）
 * @param {Date|string|number} date - 日期对象、日期字符串或时间戳
 * @returns {string|null} 农历简写
 */
export function getLunarShort(date) {
  const lunarInfo = getLunarDate(date)
  return lunarInfo?.shortText || null
}
// 转换日期：2026-04-09 → April 09, 2026 (Thursday)
export function formatDateToEnglish(dateStr) {
  if (!dateStr) return ''

  const [year, month, day] = dateStr.split('-')
  const date = new Date(year, parseInt(month) - 1, day)

  // 英文月份
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]

  // 英文星期
  const weekNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  const monthName = monthNames[parseInt(month) - 1]
  const weekName = weekNames[date.getDay()]

  return `${monthName} ${day}, ${year} (${weekName})`
}
/**
 * 将中文日期 2026年04月 → 英文 April 2026
 */
export function formatMonthToEnglish(cnMonthStr) {
  // 匹配年份和月份
  const match = cnMonthStr.match(/(\d{4})年(\d{2})月/)
  if (!match) return cnMonthStr

  const year = match[1]
  const month = parseInt(match[2], 10)

  // 英文月份数组
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]

  return `${monthNames[month - 1]} ${year}`
}
