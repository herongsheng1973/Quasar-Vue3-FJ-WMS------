<template>
  <q-page class="q-pa-md">
    <div class="row justify-between items-center q-my-none mb-4">

      <div class="col-8 q-my-none items-center">
        <h5 class="text-h5 q-my-none">用户管理</h5>
        <p class="text-subtitle2">管理所有用户，包括系统管理员、仓库经理、仓库操作员、财务人员、维修技术人员、仪器总监、仪器操作员和访问用户。</p>
      </div>
      <q-btn color="primary" label="新增用户" @click="openCreateDialog" />
    </div>

    <!-- 搜索和筛选 -->
    <div class="row q-pa-md">
      <q-input v-model="searchQuery" placeholder="搜索用户名、邮箱或姓名" class="col-md-4 q-px-md" clearable
        @keyup.enter="fetchUsers" @update:model-value="handleSearchInput">
        <template v-slot:append>
          <q-icon name="search" class="cursor-pointer" @click="fetchUsers" />
        </template>
      </q-input>

      <q-select v-model="roleFilter" label="角色筛选" :options="roleOptions" option-value="value" option-label="label"
        clearable class="col-md-4 q-ml-md" @update:model-value="fetchUsers" />

      <q-btn label="重置筛选" color="deep-orange" class="q-ma-md glossy" style="width: 120px; height: 32px;"
        @click="searchQuery = ''; roleFilter = ''; fetchUsers()" rounded />

    </div>

    <!-- 用户列表 -->
    <q-table :rows="users" :columns="columns" row-key="id" :loading="loading" v-model:pagination="pagination"
      :rows-per-page-options="[10, 20, 50, 100]" @request="onRequest">
      <template v-slot:body-cell-index="props">
        <q-td :props="props" class="text-center">
          {{ (pagination.page - 1) * pagination.rowsPerPage + props.pageIndex + 1 }}
        </q-td>
      </template>
      <template v-slot:body-cell-actions="props">
        <q-td :props="props" class="text-center">
          <q-btn size="sm" color="primary" icon="edit" round flat @click="editUser(props.row)" class="q-ml-xs">
            <q-tooltip>编辑用户</q-tooltip>
          </q-btn>
          <!-- 非超级用户隐藏/禁用 -->
          <q-btn icon="lock" color="amber" size="sm" round flat :disabled="props.row.is_superuser" class="q-ml-xs"
            @click="openResetPasswordModal(props.row)">
            <q-tooltip v-if="!props.row.is_superuser">重置该用户密码</q-tooltip>
          </q-btn>
          <q-btn size="sm" :color="props.row.is_active ? 'negative' : 'positive'"
            :icon="props.row.is_active ? 'block ' : 'check'" round flat class="q-ml-xs"
            @click="toggleUserStatus(props.row)"
            :disable="props.row.role === 'admin' && props.row.id !== currentUserId">
            <!-- 已激活 → 显示“禁用用户” -->
            <q-tooltip v-if="props.row.is_active">
              禁用用户
            </q-tooltip>

            <!-- 已禁用 → 显示“启用用户” -->
            <q-tooltip v-else>
              启用用户
            </q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>


    <!-- 创建/编辑用户对话框 -->
    <edit-user-dialog v-model="showEditDialog" :user="selectedUser" :role-options="roleOptions" @save="onUserSaved" />

    <!-- 删除确认对话框 -->
    <q-dialog v-model="showDeleteDialog">
      <q-card>
        <q-card-section>
          <h5>确认切换状态</h5>
          <p>确定要切换用户 {{ toggleUserId }} 吗？。</p>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn label="取消" color="grey" @click="showDeleteDialog = false" />
          <q-btn label="切换状态" color="negative" @click="confirmToggleUserStatus" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
  <!-- 重置密码弹窗 -->
  <q-dialog v-model="resetPasswordModal.show">
    <q-card style="width: 450px">
      <q-card-section class="bg-primary text-white">
        <h5 class="q-my-none">重置用户密码</h5>
      </q-card-section>
      <q-card-section>
        <p>用户：{{ resetPasswordModal.user?.username }}
          <q-checkbox v-model="resetPasswordModal.resetMode" label="使用后端生成密码" />
        </p>
        <q-input v-model="resetPasswordModal.newPassword" label="新密码（12位强密码）" type="password" required
          hint="必须包含大小写、数字、符号" />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn label="取消" @click="resetPasswordModal.show = false" />
        <q-btn label="确认重置" color="negative" @click="confirmResetPassword" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, onMounted, computed, reactive } from 'vue'
