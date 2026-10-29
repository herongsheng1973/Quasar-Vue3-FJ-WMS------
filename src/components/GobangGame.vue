<template>
  <q-page class="q-pa-lg q-gutter-lg">
    <div class="bg-primary text-white q-pa-xl q-border-radius-xl">
      <div class="text-center q-pa-md">
        <h1 class="text-h4 text-bold">五子棋</h1>
        <p class="text-secondary q-mt-sm">经典对弈游戏</p>
      </div>

      <!-- 主内容区域，左2/3为棋盘，右1/3为控制信息 -->
      <div class="q-pa-lg row q-gutter-lg">
        <!-- 游戏区域：左侧，占2/3宽度 -->
        <div class="col-8 col-md-8 flex flex-center relative">
          <div
            class="q-pa-md bg-grey-3 q-border-radius-lg shadow-8 q-overflow-hidden flex flex-col justify-center items-center"
            ref="gameContainer" style="width:100%;aspect-ratio:1;">
            <canvas ref="gameCanvas" class="cursor-pointer" style="width:100%;height:100%;display:block;"></canvas>
            <div class="q-pa-md flex justify-center items-center" style="width:100%;">
              <p class="text-weight-medium text-black">{{ statusText }}</p>
            </div>
          </div>
        </div>

        <!-- 游戏控制和信息：右侧，占1/3宽度，垂直排列 -->
        <div class="col-3 col-md-3 flex flex-col q-gutter-lg">
          <div class="bg-grey-3 q-border-radius-lg q-pa-md shadow-2" style="width:100%;">
            <h2 class="text-subtitle1 text-bold q-mb-md flex items-center text-primary">
              <q-icon name="info" class="q-mr-sm text-primary" />游戏信息
            </h2>
            <div class="q-gutter-md">
              <div class="row items-center justify-between" style="width:100%;">
                <span class="text-grey-7">游戏模式</span>
                <q-select v-model="gameMode" :options="gameModeOptions" emit-value map-options class="w-32" />
              </div>
              <div class="row items-center justify-between" style="width:100%;">
                <span class="text-grey-7">难度级别</span>
                <q-select style="font-size: 1rem; margin-right: 40px;" v-model="aiLevel" :options="aiLevelOptions"
                  emit-value map-options class="w-32" />
              </div>
              <div class="row items-center justify-between" style="width:100%;">
                <span class="text-grey-7">当前回合</span>
                <div class="row items-center">
                  <div
                    :class="`q-mr-sm q-border-radius-circle ${currentPlayer === 1 ? 'bg-black' : 'bg-white'} ${currentPlayer === 2 ? 'q-pa-xs q-border-grey-4' : ''}`"
                    style="width:24px;height:24px;box-shadow:0 4px 3px rgb(0 0 0 / 0.07),0 2px 2px rgb(0 0 0 / 0.06);border:1px solid #e0e0e0;">
                  </div>
                  <span class="text-primary" style="font-size: 1.5rem; margin-right: 40px;">{{ currentPlayerText
                    }}</span>
                </div>
              </div>
              <div class="row items-center justify-between" style="width:100%;">
                <span class="text-grey-7">游戏时间</span>
                <span class="font-mono text-primary" style="font-size: 1.5rem; margin-right: 40px;">{{ gameTime
                  }}</span>
              </div>
              <div class="row items-center text-primary justify-between" style="width:100%;">
                <span class="text-grey-7">步数</span>
                <span style="color: #007AFF; margin-right: 40px; font-size: 1.5rem;">{{ moveCount }}</span>
              </div>
            </div>
          </div>

          <div class="bg-grey-1 q-border-radius-lg q-pa-md shadow-2" style="width:100%;">
            <h2 class="text-subtitle1 text-bold text-primary q-mb-md flex items-center">
              <q-icon name="emoji_events" />游戏规则
            </h2>
            <ul class="text-body2 text-grey-7 q-gutter-sm">
              <li class="row items-start">
                <q-icon name="circle" size="xs" class="q-mt-xs q-mr-sm text-primary" />
                <span>黑棋和白棋轮流在棋盘上落子</span>
              </li>
              <li class="row items-start">
                <q-icon name="circle" size="xs" class="q-mt-xs q-mr-sm text-primary" />
                <span>先在横、竖或斜方向形成五子连线者获胜</span>
              </li>
              <li class="row items-start">
                <q-icon name="circle" size="xs" class="q-mt-xs q-mr-sm text-primary" />
                <span>点击棋盘上的交叉点放置棋子</span>
              </li>
            </ul>
          </div>

          <div class="row q-gutter-md" style="width:100%;">
            <q-btn label="重新开始" icon="refresh" color="primary" class="col" @click="resetGame" />
            <q-btn label="悔棋" icon="undo" color="grey-4" class="col" @click="undoMove" />
          </div>
        </div>
      </div>

      <div class="text-center text-grey-5 q-mt-xl">
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
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';

