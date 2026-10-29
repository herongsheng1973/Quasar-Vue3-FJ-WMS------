<template>
  <q-page class="q-pa-md">
    <!-- 页面标题和操作区 -->
    <div class="col-12 flex justify-between items-center q-mb-sm q-mt-sm">
      <div>
        <h4 class="text-h4 text-weight-bold text-grey-8 q-mb-xs">待办事项</h4>
        <p class="text-grey-5 text-sm">管理和组织您的所有任务</p>
      </div>
      <div>
        <q-btn color="primary" label="添加任务" icon="add" @click="openTaskDialog" />
      </div>
    </div>

    <!-- 任务统计卡片 -->
    <div class="row col-12 q-col-gutter-md">
      <div class="col-md-3 col-sm-6">
        <q-card class="stat-card bg-primary text-white shadow-2 hover:shadow-6 transition-all">
          <q-card-section class="text-center">
            <div class="text-h4">{{ totalTasks }}</div>
            <div class="text-subtitle1">总任务</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-md-3 col-sm-6">
        <q-card class="stat-card bg-green text-white shadow-2 hover:shadow-6 transition-all">
          <q-card-section class="text-center">
            <div class="text-h4">{{ completedTasks }}</div>
            <div class="text-subtitle1">已完成</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-md-3 col-sm-6">
        <q-card class="stat-card bg-orange text-white shadow-2 hover:shadow-6 transition-all">
          <q-card-section class="text-center">
            <div class="text-h4">{{ pendingTasks }}</div>
            <div class="text-subtitle1">进行中</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-md-3 col-sm-6">
        <q-card class="stat-card bg-red text-white shadow-2 hover:shadow-6 transition-all">
          <q-card-section class="text-center">
            <div class="text-h4">{{ overdueTasks }}</div>
            <div class="text-subtitle1">已过期</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- 任务操作区域 -->
    <q-card class="col-12 q-mb-md">
      <q-card-section>
        <div class="row q-col-gutter-md items-center">
          <div class="col-md-6">
            <q-input v-model="searchQuery" placeholder="搜索任务标题或详情..." outlined dense>
              <template v-slot:prepend>
                <q-icon name="search" />
              </template>
              <template v-slot:append>
                <q-icon v-if="searchQuery" name="clear" class="cursor-pointer" @click="searchQuery = ''" />
              </template>
            </q-input>
          </div>

          <div class="col-md-2">
            <q-select v-model="filterStatus" :options="statusOptions" label="状态筛选" outlined dense emit-value
              map-options />
          </div>
          <div class="col-md-2">
            <q-select v-model="sortBy" :options="sortOptions" label="排序方式" outlined dense emit-value map-options
              @update:model-value="$nextTick(() => { })" />
          </div>
          <div class="col-md-2 text-right">
            <q-btn color="primary" label="添加详细任务" icon="add" @click="openTaskDialog" />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- 任务列表 -->
    <q-card class="col-12">
      <q-card-section>
        <q-list bordered separator>
          <q-item v-for="task in filteredTasks" :key="task.id" clickable @click="toggleTaskStatus(task)">
            <q-item-section side>
              <q-checkbox v-model="task.completed" @click.stop @update:model-value="updateTaskStatus(task, $event)" />
            </q-item-section>

            <q-item-section>
              <q-item-label :class="{ 'text-strikethrough': task.completed }">
                {{ task.title }}
              </q-item-label>
              <q-item-label caption>
                <div class="row items-center">
                  <q-icon name="calendar_today" size="14px" class="q-mr-xs" />
                  <span>{{ formatDate(task.due_date) }}</span>
                  <q-icon v-if="isOverdue(task)" name="warning" color="red" size="14px" class="q-ml-sm">
                    <q-tooltip>已过期</q-tooltip>
                  </q-icon>
                  <q-chip v-if="task.priority" :color="getPriorityColor(task.priority)" text-color="white" dense
                    class="q-ml-sm">
                    {{ task.priority }}
                  </q-chip>
                  <q-chip v-if="task.category" color="grey-7" text-color="white" dense class="q-ml-sm">
                    {{ task.category }}
                  </q-chip>
                </div>
              </q-item-label>
              <q-item-label v-if="task.description" caption class="text-grey-7 q-mt-xs">
                {{ task.description }}
              </q-item-label>
            </q-item-section>

            <q-item-section side>
              <div class="row">
                <q-btn flat round dense icon="edit" @click.stop="editTask(task)" class="q-mr-sm">
                  <q-tooltip>编辑</q-tooltip>
                </q-btn>
                <q-btn flat round dense icon="delete" color="negative" @click.stop="confirmDeleteTask(task)">
                  <q-tooltip>删除</q-tooltip>
                </q-btn>
              </div>
            </q-item-section>
          </q-item>

          <q-item v-if="filteredTasks.length === 0">
            <q-item-section class="text-center text-grey-5">
              <q-icon name="task" size="48px" class="q-mb-md" />
              <div>暂无任务</div>
              <div class="text-caption q-mt-sm">点击"添加新任务"按钮创建您的第一个任务</div>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
    </q-card>

    <!-- 任务编辑/创建对话框 -->
    <q-dialog v-model="showTaskDialog" @hide="resetTaskForm">
      <q-card style="width: 500px; max-width: 90vw;">
        <q-card-section>
          <div class="text-h6">{{ editingTask ? '编辑任务' : '创建任务' }}</div>
        </q-card-section>

        <q-card-section>
          <q-form @submit="saveTask">
            <q-input v-model="taskForm.title" label="任务标题 *" outlined dense :rules="[val => !!val || '任务标题不能为空']"
              class="q-mb-sm" />

            <q-input v-model="taskForm.description" label="任务描述" outlined dense type="textarea" class="q-mb-sm" />

            <div class="row q-col-gutter-md">
              <div class="col-6">
                <q-input v-model="taskForm.due_date" label="截止日期" outlined dense mask="date">
                  <template v-slot:append>
                    <q-icon name="event" class="cursor-pointer">
                      <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                        <q-date v-model="taskForm.due_date" mask="YYYY-MM-DD" />
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
              </div>

              <div class="col-6">
                <q-select v-model="taskForm.priority" :options="priorityOptions" label="优先级" outlined dense />
              </div>
            </div>

            <q-select v-model="taskForm.category" :options="categoryOptions" label="分类" outlined dense class="q-mt-sm"
              use-input use-chips multiple hide-dropdown-icon input-debounce="0" new-value-mode="add-unique" />

            <div class="row q-mt-md">
              <q-toggle v-model="taskForm.completed" label="已完成" left-label />
            </div>
          </q-form>
        </q-card-section>

        <q-card-actions align="center">
          <q-btn flat label="取消" v-close-popup />
          <q-btn color="primary" :label="editingTask ? '更新' : '创建'" @click="saveTask" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 删除任务确认对话框 -->
    <q-dialog v-model="showDeleteDialog">
      <q-card>
        <q-card-section>
          <div class="row items-center">
            <q-icon name="delete" color="negative" size="24px" class="q-mr-sm" />
            <span class="text-h6">确认删除任务</span>
          </div>
        </q-card-section>

        <q-card-section v-if="selectedTask">
          <p>您确定要删除任务 <strong>{{ selectedTask.title }}</strong> 吗？<br>此操作不可撤销。</p>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="取消" v-close-popup />
          <q-btn color="negative" label="确认删除" @click="handleDeleteTask" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { format, isBefore, parseISO } from 'date-fns'

