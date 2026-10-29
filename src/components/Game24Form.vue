<template>
  <div class="game-container bg-white text-black rounded-xl q-pa-xl" style="width: 100%; max-width: 900px;">
    <h2 class="text-h4 text-black text-center text-bold">24点游戏</h2>

    <div class="row justify-between q-mt-md q-mb-md">
      <div class="text-subtitle1">分数：{{ score }}</div>
      <div class="text-subtitle1">时间：{{ timeLeft }}s</div>
    </div>

    <div class="row justify-center q-gutter-md q-my-xl">
      <q-btn v-for="(num, idx) in currentNumbers" :key="idx" size="lg" :label="num"
        :color="usedNumbers.includes(idx) ? 'primary' : 'grey'" @click="toggleNumberSelection(idx)" class="text-h3"
        style="width: 80px; height: 80px;" />
    </div>

    <!-- 表达式输入框 → 支持键盘输入 + 点击聚焦 -->
    <div class="text-center q-my-xl">
      <div class="text-h6 text-grey-7">当前表达式</div>
      <input v-model="expression" @input="handleExpressionInput"
        class="text-h2 text-bold q-mt-sm text-center bg-gray-50 border rounded-xl p-3 w-full"
        style="outline: none; border:1px solid #ddd;" placeholder="请输入算式" />
    </div>

    <div class="row justify-center q-gutter-sm q-my-md flex-wrap">
      <q-btn label="+" size="lg" color="accent" @click="addOperation('+')" />
      <q-btn label="-" size="lg" color="accent" @click="addOperation('-')" />
      <q-btn label="×" size="lg" color="accent" @click="addOperation('×')" />
      <q-btn label="÷" size="lg" color="accent" @click="addOperation('÷')" />
      <q-btn label="(" size="lg" color="accent" @click="addOperation('(')" />
      <q-btn label=")" size="lg" color="accent" @click="addOperation(')')" />
      <q-btn label="←" size="lg" color="warning" @click="removeLastChar" />
      <q-btn label="C" size="lg" color="negative" @click="clearExpression" />
      <q-btn label="=" size="lg" color="positive" @click="calculateResult" />
      <q-btn label="提示" size="lg" color="primary" @click="solve24point" />
    </div>

    <div class="game-controls q-mt-xl row justify-center q-gutter-md">
      <q-btn label="开始游戏" icon="play_arrow" color="primary" @click="startGame" />
      <q-btn label="重新开始" icon="refresh" color="secondary" @click="restartGame" />
      <q-btn label="下一题" icon="skip_next" color="info" @click="nextRound" />
    </div>
  </div>

  <q-dialog v-model="winDialogVisible">
    <q-card>
      <q-card-section class="text-center">
        <div class="q-pa-md bg-green-1 rounded-full flex items-center justify-center q-mx-auto q-mb-md"
          style="width:4rem;height:4rem;">
          <q-icon name="emoji_events" color="yellow-5" size="3rem" />
        </div>
        <h2 class="text-h5 text-bold q-mb-sm">挑战成功！</h2>
        <p class="text-grey-7 q-mb-lg">当前得分：{{ score }}</p>
        <q-btn label="继续游戏" color="primary" @click="nextRound" />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useQuasar } from 'quasar'
const $q = useQuasar()

const gameStarted = ref(false)
const score = ref(0)
const timeLeft = ref(60)
const timer = ref(null)
const showResult = ref(false)
const resultCorrect = ref(false)
const winDialogVisible = ref(false)

const currentNumbers = ref([0, 0, 0, 0])
const expression = ref('')
const usedNumbers = ref([])

// 生成随机数
const generateRandomNumbers = () => {
  return Array.from({ length: 4 }, () => Math.floor(Math.random() * 13) + 1)
}

// 开始游戏
const startGame = () => {
  gameStarted.value = true
  score.value = 0
  timeLeft.value = 60
  nextRound()

  timer.value = setInterval(() => {
    timeLeft.value--
    if (timeLeft.value <= 0) {
      endGame()
    }
  }, 1000)
}

// 结束游戏
const endGame = () => {
  clearInterval(timer.value)
  timer.value = null
  gameStarted.value = false

  $q.dialog({
    title: '游戏结束',
    message: `你的最终得分是: ${score.value}`,
    ok: '再来一局'
  }).onOk(() => {
    startGame()
  })
}

// 重新开始
const restartGame = () => {
  clearInterval(timer.value)
  startGame()
}

// 下一题
const nextRound = () => {
  winDialogVisible.value = false
  currentNumbers.value = generateRandomNumbers()
  expression.value = ''
  timeLeft.value = 60
  usedNumbers.value = []
  showResult.value = false
}

// 数字点击
const toggleNumberSelection = (index) => {
  if (usedNumbers.value.includes(index)) return
  if (expression.value.length > 0 && !isNaN(expression.value.slice(-1))) {
    $q.notify({ type: 'warning', message: '请先添加操作符' })
    return
  }
  expression.value += `${currentNumbers.value[index]}`
  usedNumbers.value.push(index)
}

