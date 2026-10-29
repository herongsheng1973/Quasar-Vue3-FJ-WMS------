<template>

  <div class="game-container bg-white text-black rounded-xl q-pa-xl">
    <h2 class="text-h4 text-black-9f text-center text-bold">五子棋游戏</h2>
    <div class="game-board-container q-mt-md">
      <canvas ref="gameCanvas" class="cursor-pointer"></canvas>
    </div>
    <div class="game-info row justify-between q-mt-xl">
      <div class="player-info column items-center">
        <div class="player-avatar q-mb-sm">
          <q-icon name="person" size="lg" />
        </div>
        <div :class="currentPlayer === 1 ? 'black-stone stone-indicator' : 'white-stone stone-indicator'"></div>
        <h6 class="text-subtitle1">{{ currentPlayer === 1 ? '玩家 1' : '玩家 2' }}</h6>
      </div>
      <div class="game-status column items-center">
        <div class="q-mb-sm row items-center">
          <div class="game-status">{{ statusText }}</div>
        </div>
        <div class="game-controls q-mt-xl row justify-center q-gutter-md">
          <q-btn label="重新开始" icon="refresh" color="secondary" @click="resetGame" />
          <q-btn label="悔棋" icon="undo" color="secondary" @click="undoMove" />
        </div>
      </div>
      <div class="player-info column items-center">
        <div class="player-avatar q-mb-sm">
          <q-icon name="person" size="lg" />
        </div>
        <div :class="currentPlayer === 2 ? 'black-stone stone-indicator' : 'white-stone stone-indicator'"></div>
        <h6 class="text-subtitle1">{{ currentPlayer === 2 ? '玩家 1' : '玩家 2' }}</h6>
      </div>
    </div>
  </div>
  <q-dialog v-model="winDialogVisible">
    <q-card>
      <q-card-section class="text-center">
        <div class="q-pa-md bg-green-1 q-border-radius-circle flex items-center justify-center q-mx-auto q-mb-md"
          style="width:4rem;height:4rem;">
          <q-icon name="emoji_events" color="yellow-5" size="3rem" />
        </div>
        <h2 class="text-h5 text-bold q-mb-sm">{{ winnerText }}</h2>
        <p class="text-grey-7 q-mb-lg">恭喜获胜!</p>
        <q-btn label="开始新游戏" color="primary" @click="resetGame" />
      </q-card-section>
    </q-card>
  </q-dialog>

</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
// import { useQuasar } from 'quasar'
// const $q = useQuasar()
const BOARD_SIZE = 19; // 15×15的棋盘
const CELL_SIZE = ref(40);
const PIECE_SIZE = computed(() => CELL_SIZE.value * 0.8);

const gameCanvas = ref(null);
const gameBoard = ref(Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0)));
const gameMode = ref('pvc')
const currentPlayer = ref(1);
const gameActive = ref(true);
const moveHistory = ref([])
const aiLevel = ref('hard')
const timerInterval = ref(null)
const gameTime = ref('')
const winDialogVisible = ref(false);

const statusText = computed(() => {
  return `游戏进行中 - ${currentPlayer.value === 1 ? '玩家 1' : '玩家 2'} 回合`;
});

const winnerText = computed(() => {
  return `${currentPlayer.value === 1 ? '玩家 1' : '玩家 2'} 获胜!`;
});

function deepCloneBoard(board) {
  return board.map(row => [...row]);
}
// 在 script setup 中定义 worker
const aiWorker = new Worker('/js/ai-worker-v2.js');

// 监听 Worker 返回的消息
aiWorker.onmessage = function (e) {
  console.log('收到 Worker 回复:', e.data);
};
const boardCopy = deepCloneBoard(gameBoard.value);
// 发送一条测试消息
aiWorker.postMessage({
  type: 'TEST_MESSAGE',
  content: 'Hello from main thread!',
  timestamp: Date.now(),
});

// 发送消息给 Worker
aiWorker.postMessage({
  action: 'START_AI_SEARCH',
  data: {
    board: boardCopy,
    difficulty: 'hard',
  },
});
// 替换原有 AI 函数
function makeEasyAIMove() {
  console.log('简单难度，随机选择落子位置');
  const emptyCells = [];
  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      if (gameBoard.value[i][j] === 0) {
        emptyCells.push({ row: i, col: j });
      }
    }
  }
  return emptyCells[Math.floor(Math.random() * emptyCells.length)];
}

/**
 * 寻找能够创造双重威胁的移动
 */
