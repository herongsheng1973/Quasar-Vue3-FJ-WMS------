<template>
  <!-- Main Game Container -->
  <div class="container q-pa-md">
    <div class="game-container bg-white text-black rounded-xl q-pa-xl">
      <div class="game-header row justify-between items-center">
        <div class="gt-sm">
          <q-btn-dropdown flat label="菜单">
            <q-list>
              <q-item clickable v-close-popup to="/">首页</q-item>
              <q-item clickable v-close-popup to="/single-player" class="active">单人游戏</q-item>
              <q-item clickable v-close-popup to="/online-battle">在线对战</q-item>
              <q-item clickable v-close-popup to="/leaderboard">排行榜</q-item>
              <q-item clickable v-close-popup to="/how-to-play">游戏规则</q-item>
            </q-list>
          </q-btn-dropdown>
        </div>

        <h2 class="text-h4 text-bold">单人游戏</h2>
        <div class="difficulty-selector">
          <q-select v-model="difficulty" :options="difficultyOptions" label="难度级别" dense outlined emit-value map-options
            style="width: 150px;" id="difficulty" />
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
            <p class="text-bold" id="single-player-turn">点击开始游戏</p>
          </div>
        </div>

        <!-- Game End Overlay -->
        <div v-if="gameEnded" class="game-end-overlay hidden" id="single-end-overlay">
          <div class="game-end-content bg-white text-black rounded-xl q-pa-md shadow-6">
            <h4 class="text-h5" id="single-result-message">{{ difficultyInfo }}</h4>
            <div class="game-stats row justify-around q-mt-md">
              <div class="stat">
                <span class="text-bold">步数：</span>
                <span id="single-moves">{{ moveCount }}</span>
              </div>
              <div class="stat">
                <span class="text-bold">时间：</span>
                <span id="single-time">{{ gameTime }}</span>
              </div>
            </div>
            <div class="game-end-buttons q-mt-md">
              <q-btn label="再玩一次" icon="refresh" color="primary" id="single-play-again" />
              <q-btn label="返回首页" icon="home" color="secondary" id="single-back-home" />
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
          <div class="turn-indicator" id="single-player-turn">点击开始游戏</div>
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
</template>
<script setup>
import { ref, onMounted } from 'vue'
const difficultyInfo = ref('')
// DOM refs
const gameCanvas = ref(null)
const difficulty = ref('medium')
const difficultyOptions = [
  { label: '简单', value: 'easy' },
  { label: '中等', value: 'medium' },
  { label: '困难', value: 'hard' }
]

// Game state
let gameActive = false
let playerTurn = true
let gameBoard = []
let moveHistory = []
let gameStartTime = 0
let elapsedTime = 0
let gameTimer = null
let totalMoves = 0
let isAIThinking = false
let aiWorker = null

const BOARD_SIZE = 15
const PLAYER_STONE = 1
const COMPUTER_STONE = 2

// Game control refs
const gameStarted = ref(false)
const gameEnded = ref(false)
// const resultMessage = ref('')
const moveCount = ref(0)
const gameTime = ref('00:00')

// DOM elements
const singlePlayerTimer = ref(null)
const singlePlayerTurn = ref(null)
const singleResultMessage = ref(null)
const singleMoves = ref(null)
const singleTime = ref(null)

// AI Worker setup
onMounted(() => {
  setupAIWorker()
  setupEventListeners()
  resetGame()
  createBoard()
})

function setupAIWorker() {
  try {
    aiWorker = new Worker('src/service/ai-worker-v2.js')
    aiWorker.onmessage = function (e) {
      const { type, move, depth } = e.data
      if (type === 'AI_MOVE_FOUND') {
        isAIThinking = false
        if (move && gameActive && !playerTurn) {
          executeComputerMove(move)
        }
      } else if (type === 'AI_PROGRESS') {
        if (singlePlayerTurn.value) {
          singlePlayerTurn.value.textContent = `AI 思考中 (深度 ${depth})`
        }
      } else if (type === 'AI_SEARCH_CANCELLED') {
        isAIThinking = false
      }
    }

    aiWorker.onerror = function (error) {
      console.error('AI Worker 错误:', error)
      isAIThinking = false
      useFallbackAI()
    }
  } catch (error) {
    console.error('无法创建AI Worker:', error)
    aiWorker = null
  }
}

