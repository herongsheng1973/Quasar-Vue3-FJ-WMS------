<template>
  <div class="container q-pa-md">
    <!-- Game Container -->
    <div class="game-container bg-white text-black rounded-xl q-pa-xl">
      <!-- Game Header -->
      <div class="game-header row justify-between items-center">
        <h2 class="text-h4 text-bold">单人游戏</h2>
        <div class="difficulty-selector">
          <label for="difficulty" class="q-mr-sm">难度级别:</label>
          <q-select v-model="difficulty" :options="difficultyOptions" dense outlined emit-value map-options
            style="width: 150px;" />
        </div>
      </div>

      <!-- Game Board -->
      <div class="game-board-container q-mt-md">
        <!-- Start Overlay -->
        <div v-if="!gameStarted" class="game-start-overlay" id="single-start-game">
          <div class="game-start-content text-center">
            <h3 class="text-h5">准备好开始游戏了吗？</h3>
            <p>点击下方按钮开始游戏</p>
            <q-btn color="primary" label="开始游戏" @click="startGame" />
          </div>
        </div>

        <!-- Game Board -->
        <div v-else class="game-board bg-grey-3 rounded-xl q-pa-md shadow-6" id="single-player-board">
          <div ref="gameCanvas" class="cursor-pointer" style="width: 100%; height: 600px; display: block;"></div>
          <div class="game-status text-center q-pt-md">
            <p class="text-bold" id="single-player-turn">点击开始游戏</p>
          </div>
        </div>

        <!-- Game End Overlay -->
        <div v-if="gameEnded" class="game-end-overlay hidden" id="single-end-overlay">
          <div class="game-end-content bg-white text-black rounded-xl q-pa-md shadow-6">
            <h4 class="text-h5" id="single-result-message">{{ resultMessage }}</h4>
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
              <q-btn label="再玩一次" icon="refresh" color="primary" id="single-play-again" @click="playAgain" />
              <q-btn label="返回首页" icon="home" color="secondary" id="single-back-home" />
            </div>
          </div>
        </div>
      </div>

      <!-- Game Info -->
      <div class="game-info row justify-between q-mt-xl">
        <!-- Player Info -->
        <div class="player-info column items-center">
          <div class="player-avatar q-mb-sm">
            <q-icon name="person" size="lg" />
          </div>
          <h6 class="text-subtitle1">玩家</h6>
          <div class="stone black-stone" style="width: 20px; height: 20px; background: black; border-radius: 50%;">
          </div>
        </div>

        <!-- Game Status -->
        <div class="game-status column items-center">
          <div class="timer q-mb-sm">
            <q-icon name="access_time" />
            <span class="q-ml-sm" id="single-player-timer">{{ gameTime }}</span>
          </div>
          <div class="turn-indicator" id="single-player-turn">{{ turnIndicator }}</div>

          <!-- Game Controls -->
          <div class="game-controls q-mt-xl row justify-center q-gutter-md">
            <q-btn label="重新开始" icon="refresh" color="secondary" id="single-restart" @click="restartGame" />
            <q-btn label="悔棋" icon="undo" color="secondary" id="single-undo" @click="undoMove" />
          </div>
          <p>游戏是否进行中: {{ gameActive }}</p>
          <p>当前回合: {{ playerTurn ? '玩家' : '电脑' }}</p>
          <p>总步数: {{ totalMoves }}</p>
          <p>游戏时间: {{ elapsedTime }}</p>
          <p>当前难度: {{ gameDifficulty }}</p>
        </div>

        <!-- Computer Info -->
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
import { ref } from 'vue'
import { useGomokuGame } from 'src/composables/useGomokuGame'

// DOM 元素引用
const boardElement = ref(null)
const startGameBtn = ref(null)
const restartBtn = ref(null)
const undoBtn = ref(null)
const playAgainBtn = ref(null)
const backHomeBtn = ref(null)
const difficultySelector = ref(null)
const timerElement = ref(null)
const turnIndicatorElement = ref(null)
const resultMessageElement = ref(null)
const movesElement = ref(null)
const timeElement = ref(null)
const hideOverlayElement = ref(null)
const showOverlayElement = ref(null)

// 游戏状态
const gameStarted = ref(false)
const gameEnded = ref(false)
const resultMessage = ref('')
const moveCount = ref(0)
const gameTime = ref('00:00')
const turnIndicator = ref('点击开始游戏')

// 难度设置
const difficulty = ref('medium')
const difficultyOptions = [
  { label: '简单', value: 'easy' },
  { label: '中等', value: 'medium' },
  { label: '困难', value: 'hard' }
]

// 初始化游戏并获取方法
const {
  gameActive,
  playerTurn,
  totalMoves,
  elapsedTime,
  difficulty: gameDifficulty,
  startGame,
  restartGame,
  playAgain,
  undoMove,
  hideGameEndOverlay,
  showGameEndOverlay
} = useGomokuGame({
  boardElement: boardElement,
  startGameBtn: startGameBtn,
  restartBtn: restartBtn,
  undoBtn: undoBtn,
  playAgainBtn: playAgainBtn,
  backHomeBtn: backHomeBtn,
  difficultySelector: difficultySelector,
  timerElement: timerElement,
  turnIndicatorElement: turnIndicatorElement,
  resultMessageElement: resultMessageElement,
  movesElement: movesElement,
  timeElement: timeElement,
  hideOverlayElement: hideOverlayElement,
  showOverlayElement: showOverlayElement
})

// 将方法暴露给模板
defineExpose({
  startGame,
  restartGame,
  playAgain,
  undoMove,
  hideGameEndOverlay,
  showGameEndOverlay
})


</script>

<style scoped>
:root {
  --primary-color: #3498db;
  --secondary-color: #2c3e50;
  --accent-color: #e74c3c;
  --light-color: #f5f5f5;
  --dark-color: #333;
  --gray-color: #7f8c8d;
  --border-color: #ddd;
  --success-color: #2ecc71;
  --warning-color: #f39c12;
  --danger-color: #e74c3c;
  --shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  --transition: all 0.3s ease;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  color: var(--dark-color);
  background-color: var(--light-color);
}

.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

a {
  text-decoration: none;
  color: var(--primary-color);
  transition: var(--transition);
}

a:hover {
  color: var(--secondary-color);
}

ul {
  list-style: none;
}

.btn {
  display: inline-block;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: var(--transition);
  text-align: center;
}

.primary-btn {
  background-color: var(--primary-color);
  color: white;
}

.primary-btn:hover {
  background-color: #2980b9;
  color: white;
}

.secondary-btn {
  background-color: var(--secondary-color);
  color: white;
}

.secondary-btn:hover {
  background-color: #1a2530;
  color: white;
}

.hidden {
  display: none !important;
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

.difficulty-selector {
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

.game-board-container {
  position: relative;
  background-color: #daa06d;
  border-radius: 4px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.3);
  aspect-ratio: 1 / 1;
  max-width: 600px;
  margin: 0 auto 40px;
  padding: 0;
  overflow: visible;
  border: 10px solid #c49665;
}

.game-board {
  position: relative;
  width: 100%;
  height: 100%;
  display: block;
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
  background-color: rgba(0, 0, 0, 0.7);
  pointer-events: none;
}

.h-line {
  width: 100%;
  height: 1px;
}

.v-line {
  width: 1px;
  height: 100%;
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
  content: '';
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

.game-start-content,
.game-end-content {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  text-align: center;
  max-width: 80%;
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

.player-details {
  display: flex;
  flex-direction: column;
  align-items: center;
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
</style>