// 运算符
const addOperation = (operator) => {
  if (expression.value.length === 0 && operator !== '(') {
    $q.notify({ type: 'warning', message: '表达式不能以无效操作符开始' })
    return
  }
  expression.value += `${operator}`
}

// 键盘输入表达式时同步更新
const handleExpressionInput = () => {
  // 这里可以做输入过滤，如需限制字符可在这里写
}

// 计算结果
const calculateResult = () => {
  if (!expression.value) return

  try {
    const evalExpression = expression.value
      .replace(/×/g, '*')
      .replace(/÷/g, '/')

    const result = eval(evalExpression)
    resultCorrect.value = Math.abs(result - 24) < 0.0001
    showResult.value = true

    if (resultCorrect.value) {
      score.value += 10
      winDialogVisible.value = true
    } else {
      $q.notify({ type: 'negative', message: '答案不正确' })
    }
  } catch {
    $q.notify({ type: 'negative', message: '表达式错误，请重新输入' })
  }
}

// 清空
const clearExpression = () => {
  expression.value = ''
  usedNumbers.value = []
}

// 退格
const removeLastChar = () => {
  if (expression.value.length > 0) {
    expression.value = expression.value.slice(0, -1)
  }
}

// ====================
// 提示求解逻辑
// ====================
const inputError = ref('')
const isSolving = ref(false)
const solutions = ref([])
const showNoSolution = ref(false)

const isInputValid = computed(() => {
  return currentNumbers.value.every(num => !isNaN(num) && num >= 1 && num <= 13)
})

watch(currentNumbers, () => {
  solutions.value = []
  showNoSolution.value = false
})

// 排列组合
const permutations = (arr) => {
  if (arr.length === 0) return []
  if (arr.length === 1) return [arr]
  const result = []
  for (let i = 0; i < arr.length; i++) {
    const current = arr[i]
    const remaining = [...arr.slice(0, i), ...arr.slice(i + 1)]
    for (const perm of permutations(remaining)) {
      result.push([current, ...perm])
    }
  }
  return [...new Set(result.map(p => p.join(',')))].map(p => p.split(',').map(Number))
}

// 运算符组合
const generateOperatorCombinations = () => {
  const operators = ['+', '-', '*', '/']
  const result = []
  const generate = (current) => {
    if (current.length === 3) {
      result.push([...current])
      return
    }
    for (const op of operators) {
      current.push(op)
      generate(current)
      current.pop()
    }
  }
  generate([])
  return result
}

// 求解 24 点
const solve24point = () => {
  if (!isInputValid.value) {
    inputError.value = '请输入4个1到13之间的整数'
    return
  }

  inputError.value = ''
  isSolving.value = true
  solutions.value = []
  showNoSolution.value = false

  setTimeout(() => {
    try {
      const nums = [...currentNumbers.value]
      const numberPermutations = permutations(nums)
      const operatorCombinations = generateOperatorCombinations()
      const foundSolutions = new Set()

      for (const numsPerm of numberPermutations) {
        for (const ops of operatorCombinations) {
          const expr1 = `((${numsPerm[0]}${ops[0]}${numsPerm[1]})${ops[1]}${numsPerm[2]})${ops[2]}${numsPerm[3]}`
          const expr2 = `(${numsPerm[0]}${ops[0]}(${numsPerm[1]}${ops[1]}${numsPerm[2]}))${ops[2]}${numsPerm[3]}`
          const expr3 = `${numsPerm[0]}${ops[0]}(((${numsPerm[1]}${ops[1]}${numsPerm[2]})${ops[2]}${numsPerm[3]}))`
          const expr4 = `${numsPerm[0]}${ops[0]}(${numsPerm[1]}${ops[1]}(${numsPerm[2]}${ops[2]}${numsPerm[3]}))`
          const expr5 = `(${numsPerm[0]}${ops[0]}${numsPerm[1]})${ops[1]}(${numsPerm[2]}${ops[2]}${numsPerm[3]})`

          const exprList = [expr1, expr2, expr3, expr4, expr5]
          exprList.forEach(expr => {
            try {
              if (Math.abs(eval(expr) - 24) < 1e-6) {
                foundSolutions.add(expr)
              }
            } catch {
              $q.notify({ type: 'negative', message: `表达式 ${expr} 计算出错` })
            }
          })
        }
      }

      solutions.value = Array.from(foundSolutions).sort()
      if (solutions.value.length > 0) {
        expression.value = solutions.value[0]
          .replace(/\*/g, '×')
          .replace(/\//g, '÷')
      } else {
        expression.value = '没有找到解'
        showNoSolution.value = true
      }
    } catch {
      $q.notify({ type: 'negative', message: '计算出错' })
    } finally {
      isSolving.value = false
    }
  }, 50)
}

onMounted(() => { })
onUnmounted(() => {
  if (timer.value) clearInterval(timer.value)
})
</script>

<style scoped>
.game-container {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}
</style>