function setupEventListeners() {
  const startBtn = document.getElementById('single-start-game')
  const restartBtn = document.getElementById('single-restart')
  const undoBtn = document.getElementById('single-undo')
  const playAgainBtn = document.getElementById('single-play-again')
  const backHomeBtn = document.getElementById('single-back-home')

  if (startBtn) startBtn.addEventListener('click', startGame)
  if (restartBtn) restartBtn.addEventListener('click', restartGame)
  if (undoBtn) undoBtn.addEventListener('click', undoMove)
  if (playAgainBtn) playAgainBtn.addEventListener('click', playAgain)
  if (backHomeBtn) backHomeBtn.addEventListener('click', () => window.location.href = '/')

  singlePlayerTurn.value = document.getElementById('single-player-turn')
  singleResultMessage.value = document.getElementById('single-result-message')
  singleMoves.value = document.getElementById('single-moves')
  singleTime.value = document.getElementById('single-time')
  singlePlayerTimer.value = document.getElementById('single-player-timer')
}

function startGame() {
  difficulty.value = document.getElementById('difficulty').value
  resetGame()
  gameActive = true
  gameStartTime = Date.now()
  startTimer()
  updateGameStatus()
  showDifficultyInfo()

  const startOverlay = document.querySelector('.game-start-overlay')
  if (startOverlay) startOverlay.classList.add('hidden')
  gameStarted.value = true
}

function resetGame() {
  gameActive = false
  playerTurn = true
  totalMoves = 0
  moveHistory = []
  elapsedTime = 0
  if (gameTimer) clearInterval(gameTimer)
  gameBoard = Array.from({ length: 19 }, () => Array(19).fill(0))
  clearBoard()
  updateGameStatus()
}

function createBoard() {
  const board = document.querySelector('.game-board')
  if (!board) return

  board.innerHTML = '<div class="board-grid-container"></div>'
  const grid = board.querySelector('.board-grid-container')

  // Draw lines
  for (let i = 0; i < BOARD_SIZE; i++) {
    const hLine = document.createElement('div')
    hLine.classList.add('h-line')
    hLine.style.top = `${(i / (BOARD_SIZE - 1)) * 100}%`
    grid.appendChild(hLine)

    const vLine = document.createElement('div')
    vLine.classList.add('v-line')
    vLine.style.left = `${(i / (BOARD_SIZE - 1)) * 100}%`
    grid.appendChild(vLine)
  }

  // Add intersections
  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      const intersection = document.createElement('div')
      intersection.classList.add('board-intersection')
      intersection.dataset.row = i
      intersection.dataset.col = j
      intersection.style.left = `${(j / (BOARD_SIZE - 1)) * 100}%`
      intersection.style.top = `${(i / (BOARD_SIZE - 1)) * 100}%`
      intersection.addEventListener('click', () => {
        if (gameActive && playerTurn) {
          const row = parseInt(intersection.dataset.row)
          const col = parseInt(intersection.dataset.col)
          makeMove(row, col)
        }
      })
      grid.appendChild(intersection)
    }
  }

  // Star points
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
    grid.appendChild(star)
  })
}

function clearBoard() {
  createBoard()
}

function startTimer() {
  if (gameTimer) clearInterval(gameTimer)
  gameTimer = setInterval(() => {
    elapsedTime = Date.now() - gameStartTime
    updateTimer()
  }, 1000)
}