const BOARD_SIZE = 19; // 19×19的棋盘
const CELL_SIZE = ref(0);
const PIECE_SIZE = computed(() => CELL_SIZE.value * 0.8);

const gameCanvas = ref(null);
const gameContainer = ref(null);
const gameBoard = ref(Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0)));
const currentPlayer = ref(1);
const gameActive = ref(true);
const moveHistory = ref([]);
const gameTime = ref('00:00');
const timerInterval = ref(null);
const gameMode = ref('pvp');
const aiLevel = ref('medium');
const playerColor = ref(1);
const winDialogVisible = ref(false);

const statusText = computed(() => {
  if (!gameActive.value) return '游戏已结束';
  const label = gameMode.value === 'pvp'
    ? (currentPlayer.value === 1 ? '黑棋' : '白棋')
    : (currentPlayer.value === playerColor.value ? '玩家' : '电脑');
  return `游戏进行中 - ${label}回合`;
});

const currentPlayerText = computed(() =>
  gameMode.value === 'pvp'
    ? (currentPlayer.value === 1 ? '黑棋' : '白棋')
    : (currentPlayer.value === playerColor.value ? '玩家' : '电脑')
);

const moveCount = computed(() => moveHistory.value.length);

const winnerText = computed(() => {
  const label = gameMode.value === 'pvp'
    ? (currentPlayer.value === 1 ? '黑棋' : '白棋')
    : (currentPlayer.value === playerColor.value ? '玩家' : '电脑');
  return `${label}获胜!`;
});

const gameModeOptions = [
  { label: '玩家对战', value: 'pvp' },
  { label: '人机对战', value: 'pvc' }
];

const aiLevelOptions = [
  { label: '简单', value: 'easy' },
  { label: '中等', value: 'medium' },
  { label: '困难', value: 'hard' },
  { label: '专家', value: 'expert' }
];

// 初始化和事件绑定
onMounted(() => {
  setCanvasSize();
  drawBoard();
  addCanvasEvents();
  startTimer();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  stopTimer();
  window.removeEventListener('resize', handleResize);
});

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

// 事件绑定
function addCanvasEvents() {
  const canvas = gameCanvas.value;
  canvas.addEventListener('click', handleCanvasClick);
  canvas.addEventListener('mousemove', handleCanvasMouseMove);
  canvas.addEventListener('mouseleave', handleCanvasMouseLeave);
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
    // 计算线条位置（居中）
    const pos = i * CELL_SIZE.value + CELL_SIZE.value / 2;

    // 横线
    ctx.beginPath();
    ctx.moveTo(CELL_SIZE.value / 2, pos);
    ctx.lineTo(canvas.width - CELL_SIZE.value / 2, pos);
    ctx.stroke();

    // 竖线
    ctx.beginPath();
    ctx.moveTo(pos, CELL_SIZE.value / 2);
    ctx.lineTo(pos, canvas.height - CELL_SIZE.value / 2);
    ctx.stroke();
  }

  // 天元和星位 - 修正位置
  const starPoints = [
    { x: 3, y: 3 }, { x: 3, y: 15 }, { x: 9, y: 9 },
    { x: 15, y: 3 }, { x: 15, y: 15 }
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
      makeAIMove();
    }
  }
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

// 检查平局
function checkDraw() {
  return gameBoard.value.flat().every(cell => cell !== 0);
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

// 胜利模态框
function showWinModal() {
  gameActive.value = false;
  stopTimer();
  winDialogVisible.value = true;
}

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
  if (gameMode.value === 'pvc' && playerColor.value === 2) {
    setTimeout(makeAIMove, 500);
  }
}