import { useQuasar } from 'quasar'
import EditUserDialog from 'src/components/EditUserDialog.vue'
import { getUsers, disableUser, enableUser, resetPassword, getRolesList } from 'src/services/authApi'
import { useUserStore } from 'src/stores/userStore'

const $q = useQuasar()
const userStore = useUserStore()

// 状态
const users = ref([])
const loading = ref(false)
const searchQuery = ref('')
const roleFilter = ref('')
const showEditDialog = ref(false)
const selectedUser = ref(null)
const showDeleteDialog = ref(false)
const toggleUserId = ref(null)
const toggleStatus = ref(null)

// 分页配置
const pagination = ref({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
  sortBy: 'username',
  descending: false
})
// 角色选项
const roleOptions = ref([])

// 加载角色
const loadRoles = async () => {
  try {
    const res = await getRolesList()
    console.log('原始角色列表', res.data)
    // 后端返回的角色列表
    roleOptions.value = res.data.map(role => ({
      id: role.id,
      value: role.code,
      label: role.name
    }))
    console.log('角色列表', roleOptions.value)
  } catch (e) {
    console.error('加载角色失败', e)
  }
}

onMounted(() => {
  loadRoles()
})
// 当前用户ID
const currentUserId = computed(() => userStore.user?.id)

// 表格列配置
const columns = [
  { name: 'index', label: '序号', field: 'index', align: 'center' },
  { name: 'username', label: '用户名', field: 'username', sortable: true },
  { name: 'email', label: '邮箱', field: 'email', sortable: false },
  { name: 'name', label: '姓名', field: 'name', sortable: false },
  {
    name: 'role',
    label: '角色',
    field: 'role_name',
    sortable: false
  },
  { name: 'is_staff', label: '是否员工', field: 'is_staff', sortable: false, format: val => val ? '是' : '否' },
  { name: 'is_superuser', label: '是否超级用户', field: 'is_superuser', sortable: false, format: val => val ? '是' : '否' },

  { name: 'is_active', label: '状态', field: 'is_active', sortable: false, format: val => val ? '启用' : '禁用' },
  { name: 'last_login', label: '最后登录时间', field: 'last_login', sortable: true, format: val => val ? new Date(val).toLocaleString() : '未登录', align: 'right' },
  { name: 'actions', label: '操作', align: 'center' }
]

// ✅【优化】构建正确的 DRF 格式请求参数
// 构建请求参数（严格分离 filter + search）
const buildRequestParams = () => {
  const { page, rowsPerPage, sortBy, descending } = pagination.value

  // 基础分页
  const params = {
    page: page,
    page_size: rowsPerPage
  }

  // ✅ 排序（安全处理）
  if (sortBy) {
    params.ordering = descending ? `-${sortBy}` : sortBy
  }

  // ✅ 精确筛选：角色（filter）
  const role = roleFilter.value?.['value']?.trim()
  if (role) {
    params.role__code = role
  }

  // ✅ 模糊搜索：searchQuery
  const search = searchQuery.value?.trim()
  if (search) {
    params.search = search
  }

  return params
}

// 防抖延迟函数（核心）
let fetchTimer = null
const handleSearchInput = () => {
  // 清除之前的定时器
  if (fetchTimer) clearTimeout(fetchTimer)

  // 500ms 内没有输入才会发送请求
  fetchTimer = setTimeout(() => {
    fetchUsers()
  }, 500) // 👈 延迟时间：500毫秒，可自行修改 300 / 800
}

