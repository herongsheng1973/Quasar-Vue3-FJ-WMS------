/**
 * API Client for Gomoku.com
 * This module handles all API calls to the backend server
 */

const API = {
  // Base URL for API calls
  baseUrl: '/api',

  /**
   * Make a fetch request to the API
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Fetch options
   * @returns {Promise<any>} - Response data
   */
  async fetch(endpoint, options = {}) {
    try {
      // 模擬API響應
      if (endpoint.includes('/leaderboard')) {
        console.log('提供模擬排行榜數據')

        // 模擬排行榜數據
        const mockLeaderboard = []
        const players = [
          'GomokuMaster',
          'FiveInARow',
          'BoardGameKing',
          'StrategyPro',
          'GomokuChamp',
          'StonePlayer',
          'TacticalMind',
          'PatternSeeker',
          'WinStreak',
          'MoveGenius',
          'BlackStone',
          'WhiteStone',
          'GameWizard',
          'ChessKing',
          'BoardMaster',
          'GomokuPro',
          'StoneKing',
          'MindGames',
          'ProPlayer',
          'TournamentWinner',
        ]

        const limit = endpoint.includes('limit=') ? parseInt(endpoint.split('limit=')[1]) : 10

        for (let i = 0; i < Math.min(limit, players.length); i++) {
          const wins = Math.floor(50 + Math.random() * 150)
          const losses = Math.floor(20 + Math.random() * 80)
          const winRate = Math.round((wins / (wins + losses)) * 100)

          mockLeaderboard.push({
            rank: i + 1,
            name: players[i],
            wins: wins,
            losses: losses,
            winRate: winRate,
          })
        }

        return mockLeaderboard
      }

      // 添加默認標頭
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
      }

      // 添加令牌（如果可用）
      const token = localStorage.getItem('token')
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      // 發送請求
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      })

      // 解析JSON響應
      const data = await response.json()

      // 檢查請求是否成功
      if (!response.ok) {
        throw new Error(data.message || 'An error occurred')
      }

      return data
    } catch (error) {
      console.error(`API Error: ${error.message}`)
      console.log('提供備用數據')

      // 如果是排行榜請求，提供備用數據
      if (endpoint.includes('/leaderboard')) {
        const mockLeaderboard = []
        const players = [
          'GomokuMaster',
          'FiveInARow',
          'BoardGameKing',
          'StrategyPro',
          'GomokuChamp',
          'StonePlayer',
          'TacticalMind',
          'PatternSeeker',
          'WinStreak',
          'MoveGenius',
        ]

        const limit = endpoint.includes('limit=') ? parseInt(endpoint.split('limit=')[1]) : 10

        for (let i = 0; i < Math.min(limit, players.length); i++) {
          const wins = Math.floor(50 + Math.random() * 150)
          const losses = Math.floor(20 + Math.random() * 80)
          const winRate = Math.round((wins / (wins + losses)) * 100)

          mockLeaderboard.push({
            rank: i + 1,
            name: players[i],
            wins: wins,
            losses: losses,
            winRate: winRate,
          })
        }

        return mockLeaderboard
      }

      throw error
    }
  },

  // Authentication

  /**
   * Register a new player
   * @param {Object} player - Player data
   * @returns {Promise<Object>} - Registered player data
   */
  async register(player) {
    return this.fetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(player),
    })
  },

  /**
   * Login a player
   * @param {Object} credentials - Login credentials
   * @returns {Promise<Object>} - Logged in player data
   */
  async login(credentials) {
    const data = await this.fetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })

    // Store token in localStorage
    if (data.token) {
      localStorage.setItem('token', data.token)
    }

    return data
  },

  /**
   * Logout the current player
   */
  logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('player')
  },

  /**
   * Get the current player's profile
   * @returns {Promise<Object>} - Player profile
   */
  async getProfile() {
    return this.fetch('/auth/profile')
  },

  // Leaderboard

  /**
   * Get the leaderboard
   * @param {string} timeframe - Time frame (all-time, this-month, this-week)
   * @param {number} limit - Number of players to return
   * @returns {Promise<Array>} - Leaderboard data
   */
  async getLeaderboard(timeframe = 'all-time', limit = 10) {
    return this.fetch(`/leaderboard?timeframe=${timeframe}&limit=${limit}`)
  },

  /**
   * Get a player's rank on the leaderboard
   * @param {string} playerId - Player ID
   * @returns {Promise<Object>} - Player rank
   */
  async getPlayerRank(playerId) {
    return this.fetch(`/leaderboard/rank/${playerId}`)
  },

  // Games

  /**
   * Get all games
   * @param {number} page - Page number
   * @param {number} limit - Number of games per page
   * @param {string} status - Game status filter
   * @returns {Promise<Object>} - Games data with pagination
   */
  async getGames(page = 1, limit = 10, status = '') {
    let url = `/games?page=${page}&limit=${limit}`
    if (status) {
      url += `&status=${status}`
    }
    return this.fetch(url)
  },

  /**
   * Get a specific game by ID
   * @param {string} gameId - Game ID
   * @returns {Promise<Object>} - Game data
   */
  async getGame(gameId) {
    return this.fetch(`/games/${gameId}`)
  },

  /**
   * Get games for a specific player
   * @param {string} playerId - Player ID
   * @param {number} page - Page number
   * @param {number} limit - Number of games per page
   * @returns {Promise<Object>} - Player games data with pagination
   */
  async getPlayerGames(playerId, page = 1, limit = 10) {
    return this.fetch(`/games/player/${playerId}?page=${page}&limit=${limit}`)
  },
}

// Export the API client
window.API = API
