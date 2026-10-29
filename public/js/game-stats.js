/**
 * Game Statistics System
 * 追蹤和管理全站遊戲統計數據
 */

// 統計常量
const STATS_START_DATE = '2025-07-19' // 開始統計的日期

/**
 * 遊戲統計管理器（後端版本）
 */
class GameStatsManager {
  constructor() {
    this.stats = {
      totalGames: 0,
      singlePlayerGames: 0,
      onlineBattleGames: 0,
      startDate: STATS_START_DATE,
      lastUpdated: new Date().toISOString(),
    }
    this.loadStats()
  }

  /**
   * 從後端API加載統計數據
   */
  async loadStats() {
    try {
      const response = await fetch('/api/game-stats')
      if (response.ok) {
        this.stats = await response.json()
        console.log('從後端載入統計數據:', this.stats)

        // 廣播統計更新事件
        window.dispatchEvent(
          new CustomEvent('gameStatsUpdated', {
            detail: this.stats,
          }),
        )
      } else {
        console.error('載入統計數據失敗:', response.status)
      }
    } catch (error) {
      console.error('載入統計數據失敗:', error)
    }
  }

  /**
   * 記錄一場完成的遊戲
   * @param {string} gameMode - 'single-player' 或 'online-battle'
   * @param {string} result - 'win', 'lose', 或 'draw'
   */
  async recordGameCompleted(gameMode, result = null) {
    console.log(`記錄遊戲完成: ${gameMode}, 結果: ${result}`)

    try {
      const response = await fetch('/api/game-completed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameMode: gameMode,
          result: result,
        }),
      })

      if (response.ok) {
        const responseData = await response.json()
        console.log('遊戲完成記錄成功:', responseData)

        // 重新載入最新統計數據
        await this.loadStats()
      } else {
        console.error('記錄遊戲完成失敗:', response.status)
      }
    } catch (error) {
      console.error('記錄遊戲完成失敗:', error)
    }
  }

  /**
   * 獲取統計數據
   */
  getStats() {
    return { ...this.stats }
  }

  /**
   * 刷新統計數據
   */
  async refreshStats() {
    await this.loadStats()
  }
}

// 創建全域統計管理器實例
window.gameStatsManager = new GameStatsManager()

/**
 * 格式化數字顯示（添加千分位逗號）
 */
function formatNumber(num) {
  return num.toLocaleString()
}

/**
 * 更新統計顯示元素
 */
function updateStatsDisplay() {
  const stats = window.gameStatsManager.getStats()

  // 更新總遊戲數顯示
  const totalGamesElement = document.getElementById('total-games-count')
  if (totalGamesElement) {
    totalGamesElement.textContent = formatNumber(stats.totalGames)
  }

  // 更新其他可能的統計顯示元素
  const elements = {
    'single-player-games': stats.singlePlayerGames,
    'online-battle-games': stats.onlineBattleGames,
  }

  Object.entries(elements).forEach(([elementId, value]) => {
    const element = document.getElementById(elementId)
    if (element) {
      element.textContent = formatNumber(value)
    }
  })
}

// 監聽統計更新事件
window.addEventListener('gameStatsUpdated', updateStatsDisplay)

// 頁面載入時更新顯示
document.addEventListener('DOMContentLoaded', function () {
  updateStatsDisplay()

  // 如果在Dev Log頁面，每30秒刷新一次統計數據
  if (window.location.pathname.includes('/dev-log/')) {
    setInterval(async function () {
      if (window.gameStatsManager) {
        await window.gameStatsManager.refreshStats()
      }
    }, 30000) // 30秒

    console.log('Dev Log頁面：啟用30秒自動刷新統計數據')
  }
})

console.log('遊戲統計系統已初始化')
