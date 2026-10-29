<template>
  <!-- Main Game Container -->
  <div class="container q-pa-md">
    <div class="game-container bg-white text-black rounded-xl q-pa-xl">
      <div class="row justify-between items-center">
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
        <div class="row items-center justify-between">
          <span class="text-grey-7 text-bold">难度级别</span>
          <q-select style="font-size: 1rem; margin-left: 40px; width: 80;" v-model="aiLevel" :options="aiLevelOptions"
            emit-value map-options />
        </div>
      </div>

      <!-- Game Board -->
      <div class="game-board-container q-mt-md">
        <div ref="gameContainer" style="width:100%;height:100%;display:block;">
          <!-- Start Game Overlay -->
          <div v-if="!gameActive" class="game-start-overlay" id="single-start-game">
            <div class="game-start-content text-center">
              <h3 class="text-h5">准备好开始游戏了吗？</h3>
              <p>点击下方按钮开始游戏</p>
              <q-btn color="primary" label="开始游戏" @click="resetGame" />
            </div>
          </div>

          <!-- Game Board -->
          <div v-else class="game-board bg-grey-3 rounded-xl q-pa-md shadow-6" id="single-player-board"
            style="width: 100%; height: 100%;">
            <canvas ref="gameCanvas" class="cursor-pointer"></canvas>
          </div>
        </div>


        <!-- Game End Overlay -->
        <div v-if="!gameActive" class="game-end-overlay hidden" id="single-end-overlay">
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
          <div class="black-stone stone-indicator"></div>
          <h6 class=" text-subtitle1">玩家</h6>

        </div>

        <div class="game-status column items-center">
          <div class=" q-mb-sm row items-center">
            <div class="game-status">{{ statusText }}</div>

          </div>
          <div class="timer q-mb-sm row items-center">
            <q-icon name="access_time" />
            <span class="q-ml-sm" id="single-player-timer">{{ gameTime }}</span>
          </div>
          <div class="turn-indicator" id="single-player-turn">{{ currentPlayerText }}</div>
          <div class="result-message q-mt-sm" id="single-player-result">{{ resultMessageText }}</div>
          <div class="move-count q-mt-sm" id="single-player-moves">
            步数：{{ moveCount }}
          </div>
          <!-- Game Controls -->
          <div class="game-controls q-mt-xl row justify-center q-gutter-md">
            <q-btn label="重新开始" icon="refresh" color="secondary" id="single-restart" @click="resetGame" />
            <q-btn label="悔棋" icon="undo" color="secondary" id="single-undo" @click="undoMove" />
          </div>
        </div>

        <div class="player-info column items-center">
          <div class="player-avatar q-mb-sm">
            <q-icon name="smart_toy" size="lg" />
          </div>
          <div class="white-stone stone-indicator"></div>
          <h6 class="text-subtitle1">电脑</h6>

        </div>
      </div>
    </div>
    <div class="text-center text-grey-5 q-mt-xl bg-primary q-pa-md">
      <p>© 2025 五子棋游戏 | 一个简单的 Web 游戏</p>
    </div>
  </div>
  <!-- 胜利提示模态框 -->
  <q-dialog v-model="winDialogVisible">
    <q-card>
      <q-card-section class="text-center">
        <div class="q-pa-md bg-green-1 q-border-radius-circle flex items-center justify-center q-mx-auto q-mb-md"
          style="width:4rem;height:4rem;">
          <q-icon name="emoji_events" color="yellow-5" size="3rem" />
        </div>
        <h2 class="text-h5 text-bold q-mb-sm">{{ winnerText }}</h2>
        <p class="text-grey-7 q-mb-lg">恭喜您赢得了这场精彩的比赛!</p>
        <q-btn label="开始新游戏" color="primary" @click="resetGame" />
      </q-card-section>
    </q-card>
  </q-dialog>

</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';

const BOARD_SIZE = 15; // 15×15的棋盘
const CELL_SIZE = ref(0);
const PIECE_SIZE = computed(() => CELL_SIZE.value * 0.8);
const aiLevel = ref('medium');