// 悔棋
function undoMove() {
  if (moveHistory.value.length === 0 || !gameActive.value) return;

  // 移除最后一步
  const lastMove = moveHistory.value.pop();
  gameBoard.value[lastMove.row][lastMove.col] = 0;

  // 如果是人机对战，需要移除电脑的上一步
  if (gameMode.value === 'pvc' && moveHistory.value.length > 0) {
    const secondLastMove = moveHistory.value.pop();
    gameBoard.value[secondLastMove.row][secondLastMove.col] = 0;
  } else {
    // 玩家对战时，切换回上一个玩家
    currentPlayer.value = lastMove.player;
  }

  drawBoard();
}

// 人机对战 - 电脑落子
function makeAIMove() {
  if (!gameActive.value || gameMode.value !== 'pvc' || currentPlayer.value !== (playerColor.value === 1 ? 2 : 1)) return;

  let move;

  // 根据难度选择AI算法
  if (aiLevel.value === 'easy') {
    move = makeEasyAIMove();
  } else if (aiLevel.value === 'hard') {
    move = makeHardAIMove();
    console.log(move);
  } else if (aiLevel.value === 'medium') {
    // 中等难度 - 混合简单和困难算法
    move = Math.random() > 0.5 ? makeEasyAIMove() : makeHardAIMove();
  } else if (aiLevel.value === 'expert') {
    // 专家难度 - 寻找最佳位置
    move = findBestSeat(gameBoard.value, 2, 0, 2);
    console.log(move);
  } else {
    // 简单难度 - 随机选择一个位置
    move = makeEasyAIMove();
  }

  if (move) {
    // 模拟思考时间
    setTimeout(() => {
      gameBoard.value[move.row][move.col] = currentPlayer.value;
      moveHistory.value.push({ row: move.row, col: move.col, player: currentPlayer.value });
      drawBoard();

      if (checkWin(move.row, move.col, currentPlayer.value)) {
        showWinModal();
        return;
      }

      if (checkDraw()) {
        gameActive.value = false;
        stopTimer();
        return;
      }

      currentPlayer.value = playerColor.value;
    }, 500);
  }
}

// 简单AI - 随机选择一个位置，但会优先选择能形成连子的位置
function makeEasyAIMove() {
  // 寻找能赢的位置
  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      if (gameBoard.value[i][j] === 0) {
        // 尝试在这个位置落子
        gameBoard.value[i][j] = currentPlayer.value;
        const isWinning = checkWin(i, j, currentPlayer.value);
        // 撤销落子
        gameBoard.value[i][j] = 0;

        if (isWinning) {
          return { row: i, col: j };
        }
      }
    }
  }

  // 阻止玩家赢
  const opponent = playerColor.value;
  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      if (gameBoard.value[i][j] === 0) {
        // 尝试在这个位置落子
        gameBoard.value[i][j] = opponent;
        const isWinning = checkWin(i, j, opponent);
        // 撤销落子
        gameBoard.value[i][j] = 0;

        if (isWinning) {
          return { row: i, col: j };
        }
      }
    }
  }

  // 寻找能形成连子的位置
  const validMoves = [];

  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      if (gameBoard.value[i][j] === 0) {
        // 计算与已有棋子的距离
        let minDistance = Infinity;

        for (let x = 0; x < BOARD_SIZE; x++) {
          for (let y = 0; y < BOARD_SIZE; y++) {
            if (gameBoard.value[x][y] !== 0) {
              const distance = Math.sqrt(Math.pow(x - i, 2) + Math.pow(y - j, 2));
              if (distance < minDistance) {
                minDistance = distance;
              }
            }
          }
        }

        // 如果附近有棋子，优先选择
        if (minDistance <= 2) {
          validMoves.push({ row: i, col: j });
        }
      }
    }
  }

  // 如果有合适的位置，随机选择一个
  if (validMoves.length > 0) {
    return validMoves[Math.floor(Math.random() * validMoves.length)];
  }

  // 否则随机选择一个空位
  const emptyPositions = [];
  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      if (gameBoard.value[i][j] === 0) {
        emptyPositions.push({ row: i, col: j });
      }
    }
  }

  if (emptyPositions.length > 0) {
    return emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
  }

  return null;
}