function findDoubleThreat(board, player) {
  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      if (board[i][j] === 0) {
        board[i][j] = player
        const threats = countThreats(board, i, j, player)

        if (threats >= 2) {
          board[i][j] = 0
          return { row: i, col: j }
        }
        board[i][j] = 0
      }
    }
  }
  return null
}

function countThreats(board, row, col, player) {
  let threatCount = 0;
  const directions = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];

  for (const [dx, dy] of directions) {
    const threatLevel = analyzeDirectionThreat(board, row, col, dx, dy, player)
    threatCount += threatLevel;
  }

  return threatCount;
}
function analyzeDirectionThreat(board, row, col, dx, dy, player) {
  const line = []
  for (let i = -3; i <= 3; i++) {
    const r = row + i * dx
    const c = col + i * dy

    if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
      if (r === row && c === col) {
        line.push(player)
      } else {
        line.push(board[r][c])
      }
    } else {
      line.push(-1)
    }
  }

  const pattern = line
    .map((cell) => {
      if (cell === player) return 'X'
      if (cell !== 0 && cell !== -1) return 'O'
      if (cell === 0) return '.'
      return '#'
    })
    .join('')

  if (pattern.includes('XXXX')) return 3
  if (pattern.includes('.XXXX.')) return 2.5
  if (pattern.includes('.XXX.')) return 2
  if (pattern.includes('XXX.') || pattern.includes('.XXX')) return 1.5
  if (pattern.includes('.XX.X.') || pattern.includes('.X.XX.')) return 1.8
  if (pattern.includes('XX.XX')) return 1.7
  if (pattern.includes('.XX.')) return 1
  if (pattern.includes('XX.') || pattern.includes('.XX')) return 0.5

  return 0
}
function makeMediumAIMove() {
  console.log('中等难度，混合简单和困难算法');
  // 先尝试立即胜利
  const winMove = findImmediateWin(gameBoard.value, 2);
  if (winMove) return winMove;

  // 再尝试防守玩家的立即胜利
  const blockMove = findImmediateWin(gameBoard.value, 1);
  if (blockMove) return blockMove;

  // 尝试创造双重威胁
  const doubleThreatMove = findDoubleThreat(gameBoard.value, 2);
  if (doubleThreatMove) {
    console.log('找到双重威胁移动:', doubleThreatMove);
    return doubleThreatMove;
  }

  // 否则使用随机策略
  return makeEasyAIMove();
}



// 在组件卸载时统一清理所有异步任务
onBeforeUnmount(() => {
  aiWorker.terminate();
  cleanupHandlers.forEach(handler => handler());
});

function makeHardAIMove() {
  console.log('困难算法');

  // 检查 gameBoard 数据是否合法
  const isValid = gameBoard.value.every(row => row.every(cell => typeof cell === 'number'));
  if (!isValid) {
    console.error('gameBoard 包含不可克隆的数据');
    return Promise.reject('gameBoard 数据不合法');
  }

  // 安全深拷贝棋盘
  const boardCopy = deepCloneBoard(gameBoard.value);

  // 发送消息给 Worker
  aiWorker.postMessage({
    action: 'START_AI_SEARCH',
    data: {
      board: boardCopy,
      difficulty: 'hard',
    },
  });

  return new Promise((resolve, reject) => {
    // 定义消息监听器
    const listener = function (e) {
      if (e.data.type === 'AI_MOVE_FOUND') {
        aiWorker.removeEventListener('message', listener);
        if (e.data.error) {
          console.error('AI搜索错误:', e.data.error);
          reject(e.data.error);
        } else {
          resolve(e.data.move);
        }
      }
    };

    // 添加监听器
    aiWorker.addEventListener('message', listener);

    // 添加超时机制
    const timeout = setTimeout(() => {
      aiWorker.removeEventListener('message', listener);
      reject('AI搜索超时');
    }, 10000); // 10秒超时

    // 定义清理函数
    const abortHandler = () => {
      aiWorker.removeEventListener('message', listener);
      clearTimeout(timeout);
      reject('组件卸载，AI搜索中止');
    };

    // 将清理函数加入统一管理的数组中
    cleanupHandlers.push(abortHandler);
  });
}
function findImmediateWin(board, player) {
  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      if (board[i][j] === 0) {
        board[i][j] = player;
        if (checkWin(i, j, player)) {
          board[i][j] = 0;
          return { row: i, col: j };
        }
        board[i][j] = 0;
      }
    }
  }
  return null;
}
// 初始化和事件绑定
onMounted(() => {
  setCanvasSize();
  drawBoard();
  startTimer();
  addCanvasEvents();
  window.addEventListener('resize', handleResize);
});
let cleanupHandlers = [];