const gameCanvas = ref(null);
const gameContainer = ref(null);
const gameBoard = ref(Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0)));
const currentPlayer = ref(1);
const gameActive = ref(false);
const moveHistory = ref([]);
const gameTime = ref('00:00');
const timerInterval = ref(null);
const gameMode = ref('single');
const playerColor = ref(1);
const winDialogVisible = ref(false);

const aiLevelOptions = [
  { label: '简单', value: 'easy' },
  { label: '中等', value: 'medium' },
  { label: '困难', value: 'hard' }
];

const statusText = computed(() => {
  if (!gameActive.value) return '游戏已结束';
  const label = gameMode.value === 'pvp'
    ? (currentPlayer.value === 1 ? '黑棋' : '白棋')
    : (currentPlayer.value === playerColor.value ? '玩家' : '电脑');
  return `游戏进行中 - ${label}回合`;
});

const currentPlayerText = computed(() =>
  gameMode.value === 'single'
    ? (currentPlayer.value === 1 ? '黑棋' : '白棋')
    : (currentPlayer.value === playerColor.value ? '玩家' : '电脑')
);

const moveCount = computed(() => moveHistory.value.length);

const winnerText = computed(() => {
  const label = gameMode.value === 'single'
    ? (currentPlayer.value === 1 ? '黑棋' : '白棋')
    : (currentPlayer.value === playerColor.value ? '玩家' : '电脑');
  return `${label}获胜!`;
});

// 初始化和事件绑定
onMounted(() => {
  startTimer()
});
watch(
  gameActive, () => {
    setCanvasSize()
    drawBoard()
    addCanvasEvents();
    startTimer();
    window.addEventListener('resize', handleResize);
  }
)
onUnmounted(() => {
  stopTimer();
  window.removeEventListener('resize', handleResize);
});

// 重置游戏
function resetGame() {
  gameBoard.value = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0));
  currentPlayer.value = 1;
  gameActive.value = true;
  moveHistory.value = [];
  gameTime.value = '00:00';
  stopTimer();
  startTimer();
  drawBoard();
  winDialogVisible.value = false;

  // 如果是人机对战且电脑先手，则电脑落子
  if (gameMode.value === 'single' && playerColor.value === 2) {
    // setTimeout(makeAIMove, 500);
  }
}

// 设置Canvas尺寸 - 修正计算方式
function setCanvasSize() {
  const canvas = gameCanvas.value;
  const container = gameContainer.value;

  // 获取容器的实际可用尺寸
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;

  // 正确计算每个单元格的大小
  CELL_SIZE.value = Math.min(
    containerWidth / BOARD_SIZE,
    containerHeight / BOARD_SIZE
  );

  // 设置Canvas尺寸
  canvas.width = CELL_SIZE.value * BOARD_SIZE;
  canvas.height = CELL_SIZE.value * BOARD_SIZE;

  console.log("容器尺寸:", containerWidth, containerHeight);
  console.log("棋盘尺寸:", canvas.width, canvas.height);
  console.log("单元格尺寸:", CELL_SIZE.value);
}
// 窗口大小变化处理
function handleResize() {
  setCanvasSize();
  drawBoard();
}

// 绘制棋盘 - 修正绘制逻辑
function drawBoard() {
  const canvas = gameCanvas.value;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 绘制棋盘背景（可选）
  ctx.fillStyle = '#DEB887'; // 棋盘底色
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 网格线
  ctx.strokeStyle = '#8B4513';
  ctx.lineWidth = 1.5;

  // 绘制网格线 - 修正绘制逻辑
  for (let i = 0; i < BOARD_SIZE; i++) {
    // 计算线条位置
    const pos = i * CELL_SIZE.value;

    // 横线
    ctx.beginPath();
    ctx.moveTo(0, pos);
    ctx.lineTo(canvas.width, pos);
    ctx.stroke();

    // 竖线
    ctx.beginPath();
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, canvas.height);
    ctx.stroke();
  }

  // 天元和星位 - 修正位置
  const starPoints = [
    { x: 3, y: 3 }, { x: 3, y: 11 }, { x: 7, y: 7 },
    { x: 11, y: 3 }, { x: 11, y: 11 }
  ];

  starPoints.forEach(point => {
    const x = point.x * CELL_SIZE.value + CELL_SIZE.value / 2;
    const y = point.y * CELL_SIZE.value + CELL_SIZE.value / 2;

    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#8B4513';
    ctx.fill();
  });

  // 绘制棋子
  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      if (gameBoard.value[i][j] !== 0) {
        drawPiece(i, j, gameBoard.value[i][j]);
      }
    }
  }
}

