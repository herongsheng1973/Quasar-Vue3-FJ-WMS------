<template>
  <q-page class="flex flex-center">
    <!-- Main Game Container -->
    <div class="container q-pa-md">
      <div class="game-container bg-white text-black rounded-xl q-pa-xl">
        <div class="game-header row justify-between items-center">
          <div class="gt-sm">
            <q-btn-dropdown flat label="菜单">
              <q-list>
                <q-item clickable v-close-popup to="/">首页</q-item>
                <q-item clickable v-close-popup to="/gobang" class="active">单人游戏</q-item>
                <q-item clickable v-close-popup to="/gobang">在线对战</q-item>
                <q-item clickable v-close-popup to="/gobang">排行榜</q-item>
                <q-item clickable v-close-popup to="/how-to-play">游戏规则</q-item>
              </q-list>
            </q-btn-dropdown>
          </div>

          <h2 class="text-h4 text-bold">单人游戏</h2>
          <div class="difficulty-selector">
            <q-select v-model="difficulty" :options="difficultyOptions" label="难度级别" dense outlined emit-value
              map-options style="width: 150px;" id="difficulty" />
          </div>
        </div>

        <!-- Game Board -->
        <div class="game-board-container q-mt-md">
          <div v-if="!gameStarted" class="game-start-overlay" id="single-start-game">
            <div class="game-start-content text-center">
              <h3 class="text-h5">准备好开始游戏了吗？</h3>
              <p>点击下方按钮开始游戏</p>
              <q-btn color="primary" label="开始游戏" @click="startGame" />
            </div>
          </div>

          <div v-else class="game-board bg-grey-3 rounded-xl q-pa-md shadow-6" id="single-player-board">
            <div ref="gameCanvas" class="cursor-pointer" style="width: 100%; height: 600px; display: block;"></div>
            <div class="game-status text-center q-pt-md">
              <p class="text-bold" id="single-player-turn">{{ turnIndicatorText }}</p>
            </div>
          </div>

          <!-- Game End Overlay -->
          <div v-if="gameEnded" class="game-end-overlay hidden" id="single-end-overlay">
            <div class="game-end-content bg-white text-black rounded-xl q-pa-md shadow-6">
              <h4 class="text-h5" id="single-result-message">{{ resultMessage }}</h4>
              <div class="game-stats row justify-around q-mt-md">
                <div class="stat">
                  <span class="text-bold">步数：</span>
                  <span id="single-moves">{{ totalMoves }}</span>
                </div>
                <div class="stat">
                  <span class="text-bold">时间：</span>
                  <span id="single-time">{{ gameTime }}</span>
                </div>
              </div>
              <div class="game-end-buttons q-mt-md">
                <q-btn label="再玩一次" icon="refresh" color="primary" id="single-play-again" @click="playAgain" />
                <q-btn label="返回首页" icon="home" color="secondary" id="single-back-home" @click="backHome" />
              </div>
            </div>
          </div>
        </div>

        <!-- Game Info -->
        <div class="game-info row justify-between q-mt-xl">
          <div class="player-info column items-center">
            <div class="player-avatar q-mb-sm">
              <q-icon name="person" size="lg" />
            </div>
            <h6 class="text-subtitle1">玩家</h6>
            <div class="stone black-stone" style="width: 20px; height: 20px; background: black; border-radius: 50%;">
            </div>
          </div>

          <div class="game-status column items-center">
            <div class="timer q-mb-sm">
              <q-icon name="access_time" />
              <span class="q-ml-sm" id="single-player-timer">{{ gameTime }}</span>
            </div>
            <div class="turn-indicator" id="single-player-turn">{{ turnIndicatorText }}</div>
            <!-- Game Controls -->
            <div class="game-controls q-mt-xl row justify-center q-gutter-md">
              <q-btn label="重新开始" icon="refresh" color="secondary" id="single-restart" @click="restartGame" />
              <q-btn label="悔棋" icon="undo" color="secondary" id="single-undo" @click="undoMove" />
            </div>
          </div>

          <div class="player-info column items-center">
            <div class="player-avatar q-mb-sm">
              <q-icon name="smart_toy" size="lg" />
            </div>
            <h6 class="text-subtitle1">电脑</h6>
            <div class="stone white-stone"
              style="width: 20px; height: 20px; background: white; border: 1px solid #ccc; border-radius: 50%;"></div>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'

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

