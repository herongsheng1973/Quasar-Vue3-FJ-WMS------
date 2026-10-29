/**
 * AI Worker - 背景执行AI计算
 * 实现迭代加深 + 可取消标志，完全不阻塞UI
 */

console.log('AI Worker 脚本开始加载...')

// 全局变量
let isCancelled = false
// let bestMoveFound = null

// 常量
const BOARD_SIZE = 15
const PLAYER_STONE = 1
const COMPUTER_STONE = 2

console.log('AI Worker 初始化完成，等待消息...')

// 监听主线程消息
self.onmessage = function (e) {
  console.log('AI Worker 收到消息:', e.data)
  const { action, data } = e.data

  switch (action) {
    case 'START_AI_SEARCH':
      console.log('开始AI搜索，数据:', data)
      startAISearch(data)
      break
    case 'CANCEL_AI_SEARCH':
      console.log('收到取消AI搜索指令')
      isCancelled = true
      // 报告取消状态
      self.postMessage({
        type: 'AI_SEARCH_CANCELLED',
        message: 'AI搜索已被取消',
      })
      break
    default:
      console.log('未知动作:', action)
  }
}

/**
 * 开始AI搜索
 */
function startAISearch({ board, difficulty }) {
  console.log('AI Worker startAISearch 被调用')
  console.log('difficulty:', difficulty)
  console.log('board size:', board.length)

  // 重置状态 - 确保每次搜索都是干净的
  isCancelled = false
  //bestMoveFound = null

  try {
    console.log(`AI Worker 开始搜索 [${difficulty}]`)

    // 只检查立即获胜机会 (最高优先级)
    const winMove = findImmediateWin(board, COMPUTER_STONE)
    if (winMove) {
      console.log('找到立即获胜移动:', winMove)
      self.postMessage({ type: 'AI_MOVE_FOUND', move: winMove, depth: 0, time: 0 })
      return
    }

    // 只检查阻挡玩家立即获胜 (第二优先级)
    const blockMove = findImmediateWin(board, PLAYER_STONE)
    if (blockMove) {
      console.log('找到阻挡玩家获胜移动:', blockMove)
      self.postMessage({ type: 'AI_MOVE_FOUND', move: blockMove, depth: 0, time: 0 })
      return
    }
    // 在阻挡玩家获胜之后，添加：
    const doubleThreatMove = findDoubleThreat(board, COMPUTER_STONE)
    if (doubleThreatMove) {
      console.log('找到双重威胁移动:', doubleThreatMove)
      self.postMessage({ type: 'AI_MOVE_FOUND', move: doubleThreatMove, depth: 0, time: 0 })
      return
    }
    // **移除威胁检测，直接进行深度搜索**
    // 这样AI会在每一步都进行完整的深度分析

    console.log('开始迭代加深搜索...')
    const result = iterativeDeepeningSearch(board, difficulty)

    if (result && result.move) {
      console.log('AI Worker 找到最佳移动:', result)
      self.postMessage({
        type: 'AI_MOVE_FOUND',
        move: result.move,
        depth: result.depth,
        time: result.time,
      })
    } else {
      console.warn('AI Worker 无法找到移动，使用fallback')
      const fallbackMove = getFallbackMove(board)
      self.postMessage({
        type: 'AI_MOVE_FOUND',
        move: fallbackMove,
        depth: 0,
        time: 0,
        error: 'No move found, using fallback',
      })
    }
  } catch (error) {
    console.error('AI Worker 搜索过程中发生错误:', error)
    const fallbackMove = getFallbackMove(board)
    self.postMessage({
      type: 'AI_MOVE_FOUND',
      move: fallbackMove,
      depth: 0,
      time: 0,
      error: error.message,
    })
  }
}

/**
 * 迭代加深搜索
 */