// 绘制棋子
function drawPiece(row, col, player) {
  const canvas = gameCanvas.value;
  const ctx = canvas.getContext('2d');

  // 计算棋子中心位置（居中）
  const x = col * CELL_SIZE.value + CELL_SIZE.value / 2;
  const y = row * CELL_SIZE.value + CELL_SIZE.value / 2;

  // 阴影
  ctx.beginPath();
  ctx.arc(x, y, PIECE_SIZE.value / 2 + 2, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.fill();

  // 棋子本体
  ctx.beginPath();
  ctx.arc(x, y, PIECE_SIZE.value / 2, 0, Math.PI * 2);

  if (player === 1) {
    // 黑棋渐变
    const gradient = ctx.createRadialGradient(
      x - PIECE_SIZE.value / 6, y - PIECE_SIZE.value / 6, PIECE_SIZE.value / 10,
      x, y, PIECE_SIZE.value / 2
    );
    gradient.addColorStop(0, '#555');
    gradient.addColorStop(1, '#000');
    ctx.fillStyle = gradient;
  } else {
    // 白棋渐变
    const gradient = ctx.createRadialGradient(
      x - PIECE_SIZE.value / 6, y - PIECE_SIZE.value / 6, PIECE_SIZE.value / 10,
      x, y, PIECE_SIZE.value / 2
    );
    gradient.addColorStop(0, '#fff');
    gradient.addColorStop(1, '#ddd');
    ctx.fillStyle = gradient;
  }
  ctx.fill();

  // 棋子边缘
  ctx.strokeStyle = player === 1 ? '#333' : '#ccc';
  ctx.lineWidth = 1;
  ctx.stroke();
}
// 鼠标悬停预览效果
function handleCanvasMouseMove(e) {
  if (!gameActive.value) return;
  if (gameMode.value === 'pvc' && currentPlayer.value !== playerColor.value) return;

  const canvas = gameCanvas.value;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  // 计算鼠标在Canvas中的坐标
  const x = (e.clientX - rect.left) * scaleX;
  const y = (e.clientY - rect.top) * scaleY;

  // 计算对应的行列（居中计算）
  const col = Math.round((x - CELL_SIZE.value / 2) / CELL_SIZE.value);
  const row = Math.round((y - CELL_SIZE.value / 2) / CELL_SIZE.value);

  drawBoard();

  // 检查坐标是否在棋盘内且为空
  if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE && gameBoard.value[row][col] === 0) {
    const ctx = canvas.getContext('2d');
    const previewX = col * CELL_SIZE.value + CELL_SIZE.value / 2;
    const previewY = row * CELL_SIZE.value + CELL_SIZE.value / 2;

    ctx.beginPath();
    ctx.arc(previewX, previewY, PIECE_SIZE.value / 2, 0, Math.PI * 2);
    ctx.fillStyle = currentPlayer.value === 1 ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.6)';
    ctx.fill();
  }
}

// 鼠标离开棋盘时重绘
function handleCanvasMouseLeave() {
  drawBoard();
}