// 困难AI - 使用评分系统选择最佳位置
function makeHardAIMove() {
  const aiPlayer = currentPlayer.value;
  const opponent = playerColor.value;
  let bestScore = -Infinity;
  let bestMove = null;

  // 检查棋盘中心位置
  const centerRow = Math.floor(BOARD_SIZE / 2);
  const centerCol = Math.floor(BOARD_SIZE / 2);

  if (gameBoard.value[centerRow][centerCol] === 0) {
    return { row: centerRow, col: centerCol };
  }

  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      if (gameBoard.value[i][j] === 0) {
        // 计算与已有棋子的距离
        let minDistance = Infinity;

        for (let x = 0; x < BOARD_SIZE; x++) {
          for (let y = 0; y < BOARD_SIZE; y++) {
            if (gameBoard.value[x][y] !== 0) {
              const distance = Math.sqrt(Math.pow(x - i, 2) + Math.pow(y - j, 2));
              if (distance < minDistance) {
                minDistance = distance;
              }
            }
          }
        }

        // 太远的位置不考虑
        if (minDistance > 3) {
          continue;
        }

        // 评估AI在这个位置落子的分数
        gameBoard.value[i][j] = aiPlayer;
        const aiScore = evaluatePosition(i, j, aiPlayer);
        gameBoard.value[i][j] = 0;

        // 评估对手在这个位置落子的分数
        gameBoard.value[i][j] = opponent;
        const opponentScore = evaluatePosition(i, j, opponent);
        gameBoard.value[i][j] = 0;

        // 综合评分：AI自己的得分 + 阻止对手的得分
        const score = aiScore * 1.2 + opponentScore;

        // 添加随机性，避免总是选择同样的走法
        const randomFactor = Math.random() * 5;

        if (score + randomFactor > bestScore) {
          bestScore = score + randomFactor;
          bestMove = { row: i, col: j };
        }
      }
    }
  }

  return bestMove;
}

// 评估位置的分数
function evaluatePosition(row, col, player) {
  const directions = [
    [1, 0],   // 水平
    [0, 1],   // 垂直
    [1, 1],   // 对角线
    [1, -1]   // 反对角线
  ];

  let maxScore = 0;

  for (const [dx, dy] of directions) {
    let score = 0;
    let count = 1;  // 当前位置已经有一个棋子
    let blockedEnds = 0;  // 被阻挡的端点数量

    // 正向检查
    for (let i = 1; i < 5; i++) {
      const newRow = row + i * dy;
      const newCol = col + i * dx;

      if (newRow < 0 || newRow >= BOARD_SIZE || newCol < 0 || newCol >= BOARD_SIZE) {
        blockedEnds++;
        break;
      }

      if (gameBoard.value[newRow][newCol] === player) {
        count++;
      } else if (gameBoard.value[newRow][newCol] !== 0) {
        blockedEnds++;
        break;
      } else {
        // 空位，检查是否可以形成更长的连子
        let canExtend = true;
        for (let j = 1; j < 5 - i; j++) {
          const checkRow = newRow + j * dy;
          const checkCol = newCol + j * dx;

          if (checkRow < 0 || checkRow >= BOARD_SIZE || checkCol < 0 || checkCol >= BOARD_SIZE ||
            gameBoard.value[checkRow][checkCol] === (player === 1 ? 2 : 1)) {
            canExtend = false;
            break;
          }
        }

        if (!canExtend) {
          blockedEnds++;
        }
        break;
      }
    }

    // 反向检查
    for (let i = 1; i < 5; i++) {
      const newRow = row - i * dy;
      const newCol = col - i * dx;

      if (newRow < 0 || newRow >= BOARD_SIZE || newCol < 0 || newCol >= BOARD_SIZE) {
        blockedEnds++;
        break;
      }

      if (gameBoard.value[newRow][newCol] === player) {
        count++;
      } else if (gameBoard.value[newRow][newCol] !== 0) {
        blockedEnds++;
        break;
      } else {
        // 空位，检查是否可以形成更长的连子
        let canExtend = true;
        for (let j = 1; j < 5 - i; j++) {
          const checkRow = newRow - j * dy;
          const checkCol = newCol - j * dx;

          if (checkRow < 0 || checkRow >= BOARD_SIZE || checkCol < 0 || checkCol >= BOARD_SIZE ||
            gameBoard.value[checkRow][checkCol] === (player === 1 ? 2 : 1)) {
            canExtend = false;
            break;
          }
        }

        if (!canExtend) {
          blockedEnds++;
        }
        break;
      }
    }

    // 根据连子数量和被阻挡的端点数量评分
    if (count >= 5) {
      score = 10000;  // 五连
    } else if (count === 4 && blockedEnds === 0) {
      score = 1000;   // 活四
    } else if (count === 4 && blockedEnds === 1) {
      score = 100;    // 冲四
    } else if (count === 3 && blockedEnds === 0) {
      score = 50;     // 活三
    } else if (count === 3 && blockedEnds === 1) {
      score = 10;     // 冲三
    } else if (count === 2 && blockedEnds === 0) {
      score = 5;      // 活二
    } else if (count === 2 && blockedEnds === 1) {
      score = 1;      // 冲二
    }

    if (score > maxScore) {
      maxScore = score;
    }
  }

  return maxScore;
}
// 五子棋电脑落子核心算法（findbestseat的JS实现）