function iterativeDeepeningSearch(board, difficulty) {
  console.log(
    'AI Worker 开始迭代加深搜索，目标深度:',
    getTimeConfig(difficulty, evaluateBoardComplexity(board)).maxDepth,
    ', 时间限制:',
    getTimeConfig(difficulty, evaluateBoardComplexity(board)).baseTime + 'ms',
  )

  const startTime = Date.now()
  const timeConfig = getTimeConfig(difficulty, evaluateBoardComplexity(board))
  const candidates = getOrderedMoves(board)

  if (candidates.length === 0) {
    console.warn('没有可用的候选移动')
    return null
  }

  let bestMove = candidates[0]
  let finalDepth = 1 // 至少完成深度1

  try {
    // 迭代加深 - 修复: 只有成功完成的深度才被记录
    for (let depth = 1; depth <= timeConfig.maxDepth; depth++) {
      const depthStartTime = Date.now()

      // 发送进度更新
      self.postMessage({
        type: 'AI_PROGRESS',
        depth: depth,
        move: bestMove,
        elapsed: depthStartTime - startTime,
      })

      const result = searchAtDepth(board, depth, candidates, timeConfig, startTime)
      const depthTime = Date.now() - depthStartTime

      if (isCancelled) {
        console.log('搜索被取消')
        break
      }

      // 检查搜索是否成功完成
      if (result && result.move) {
        bestMove = result.move
        finalDepth = depth
        console.log(`深度 ${depth} 完成，用时 ${depthTime}ms, 最佳分数: ${result.score || 'N/A'}`)

        // 检查是否还有足够时间进行下一个深度的搜索
        const elapsed = Date.now() - startTime
        const remainingTime = timeConfig.baseTime - elapsed

        // 如果剩余时间不足以完成下一个深度，停止搜索
        // 估算下一个深度需要的时间（大约是当前深度的3-5倍）
        const estimatedNextDepthTime = depthTime * 4
        if (remainingTime < estimatedNextDepthTime) {
          console.log(
            `剩余时间 ${remainingTime}ms 不足完成下一深度（预估需要 ${estimatedNextDepthTime}ms），停止搜索`,
          )
          break
        }
      } else {
        console.log(
          `深度 ${depth} 搜索失败或不完整，用时 ${depthTime}ms，保持深度 ${finalDepth} 的结果`,
        )
        break // 如果这个深度没完成，更深的肯定也完成不了
      }
    }

    const totalTime = Date.now() - startTime
    console.log(`AI Worker 完成搜索，最终深度: ${finalDepth}, 总时间: ${totalTime}ms`)

    return {
      move: bestMove,
      depth: finalDepth,
      time: totalTime,
    }
  } catch (error) {
    console.error('迭代加深搜索错误:', error)
    return {
      move: bestMove,
      depth: finalDepth,
      time: Date.now() - startTime,
      error: error.message,
    }
  }
}

/**
 * 在指定深度搜索最佳移动
 */
function searchAtDepth(board, depth, candidates, timeConfig, startTime) {
  let bestMove = null
  let bestScore = -Infinity
  const searchStartTime = Date.now()

  // 添加少量随机性（基于难度）- 但不在高难度下影响搜索
  const randomChance = getRandom(timeConfig.difficulty)
  if (depth === 1 && Math.random() < randomChance) {
    const randomIndex = Math.floor(Math.random() * Math.min(candidates.length, 3))
    return { ...candidates[randomIndex], score: bestScore }
  }

  // 搜索最佳移动
  let movesEvaluated = 0
  const targetMoves = Math.min(timeConfig.searchWidth, candidates.length)

  for (let i = 0; i < targetMoves; i++) {
    // 检查取消和整体时间限制
    if (isCancelled) {
      console.log(`搜索在深度 ${depth} 被取消，已评估 ${movesEvaluated}/${targetMoves} 个移动`)
      break
    }

    const elapsed = Date.now() - startTime
    if (elapsed > timeConfig.baseTime * 0.8) {
      console.log(
        `搜索在深度 ${depth} 因时间限制停止，已评估 ${movesEvaluated}/${targetMoves} 个移动`,
      )
      break
    }

    const move = candidates[i]

    // 尝试此移动
    board[move.row][move.col] = COMPUTER_STONE

    // Alpha-Beta搜索
    const score = alphaBetaMinimax(
      board,
      depth - 1,
      -Infinity,
      Infinity,
      false,
      PLAYER_STONE,
      startTime,
      timeConfig.baseTime * 0.8, // 更严格的时间限制
    )

    // 撤销移动
    board[move.row][move.col] = 0

    if (score > bestScore) {
      bestScore = score
      bestMove = { ...move, score }
    }

    movesEvaluated++
  }

  const searchTime = Date.now() - searchStartTime

  // 只有当评估了合理数量的移动才认为搜索成功
  const minimumMoves = Math.min(5, candidates.length)
  const searchComplete = movesEvaluated >= minimumMoves

  if (!searchComplete) {
    console.log(
      `深度 ${depth} 搜索不完整：仅评估了 ${movesEvaluated}/${targetMoves} 个移动，用时 ${searchTime}ms`,
    )
    return null // 返回null表示搜索不完整
  }

  console.log(
    `深度 ${depth} 搜索完成：评估了 ${movesEvaluated}/${targetMoves} 个移动，用时 ${searchTime}ms，最佳分数 ${bestScore}`,
  )
  return bestMove
}