// UI 状态
const gameStarted = ref(false)
const gameEnded = ref(false)
const resultMessage = ref('')
const turnIndicatorText = ref('点击开始游戏')
const difficultyOptions = [
  { label: '简单', value: 'easy' },
  { label: '中等', value: 'medium' },
  { label: '困难', value: 'hard' }
]

// DOM Refs
const gameCanvas = ref(null)
//const singlePlayerTurn = ref(null)
const singleResultMessage = ref(null)
const singleMoves = ref(null)
const singleTime = ref(null)
const singlePlayerTimer = ref(null)

// 常量
const BOARD_SIZE = 15
const PLAYER_STONE = 1
const COMPUTER_STONE = 2

// Worker
let aiWorker = null
let isAIThinking = false

// 初始化棋盘
function initBoard() {
  gameBoard.value = Array.from({ length: BOARD_SIZE }, () => Array.from({ length: BOARD_SIZE }, () => 0))
}

// 设置 AI Worker
function setupAIWorker() {
  try {
    aiWorker = new Worker(new URL('../../assets/js/ai-worker-v2.js', import.meta.url), { type: 'module' })

    aiWorker.onmessage = (e) => {
      const { type, move, depth } = e.data
      switch (type) {
        case 'AI_PROGRESS':
          turnIndicatorText.value = `AI 思考中 (深度 ${depth})`
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
      console.error('AI Worker 错误:', error)
      isAIThinking = false
      useFallbackAI()
    }
  } catch (error) {
    console.error('无法创建AI Worker:', error)
    aiWorker = null
  }
}

// 开始游戏
function startGame() {
  difficulty.value = document.getElementById('difficulty').value
  resetGame()
  gameActive.value = true
  gameStartTime.value = Date.now()

  const startOverlay = document.querySelector('.game-start-overlay')
  if (startOverlay) startOverlay.classList.add('hidden')

  startTimer()
  updateGameStatus()
  showDifficultyInfo()

  gameStarted.value = true
}

// 显示难度信息
function showDifficultyInfo() {
  const infoMap = {
    easy: '简单: AI 会犯一些错误，适合新手',
    medium: '中等: AI 有策略思考，适合普通玩家',
    hard: '困难: AI 使用高级算法，极具挑战！'
  }

  resultMessage.value = `
    <div class="difficulty-info">
      <strong>${infoMap[difficulty.value]}</strong><br>
      <span style="color:#4CAF50">🚀 后台AI：最大强度，无卡顿</span>
    </div>
  `

  singleResultMessage.value.innerHTML = resultMessage.value
  singleResultMessage.value.style.display = 'block'

  setTimeout(() => {
    if (gameActive.value) {
      singleResultMessage.value.style.display = 'none'
    }
  }, 5000)
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

  resultMessage.value = ''
}

// 创建棋盘
function createBoard() {
  if (!gameCanvas.value) return
  const container = gameCanvas.value
  container.innerHTML = ''
  const gridContainer = document.createElement('div')
  gridContainer.classList.add('board-grid-container')
  container.appendChild(gridContainer)

  // 水平线
  for (let i = 0; i < BOARD_SIZE; i++) {
    const hLine = document.createElement('div')
    hLine.classList.add('h-line')
    hLine.style.top = `${(i / (BOARD_SIZE - 1)) * 100}%`
    gridContainer.appendChild(hLine)
  }

  // 垂直线
  for (let i = 0; i < BOARD_SIZE; i++) {
    const vLine = document.createElement('div')
    vLine.classList.add('v-line')
    vLine.style.left = `${(i / (BOARD_SIZE - 1)) * 100}%`
    gridContainer.appendChild(vLine)
  }

  // 交叉点
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

  // 星位
  const starPoints = [
    { row: 3, col: 3 },
    { row: 3, col: 11 },
    { row: 7, col: 7 },
    { row: 11, col: 3 },
    { row: 11, col: 11 }
  ]

  starPoints.forEach(point => {
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
  if (gameTimer.value) clearInterval(gameTimer.value)
  gameTimer.value = setInterval(() => {
    elapsedTime.value = Date.now() - gameStartTime.value
    updateTimer()
  }, 1000)
}

// 更新计时器显示
function updateTimer() {
  const seconds = Math.floor(elapsedTime.value / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  singlePlayerTimer.value.textContent = `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
}

// 更新游戏状态
function updateGameStatus() {
  updateTurnIndicator()
  updateMoveCount()
}

// 更新回合指示器
function updateTurnIndicator() {
  turnIndicatorText.value = playerTurn.value ? '你的回合' : 'AI 思考中...'
}

// 更新步数
function updateMoveCount() {
  if (singleMoves.value) singleMoves.value.textContent = totalMoves.value
  if (singleTime.value) singleTime.value.textContent = `${Math.floor(elapsedTime.value / 1000)}s`
}

// 玩家落子
function makeMove(row, col) {
  if (gameBoard.value[row][col] !== 0 || !gameActive.value || !playerTurn.value) return

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
      const boardCopy = gameBoard.value.map(row => [...row])
      aiWorker.postMessage({
        action: 'START_AI_SEARCH',
        data: {
          board: boardCopy,
          difficulty: difficulty.value
        }
      })

      // 超时 fallback
      setTimeout(() => {
        if (isAIThinking) {
          isAIThinking = false
          useFallbackAI()
        }
      }, 15000)
    } catch (error) {
      console.error('Web Worker 错误:', error)
      isAIThinking = false
      useFallbackAI()
    }
  } else {
    useFallbackAI()
  }
}

// Fallback AI
function useFallbackAI() {
  if (!gameActive.value || playerTurn.value) return

  const move = fallbackAI(gameBoard.value, difficulty.value)
  isAIThinking = false
  if (move) {
    executeComputerMove(move)
  } else {
    endGame(null)
  }
}

// Fallback AI 实现
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

// 查找获胜移动
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
  const occupied = []
  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      if (board[i][j] !== 0) occupied.push({ row: i, col: j })
    }
  }

  if (occupied.length === 0) {
    const center = Math.floor(BOARD_SIZE / 2)
    return [{ row: center, col: center }]
  }

  const candidateSet = new Set()
  for (const { row, col } of occupied) {
    for (let di = -2; di <= 2; di++) {
      for (let dj = -2; dj <= 2; dj++) {
        const ni = row + di
        const nj = col + dj
        if (ni >= 0 && ni < BOARD_SIZE && nj >= 0 && nj < BOARD_SIZE && board[ni][nj] === 0) {
          candidateSet.add(`${ni},${nj}`)
        }
      }
    }
  }

  const scoredMoves = []
  for (const pos of candidateSet) {
    const [row, col] = pos.split(',').map(Number)
    const score = evaluateMoveSimple(board, row, col)
    scoredMoves.push({ row, col, score })
  }

  return scoredMoves.sort((a, b) => b.score - a.score)
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
  const directions = [[0, 1], [1, 0], [1, 1], [1, -1]]

  for (const [dx, dy] of directions) {
    let count = 1
    for (let i = 1; i < 5; i++) {
      const r = row + i * dx
      const c = col + i * dy
      if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) count++
      else break
    }

    for (let i = 1; i < 5; i++) {
      const r = row - i * dx
      const c = col - i * dy
      if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) count++
      else break
    }

    if (count >= 5) score += 100000
    else if (count === 4) score += 10000
    else if (count === 3) score += 1000
    else if (count === 2) score += 100
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
    `.board-intersection[data-row="${row}"][data-col="${col}"]`
  )
  if (!intersection) return

  intersection.innerHTML = ''
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
    if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && gameBoard.value[r][c] === player) count++
    else break
  }

  for (let i = 1; i < 5; i++) {
    const r = row - i * dx
    const c = col - i * dy
    if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && gameBoard.value[r][c] === player) count++
    else break
  }

  return count >= 5
}

// 检查平局
function checkDraw() {
  return gameBoard.value.every(row => row.every(cell => cell !== 0))
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
    const resultText = playerWon === null ? '平局' : playerWon ? '你赢了！' : '你输了！'
    singleResultMessage.value.textContent = resultText
    singleResultMessage.value.style.display = 'block'
  }
}

// 重新开始
function restartGame() {
  const endOverlay = document.querySelector('.game-end-overlay')
  if (endOverlay) {
    endOverlay.classList.add('hidden')
  }
  startGame()
}

// 再玩一次
function playAgain() {
  restartGame()
}

// 返回首页
function backHome() {
  window.history.back()
}

// 撤销一步
function undoMove() {
  if (!gameActive.value || moveHistory.value.length < 2 || isAIThinking) return

  if (aiWorker && isAIThinking) {
    aiWorker.postMessage({ action: 'CANCEL_AI_SEARCH' })
    isAIThinking = false
  }

  const lastMove = moveHistory.value.pop()
  const prevMove = moveHistory.value.pop()
  gameBoard.value[lastMove.row][lastMove.col] = 0
  gameBoard.value[prevMove.row][prevMove.col] = 0
  removeStone(lastMove.row, lastMove.col)
  removeStone(prevMove.row, prevMove.col)
  totalMoves.value -= 2
  playerTurn.value = true
  updateGameStatus()
}

// 移除棋子
function removeStone(row, col) {
  const intersection = document.querySelector(
    `.board-intersection[data-row="${row}"][data-col="${col}"]`
  )
  if (intersection) {
    intersection.innerHTML = ''
  }
}

// 挂载时初始化
onMounted(() => {
  setupAIWorker()
})

// 卸载时清理
onBeforeUnmount(() => {
  if (gameTimer.value) clearInterval(gameTimer.value)
  if (aiWorker) aiWorker.terminate()
})

// 计算时间显示
const gameTime = computed(() => {
  const seconds = Math.floor(elapsedTime.value / 1000)
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
})
</script>

<style scoped>
/* 保留你原来的样式 */
.container {
  padding: 20px;
  margin: 0 auto;
  width: 1200px;
  background-color: #fff;
}

.game-container {
  max-width: 800px;
  margin: 0 auto;
}

.game-board-container {
  position: relative;
  background-color: #daa06d;
  border-radius: 4px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.3);
  aspect-ratio: 1 / 1;
  max-width: 600px;
  margin: 0 auto 40px;
  padding: 0;
  box-sizing: border-box;
  overflow: visible;
  border: 10px solid #c49665;
}

.game-board {
  position: relative;
  width: 100%;
  height: 100%;
  display: block;
  box-sizing: border-box;
}

.board-grid-container {
  position: absolute;
  top: 8%;
  left: 8%;
  width: 84%;
  height: 84%;
  background-color: transparent;
}

.h-line,
.v-line {
  position: absolute;
  width: 1px;
  height: 1px;
  background-color: rgba(0, 0, 0, 0.7);
  pointer-events: none;
}

.board-point {
  position: absolute;
  width: 6px;
  height: 6px;
  background-color: rgba(0, 0, 0, 0.8);
  transform: translate(-50%, -50%);
  z-index: 2;
  pointer-events: none;
  border-radius: 2px;
}

.board-intersection {
  position: absolute;
  width: 5.7%;
  height: 5.7%;
  transform: translate(-50%, -50%);
  z-index: 3;
  cursor: pointer;
  border-radius: 50%;
}

.board-intersection:hover::before {
  content: "";
  position: absolute;
  width: 80%;
  height: 80%;
  background-color: rgba(0, 0, 0, 0.15);
  border-radius: 50%;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 1;
}

.stone {
  position: absolute;
  width: 90%;
  height: 90%;
  border-radius: 50%;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 4;
  pointer-events: none;
}

.black-stone {
  background: radial-gradient(circle at 30% 30%, #333, #000);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  border: 1px solid #111;
}

.white-stone {
  background: radial-gradient(circle at 30% 30%, #fff, #eee);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  border: 1px solid #d0d0d0;
}

.game-end-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
  border-radius: 8px;
}
</style>
