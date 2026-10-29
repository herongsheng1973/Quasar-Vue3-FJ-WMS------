/**
 * Single Player Gomoku Game
 * 使用Web Worker背景執行緒執行AI計算，完全不阻塞UI
 */

document.addEventListener('DOMContentLoaded', function () {
  // DOM 元素
  const singlePlayerBoard = document.getElementById('single-player-board')
  const singleStartGame = document.getElementById('single-start-game')
  const singleRestart = document.getElementById('single-restart')
  const singleUndo = document.getElementById('single-undo')
  const singlePlayAgain = document.getElementById('single-play-again')
  const singleBackHome = document.getElementById('single-back-home')
  const difficultySelector = document.getElementById('difficulty')
  const singlePlayerTimer = document.getElementById('single-player-timer')
  const singlePlayerTurn = document.getElementById('single-player-turn')
  const singleResultMessage = document.getElementById('single-result-message')
  const singleMoves = document.getElementById('single-moves')
  const singleTime = document.getElementById('single-time')
  const singleHideOverlay = document.getElementById('single-hide-overlay')
  const singleShowOverlay = document.getElementById('single-show-overlay')

  // Web Worker for AI
  let aiWorker = null
  let isAIThinking = false

  // 遊戲狀態
  let gameActive = false
  let playerTurn = true // true: 玩家, false: 電腦
  let gameBoard = []
  let moveHistory = []
  let gameStartTime = null
  let gameTimer = null
  let elapsedTime = 0
  let difficulty = 'medium'
  let totalMoves = 0

  // 常量
  const BOARD_SIZE = 15
  const PLAYER_STONE = 1
  const COMPUTER_STONE = 2

  // 初始化遊戲
  initGame()

  /**
   * 初始化遊戲
   */
  function initGame() {
    console.log('=== 初始化遊戲開始 ===')
    console.log('DOM加載狀態:', document.readyState)

    // 檢查關鍵DOM元素
    console.log('檢查DOM元素:')
    console.log('singlePlayerBoard:', singlePlayerBoard)
    console.log('singleStartGame:', singleStartGame)
    console.log('singleRestart:', singleRestart)
    console.log('singleUndo:', singleUndo)
    console.log('singlePlayAgain:', singlePlayAgain)
    console.log('singleBackHome:', singleBackHome)
    console.log('difficultySelector:', difficultySelector)
    console.log('singlePlayerTimer:', singlePlayerTimer)
    console.log('singlePlayerTurn:', singlePlayerTurn)
    console.log('singleResultMessage:', singleResultMessage)
    console.log('singleMoves:', singleMoves)
    console.log('singleTime:', singleTime)

    setupEventListeners()
    setupAIWorker()
    resetGame()
    console.log('=== 初始化遊戲完成 ===')
  }

  /**
   * 設置AI Worker
   */
  function setupAIWorker() {
    console.log('開始設置AI Worker...')
    try {
      console.log('嘗試創建Worker: /js/ai-worker-v2.js')
      aiWorker = new Worker('/js/ai-worker-v2.js')
      console.log('Worker 創建成功:', aiWorker)

      aiWorker.onmessage = function (e) {
        console.log('收到Worker消息:', e.data)
        const { type, move, depth, time, elapsed, error, message } = e.data

        switch (type) {
          case 'AI_PROGRESS':
            console.log(`AI搜索進度: 深度${depth}, 已用時${elapsed}ms`)
            // 更新UI顯示AI思考進度
            if (singlePlayerTurn) {
              singlePlayerTurn.textContent = i18n.t('AI Thinking... (Depth {depth})', {
                depth: depth,
              })
              console.log('更新UI: AI Thinking... (Depth ' + depth + ')')
            }
            break

          case 'AI_MOVE_FOUND':
            console.log(`AI找到最佳移動: ${JSON.stringify(move)}, 深度${depth}, 用時${time}ms`)
            if (error) {
              console.warn('AI Worker報告錯誤 (但仍找到移動):', error)
            }

            isAIThinking = false

            if (move && gameActive && !playerTurn) {
              executeComputerMove(move)
            } else if (!move) {
              console.error('AI無法找到移動，使用fallback')
              useFallbackAI()
            } else {
              console.warn('AI移動返回時遊戲狀態已變更')
            }
            break

          case 'AI_SEARCH_CANCELLED':
            console.log('AI Worker確認搜索已取消:', message)
            isAIThinking = false
            break

          default:
            console.warn('未知的Worker消息類型:', type)
        }
      }

      aiWorker.onerror = function (error) {
        console.error('AI Worker錯誤:', error)
        console.error('錯誤詳情:', error.message, error.filename, error.lineno)

        // 重置AI狀態
        isAIThinking = false

        // 只有在嚴重錯誤時才禁用Worker，一般錯誤不影響使用
        console.warn('AI Worker發生錯誤，但繼續使用 (不重新創建)')

        // 如果正在等待AI移動，使用fallback
        if (!playerTurn && gameActive) {
          console.log('當前正在等待AI移動，使用fallback AI')
          useFallbackAI()
        }
      }

      // 重置重試計數
      aiWorker.retryCount = 0
      console.log('AI Worker 初始化成功')
    } catch (error) {
      console.error('無法創建AI Worker:', error)
      console.error('錯誤詳情:', error.message, error.stack)
      aiWorker = null
    }
  }

  /**
   * 設置事件監聽器
   */
  function setupEventListeners() {
    console.log('=== 設置事件監聽器開始 ===')

    if (singleStartGame) {
      console.log('設置Start Game按鈕事件監聽器')
      singleStartGame.addEventListener('click', startGame)
      console.log('Start Game按鈕事件監聽器已設置')
    } else {
      console.error('找不到Start Game按鈕元素!')
    }

    if (singleRestart) {
      console.log('設置Restart按鈕事件監聽器')
      singleRestart.addEventListener('click', restartGame)
    } else {
      console.warn('找不到Restart按鈕元素')
    }

    if (singleUndo) {
      console.log('設置Undo按鈕事件監聽器')
      singleUndo.addEventListener('click', undoMove)
    } else {
      console.warn('找不到Undo按鈕元素')
    }

    if (singlePlayAgain) {
      console.log('設置Play Again按鈕事件監聽器')
      singlePlayAgain.addEventListener('click', playAgain)
    } else {
      console.warn('找不到Play Again按鈕元素')
    }

    if (singleBackHome) {
      console.log('設置Back Home按鈕事件監聽器')
      singleBackHome.addEventListener('click', () => {
        // 根據當前語言返回對應的首頁
        const currentLang = i18n.getCurrentLang()
        let homePath = '/'
        if (currentLang === 'ja') {
          homePath = '/ja/'
        } else if (currentLang === 'zh-tw') {
          homePath = '/zh-tw/'
        } else if (currentLang === 'zh-cn') {
          homePath = '/zh-cn/'
        } else if (currentLang === 'ko') {
          homePath = '/ko/'
        }
        window.location.href = homePath
      })
    } else {
      console.warn('找不到Back Home按鈕元素')
    }

    if (singleHideOverlay) {
      console.log('設置Hide Overlay按鈕事件監聽器')
      singleHideOverlay.addEventListener('click', hideGameEndOverlay)
    } else {
      console.warn('找不到Hide Overlay按鈕元素')
    }

    if (singleShowOverlay) {
      console.log('設置Show Overlay按鈕事件監聽器')
      singleShowOverlay.addEventListener('click', showGameEndOverlay)
    } else {
      console.warn('找不到Show Overlay按鈕元素')
    }

    if (difficultySelector) {
      console.log('設置難度選擇器事件監聽器')
      difficultySelector.addEventListener('change', (e) => {
        difficulty = e.target.value
        console.log('難度已變更為:', difficulty)
      })
    } else {
      console.warn('找不到難度選擇器元素')
    }

    console.log('=== 事件監聽器設置完成 ===')

    // 翻譯難度選擇器選項
    if (typeof i18n !== 'undefined' && i18n.translateDifficultyOptions) {
      i18n.translateDifficultyOptions()
      console.log('難度選擇器選項已翻譯')
    }
  }

  /**
   * 開始遊戲
   */
  function startGame() {
    console.log('=== startGame 函數被調用 ===')
    console.log('difficultySelector:', difficultySelector)

    if (!difficultySelector) {
      console.error('difficultySelector 不存在，無法開始遊戲')
      return
    }

    difficulty = difficultySelector.value
    console.log('當前難度設定:', difficulty)

    console.log('調用 resetGame...')
    resetGame()

    console.log('設置遊戲狀態為活躍...')
    gameActive = true
    gameStartTime = Date.now()

    // 隱藏開始覆蓋層
    const startOverlay = document.querySelector('.game-start-overlay')
    console.log('開始覆蓋層元素:', startOverlay)
    if (startOverlay) {
      startOverlay.classList.add('hidden')
      console.log('開始覆蓋層已隱藏')
    } else {
      console.error('找不到開始覆蓋層元素!')
    }

    // 開始計時器
    console.log('開始計時器...')
    startTimer()

    // 更新UI
    console.log('更新遊戲狀態...')
    updateGameStatus()

    // 顯示難度信息
    console.log('顯示難度信息...')
    showDifficultyInfo()

    console.log('=== startGame 函數執行完成 ===')
  }

  /**
   * 顯示難度信息
   */
  function showDifficultyInfo() {
    const difficultyInfo = {
      easy: i18n.t('Easy Mode: AI makes some mistakes, suitable for beginners'),
      medium: i18n.t('Medium Mode: AI has strategic thinking, suitable for general players'),
      hard: i18n.t('Hard Mode: AI uses advanced algorithms, extremely challenging!'),
    }

    if (singleResultMessage) {
      singleResultMessage.innerHTML = `
                <div class="difficulty-info">
                    <strong>${difficultyInfo[difficulty]}</strong><br>
                    <span style="color: #4CAF50; font-size: 0.9em;">${i18n.t('🚀 Background AI: Maximum strength, smooth UI')}</span>
                </div>
            `
      singleResultMessage.style.display = 'block'

      // 5秒後隱藏
      setTimeout(() => {
        if (gameActive) {
          singleResultMessage.style.display = 'none'
        }
      }, 5000)
    }
  }

  /**
   * 重置遊戲
   */
  function resetGame() {
    gameActive = false
    playerTurn = true
    totalMoves = 0
    moveHistory = []
    elapsedTime = 0

    // 停止計時器
    if (gameTimer) {
      clearInterval(gameTimer)
      gameTimer = null
    }

    // 顯示開始覆蓋層
    const startOverlay = document.querySelector('.game-start-overlay')
    if (startOverlay) {
      startOverlay.classList.remove('hidden')
    }

    // 隱藏結束覆蓋層
    const endOverlay = document.querySelector('.game-end-overlay')
    if (endOverlay) {
      endOverlay.classList.add('hidden')
    }

    // 初始化棋盤
    gameBoard = []
    for (let i = 0; i < BOARD_SIZE; i++) {
      gameBoard[i] = []
      for (let j = 0; j < BOARD_SIZE; j++) {
        gameBoard[i][j] = 0
      }
    }

    // 清除UI
    clearBoard()
    updateGameStatus()

    if (singleResultMessage) {
      singleResultMessage.style.display = 'none'
    }
  }

  /**
   * 創建棋盤
   */
  function createBoard() {
    if (!singlePlayerBoard) {
      console.error('singlePlayerBoard 元素不存在!')
      return
    }

    singlePlayerBoard.innerHTML = ''
    singlePlayerBoard.className = 'game-board'

    // 創建網格容器
    const gridContainer = document.createElement('div')
    gridContainer.classList.add('board-grid-container')
    singlePlayerBoard.appendChild(gridContainer)

    // 添加水平線
    for (let i = 0; i < BOARD_SIZE; i++) {
      const hLine = document.createElement('div')
      hLine.classList.add('h-line')
      const position = (i / (BOARD_SIZE - 1)) * 100
      hLine.style.top = `${position}%`
      gridContainer.appendChild(hLine)
    }

    // 添加垂直線
    for (let i = 0; i < BOARD_SIZE; i++) {
      const vLine = document.createElement('div')
      vLine.classList.add('v-line')
      const position = (i / (BOARD_SIZE - 1)) * 100
      vLine.style.left = `${position}%`
      gridContainer.appendChild(vLine)
    }

    // 添加棋盤交叉點（落子點）
    for (let i = 0; i < BOARD_SIZE; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        const intersection = document.createElement('div')
        intersection.classList.add('board-intersection')
        intersection.dataset.row = i
        intersection.dataset.col = j

        // 計算位置
        const percentX = (j / (BOARD_SIZE - 1)) * 100
        const percentY = (i / (BOARD_SIZE - 1)) * 100

        intersection.style.left = `${percentX}%`
        intersection.style.top = `${percentY}%`

        // 點擊事件
        intersection.addEventListener('click', function () {
          if (gameActive && playerTurn) {
            const row = parseInt(this.dataset.row)
            const col = parseInt(this.dataset.col)
            makeMove(row, col)
          }
        })

        gridContainer.appendChild(intersection)
      }
    }

    // 添加星位標記
    const starPoints = [
      { row: 3, col: 3 }, // 左上
      { row: 3, col: 11 }, // 右上
      { row: 7, col: 7 }, // 中央 (天元)
      { row: 11, col: 3 }, // 左下
      { row: 11, col: 11 }, // 右下
    ]

    starPoints.forEach((point) => {
      const starPoint = document.createElement('div')
      starPoint.classList.add('board-point')

      const percentX = (point.col / (BOARD_SIZE - 1)) * 100
      const percentY = (point.row / (BOARD_SIZE - 1)) * 100

      starPoint.style.left = `${percentX}%`
      starPoint.style.top = `${percentY}%`
      gridContainer.appendChild(starPoint)
    })

    console.log('棋盤創建完成')
  }

  /**
   * 清除棋盤
   */
  function clearBoard() {
    createBoard()
  }

  /**
   * 開始計時器
   */
  function startTimer() {
    gameTimer = setInterval(() => {
      elapsedTime = Date.now() - gameStartTime
      updateTimer()
    }, 1000)
  }

  /**
   * 更新計時器顯示
   */
  function updateTimer() {
    if (singlePlayerTimer) {
      const seconds = Math.floor(elapsedTime / 1000)
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      singlePlayerTimer.textContent = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
    }
  }

  /**
   * 更新遊戲狀態顯示
   */
  function updateGameStatus() {
    updateTurnIndicator()
    updateMoveCount()
    updateTimer()
  }

  /**
   * 更新回合指示器
   */
  function updateTurnIndicator() {
    if (singlePlayerTurn) {
      if (gameActive) {
        singlePlayerTurn.textContent = playerTurn ? i18n.t('Your Turn') : i18n.t('AI Thinking...')
        singlePlayerTurn.className = playerTurn
          ? 'turn-indicator player-turn'
          : 'turn-indicator ai-turn'
      } else {
        singlePlayerTurn.textContent = i18n.t('Click Start Game')
        singlePlayerTurn.className = 'turn-indicator'
      }
    }
  }

  /**
   * 更新移動計數
   */
  function updateMoveCount() {
    if (singleMoves) {
      singleMoves.textContent = totalMoves
    }

    if (singleTime) {
      const seconds = Math.floor(elapsedTime / 1000)
      singleTime.textContent = `${seconds}s`
    }
  }

  /**
   * 玩家落子
   */
  function makeMove(row, col) {
    // 檢查位置是否為空
    if (gameBoard[row][col] !== 0) {
      return
    }

    // 玩家落子
    gameBoard[row][col] = PLAYER_STONE
    placeStone(row, col, PLAYER_STONE)

    // 記錄移動
    moveHistory.push({ row, col, player: PLAYER_STONE })
    totalMoves++

    // 檢查是否獲勝
    if (checkWin(row, col, PLAYER_STONE)) {
      endGame(true)
      return
    }

    // 檢查是否平局
    if (checkDraw()) {
      endGame(null)
      return
    }

    // 輪到電腦
    playerTurn = false
    updateTurnIndicator()

    // 電腦落子（延遲一下，模擬思考）
    const thinkingTime = difficulty === 'hard' ? 1000 : difficulty === 'medium' ? 700 : 500
    setTimeout(computerMove, thinkingTime)
  }

  /**
   * 電腦落子 - 使用Web Worker背景計算或fallback AI
   */
  function computerMove() {
    console.log('=== computerMove 開始 ===')
    console.log('gameActive:', gameActive)
    console.log('playerTurn:', playerTurn)
    console.log('isAIThinking:', isAIThinking)
    console.log('aiWorker 狀態:', aiWorker ? 'available' : 'null')
    console.log('totalMoves:', totalMoves)

    if (!gameActive || playerTurn || isAIThinking) {
      console.log('computerMove 提前返回，條件不滿足')
      return
    }

    console.log('開始AI思考...')
    isAIThinking = true
    updateTurnIndicator()

    if (aiWorker) {
      // 使用Web Worker AI
      console.log('=== 使用Web Worker AI (第' + (Math.floor(totalMoves / 2) + 1) + '次AI思考) ===')

      try {
        // 創建棋盤的深拷貝
        const boardCopy = gameBoard.map((row) => [...row])

        console.log('準備發送消息給Worker')
        console.log('difficulty:', difficulty)
        console.log('棋盤狀態:', boardCopy.map((row) => row.join('')).join('\\n'))

        // 發送棋盤狀態給AI Worker
        aiWorker.postMessage({
          action: 'START_AI_SEARCH',
          data: {
            board: boardCopy,
            difficulty: difficulty,
          },
        })

        console.log('=== 消息已發送給Worker，等待回應... ===')

        // 僅設置一個保守的超時保護 (15秒，比之前更長)
        setTimeout(() => {
          if (isAIThinking && !playerTurn && gameActive) {
            console.warn('=== AI Worker 超時 (15秒)，使用fallback AI ===')
            isAIThinking = false

            // 取消Worker搜索 (但不禁用Worker)
            if (aiWorker) {
              try {
                aiWorker.postMessage({ action: 'CANCEL_AI_SEARCH' })
                console.log('已向Worker發送取消指令')
              } catch (e) {
                console.error('取消Worker搜索失敗:', e)
              }
            }

            // 使用fallback AI
            setTimeout(() => {
              if (!playerTurn && gameActive && !isAIThinking) {
                useFallbackAI()
              }
            }, 100)
          }
        }, 15000) // 15秒超時，比之前更寬鬆
      } catch (error) {
        console.error('Web Worker AI 調用錯誤:', error)
        isAIThinking = false
        useFallbackAI()
      }
    } else {
      // 直接使用fallback AI
      console.log('=== Web Worker不可用，使用fallback AI ===')
      useFallbackAI()
    }
  }

  /**
   * 使用fallback AI
   */
  function useFallbackAI() {
    console.log('使用fallback基本AI')

    if (!gameActive || playerTurn) {
      return
    }

    if (!isAIThinking) {
      isAIThinking = true
      updateTurnIndicator()
    }

    setTimeout(() => {
      try {
        const move = fallbackAI(gameBoard, difficulty)
        isAIThinking = false

        if (move && gameActive && !playerTurn) {
          executeComputerMove(move)
        } else if (!move) {
          console.warn('Fallback AI 無法找到移動')
          endGame(null)
        } else {
          console.warn('Fallback AI 返回時遊戲狀態已變更')
          playerTurn = true
          updateTurnIndicator()
        }
      } catch (error) {
        console.error('Fallback AI錯誤:', error)
        isAIThinking = false
        playerTurn = true
        updateTurnIndicator()
      }
    }, 500) // 模擬思考時間
  }

  /**
   * Fallback AI - 當Web Worker不可用時使用
   */
  function fallbackAI(board, difficulty) {
    console.log('Fallback AI 開始計算...')

    // 立即檢查獲勝機會
    const winMove = findWinMove(board, COMPUTER_STONE)
    if (winMove) {
      console.log('Fallback AI找到獲勝移動:', winMove)
      return winMove
    }

    // 立即檢查阻擋玩家獲勝
    const blockMove = findWinMove(board, PLAYER_STONE)
    if (blockMove) {
      console.log('Fallback AI找到阻擋移動:', blockMove)
      return blockMove
    }

    // 尋找最佳位置
    const candidates = getCandidateMoves(board)
    if (candidates.length === 0) {
      return null
    }

    // 根據難度添加隨機性
    const randomFactor = difficulty === 'easy' ? 0.3 : difficulty === 'medium' ? 0.1 : 0.05
    if (Math.random() < randomFactor) {
      const randomIndex = Math.floor(Math.random() * Math.min(candidates.length, 5))
      return candidates[randomIndex]
    }

    // 返回評分最高的移動
    return candidates[0]
  }

  /**
   * 尋找獲勝移動
   */
  function findWinMove(board, player) {
    for (let i = 0; i < BOARD_SIZE; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        if (board[i][j] === 0) {
          board[i][j] = player
          if (checkWin(i, j, player)) {
            board[i][j] = 0
            return { row: i, col: j }
          }
          board[i][j] = 0
        }
      }
    }
    return null
  }

  /**
   * 獲取候選移動
   */
  function getCandidateMoves(board) {
    const moves = []
    const occupied = []

    // 收集已佔位置
    for (let i = 0; i < BOARD_SIZE; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        if (board[i][j] !== 0) {
          occupied.push({ row: i, col: j })
        }
      }
    }

    // 開局處理
    if (occupied.length === 0) {
      const center = Math.floor(BOARD_SIZE / 2)
      return [{ row: center, col: center }]
    }

    // 在已佔位置附近搜索
    const candidateSet = new Set()

    for (const pos of occupied) {
      for (let di = -2; di <= 2; di++) {
        for (let dj = -2; dj <= 2; dj++) {
          const ni = pos.row + di
          const nj = pos.col + dj

          if (ni >= 0 && ni < BOARD_SIZE && nj >= 0 && nj < BOARD_SIZE && board[ni][nj] === 0) {
            candidateSet.add(`${ni},${nj}`)
          }
        }
      }
    }

    // 評估和排序
    for (const pos of candidateSet) {
      const [row, col] = pos.split(',').map(Number)
      const score = evaluateMoveSimple(board, row, col)
      moves.push({ row, col, score })
    }

    // 按分數降序排序
    moves.sort((a, b) => b.score - a.score)

    return moves
  }

  /**
   * 簡單移動評估
   */
  function evaluateMoveSimple(board, row, col) {
    let score = 0

    // 評估AI落子
    board[row][col] = COMPUTER_STONE
    score += evaluatePositionSimple(board, row, col, COMPUTER_STONE) * 1.1
    board[row][col] = 0

    // 評估玩家落子（防守價值）
    board[row][col] = PLAYER_STONE
    score += evaluatePositionSimple(board, row, col, PLAYER_STONE) * 0.9
    board[row][col] = 0

    return score
  }

  /**
   * 簡單位置評估
   */
  function evaluatePositionSimple(board, row, col, player) {
    let score = 0
    const directions = [
      [0, 1],
      [1, 0],
      [1, 1],
      [1, -1],
    ]

    for (const [dx, dy] of directions) {
      let count = 1
      let blocked = 0

      // 向一個方向計數
      for (let i = 1; i < 5; i++) {
        const r = row + i * dx
        const c = col + i * dy

        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
          if (board[r][c] === player) {
            count++
          } else if (board[r][c] !== 0) {
            blocked++
            break
          } else {
            break
          }
        } else {
          blocked++
          break
        }
      }

      // 向相反方向計數
      for (let i = 1; i < 5; i++) {
        const r = row - i * dx
        const c = col - i * dy

        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
          if (board[r][c] === player) {
            count++
          } else if (board[r][c] !== 0) {
            blocked++
            break
          } else {
            break
          }
        } else {
          blocked++
          break
        }
      }

      // 評分
      if (count >= 5) {
        score += 100000
      } else if (count === 4 && blocked === 0) {
        score += 10000
      } else if (count === 4 && blocked === 1) {
        score += 1000
      } else if (count === 3 && blocked === 0) {
        score += 1000
      } else if (count === 3 && blocked === 1) {
        score += 100
      } else if (count === 2 && blocked === 0) {
        score += 100
      } else {
        score += count
      }
    }

    return score
  }

  /**
   * 執行電腦移動的共用函數
   */
  function executeComputerMove(move) {
    // 電腦落子
    gameBoard[move.row][move.col] = COMPUTER_STONE
    placeStone(move.row, move.col, COMPUTER_STONE)

    // 記錄移動
    moveHistory.push({ row: move.row, col: move.col, player: COMPUTER_STONE })
    totalMoves++

    // 檢查是否獲勝
    if (checkWin(move.row, move.col, COMPUTER_STONE)) {
      endGame(false)
      return
    }

    // 檢查是否平局
    if (checkDraw()) {
      endGame(null)
      return
    }

    // 輪到玩家
    playerTurn = true
    updateTurnIndicator()
  }

  /**
   * 在棋盤上放置棋子
   */
  function placeStone(row, col, player) {
    // 獲取對應的交叉點
    const intersection = document.querySelector(
      `.board-intersection[data-row="${row}"][data-col="${col}"]`,
    )
    if (!intersection) return

    // 移除已有的棋子（如果有）
    while (intersection.firstChild) {
      intersection.removeChild(intersection.firstChild)
    }

    // 創建棋子元素
    const stone = document.createElement('div')
    stone.classList.add('stone')

    // 設置棋子顏色
    if (player === PLAYER_STONE) {
      stone.classList.add('black-stone')
    } else {
      stone.classList.add('white-stone')
    }

    // 添加到交叉點
    intersection.appendChild(stone)
  }

  /**
   * 檢查是否獲勝
   */
  function checkWin(row, col, player) {
    // 檢查橫、豎、斜線
    return (
      checkDirection(row, col, 1, 0, player) || // 橫向
      checkDirection(row, col, 0, 1, player) || // 豎向
      checkDirection(row, col, 1, 1, player) || // 右下斜
      checkDirection(row, col, 1, -1, player) // 左下斜
    )
  }

  /**
   * 檢查指定方向是否有五子連珠
   */
  function checkDirection(row, col, dx, dy, player) {
    let count = 1 // 從當前棋子開始計數

    // 向一個方向檢查
    for (let i = 1; i < 5; i++) {
      const r = row + i * dx
      const c = col + i * dy

      if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && gameBoard[r][c] === player) {
        count++
      } else {
        break
      }
    }

    // 向相反方向檢查
    for (let i = 1; i < 5; i++) {
      const r = row - i * dx
      const c = col - i * dy

      if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && gameBoard[r][c] === player) {
        count++
      } else {
        break
      }
    }

    return count >= 5
  }

  /**
   * 檢查是否平局
   */
  function checkDraw() {
    for (let i = 0; i < BOARD_SIZE; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        if (gameBoard[i][j] === 0) {
          return false // 還有空位
        }
      }
    }
    return true // 棋盤已滿
  }

  /**
   * 撤銷上一步
   */
  function undoMove() {
    if (!gameActive || moveHistory.length < 2 || isAIThinking) {
      return
    }

    // 取消AI搜索（如果正在進行）
    if (aiWorker && isAIThinking) {
      aiWorker.postMessage({ action: 'CANCEL_AI_SEARCH' })
      isAIThinking = false
    }

    // 撤銷AI的移動
    if (moveHistory.length > 0) {
      const lastMove = moveHistory.pop()
      gameBoard[lastMove.row][lastMove.col] = 0
      removeStone(lastMove.row, lastMove.col)
      totalMoves--
    }

    // 撤銷玩家的移動
    if (moveHistory.length > 0) {
      const lastMove = moveHistory.pop()
      gameBoard[lastMove.row][lastMove.col] = 0
      removeStone(lastMove.row, lastMove.col)
      totalMoves--
    }

    // 確保輪到玩家
    playerTurn = true
    updateGameStatus()
  }

  /**
   * 移除棋子
   */
  function removeStone(row, col) {
    const intersection = document.querySelector(
      `.board-intersection[data-row="${row}"][data-col="${col}"]`,
    )
    if (intersection) {
      while (intersection.firstChild) {
        intersection.removeChild(intersection.firstChild)
      }
    }
  }

  /**
   * 結束遊戲
   */
  function endGame(playerWon) {
    gameActive = false

    console.log('=== 開始endGame調試 ===')
    console.log('playerWon:', playerWon)

    // 記錄遊戲完成統計
    if (window.gameStatsManager) {
      let result = 'draw'
      if (playerWon === true) result = 'win'
      else if (playerWon === false) result = 'lose'

      // 使用await處理async方法
      window.gameStatsManager.recordGameCompleted('single-player', result)
    }

    // 停止計時器
    if (gameTimer) {
      clearInterval(gameTimer)
      gameTimer = null
    }

    // 顯示結束覆蓋層
    const endOverlay = document.querySelector('.game-end-overlay')
    console.log('endOverlay 找到:', endOverlay)
    if (endOverlay) {
      endOverlay.classList.remove('hidden')
      // 確保移除 overlay-hidden 類別並隱藏顯示按鈕
      endOverlay.classList.remove('overlay-hidden')
      if (singleShowOverlay) {
        singleShowOverlay.classList.remove('visible')
      }
      console.log('已移除 hidden class')
    } else {
      console.error('找不到 .game-end-overlay 元素')
    }

    // 準備結果訊息
    let resultText = ''

    if (playerWon === null) {
      resultText = i18n.t('Draw!')
    } else if (playerWon) {
      resultText = i18n.t('You Win!')
    } else {
      resultText = i18n.t('You Lose!')
    }

    console.log('準備設置的結果訊息:', resultText)

    // 使用多種方法更新結果訊息元素
    if (singleResultMessage) {
      console.log('找到 singleResultMessage 元素:', singleResultMessage)
      singleResultMessage.textContent = resultText
      singleResultMessage.innerHTML = resultText // 也試試innerHTML
      console.log('設置後的textContent:', singleResultMessage.textContent)
      console.log('設置後的innerHTML:', singleResultMessage.innerHTML)

      // 強制顯示
      singleResultMessage.style.display = 'block'
      singleResultMessage.style.visibility = 'visible'
    } else {
      console.error('找不到 singleResultMessage 元素')

      // 嘗試重新獲取
      const resultElement = document.getElementById('single-result-message')
      console.log('重新獲取的 single-result-message:', resultElement)
      if (resultElement) {
        resultElement.textContent = resultText
        console.log('使用重新獲取的元素設置訊息')
      }
    }

    // 更新統計數據
    if (singleMoves) {
      singleMoves.textContent = totalMoves
      console.log('更新 moves:', totalMoves)
    } else {
      console.error('找不到 singleMoves 元素')
    }

    if (singleTime) {
      const seconds = Math.floor(elapsedTime / 1000)
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      const timeText = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
      singleTime.textContent = timeText
      console.log('更新 time:', timeText)
    } else {
      console.error('找不到 singleTime 元素')
    }

    updateTurnIndicator()

    console.log('=== endGame調試結束 ===')
  }

  /**
   * 重新開始遊戲
   */
  function restartGame() {
    // 隱藏結束覆蓋層
    const endOverlay = document.querySelector('.game-end-overlay')
    if (endOverlay) {
      endOverlay.classList.add('hidden')
      // 確保移除 overlay-hidden 類別並隱藏顯示按鈕
      endOverlay.classList.remove('overlay-hidden')
      if (singleShowOverlay) {
        singleShowOverlay.classList.remove('visible')
      }
    }

    startGame()
  }

  /**
   * 再玩一局
   */
  function playAgain() {
    const gameEndOverlay = document.querySelector('.game-end-overlay')
    if (gameEndOverlay) {
      gameEndOverlay.classList.add('hidden')
      // 確保移除 overlay-hidden 類別並隱藏顯示按鈕
      gameEndOverlay.classList.remove('overlay-hidden')
      if (singleShowOverlay) {
        singleShowOverlay.classList.remove('visible')
      }
    }

    startGame()
  }

  /**
   * 隱藏遊戲結束彈窗
   */
  function hideGameEndOverlay() {
    const gameEndOverlay = document.querySelector('.game-end-overlay')
    if (!gameEndOverlay) return

    // 隱藏彈窗內容並顯示顯示按鈕
    gameEndOverlay.classList.add('overlay-hidden')
    if (singleShowOverlay) {
      singleShowOverlay.classList.add('visible')
    }
  }

  /**
   * 顯示遊戲結束彈窗
   */
  function showGameEndOverlay() {
    const gameEndOverlay = document.querySelector('.game-end-overlay')
    if (!gameEndOverlay) return

    // 顯示彈窗內容並隱藏顯示按鈕
    gameEndOverlay.classList.remove('overlay-hidden')
    if (singleShowOverlay) {
      singleShowOverlay.classList.remove('visible')
    }
  }

  // 初始化棋盤
  createBoard()
})