function updateTimer() {
  const seconds = Math.floor(elapsedTime / 1000)
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  singlePlayerTimer.value.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

function updateGameStatus() {
  updateTurnIndicator()
  updateMoveCount()
}

function updateTurnIndicator() {
  if (singlePlayerTurn.value) {
    singlePlayerTurn.value.textContent = playerTurn ? '你的回合' : 'AI 思考中...'
  }
}

function updateMoveCount() {
  if (singleMoves.value) singleMoves.value.textContent = totalMoves
  if (singleTime.value) singleTime.value.textContent = `${Math.floor(elapsedTime / 1000)}s`
}

function makeMove(row, col) {
  if (gameBoard[row][col] !== 0 || !gameActive || !playerTurn) return

  gameBoard[row][col] = PLAYER_STONE
  placeStone(row, col, PLAYER_STONE)
  moveHistory.push({ row, col, player: PLAYER_STONE })
  totalMoves++
  if (checkWin(row, col, PLAYER_STONE)) {
    endGame(true)
    return
  }
  if (checkDraw()) {
    endGame(null)
    return
  }

  playerTurn = false
  updateTurnIndicator()
  setTimeout(computerMove, difficulty.value === 'hard' ? 1000 : difficulty.value === 'medium' ? 700 : 500)
}

function computerMove() {
  if (!gameActive || !gameBoard || playerTurn || isAIThinking) return

  isAIThinking = true
  updateTurnIndicator()

  if (aiWorker) {
    const boardCopy = gameBoard.map(row => [...row])
    aiWorker.postMessage({
      action: 'START_AI_SEARCH',
      data: {
        board: boardCopy,
        difficulty: difficulty.value
      }
    })

    // Fallback
    setTimeout(() => {
      if (isAIThinking) {
        isAIThinking = false
        useFallbackAI()
      }
    }, 15000)
  } else {
    useFallbackAI()
  }
}

function useFallbackAI() {
  if (!gameActive || !gameBoard || playerTurn) return

  const move = fallbackAI(gameBoard, difficulty.value)
  isAIThinking = false
  if (move) executeComputerMove(move)
  else endGame(null)
}

function fallbackAI(board, difficulty) {
  const winMove = findWinMove(board, COMPUTER_STONE)
  if (winMove) return winMove

  const blockMove = findWinMove(board, PLAYER_STONE)
  if (blockMove) return blockMove

  const candidates = getCandidateMoves(board)
  if (candidates.length === 0) return null

  const randomFactor = difficulty === 'easy' ? 0.3 : difficulty === 'medium' ? 0.1 : 0.05
  if (Math.random() < randomFactor) {
    const idx = Math.floor(Math.random() * Math.min(candidates.length, 5))
    return candidates[idx]
  }

  return candidates[0]
}

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

function getCandidateMoves(board) {

  const occupied = []
  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      if (board[i][j] !== 0) occupied.push({ row: i, col: j })
    }
  }

  const candidateSet = new Set()
  for (const { row, col } of occupied) {
    for (let di = -2; di <= 2; di++) {
      for (let dj = -2; dj <= 2; dj++) {
        const ni = row + di, nj = col + dj
        if (ni >= 0 && ni < 19 && nj >= 0 && nj < 19 && board[ni][nj] === 0) {
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

function evaluateMoveSimple(board, row, col) {
  let score = 0
  board[row][col] = COMPUTER_STONE
  score += evaluatePositionSimple(board, row, col, COMPUTER_STONE) * 1.1
  board[row][col] = PLAYER_STONE
  score += evaluatePositionSimple(board, row, col, PLAYER_STONE) * 0.9
  board[row][col] = 0
  return score
}

function evaluatePositionSimple(board, row, col, player) {
  const directions = [[0, 1], [1, 0], [1, 1], [1, -1]]
  let score = 0

  for (const [dx, dy] of directions) {
    let count = 1
    for (let i = 1; i < 5; i++) {
      const r = row + i * dx, c = col + i * dy
      if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) count++
      else break
    }
    for (let i = 1; i < 5; i++) {
      const r = row - i * dx, c = col - i * dy
      if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) count++
      else break
    }

    if (count >= 5) score += 100000
    else if (count === 4) score += 10000
    else if (count === 3) score += 1000
    else if (count === 2) score += 100
    else if (count === 1) score += 10
  }

  return score
}

function executeComputerMove(move) {
  gameBoard[move.row][move.col] = COMPUTER_STONE
  placeStone(move.row, move.col, COMPUTER_STONE)
  moveHistory.push({ row: move.row, col: move.col, player: COMPUTER_STONE })
  totalMoves++
  if (checkWin(move.row, move.col, COMPUTER_STONE)) {
    endGame(false)
    return
  }
  if (checkDraw()) {
    endGame(null)
    return
  }
  playerTurn = true
  updateTurnIndicator()
}

function placeStone(row, col, player) {
  const intersection = document.querySelector(`.board-intersection[data-row="${row}"][data-col="${col}"]`)
  if (!intersection) return
  intersection.innerHTML = ''
  const stone = document.createElement('div')
  stone.classList.add('stone')
  if (player === PLAYER_STONE) stone.classList.add('black-stone')
  else stone.classList.add('white-stone')
  intersection.appendChild(stone)
}

function checkWin(row, col, player) {
  return (
    checkDirection(row, col, 1, 0, player) ||
    checkDirection(row, col, 0, 1, player) ||
    checkDirection(row, col, 1, 1, player) ||
    checkDirection(row, col, 1, -1, player)
  )
}

function checkDirection(row, col, dx, dy, player) {
  let count = 1
  for (let i = 1; i < 5; i++) {
    const r = row + i * dx, c = col + i * dy
    if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && gameBoard[r][c] === player) count++
    else break
  }
  for (let i = 1; i < 5; i++) {
    const r = row - i * dx, c = col - i * dy
    if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && gameBoard[r][c] === player) count++
    else break
  }
  return count >= 5
}