// 引入 API 服务
import {
  fetchTasks,
  createTask,
  updateTask,
  deleteTask
} from 'src/services/todoServiceApi'

const $q = useQuasar()

// 状态
const tasks = ref([])
const showTaskDialog = ref(false)
const editingTask = ref(null)
const showDeleteDialog = ref(false)
const selectedTask = ref(null)
const filterStatus = ref('全部')
const sortBy = ref('创建时间')
const searchQuery = ref('')

// 任务表单
const taskForm = ref({
  title: '',
  description: '',
  due_date: '',
  completed: false,
  priority: null,
  category: []
})

// 选项配置
const statusOptions = [
  { label: '全部', value: 'all' },
  { label: '待办', value: 'pending' },
  { label: '已完成', value: 'completed' },
  { label: '已过期', value: 'overdue' }
]
const sortOptions = [
  { label: '创建时间', value: 'created' },
  { label: '截止日期', value: 'due_date' },
  { label: '优先级', value: 'priority' }
]

const priorityOptions = [
  { label: '低', value: '低' },
  { label: '中', value: '中' },
  { label: '高', value: '高' }
]

const categoryOptions = ['工作', '学习', '个人', '会议', '健康', '旅行']

// 计算属性
const totalTasks = computed(() => tasks.value.length)
const completedTasks = computed(() => tasks.value.filter(t => t.completed).length)
const pendingTasks = computed(() => tasks.value.filter(t => !t.completed).length)
const overdueTasks = computed(() => tasks.value.filter(t => isOverdue(t)).length)