const dx = [1, 0, 1, 1];
const dy = [0, 1, 1, -1];
const Score = [
  [0, 10, 100, 1000, 10000],  // 无阻挡
  [0, 5, 50, 500, 5000],      // 一端阻挡
  [0, 1, 10, 100, 1000]       // 两端阻挡
];

// 检查胜利条件（独立函数，传入棋盘、坐标、颜色）
function checkWin1(board, row, col, player) {
  const BOARD_SIZE = board.length;
  const directions = [
    [1, 0], [0, 1], [1, 1], [1, -1]
  ];
  for (const [dx, dy] of directions) {
    let count = 1;
    for (let i = 1; i < 5; i++) {
      const newRow = row + i * dy;
      const newCol = col + i * dx;
      if (newRow < 0 || newRow >= BOARD_SIZE || newCol < 0 || newCol >= BOARD_SIZE) break;
      if (board[newRow][newCol] === player) count++;
      else break;
    }
    for (let i = 1; i < 5; i++) {
      const newRow = row - i * dy;
      const newCol = col - i * dx;
      if (newRow < 0 || newRow >= BOARD_SIZE || newCol < 0 || newCol >= BOARD_SIZE) break;
      if (board[newRow][newCol] === player) count++;
      else break;
    }
    if (count >= 5) return true;
  }
  return false;
}

function isLiveThree(board, row, col, player) {
  const directions = [
    [1, 0], [0, 1], [1, 1], [1, -1]
  ];

  for (const [dx, dy] of directions) {
    let count = 1;
    let leftBlocked = false;
    let rightBlocked = false;

    // 正向检查
    for (let i = 1; i < 3; i++) {
      const newRow = row + i * dy;
      const newCol = col + i * dx;
      if (newRow < 0 || newRow >= board.length || newCol < 0 || newCol >= board.length) {
        leftBlocked = true;
        break;
      }
      if (board[newRow][newCol] === player) count++;
      else if (board[newRow][newCol] !== 0) {
        leftBlocked = true;
        break;
      }
    }

    // 反向检查
    for (let i = 1; i < 3; i++) {
      const newRow = row - i * dy;
      const newCol = col - i * dx;
      if (newRow < 0 || newRow >= board.length || newCol < 0 || newCol >= board.length) {
        rightBlocked = true;
        break;
      }
      if (board[newRow][newCol] === player) count++;
      else if (board[newRow][newCol] !== 0) {
        rightBlocked = true;
        break;
      }
    }

    // 判断是否为活三：3子相连且两端都为空
    if (count === 3 && !leftBlocked && !rightBlocked) {
      return true;
    }
  }

  return false;
}

function isLiveFour(board, row, col, player) {
  const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];

  for (const [dx, dy] of directions) {
    let count = 1;
    let leftBlocked = false;
    let rightBlocked = false;

    for (let i = 1; i < 4; i++) {
      const newRow = row + i * dy;
      const newCol = col + i * dx;
      if (newRow < 0 || newRow >= board.length || newCol < 0 || newCol >= board.length) {
        leftBlocked = true;
        break;
      }
      if (board[newRow][newCol] === player) count++;
      else if (board[newRow][newCol] !== 0) {
        leftBlocked = true;
        break;
      }
    }

    for (let i = 1; i < 4; i++) {
      const newRow = row - i * dy;
      const newCol = col - i * dx;
      if (newRow < 0 || newRow >= board.length || newCol < 0 || newCol >= board.length) {
        rightBlocked = true;
        break;
      }
      if (board[newRow][newCol] === player) count++;
      else if (board[newRow][newCol] !== 0) {
        rightBlocked = true;
        break;
      }
    }

    if (count === 4 && !leftBlocked && !rightBlocked) return true;
  }
  return false;
}
// color: 1=玩家(黑棋), 2=电脑(白棋)