function checkDraw() {
  return gameBoard.every(row => row.every(cell => cell !== 0))
}

function endGame(playerWon) {
  gameActive = false
  clearInterval(gameTimer)

  const endOverlay = document.querySelector('.game-end-overlay')
  if (endOverlay) {
    endOverlay.classList.remove('hidden')
    const resultText = playerWon ? '你赢了！' : (playerWon === null ? '平局' : '你输了！')
    singleResultMessage.value.textContent = resultText
  }

  if (singleMoves.value) singleMoves.value.textContent = totalMoves
  if (singleTime.value) {
    const seconds = Math.floor(elapsedTime / 1000)
    singleTime.value.textContent = `${seconds}s`
  }
}

function restartGame() {
  const endOverlay = document.querySelector('.game-end-overlay')
  if (endOverlay) endOverlay.classList.add('hidden')
  startGame()
}

function playAgain() {
  restartGame()
}

function undoMove() {
  if (!gameActive || moveHistory.length < 2 || isAIThinking) return
  if (aiWorker && isAIThinking) {
    aiWorker.postMessage({ action: 'CANCEL_AI_SEARCH' })
    isAIThinking = false
  }

  const move1 = moveHistory.pop()
  const move2 = moveHistory.pop()
  gameBoard[move1.row][move1.col] = 0
  gameBoard[move2.row][move2.col] = 0
  removeStone(move1.row, move1.col)
  removeStone(move2.row, move2.col)
  totalMoves -= 2
  playerTurn = true
  updateGameStatus()
}

function removeStone(row, col) {
  const intersection = document.querySelector(`.board-intersection[data-row="${row}"][data-col="${col}"]`)
  if (intersection) intersection.innerHTML = ''
}

function showDifficultyInfo() {
  const infoMap = {
    easy: '简单: AI 会犯一些错误，适合新手',
    medium: '中等: AI 有策略思考，适合普通玩家',
    hard: '困难: AI 使用高级算法，极具挑战！'
  }
  difficultyInfo.value = `<div class="difficulty-info"><strong>${infoMap[difficulty.value]}</strong><br><span style="color:#4CAF50">🚀 后台AI：最大强度，无卡顿</span></div>`

  setTimeout(() => {
    difficultyInfo.value = ''
  }, 5000)
}
</script>

<style scoped>
.container {
  padding: 20px;
  margin: 0 auto;
  width: 1200px;
  background-color: #fff;
}

.features {
  display: flex;
  justify-content: space-between;
  margin-bottom: 50px;
  gap: 20px;
}