// 点击棋盘事件
function handleCanvasClick(e) {
  if (!gameActive.value) return;
  if (gameMode.value === 'pvc' && currentPlayer.value !== playerColor.value) return;

  const canvas = gameCanvas.value;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  // 计算鼠标在Canvas中的坐标
  const x = (e.clientX - rect.left) * scaleX;
  const y = (e.clientY - rect.top) * scaleY;

  // 计算对应的行列（居中计算）
  const col = Math.round((x - CELL_SIZE.value / 2) / CELL_SIZE.value);
  const row = Math.round((y - CELL_SIZE.value / 2) / CELL_SIZE.value);

  // 检查坐标是否在棋盘内且为空
  if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE && gameBoard.value[row][col] === 0) {
    gameBoard.value[row][col] = currentPlayer.value;
    moveHistory.value.push({ row, col, player: currentPlayer.value });
    drawBoard();

    if (checkWin(row, col, currentPlayer.value)) {
      showWinModal();
      return;
    }

    if (checkDraw()) {
      gameActive.value = false;
      stopTimer();
      return;
    }

    currentPlayer.value = currentPlayer.value === 1 ? 2 : 1;

    // 如果是人机对战且现在是电脑回合，让电脑落子
    if (gameMode.value === 'pvc' && currentPlayer.value !== playerColor.value) {
      // makeAIMove();
    }
  }
}

// 检查平局
function checkDraw() {
  return gameBoard.value.flat().every(cell => cell !== 0);
}
// 胜利模态框
function showWinModal() {
  gameActive.value = false;
  stopTimer();
  winDialogVisible.value = true;
}
// 检查胜利条件
function checkWin(row, col, player) {
  const directions = [
    [1, 0], [0, 1], [1, 1], [1, -1]
  ];

  for (const [dx, dy] of directions) {
    let count = 1;

    // 正向检查
    for (let i = 1; i < 5; i++) {
      const newRow = row + i * dy;
      const newCol = col + i * dx;

      if (newRow < 0 || newRow >= BOARD_SIZE || newCol < 0 || newCol >= BOARD_SIZE) break;
      if (gameBoard.value[newRow][newCol] === player) count++;
      else break;
    }

    // 反向检查
    for (let i = 1; i < 5; i++) {
      const newRow = row - i * dy;
      const newCol = col - i * dx;

      if (newRow < 0 || newRow >= BOARD_SIZE || newCol < 0 || newCol >= BOARD_SIZE) break;
      if (gameBoard.value[newRow][newCol] === player) count++;
      else break;
    }

    if (count >= 5) return true;
  }

  return false;
}

// 事件绑定
function addCanvasEvents() {
  const canvas = gameCanvas.value;
  canvas.addEventListener('click', handleCanvasClick);
  canvas.addEventListener('mousemove', handleCanvasMouseMove);
  canvas.addEventListener('mouseleave', handleCanvasMouseLeave);
}

// 游戏时间
function updateGameTime() {
  const [min, sec] = gameTime.value.split(':').map(Number);
  const totalSeconds = min * 60 + sec + 1;
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  gameTime.value = `${minutes}:${seconds}`;
}
function startTimer() {
  if (timerInterval.value) clearInterval(timerInterval.value);
  timerInterval.value = setInterval(updateGameTime, 1000);
}

function stopTimer() {
  if (timerInterval.value) clearInterval(timerInterval.value);
}

</script>
<style scoped>
/* 原样式代码保持不变 */
</style>
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
  max-width: 800px;
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

/* Game Info Section */
.game-info {
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.player-info {
  flex: 1;
  min-width: 120px;
  text-align: center;
}

.player-avatar {
  font-size: 24px;
  color: #555;
}

.stone-indicator {
  width: 24px;
  height: 24px;
  margin-top: 8px;
  border-radius: 50%;
  display: inline-block;
}

.stone-indicator.black-stone {
  background: black;
}

.stone-indicator.white-stone {
  background: white;
  border: 1px solid #ccc;
}

.game-status {
  flex: 2;
  max-width: 300px;
  text-align: center;
}

.turn-indicator {
  font-weight: bold;
  font-size: 16px;
  margin-top: 10px;
}

.result-message {
  color: #e53935;
  font-size: 14px;
}

.move-count {
  font-size: 14px;
  color: #666;
}

.timer {
  font-size: 14px;
  color: #444;
}

.game-controls {
  margin-top: 20px;
}

.status-indicator {
  width: 24px;
  height: 24px;
  margin-top: 8px;
  border-radius: 50%;
  display: inline-block;
  margin-right: 8px;
}

.status-indicator.black-stone {
  background: black;
}

.status-indicator.white-stone {
  background: white;
  border: 1px solid #ccc;
}
</style>