// 重置游戏
function resetGame() {
  gameBoard.value = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0));
  currentPlayer.value = 1;
  gameActive.value = true;
  startTimer()
  winDialogVisible.value = false;
  drawBoard();
  // 如果是人机对战且电脑先手，则电脑落子
  if (gameMode.value === 'pvc' && currentPlayer.value === 2) {
    setTimeout(makeAIMove, 500);
  }
}
// 窗口大小变化处理
function handleResize() {
  setCanvasSize();
  drawBoard();
}
// 设置Canvas尺寸
function setCanvasSize() {
  const canvas = gameCanvas.value;
  canvas.width = CELL_SIZE.value * BOARD_SIZE;
  canvas.height = CELL_SIZE.value * BOARD_SIZE;
}

// 绘制棋盘
function drawBoard() {
  const canvas = gameCanvas.value;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 绘制棋盘背景
  ctx.fillStyle = '#DEB887';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 绘制网格线
  ctx.strokeStyle = '#8B4513';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < BOARD_SIZE; i++) {
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

  // 绘制天元和星位
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
    const gradient = ctx.createRadialGradient(
      x - PIECE_SIZE.value / 6, y - PIECE_SIZE.value / 6, PIECE_SIZE.value / 10,
      x, y, PIECE_SIZE.value / 2
    );
    gradient.addColorStop(0, '#555');
    gradient.addColorStop(1, '#000');
    ctx.fillStyle = gradient;
  } else {
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

// 点击棋盘事件
function handleCanvasClick(e) {
  if (!gameActive.value) return;

  const canvas = gameCanvas.value;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  const x = (e.clientX - rect.left) * scaleX;
  const y = (e.clientY - rect.top) * scaleY;

  const col = Math.round((x - CELL_SIZE.value / 2) / CELL_SIZE.value);
  const row = Math.round((y - CELL_SIZE.value / 2) / CELL_SIZE.value);

  if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE && gameBoard.value[row][col] === 0) {
    gameBoard.value[row][col] = currentPlayer.value;
    moveHistory.value.push({ row, col, player: currentPlayer.value });
    drawBoard();

    if (checkWin(row, col, currentPlayer.value)) {
      showWinModal();
      return;
    }

    currentPlayer.value = currentPlayer.value === 1 ? 2 : 1;
    console.log('currentPlayer:', currentPlayer.value, 'gameMode:', gameMode.value)
    // 如果是人机对战且现在是电脑回合，让电脑落子
    if (gameMode.value === 'pvc' && currentPlayer.value === 2) {
      makeAIMove();
    }
  }
}
// 鼠标悬停预览效果
function handleCanvasMouseMove(e) {
  if (!gameActive.value) return;
  if (gameMode.value === 'pvc' && currentPlayer.value !== 2) return;

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

function checkDraw() {
  console.log('检查平局')
}
// 胜利模态框
function showWinModal() {
  gameActive.value = false;
  winDialogVisible.value = true;
}

// 事件绑定
function addCanvasEvents() {
  const canvas = gameCanvas.value;
  canvas.addEventListener('click', handleCanvasClick);
  canvas.addEventListener('mousemove', handleCanvasMouseMove);
  canvas.addEventListener('mouseleave', handleCanvasMouseLeave);
}

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

// 人机对战 - 电脑落子
async function makeAIMove() {
  if (!gameActive.value || gameMode.value !== 'pvc' || currentPlayer.value !== 2) return;

  let move;

  try {
    if (aiLevel.value === 'easy') {
      move = makeEasyAIMove();
    } else if (aiLevel.value === 'medium') {
      move = makeMediumAIMove();
    } else if (aiLevel.value === 'hard') {
      move = await makeHardAIMove();
    } else {
      move = makeEasyAIMove();
    }
  } catch (err) {
    console.error('AI 落子失败，使用随机策略作为 fallback:', err);
    move = makeEasyAIMove();
  }

  if (move) {
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

      currentPlayer.value = 1;
    }, 500);
  }
}
watch(gameMode, (newVal) => {
  if (newVal === 'pvc' && currentPlayer.value === 2) {
    setTimeout(makeAIMove, 500);
  }
});
</script>

<style scoped>
.game-container {
  max-width: 1000px;
  margin: 0 auto;
}

.game-board-container {
  position: relative;
  background-color: #daa06d;
  border-radius: 4px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.3);
  aspect-ratio: 1 / 1;
  max-width: 1000px;
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

.game-controls {
  margin-top: 20px;
}
</style>
