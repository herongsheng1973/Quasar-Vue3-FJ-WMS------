// src/composables/useGomokuGame.js

import { ref, onMounted } from 'vue'

export function useGomokuGame({
  boardElement,
  startGameBtn,
  restartBtn,
  undoBtn,
  playAgainBtn,
  backHomeBtn,
  difficultySelector,
  timerElement,
  turnIndicatorElement,
  resultMessageElement,
  movesElement,
  timeElement,
  hideOverlayElement,
  showOverlayElement,
}) {
  // 响应式状态
  const gameActive = ref(false)
  const playerTurn = ref(true)
  const gameBoard = ref([])
  const moveHistory = ref([])
  const gameStartTime = ref(null)
  const gameTimer = ref(null)
  const elapsedTime = ref(0)
  const difficulty = ref('medium')
  const totalMoves = ref(0)

  const BOARD_SIZE = 15
  const PLAYER_STONE = 1
  const COMPUTER_STONE = 2

  let aiWorker = null
  let isAIThinking = false

  // 初始化棋盘
  function initBoard() {
    gameBoard.value = Array.from({ length: BOARD_SIZE }, () =>
      Array.from({ length: BOARD_SIZE }, () => 0),
    )
  }

  // 设置 AI Worker
  function setupAIWorker() {
    try {
      aiWorker = new Worker(new URL('@/assets/js/ai-worker-v2.js', import.meta.url), {
        type: 'module',
      })

      aiWorker.onmessage = (e) => {
        const { type, move, depth, time, elapsed } = e.data
        console.log('收到Worker消息:', type, move, depth, time, elapsed)
        switch (type) {
          case 'AI_PROGRESS':
            turnIndicatorElement.textContent = `AI Thinking... (Depth ${depth})`
            break
          case 'AI_MOVE_FOUND':
            isAIThinking = false
            if (move && gameActive.value && !playerTurn.value) {
              executeComputerMove(move)
            } else {
              useFallbackAI()
            }
            break
          case 'AI_SEARCH_CANCELLED':
            isAIThinking = false
            break
        }
      }

      aiWorker.onerror = (error) => {
        console.error('AI Worker error:', error)
        isAIThinking = false
        if (!playerTurn.value && gameActive.value) {
          useFallbackAI()
        }
      }
    } catch (error) {
      console.error('Failed to create AI Worker:', error)
      aiWorker = null
    }
  }

  // 设置事件监听器
  function setupEventListeners() {
    if (startGameBtn) startGameBtn.addEventListener('click', startGame)
    if (restartBtn) restartBtn.addEventListener('click', restartGame)
    if (undoBtn) undoBtn.addEventListener('click', undoMove)
    if (playAgainBtn) playAgainBtn.addEventListener('click', playAgain)
    if (backHomeBtn) backHomeBtn.addEventListener('click', () => window.history.back())
    if (hideOverlayElement) hideOverlayElement.addEventListener('click', hideGameEndOverlay)
    if (showOverlayElement) showOverlayElement.addEventListener('click', showGameEndOverlay)
    if (difficultySelector)
      difficultySelector.addEventListener('change', (e) => (difficulty.value = e.target.value))
  }

  // 开始游戏
  function startGame() {
    if (!difficultySelector) return

    difficulty.value = difficultySelector.value
    resetGame()
    gameActive.value = true
    gameStartTime.value = Date.now()

    const startOverlay = document.querySelector('.game-start-overlay')
    if (startOverlay) startOverlay.classList.add('hidden')

    startTimer()
    updateGameStatus()
    showDifficultyInfo()
  }

  // 显示难度信息
  function showDifficultyInfo() {
    const difficultyInfo = {
      easy: 'Easy Mode: AI makes some mistakes, suitable for beginners',
      medium: 'Medium Mode: AI has strategic thinking, suitable for general players',
      hard: 'Hard Mode: AI uses advanced algorithms, extremely challenging!',
    }

    if (resultMessageElement) {
      resultMessageElement.innerHTML = `
        <div class="difficulty-info">
          <strong>${difficultyInfo[difficulty.value]}</strong><br>
          <span style="color: #4CAF50; font-size: 0.9em;">🚀 Background AI: Maximum strength, smooth UI</span>
        </div>
      `
      resultMessageElement.style.display = 'block'

      setTimeout(() => {
        if (gameActive.value) {
          resultMessageElement.style.display = 'none'
        }
      }, 5000)
    }
  }

  // 重置游戏
  function resetGame() {
    gameActive.value = false
    playerTurn.value = true
    totalMoves.value = 0
    moveHistory.value = []
    elapsedTime.value = 0

    if (gameTimer.value) {
      clearInterval(gameTimer.value)
      gameTimer.value = null
    }

    const startOverlay = document.querySelector('.game-start-overlay')
    if (startOverlay) startOverlay.classList.remove('hidden')

    const endOverlay = document.querySelector('.game-end-overlay')
    if (endOverlay) endOverlay.classList.add('hidden')

    initBoard()
    clearBoard()
    updateGameStatus()

    if (resultMessageElement) {
      resultMessageElement.style.display = 'none'
    }
  }

  // 创建棋盘
  function createBoard() {
    if (!boardElement) return

    boardElement.innerHTML = ''
    const gridContainer = document.createElement('div')
    gridContainer.classList.add('board-grid-container')
    boardElement.appendChild(gridContainer)

    // 创建水平线
    for (let i = 0; i < BOARD_SIZE; i++) {
      const hLine = document.createElement('div')
      hLine.classList.add('h-line')
      const position = (i / (BOARD_SIZE - 1)) * 100
      hLine.style.top = `${position}%`
      gridContainer.appendChild(hLine)
    }

    // 创建垂直线
    for (let i = 0; i < BOARD_SIZE; i++) {
      const vLine = document.createElement('div')
      vLine.classList.add('v-line')
      const position = (i / (BOARD_SIZE - 1)) * 100
      vLine.style.left = `${position}%`
      gridContainer.appendChild(vLine)
    }

    // 创建交叉点
    for (let i = 0; i < BOARD_SIZE; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        const intersection = document.createElement('div')
        intersection.classList.add('board-intersection')
        intersection.dataset.row = i
        intersection.dataset.col = j
        intersection.style.left = `${(j / (BOARD_SIZE - 1)) * 100}%`
        intersection.style.top = `${(i / (BOARD_SIZE - 1)) * 100}%`
        intersection.addEventListener('click', () => {
          if (gameActive.value && playerTurn.value) {
            const row = parseInt(intersection.dataset.row)
            const col = parseInt(intersection.dataset.col)
            makeMove(row, col)
          }
        })
        gridContainer.appendChild(intersection)
      }
    }

    // 添加星位
    const starPoints = [
      { row: 3, col: 3 },
      { row: 3, col: 11 },
      { row: 7, col: 7 },
      { row: 11, col: 3 },
      { row: 11, col: 11 },
    ]

    starPoints.forEach((point) => {
      const star = document.createElement('div')
      star.classList.add('board-point')
      star.style.left = `${(point.col / (BOARD_SIZE - 1)) * 100}%`
      star.style.top = `${(point.row / (BOARD_SIZE - 1)) * 100}%`
      gridContainer.appendChild(star)
    })
  }

  // 清除棋盘
  function clearBoard() {
    createBoard()
  }

  // 开始计时器
  function startTimer() {
    gameTimer.value = setInterval(() => {
      elapsedTime.value = Date.now() - gameStartTime.value
      updateTimer()
    }, 1000)
  }

  // 更新计时器显示
  function updateTimer() {
    if (timerElement) {
      const seconds = Math.floor(elapsedTime.value / 1000)
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      timerElement.textContent = `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
    }
  }

  // 更新游戏状态
  function updateGameStatus() {
    updateTurnIndicator()
    updateMoveCount()
    updateTimer()
  }

  // 更新回合指示器
  function updateTurnIndicator() {
    if (turnIndicatorElement) {
      turnIndicatorElement.textContent = playerTurn.value ? 'Your Turn' : 'AI Thinking...'
      turnIndicatorElement.className = playerTurn.value
        ? 'turn-indicator player-turn'
        : 'turn-indicator ai-turn'
    }
  }

  // 更新步数
  function updateMoveCount() {
    if (movesElement) movesElement.textContent = totalMoves.value
    if (timeElement) timeElement.textContent = `${Math.floor(elapsedTime.value / 1000)}s`
  }

  // 玩家落子
  function makeMove(row, col) {
    if (gameBoard.value[row][col] !== 0) return

    gameBoard.value[row][col] = PLAYER_STONE
    placeStone(row, col, PLAYER_STONE)

    moveHistory.value.push({ row, col, player: PLAYER_STONE })
    totalMoves.value++

    if (checkWin(row, col, PLAYER_STONE)) {
      endGame(true)
      return
    }

    if (checkDraw()) {
      endGame(null)
      return
    }

    playerTurn.value = false
    updateTurnIndicator()

    const thinkingTime =
      difficulty.value === 'hard' ? 1000 : difficulty.value === 'medium' ? 700 : 500
    setTimeout(computerMove, thinkingTime)
  }

  // 电脑落子
  function computerMove() {
    if (!gameActive.value || playerTurn.value || isAIThinking) return

    isAIThinking = true
    updateTurnIndicator()

    if (aiWorker) {
      try {
        const boardCopy = gameBoard.value.map((row) => [...row])
        aiWorker.postMessage({
          action: 'START_AI_SEARCH',
          data: {
            board: boardCopy,
            difficulty: difficulty.value,
          },
        })

        setTimeout(() => {
          if (isAIThinking && !playerTurn.value && gameActive.value) {
            isAIThinking = false
            if (aiWorker) {
              aiWorker.postMessage({ action: 'CANCEL_AI_SEARCH' })
            }
            useFallbackAI()
          }
        }, 15000)
      } catch (error) {
        console.error('Web Worker error:', error)
        isAIThinking = false
        useFallbackAI()
      }
    } else {
      useFallbackAI()
    }
  }

  // 使用 fallback AI
  function useFallbackAI() {
    if (!gameActive.value || playerTurn.value) return

    if (!isAIThinking) {
      isAIThinking = true
      updateTurnIndicator()
    }

    setTimeout(() => {
      try {
        const move = fallbackAI(gameBoard.value, difficulty.value)
        isAIThinking = false

        if (move && gameActive.value && !playerTurn.value) {
          executeComputerMove(move)
        } else if (!move) {
          endGame(null)
        } else {
          playerTurn.value = true
          updateTurnIndicator()
        }
      } catch (error) {
        console.error('Fallback AI error:', error)
        isAIThinking = false
        playerTurn.value = true
        updateTurnIndicator()
      }
    }, 500)
  }

  // Fallback AI
  function fallbackAI(board, difficulty) {
    const winMove = findWinMove(board, COMPUTER_STONE)
    if (winMove) return winMove

    const blockMove = findWinMove(board, PLAYER_STONE)
    if (blockMove) return blockMove

    const candidates = getCandidateMoves(board)
    if (candidates.length === 0) return null

    const randomFactor = difficulty === 'easy' ? 0.3 : difficulty === 'medium' ? 0.1 : 0.05
    if (Math.random() < randomFactor) {
      const randomIndex = Math.floor(Math.random() * Math.min(candidates.length, 5))
      return candidates[randomIndex]
    }

    return candidates[0]
  }

  // 寻找获胜移动
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

  // 获取候选移动
  function getCandidateMoves(board) {
    const moves = []
    const occupied = []

    for (let i = 0; i < BOARD_SIZE; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        if (board[i][j] !== 0) {
          occupied.push({ row: i, col: j })
        }
      }
    }

    if (occupied.length === 0) {
      const center = Math.floor(BOARD_SIZE / 2)
      return [{ row: center, col: center }]
    }

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

    for (const pos of candidateSet) {
      const [row, col] = pos.split(',').map(Number)
      const score = evaluateMoveSimple(board, row, col)
      moves.push({ row, col, score })
    }

    moves.sort((a, b) => b.score - a.score)
    return moves
  }

  // 评估移动
  function evaluateMoveSimple(board, row, col) {
    let score = 0
    board[row][col] = COMPUTER_STONE
    score += evaluatePositionSimple(board, row, col, COMPUTER_STONE) * 1.1
    board[row][col] = 0

    board[row][col] = PLAYER_STONE
    score += evaluatePositionSimple(board, row, col, PLAYER_STONE) * 0.9
    board[row][col] = 0

    return score
  }

  // 评估位置
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

      for (let i = 1; i < 5; i++) {
        const r = row + i * dx
        const c = col + i * dy
        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
          if (board[r][c] === player) count++
          else if (board[r][c] !== 0) {
            blocked++
            break
          } else break
        } else {
          blocked++
          break
        }
      }

      for (let i = 1; i < 5; i++) {
        const r = row - i * dx
        const c = col - i * dy
        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
          if (board[r][c] === player) count++
          else if (board[r][c] !== 0) {
            blocked++
            break
          } else break
        } else {
          blocked++
          break
        }
      }

      if (count >= 5) score += 100000
      else if (count === 4 && blocked === 0) score += 10000
      else if (count === 4 && blocked === 1) score += 1000
      else if (count === 3 && blocked === 0) score += 1000
      else if (count === 3 && blocked === 1) score += 100
      else if (count === 2 && blocked === 0) score += 100
      else score += count
    }

    return score
  }

  // 执行电脑移动
  function executeComputerMove(move) {
    gameBoard.value[move.row][move.col] = COMPUTER_STONE
    placeStone(move.row, move.col, COMPUTER_STONE)

    moveHistory.value.push({ row: move.row, col: move.col, player: COMPUTER_STONE })
    totalMoves.value++

    if (checkWin(move.row, move.col, COMPUTER_STONE)) {
      endGame(false)
      return
    }

    if (checkDraw()) {
      endGame(null)
      return
    }

    playerTurn.value = true
    updateTurnIndicator()
  }

  // 放置棋子
  function placeStone(row, col, player) {
    const intersection = document.querySelector(
      `.board-intersection[data-row="${row}"][data-col="${col}"]`,
    )
    if (!intersection) return

    while (intersection.firstChild) {
      intersection.removeChild(intersection.firstChild)
    }

    const stone = document.createElement('div')
    stone.classList.add('stone')
    stone.classList.add(player === PLAYER_STONE ? 'black-stone' : 'white-stone')
    intersection.appendChild(stone)
  }

  // 检查胜利
  function checkWin(row, col, player) {
    return (
      checkDirection(row, col, 1, 0, player) ||
      checkDirection(row, col, 0, 1, player) ||
      checkDirection(row, col, 1, 1, player) ||
      checkDirection(row, col, 1, -1, player)
    )
  }

  // 检查方向
  function checkDirection(row, col, dx, dy, player) {
    let count = 1
    for (let i = 1; i < 5; i++) {
      const r = row + i * dx
      const c = col + i * dy
      if (
        r >= 0 &&
        r < BOARD_SIZE &&
        c >= 0 &&
        c < BOARD_SIZE &&
        gameBoard.value[r][c] === player
      ) {
        count++
      } else break
    }

    for (let i = 1; i < 5; i++) {
      const r = row - i * dx
      const c = col - i * dy
      if (
        r >= 0 &&
        r < BOARD_SIZE &&
        c >= 0 &&
        c < BOARD_SIZE &&
        gameBoard.value[r][c] === player
      ) {
        count++
      } else break
    }

    return count >= 5
  }

  // 检查平局
  function checkDraw() {
    return gameBoard.value.every((row) => row.every((cell) => cell !== 0))
  }

  // 撤销一步
  function undoMove() {
    if (!gameActive.value || moveHistory.value.length < 2 || isAIThinking) return

    if (aiWorker && isAIThinking) {
      aiWorker.postMessage({ action: 'CANCEL_AI_SEARCH' })
      isAIThinking = false
    }

    if (moveHistory.value.length > 0) {
      const lastMove = moveHistory.value.pop()
      gameBoard.value[lastMove.row][lastMove.col] = 0
      removeStone(lastMove.row, lastMove.col)
      totalMoves.value--
    }

    if (moveHistory.value.length > 0) {
      const lastMove = moveHistory.value.pop()
      gameBoard.value[lastMove.row][lastMove.col] = 0
      removeStone(lastMove.row, lastMove.col)
      totalMoves.value--
    }

    playerTurn.value = true
    updateGameStatus()
  }

  // 移除棋子
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

  // 结束游戏
  function endGame(playerWon) {
    gameActive.value = false

    if (gameTimer.value) {
      clearInterval(gameTimer.value)
      gameTimer.value = null
    }

    const endOverlay = document.querySelector('.game-end-overlay')
    if (endOverlay) {
      endOverlay.classList.remove('hidden')
      endOverlay.classList.remove('overlay-hidden')
      if (showOverlayElement) showOverlayElement.classList.remove('visible')
    }

    let resultText = ''
    if (playerWon === null) resultText = 'Draw!'
    else if (playerWon) resultText = 'You Win!'
    else resultText = 'You Lose!'

    if (resultMessageElement) {
      resultMessageElement.textContent = resultText
      resultMessageElement.style.display = 'block'
      resultMessageElement.style.visibility = 'visible'
    }

    if (movesElement) movesElement.textContent = totalMoves.value
    if (timeElement) {
      const seconds = Math.floor(elapsedTime.value / 1000)
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      timeElement.textContent = `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
    }

    updateTurnIndicator()
  }

  // 重新开始
  function restartGame() {
    const endOverlay = document.querySelector('.game-end-overlay')
    if (endOverlay) {
      endOverlay.classList.add('hidden')
      endOverlay.classList.remove('overlay-hidden')
      if (showOverlayElement) showOverlayElement.classList.remove('visible')
    }

    startGame()
  }

  // 再玩一次
  function playAgain() {
    const endOverlay = document.querySelector('.game-end-overlay')
    if (endOverlay) {
      endOverlay.classList.add('hidden')
      endOverlay.classList.remove('overlay-hidden')
      if (showOverlayElement) showOverlayElement.classList.remove('visible')
    }

    startGame()
  }

  // 隐藏游戏结束弹窗
  function hideGameEndOverlay() {
    const endOverlay = document.querySelector('.game-end-overlay')
    if (endOverlay) {
      endOverlay.classList.add('overlay-hidden')
      if (showOverlayElement) showOverlayElement.classList.add('visible')
    }
  }

  // 显示游戏结束弹窗
  function showGameEndOverlay() {
    const endOverlay = document.querySelector('.game-end-overlay')
    if (endOverlay) {
      endOverlay.classList.remove('overlay-hidden')
      if (showOverlayElement) showOverlayElement.classList.remove('visible')
    }
  }

  // 初始化游戏
  function initGame() {
    setupAIWorker()
    setupEventListeners()
    initBoard()
    createBoard()
  }

  // 在挂载时初始化
  onMounted(() => {
    initGame()
  })

  // 返回所有方法和状态
  return {
    gameActive,
    playerTurn,
    totalMoves,
    elapsedTime,
    difficulty,
    startGame,
    restartGame,
    playAgain,
    undoMove,
    hideGameEndOverlay,
    showGameEndOverlay,
  }
}