// 新增函数：判断是否是“冲四”
function isBlockedFour(board, row, col, player) {
  const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];

  for (const [dx, dy] of directions) {
    let count = 1;
    let leftBlocked = false;
    let rightBlocked = false;

    for (let i = 1; i < 4; i++) {
      const newRow = row + i * dy;
      const newCol = col + i * dx;
      if (newRow < 0 || newRow >= board.length || newCol < 0 || newCol >= board.length) {
        leftBlocked = true;
        break;
      }
      if (board[newRow][newCol] === player) count++;
      else if (board[newRow][newCol] !== 0) {
        leftBlocked = true;
        break;
      }
    }

    for (let i = 1; i < 4; i++) {
      const newRow = row - i * dy;
      const newCol = col - i * dx;
      if (newRow < 0 || newRow >= board.length || newCol < 0 || newCol >= board.length) {
        rightBlocked = true;
        break;
      }
      if (board[newRow][newCol] === player) count++;
      else if (board[newRow][newCol] !== 0) {
        rightBlocked = true;
        break;
      }
    }

    if (count === 4 && (leftBlocked || rightBlocked)) return true;
  }
  return false;
}

// 五子棋电脑落子核心算法（findBestSeat 优化版）
// 五子棋电脑落子核心算法（findBestSeat 优化版，使用 Alpha-Beta 剪枝）
// 五子棋电脑落子核心算法（findBestSeat 优化版，使用 Alpha-Beta 剪枝）
function findBestSeat(board, color, depth = 0, maxDepth = 4, alpha = -Infinity, beta = Infinity) {
  const BOARD_SIZE = board.length;
  const enemyColor = color === 1 ? 2 : 1;
  let maxScore = -Infinity;
  let bestSeats = [];

  // 1. 自己是否能赢？
  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      if (board[i][j] !== 0) continue;
      board[i][j] = color;
      if (checkWin1(board, i, j, color)) {
        board[i][j] = 0;
        return { row: i, col: j, score: 99999 };
      }
      board[i][j] = 0;
    }
  }

  // 2. 对手是否能赢？（包括五连、活四、冲四）
  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      if (board[i][j] !== 0) continue;
      board[i][j] = enemyColor;
      if (checkWin1(board, i, j, enemyColor)) {
        board[i][j] = 0;
        return { row: i, col: j, score: 99999 }; // 对手能赢，必须堵
      }
      board[i][j] = 0;
    }
  }

  // 3. 对手是否能形成“冲四”？
  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      if (board[i][j] !== 0) continue;
      board[i][j] = enemyColor;
      if (isBlockedFour(board, i, j, enemyColor)) {
        board[i][j] = 0;

        // 检查自己是否也能赢
        board[i][j] = color;
        if (checkWin1(board, i, j, color)) {
          board[i][j] = 0;
          return { row: i, col: j, score: 99999 };
        }
        board[i][j] = 0;

        // 否则必须堵住“冲四”
        return { row: i, col: j, score: 80000 };
      }
      board[i][j] = 0;
    }
  }

  // 4. 对手是否能形成“活四”？
  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      if (board[i][j] !== 0) continue;
      board[i][j] = enemyColor;
      if (isLiveFour(board, i, j, enemyColor)) {
        board[i][j] = 0;
        return { row: i, col: j, score: 99999 };
      }
      board[i][j] = 0;
    }
  }

  // 5. 对手是否能形成“活三”？
  let liveThreeFound = false;
  let liveThreeMove = null;
  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      if (board[i][j] !== 0) continue;
      board[i][j] = enemyColor;
      if (isLiveThree(board, i, j, enemyColor)) {
        liveThreeFound = true;
        liveThreeMove = { row: i, col: j, score: 20000 };
        board[i][j] = 0;
        break;
      }
      board[i][j] = 0;
    }
    if (liveThreeFound) break;
  }
  if (liveThreeFound) {
    return liveThreeMove;
  }

  // 6. 搜索所有合法位置，评估评分
  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      if (board[i][j] !== 0) continue;

      // 判断是否是有效位置（周围有棋子）
      let hasNeighbor = false;
      for (let k = 0; k < 4; k++) {
        for (let d = -1; d <= 1; d += 2) {
          let ni = i + dx[k] * d;
          let nj = j + dy[k] * d;
          if (ni >= 0 && ni < BOARD_SIZE && nj >= 0 && nj < BOARD_SIZE && board[ni][nj] !== 0) {
            hasNeighbor = true;
            break;
          }
        }
        if (hasNeighbor) break;
      }
      if (!hasNeighbor) continue;

      let score = 0;

      // 自己落子评分
      board[i][j] = color;
      for (let k = 0; k < 4; k++) {
        let len = 0, enemy = 0;
        let ni = i, nj = j;
        while (ni >= 0 && ni < BOARD_SIZE && nj >= 0 && nj < BOARD_SIZE && board[ni][nj] === color) {
          len++;
          ni += dx[k];
          nj += dy[k];
        }
        if (ni < 0 || ni >= BOARD_SIZE || nj < 0 || nj >= BOARD_SIZE || (board[ni][nj] !== 0 && board[ni][nj] !== color)) {
          enemy++;
        }
        ni = i;
        nj = j;
        while (ni >= 0 && ni < BOARD_SIZE && nj >= 0 && nj < BOARD_SIZE && board[ni][nj] === color) {
          len++;
          ni -= dx[k];
          nj -= dy[k];
        }
        if (ni < 0 || ni >= BOARD_SIZE || nj < 0 || nj >= BOARD_SIZE || (board[ni][nj] !== 0 && board[ni][nj] !== color)) {
          enemy++;
        }
        len -= 2;
        if (len > 4) len = 4;
        if (Score[enemy][len] === 500) {
          board[i][j] = 0;
          return { row: i, col: j, score: Score[enemy][len] };
        }
        score += Score[enemy][len];
      }

      // 对手落子评分
      board[i][j] = enemyColor;
      for (let k = 0; k < 4; k++) {
        let len = 0, enemy = 0;
        let ni = i, nj = j;
        while (ni >= 0 && ni < BOARD_SIZE && nj >= 0 && nj < BOARD_SIZE && board[ni][nj] === enemyColor) {
          len++;
          ni += dx[k];
          nj += dy[k];
        }
        if (ni < 0 || ni >= BOARD_SIZE || nj < 0 || nj >= BOARD_SIZE || (board[ni][nj] !== 0 && board[ni][nj] !== enemyColor)) {
          enemy++;
        }
        ni = i;
        nj = j;
        while (ni >= 0 && ni < BOARD_SIZE && nj >= 0 && nj < BOARD_SIZE && board[ni][nj] === enemyColor) {
          len++;
          ni -= dx[k];
          nj -= dy[k];
        }
        if (ni < 0 || ni >= BOARD_SIZE || nj < 0 || nj >= BOARD_SIZE || (board[ni][nj] !== 0 && board[ni][nj] !== enemyColor)) {
          enemy++;
        }
        len -= 2;
        if (len > 4) len = 4;
        if (Score[enemy][len] === 500) {
          score += 10000; // 活四
        } else if (Score[enemy][len] === 100) {
          score += 5000; // 冲四
        } else if (Score[enemy][len] === 50) {
          score += 2000; // 活三
        }
        score += Score[enemy][len];
      }
      board[i][j] = 0;

      // 递归评估（最多maxDepth层）
      if (depth < maxDepth) {
        board[i][j] = color;
        if (checkWin1(board, i, j, color)) {
          board[i][j] = 0;
          score = 99999;
        } else {
          let enemyScore = findBestSeat(board, enemyColor, depth + 1, maxDepth, -beta, -alpha).score;
          board[i][j] = 0;
          score -= enemyScore;
        }
      }

      if (score > maxScore) {
        maxScore = score;
        if (depth === 0) bestSeats = [];
      }
      if (depth === 0 && score >= maxScore) {
        bestSeats.push({ row: i, col: j, score: score });
      }

      // Alpha-Beta 剪枝
      alpha = Math.max(alpha, score);
      if (alpha >= beta) {
        break;
      }
    }
  }

  // 返回最优位置（第一层）
  if (depth === 0 && bestSeats.length > 0) {
    const idx = Math.floor(Math.random() * bestSeats.length);
    return bestSeats[idx];
  }

  return { row: 0, col: 0, score: maxScore };
}
// 用法举例（假设电脑执黑，玩家执白）
// const move = findBestSeat(gameBoard.value, 1, 0, 2); // 1为黑棋，0为白棋，递归2层
// gameBoard.value[move.i][move.j] = 1; // 电脑落子
// 监听游戏模式变化
watch(gameMode, (newVal) => {
  if (newVal === 'pvc' && currentPlayer.value === 2) {
    setTimeout(makeAIMove, 500);
  }
});
</script>