.feature-card {
  flex: 1;
  background-color: white;
  border-radius: 8px;
  padding: 30px;
  text-align: center;
  box-shadow: var(--shadow);
  transition: var(--transition);
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.feature-card i {
  font-size: 36px;
  color: var(--primary-color);
  margin-bottom: 15px;
}

.feature-card h3 {
  font-size: 20px;
  margin-bottom: 10px;
  color: var(--secondary-color);
}

.feature-card p {
  color: var(--gray-color);
}

.leaderboard-preview {
  background-color: white;
  border-radius: 8px;
  padding: 30px;
  box-shadow: var(--shadow);
}

.leaderboard-preview h2 {
  font-size: 24px;
  margin-bottom: 20px;
  color: var(--secondary-color);
  text-align: center;
}

.leaderboard-table {
  width: 100%;
  margin-bottom: 20px;
}

.leaderboard-header {
  display: flex;
  background-color: var(--secondary-color);
  color: white;
  font-weight: 600;
  border-radius: 4px 4px 0 0;
}

.leaderboard-header div,
.leaderboard-row div {
  padding: 12px 15px;
}

.leaderboard-row {
  display: flex;
  border-bottom: 1px solid var(--border-color);
  transition: var(--transition);
}

.leaderboard-row:last-child {
  border-bottom: none;
}

.leaderboard-row:hover {
  background-color: rgba(52, 152, 219, 0.05);
}

.rank {
  width: 15%;
  text-align: center;
}

.player {
  width: 55%;
}

.wins,
.losses,
.win-rate {
  width: 15%;
  text-align: center;
}

.leaderboard-preview .btn {
  display: block;
  width: 200px;
  margin: 0 auto;
}

/* Game Board Styles */
.game-container {
  max-width: 800px;
  margin: 0 auto;
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.game-header h2 {
  font-size: 28px;
  color: var(--secondary-color);
}

.difficulty-selector,
.room-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.difficulty-selector select {
  padding: 8px;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  background-color: white;
}

/* 棋盤容器 */
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

/* 棋盤 */
.game-board {
  position: relative;
  width: 100%;
  height: 100%;
  display: block;
  box-sizing: border-box;
}

/* 棋盤網格容器 */
.board-grid-container {
  position: absolute;
  top: 8%;
  left: 8%;
  width: 84%;
  height: 84%;
  background-color: transparent;
}

/* 水平線 */
.h-line {
  position: absolute;
  width: 100%;
  height: 1px;
  background-color: rgba(0, 0, 0, 0.7);
  pointer-events: none;
}

/* 垂直線 */
.v-line {
  position: absolute;
  width: 1px;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  pointer-events: none;
}

/* 棋盤星位標記 */
.board-point {
  position: absolute;
  width: 6px;
  height: 6px;
  background-color: rgba(0, 0, 0, 0.8);
  transform: translate(calc(-50% + 0.5px), calc(-50% + 0.5px)) rotate(45deg);
  z-index: 2;
  pointer-events: none;
  border-radius: 2px;
  transform-origin: center center;
}

/* 棋盤交叉點（落子點） */
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

/* 根據玩家顏色顯示不同的懸停預覽效果 */
.player-black .board-intersection:hover::before {
  background-color: rgba(0, 0, 0, 0.15);
}

.player-white .board-intersection:hover::before {
  background-color: rgba(255, 255, 255, 0.15);
}

/* 棋子 */
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
  position: relative;
}

/* 高光效果已移除 */
.black-stone::after {
  display: none;
}

.white-stone {
  background: radial-gradient(circle at 30% 30%, #fff, #eee);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  border: 1px solid #d0d0d0;
  position: relative;
}

/* 高光效果已移除 */
.white-stone::after {
  display: none;
}

/* 電腦版棋子大小 */
@media (min-width: 768px) {
  .stone {
    width: 90%;
    height: 90%;
  }

  .board-intersection {
    width: 30px;
    height: 30px;
  }

  .board-intersection:hover::before {
    width: 26px;
    height: 26px;
  }
}

.game-start-overlay,
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

/* Hide overlay button (down arrow in content) */
.hide-overlay-btn {
  position: absolute;
  bottom: -30px;
  left: 50%;
  transform: translateX(-50%);
  width: 50px;
  height: 50px;
  background-color: rgba(255, 255, 255, 0.95);
  border: 2px solid var(--primary-color);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  z-index: 12;
  transition: all 0.3s ease;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.15);
}

.hide-overlay-btn:hover {
  background-color: var(--primary-color);
  transform: translateX(-50%) scale(1.1);
  animation: none;
}

.hide-overlay-btn i {
  font-size: 18px;
  color: var(--primary-color);
  transition: color 0.3s ease;
  animation: bounceDown 2s infinite;
}

.hide-overlay-btn:hover i {
  color: white;
  animation: none;
}



/* Show overlay button (up arrow below overlay) */
.show-overlay-btn {
  position: absolute;
  bottom: -60px;
  left: 50%;
  transform: translateX(-50%);
  width: 50px;
  height: 50px;
  background-color: rgba(255, 255, 255, 0.95);
  border: 2px solid var(--primary-color);
  border-radius: 50%;
  display: none;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  z-index: 12;
  transition: all 0.3s ease;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.15);
}