/**
 * Alpha-Beta Minimax算法 - 完整不中断版本
 */
function alphaBetaMinimax(
  board,
  depth,
  alpha,
  beta,
  isMaximizing,
  currentPlayer,
  startTime,
  timeLimit,
) {
  // 只在开始时检查取消和时间，不在中途中断
  if (depth === 0 || Date.now() - startTime > timeLimit) {
    return evaluateBoard(board, COMPUTER_STONE)
  }

  const moves = getOrderedMoves(board).slice(0, 25)

  if (isMaximizing) {
    let maxEval = -Infinity

    for (let i = 0; i < moves.length; i++) {
      const move = moves[i]
      board[move.row][move.col] = currentPlayer

      // 检查游戏结束
      if (checkWin(board, move.row, move.col, currentPlayer)) {
        board[move.row][move.col] = 0
        return currentPlayer === COMPUTER_STONE ? 100000 + depth : -100000 - depth
      }

      const evaluation = alphaBetaMinimax(
        board,
        depth - 1,
        alpha,
        beta,
        false,
        currentPlayer === COMPUTER_STONE ? PLAYER_STONE : COMPUTER_STONE,
        startTime,
        timeLimit,
      )

      board[move.row][move.col] = 0

      maxEval = Math.max(maxEval, evaluation)
      alpha = Math.max(alpha, evaluation)

      // Alpha-Beta剪枝
      if (beta <= alpha) break
    }

    return maxEval
  } else {
    let minEval = Infinity

    for (let i = 0; i < moves.length; i++) {
      const move = moves[i]
      board[move.row][move.col] = currentPlayer

      // 检查游戏结束
      if (checkWin(board, move.row, move.col, currentPlayer)) {
        board[move.row][move.col] = 0
        return currentPlayer === COMPUTER_STONE ? 100000 + depth : -100000 - depth
      }

      const evaluation = alphaBetaMinimax(
        board,
        depth - 1,
        alpha,
        beta,
        true,
        currentPlayer === COMPUTER_STONE ? PLAYER_STONE : COMPUTER_STONE,
        startTime,
        timeLimit,
      )

      board[move.row][move.col] = 0

      minEval = Math.min(minEval, evaluation)
      beta = Math.min(beta, evaluation)

      // Alpha-Beta剪枝
      if (beta <= alpha) break
    }

    return minEval
  }
}

/**
 * 时间配置
 */
function getTimeConfig(difficulty, complexity) {
  let baseConfig

  switch (difficulty) {
    case 'hard':
      baseConfig = {
        baseTime: 6000, // 6秒基础时间 (增加到让深度搜索完成)
        maxDepth: 8, // 最大8层
        searchWidth: 25, // 搜索宽度 (稍微减少以提高质量)
        difficulty: 'hard',
      }
      break
    case 'medium':
      baseConfig = {
        baseTime: 3500, // 3.5秒基础时间
        maxDepth: 6, // 最大6层
        searchWidth: 20, // 搜索宽度
        difficulty: 'medium',
      }
      break
    case 'easy':
      baseConfig = {
        baseTime: 2000, // 2秒基础时间
        maxDepth: 4, // 最大4层
        searchWidth: 15, // 搜索宽度
        difficulty: 'easy',
      }
      break
    default:
      baseConfig = {
        baseTime: 3500,
        maxDepth: 6,
        searchWidth: 20,
        difficulty: 'medium',
      }
  }

  // 根据复杂度动态调整 (更保守的调整)
  const timeMultiplier = Math.min(complexity * 0.6 + 0.7, 2.0) // 更保守的时间倍数
  const depthBonus = complexity > 2.5 ? 1 : 0 // 只在高复杂度时增加深度

  return {
    timeLimit: Math.floor(baseConfig.baseTime * timeMultiplier),
    baseTime: baseConfig.baseTime, // 添加baseTime字段
    maxDepth: Math.min(baseConfig.maxDepth + depthBonus, 10),
    searchWidth: baseConfig.searchWidth,
    difficulty: baseConfig.difficulty,
  }
}