const filteredTasks = computed(() => {
  let result = [...tasks.value]

  // 搜索筛选
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(t =>
      t.title?.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q)
    )
  }

  // 状态筛选
  const status = filterStatus.value
  if (status === 'pending') {
    result = result.filter(t => !t.completed)
  }
  if (status === 'completed') {
    result = result.filter(t => t.completed)
  }
  if (status === 'overdue') {
    result = result.filter(t => isOverdue(t) && !t.completed)
  }

  // 排序逻辑
  switch (sortBy.value) {
    case 'due_date':
      result.sort((a, b) => new Date(a.due_date || '9999-12-31') - new Date(b.due_date || '9999-12-31'))
      break
    case 'priority': {
      const order = { '高': 3, '中': 2, '低': 1 }
      result.sort((a, b) => (order[b.priority] || 0) - (order[a.priority] || 0))
      break
    }
    default:
      result.sort((a, b) => a.id - b.id)
  }

  return result
})
// 工具函数
const formatDate = (str) => str ? format(parseISO(str), 'yyyy-MM-dd') : '无日期'
const isOverdue = (task) => !task.completed && task.due_date && isBefore(parseISO(task.due_date), new Date())
const getPriorityColor = (p) => ({ '高': 'red', '中': 'orange', '低': 'green' }[p] || 'grey')

// 加载任务
const loadTasks = async () => {
  try {
    const res = await fetchTasks()
    tasks.value = res.data.results || res.data || []
  } catch (e) {
    $q.notify({ color: 'negative', message: '加载失败：' + e.message })
  }
}

// 打开/重置表单
const openTaskDialog = () => {
  editingTask.value = null
  resetTaskForm()
  showTaskDialog.value = true
}

const editTask = (task) => {
  editingTask.value = task
  taskForm.value = { ...task }
  showTaskDialog.value = true
}

const resetTaskForm = () => {
  taskForm.value = {
    title: '', description: '', due_date: '', completed: false, priority: null, category: []
  }
}

// 保存任务（修复版）
const saveTask = async () => {
  try {
    // 🔥 修复 1：格式化日期 + 提取 priority value
    const data = {
      ...taskForm.value,
      // 日期格式化：把 / 换成 -
      due_date: taskForm.value.due_date ? taskForm.value.due_date.replace(/\//g, '-') : null,
      // 优先级只提交 value，不提交对象
      priority: taskForm.value.priority?.value || taskForm.value.priority,
    }

    if (editingTask.value) {
      await updateTask(editingTask.value.id, data)
      $q.notify({ color: 'positive', message: '更新成功' })
    } else {
      await createTask(data)
      $q.notify({ color: 'positive', message: '创建成功' })
    }

    showTaskDialog.value = false
    loadTasks()
  } catch (e) {
    $q.notify({ color: 'negative', message: '保存失败：' + e.message })
  }
}

// 切换状态
const toggleTaskStatus = (task) => updateTaskStatus(task, !task.completed)
const updateTaskStatus = async (task, completed) => {
  try {
    await updateTask(task.id, { ...task, completed })
    task.completed = completed
    $q.notify({ color: 'positive', message: completed ? '已完成' : '已恢复待办' })
  } catch (e) {
    $q.notify({ color: 'negative', message: '状态更新失败：' + e.message })
  }
}

// 删除
const confirmDeleteTask = (task) => {
  selectedTask.value = task
  showDeleteDialog.value = true
}

const handleDeleteTask = async () => {
  try {
    await deleteTask(selectedTask.value.id)
    tasks.value = tasks.value.filter(t => t.id !== selectedTask.value.id)
    $q.notify({ color: 'positive', message: '删除成功' })
  } catch (e) {
    $q.notify({ color: 'negative', message: '删除失败：' + e.message })
  } finally {
    showDeleteDialog.value = false
  }
}

onMounted(() => loadTasks())
</script>