.show-overlay-btn:hover {
  background-color: var(--primary-color);
  transform: translateX(-50%) scale(1.1);
  animation: none;
}

.show-overlay-btn i {
  font-size: 18px;
  color: var(--primary-color);
  transition: color 0.3s ease;
  animation: bounceUp 2s infinite;
}

.show-overlay-btn:hover i {
  color: white;
  animation: none;
}

.show-overlay-btn.visible {
  display: flex !important;
  pointer-events: auto !important;
}

/* Hidden overlay state - only show the show button */
.game-end-overlay.overlay-hidden {
  background-color: transparent;
  pointer-events: none;
}

.game-end-overlay.overlay-hidden .game-end-content {
  display: none;
}

.game-end-overlay.overlay-hidden .hide-overlay-btn {
  display: none;
}

.game-end-overlay.overlay-hidden .show-overlay-btn {
  pointer-events: auto !important;
}

.game-start-content,
.game-end-content {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  text-align: center;
  max-width: 80%;
}

.game-start-content h2,
.game-end-content h2 {
  font-size: 28px;
  margin-bottom: 15px;
  color: var(--secondary-color);
}

.game-start-content p {
  margin-bottom: 20px;
  color: var(--gray-color);
}

.countdown {
  font-size: 48px;
  font-weight: 700;
  color: var(--primary-color);
  margin: 20px 0;
}

.game-stats {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin: 20px 0;
}

.stat {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 14px;
  color: var(--gray-color);
  margin-bottom: 5px;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: var(--secondary-color);
}

.game-end-buttons {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 20px;
}

.game-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  background-color: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: var(--shadow);
}

.player-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

/* 黑子玩家向左對齊 */
.player-info:first-child .player-details {
  align-items: flex-start;
  text-align: left;
}

/* 白子玩家向右對齊 */
.player-info:last-child .player-details {
  align-items: flex-end;
  text-align: right;
}

.player-avatar {
  width: 40px;
  height: 40px;
  background-color: var(--light-color);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 20px;
  color: var(--gray-color);
}

.player-details {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.player-details h3 {
  font-size: 16px;
  margin-bottom: 5px;
}

.player-details .stone {
  position: relative;
  width: 20px;
  height: 20px;
  transform: none;
  top: auto;
  left: auto;
}

.game-status {
  margin-top: 20px;
  text-align: center;
}

.timer {
  font-size: 18px;
  font-weight: 600;
  color: var(--secondary-color);
  margin-bottom: 5px;
}

.turn-indicator {
  font-size: 14px;
  color: var(--primary-color);
  font-weight: 500;
}

.game-controls {
  display: flex;
  justify-content: center;
  gap: 15px;
}

/* Online Battle Styles */
.player-setup {
  background-color: white;
  border-radius: 8px;
  padding: 30px;
  text-align: center;
  box-shadow: var(--shadow);
  max-width: 500px;
  margin: 0 auto;
}

.player-setup h3 {
  font-size: 22px;
  margin-bottom: 20px;
  color: var(--secondary-color);
}

.player-form {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.player-form input {
  flex: 1;
  padding: 10px 15px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 16px;
}

.waiting-message {
  text-align: center;
  color: var(--gray-color);
}

.spinner {
  margin: 20px auto;
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-left-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}



.message {
  margin-bottom: 10px;
  padding: 8px 12px;
  border-radius: 8px;
  max-width: 80%;
  word-break: break-word;
}

.user-message {
  background-color: var(--primary-color);
  color: white;
  margin-left: auto;
}

.opponent-message {
  background-color: var(--light-color);
}
</style>