/**
 * 随机性配置
 */
function getRandom(difficulty) {
  switch (difficulty) {
    case 'hard':
      return 0.001 // 0.1%随机性
    case 'medium':
      return 0.01 // 1%随机性
    case 'easy':
      return 0.05 // 5%随机性
    default:
      return 0.01
  }
}

// 以下是辅助函数的实现...

/**
 * 寻找立即获胜的移动
 */
function findImmediateWin(board, player) {
  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      if (board[i][j] === 0) {
        board[i][j] = player
        if (checkWin(board, i, j, player)) {
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
 * 寻找能创造双重威胁的移动
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

/**
 * 计算威胁数量
 */
function countThreats(board, row, col, player) {
  let threatCount = 0
  const directions = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ]

  for (const [dx, dy] of directions) {
    const threatLevel = analyzeDirectionThreat(board, row, col, dx, dy, player)
    threatCount += threatLevel
  }

  return threatCount
}

/**
 * 分析方向威胁级别
 */
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

/**
 * 评估棋盘复杂度
 */
function evaluateBoardComplexity(board) {
  let complexity = 1.0
  let occupiedCount = 0
  let threatenCount = 0

  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      if (board[i][j] !== 0) {
        occupiedCount++
        const threats = countThreats(board, i, j, board[i][j])
        if (threats > 0) threatenCount++
      }
    }
  }

  const occupancyFactor = Math.min(occupiedCount / 50.0, 2.0)
  const threatFactor = Math.min(threatenCount / 10.0, 3.0)

  complexity = 1.0 + occupancyFactor + threatFactor

  return Math.min(complexity, 5.0)
}

/**
 * 获取有序的移动候选
 */
function getOrderedMoves(board) {
  const moves = []
  const occupied = []

  // 收集已占位置
  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      if (board[i][j] !== 0) {
        occupied.push({ row: i, col: j })
      }
    }
  }

  // 开局处理
  if (occupied.length === 0) {
    const center = Math.floor(BOARD_SIZE / 2)
    return [{ row: center, col: center, score: 0 }]
  }

  if (occupied.length === 1) {
    const center = Math.floor(BOARD_SIZE / 2)
    const adjacent = [
      { row: center, col: center },
      { row: center - 1, col: center },
      { row: center + 1, col: center },
      { row: center, col: center - 1 },
      { row: center, col: center + 1 },
    ]

    return adjacent
      .filter(
        (pos) =>
          pos.row >= 0 &&
          pos.row < BOARD_SIZE &&
          pos.col >= 0 &&
          pos.col < BOARD_SIZE &&
          board[pos.row][pos.col] === 0,
      )
      .map((pos) => ({ row: pos.row, col: pos.col, score: 0 }))
  }

  // 在已占位置附近搜索
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

  // 评估和排序
  for (const pos of candidateSet) {
    const [row, col] = pos.split(',').map(Number)
    const score = evaluateMoveQuick(board, row, col)
    moves.push({ row, col, score })
  }

  // 按分数降序排序
  moves.sort((a, b) => b.score - a.score)

  return moves
}

/**
 * 快速移动评估
 */
function evaluateMoveQuick(board, row, col) {
  let score = 0

  // 评估AI落子
  board[row][col] = COMPUTER_STONE
  score += evaluateBoard(board, COMPUTER_STONE) * 1.1
  board[row][col] = 0

  // 评估玩家落子（防守价值）
  board[row][col] = PLAYER_STONE
  score += evaluateBoard(board, PLAYER_STONE) * 0.9
  board[row][col] = 0

  return score
}

/**
 * 棋盘评估函数
 */
function evaluateBoard(board, player) {
  const opponent = player === COMPUTER_STONE ? PLAYER_STONE : COMPUTER_STONE
  let score = 0

  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      if (board[i][j] === player) {
        score += evaluatePosition(board, i, j, player)
      } else if (board[i][j] === opponent) {
        score -= evaluatePosition(board, i, j, opponent)
      }
    }
  }

  return score
}

/**
 * 位置评估函数
 */
function evaluatePosition(board, row, col, player) {
  let totalScore = 0
  const directions = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ]

  for (const [dx, dy] of directions) {
    const lineScore = evaluateLine(board, row, col, dx, dy, player)
    totalScore += lineScore
  }

  return totalScore
}

/**
 * 线型评估函数
 */