// 获取用户列表
const fetchUsers = async () => {
  try {
    loading.value = true
    const params = buildRequestParams()
    const response = await getUsers(params)

    users.value = response.results
    pagination.value.rowsNumber = response.count
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: '获取用户列表失败: ' + (error.message || '未知错误')
    })
  } finally {
    loading.value = false
  }
}

// 处理分页/排序变化
const onRequest = (props) => {
  pagination.value = props.pagination
  fetchUsers()
}
// 打开创建用户对话框
const openCreateDialog = () => {
  selectedUser.value = null
  showEditDialog.value = true
}

// 编辑用户
const editUser = (user) => {
  selectedUser.value = { ...user }
  console.log(selectedUser.value)
  showEditDialog.value = true
}

// 确认切换状态
const toggleUserStatus = (user) => {
  toggleUserId.value = user.id
  toggleStatus.value = user.is_active
  showDeleteDialog.value = true
}
const showError = (error) => {

  if (!error) {
    $q.notify({ color: 'negative', message: '操作失败' })
    return
  }

  // 🔥 自动拼接你的后端错误信息
  let msg = error.error || '操作失败'
  if (error.fields && error.fields.length) {
    msg += '：' + error.fields.join('、')
  }

  $q.notify({
    color: 'negative',
    message: msg
  })
}
// 执行切换状态
const confirmToggleUserStatus = async () => {
  try {
    if (toggleUserId.value === currentUserId.value) {
      $q.notify({
        color: 'negative',
        message: '无法切换当前登录用户的状态！'
      })
      return
    }
    if (toggleStatus.value === null) {
      $q.notify({
        color: 'negative',
        message: '请选择要切换的状态！'
      })
      return
    }
    if (toggleStatus.value === true) {
      await disableUser(toggleUserId.value)
    } else {
      await enableUser(toggleUserId.value)
    }
    $q.notify({
      color: 'positive',
      message: '用户状态切换成功！'
    })
    fetchUsers()
  } catch (error) {
    showError(error)
  } finally {
    showDeleteDialog.value = false
  }
}

// 用户保存后刷新列表
const onUserSaved = () => {
  showEditDialog.value = false
  fetchUsers()
}
// 重置密码弹窗
const resetPasswordModal = reactive({
  show: false,
  user: null,
  resetMode: false, // 是否使用后端生成密码
  newPassword: ''
})

// 打开弹窗
const openResetPasswordModal = (row) => {
  resetPasswordModal.user = row
  resetPasswordModal.newPassword = ''
  resetPasswordModal.show = true
}

// 确认重置密码
const confirmResetPassword = async () => {
  if (!resetPasswordModal.resetMode && resetPasswordModal.newPassword.length < 12) {
    $q.notify({ color: 'warning', message: '请输入新密码（12位强密码）' })
    return
  }
  if (resetPasswordModal.resetMode) {
    resetPasswordModal.newPassword = '' // 后端生成密码，不需要前端输入
  } else {
    if (!/[A-Z]/.test(resetPasswordModal.newPassword) ||
      !/[a-z]/.test(resetPasswordModal.newPassword) ||
      !/[0-9]/.test(resetPasswordModal.newPassword) ||
      !/[^A-Za-z0-9]/.test(resetPasswordModal.newPassword)) {
      $q.notify({ color: 'warning', message: '密码必须包含大小写字母、数字和特殊字符' })
      return
    }

  }

  try {
    await resetPassword(resetPasswordModal.user.id, resetPasswordModal.newPassword, resetPasswordModal.resetMode)
    // 重置成功后，刷新用户列表
    // fetchUsers()
    $q.notify({ color: 'positive', message: '密码重置成功' })
    resetPasswordModal.show = false
  } catch (err) {
    $q.notify({
      color: 'negative',
      message: err.response?.data?.error || '重置失败'
    })
  }
}
// 页面加载时获取用户列表
onMounted(() => {
  fetchUsers()
})
</script>