function evaluateLine(board, row, col, dx, dy, player) {
  const line = []

  for (let i = -4; i <= 4; i++) {
    const r = row + i * dx
    const c = col + i * dy

    if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
      line.push(board[r][c])
    } else {
      line.push(-1)
    }
  }

  return analyzePattern(line, player)
}

/**
 * 模式分析函数
 */
function analyzePattern(line, player) {
  const opponent = player === COMPUTER_STONE ? PLAYER_STONE : COMPUTER_STONE
  let score = 0

  const pattern = line
    .map((cell) => {
      if (cell === player) return 'X'
      if (cell === opponent) return 'O'
      if (cell === 0) return '.'
      return '#'
    })
    .join('')

  const patterns = [
    { regex: /XXXXX/, score: 100000 },
    { regex: /\.XXXX\./, score: 50000 },
    { regex: /XXXX\./, score: 10000 },
    { regex: /\.XXXX/, score: 10000 },
    { regex: /XXX\.X/, score: 10000 },
    { regex: /X\.XXX/, score: 10000 },
    { regex: /XX\.XX/, score: 10000 },
    { regex: /\.XXX\./, score: 5000 },
    { regex: /\.XX\.X\./, score: 5000 },
    { regex: /\.X\.XX\./, score: 5000 },
    { regex: /XXX\./, score: 500 },
    { regex: /\.XXX/, score: 500 },
    { regex: /XX\.X/, score: 500 },
    { regex: /X\.XX/, score: 500 },
    { regex: /\.XX\./, score: 200 },
    { regex: /\.X\.X\./, score: 200 },
    { regex: /XX\./, score: 50 },
    { regex: /\.XX/, score: 50 },
    { regex: /X\.X/, score: 50 },

    // 防守模式
    { regex: /OOOOO/, score: -90000 },
    { regex: /\.OOOO\./, score: -45000 },
    { regex: /OOOO\./, score: -9000 },
    { regex: /\.OOOO/, score: -9000 },
    { regex: /OOO\.O/, score: -9000 },
    { regex: /O\.OOO/, score: -9000 },
    { regex: /OO\.OO/, score: -9000 },
    { regex: /\.OOO\./, score: -4500 },
    { regex: /\.OO\.O\./, score: -4500 },
    { regex: /\.O\.OO\./, score: -4500 },
    { regex: /OOO\./, score: -450 },
    { regex: /\.OOO/, score: -450 },
    { regex: /OO\.O/, score: -450 },
    { regex: /O\.OO/, score: -450 },
    { regex: /\.OO\./, score: -180 },
    { regex: /\.O\.O\./, score: -180 },
    { regex: /OO\./, score: -45 },
    { regex: /\.OO/, score: -45 },
    { regex: /O\.O/, score: -45 },
  ]

  for (const { regex, score: patternScore } of patterns) {
    const matches = pattern.match(regex)
    if (matches) {
      score += patternScore * matches.length
    }
  }

  return score
}

/**
 * 检查是否获胜
 */
function checkWin(board, row, col, player) {
  return (
    checkDirection(board, row, col, 1, 0, player) ||
    checkDirection(board, row, col, 0, 1, player) ||
    checkDirection(board, row, col, 1, 1, player) ||
    checkDirection(board, row, col, 1, -1, player)
  )
}

/**
 * 检查指定方向是否有五子连珠
 */
function checkDirection(board, row, col, dx, dy, player) {
  let count = 1

  for (let i = 1; i < 5; i++) {
    const r = row + i * dx
    const c = col + i * dy

    if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) {
      count++
    } else {
      break
    }
  }

  for (let i = 1; i < 5; i++) {
    const r = row - i * dx
    const c = col - i * dy

    if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) {
      count++
    } else {
      break
    }
  }

  return count >= 5
}

/**
 * 获取fallback移动 - 当AI搜索失败时使用
 */
function getFallbackMove(board) {
  console.log('使用fallback移动')

  // 简单地寻找中心附近的空位
  const center = Math.floor(BOARD_SIZE / 2)

  for (let radius = 0; radius < 5; radius++) {
    for (let i = -radius; i <= radius; i++) {
      for (let j = -radius; j <= radius; j++) {
        const row = center + i
        const col = center + j

        if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE && board[row][col] === 0) {
          return { row, col }
        }
      }
    }
  }

  // 如果中心都被占了，随机找一个空位
  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      if (board[i][j] === 0) {
        return { row: i, col: j }
      }
    }
  }

  return null
}
