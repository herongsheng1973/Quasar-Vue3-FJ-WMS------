<template>
  <q-page class="q-pa-md">
    <div class="row flex q-pa-xl q-col-gutter-md">
      <!-- 页面标题 -->
      <div class="col-6">
        <h5 class="text-h5 text-grey-8 q-my-none">权限管理</h5>
        <p class="text-grey-5 q-mt-sm q-my-none">为角色分配或移除权限</p>
      </div>
      <!-- 角色选择区域 -->
      <div class="col-6 vertical-align-middle">
        <q-select v-model="selectedRole" label="选择角色" :options="roleOptions" required
          @update:model-value="loadRolePermissions" outlined />
      </div>
    </div>


    <!-- 权限分配区域 -->

    <div class="row q-col-gutter-md q-ma-md">
      <!-- 可用权限列表 -->
      <div class="col-6">
        <div class="row items-center justify-between q-mb-sm">
          <div class="text-subtitle1 text-weight-medium text-grey-7">可用权限</div>
          <q-btn flat dense size="sm" color="primary" label="全选" @click="selectAllAvailable" />
        </div>

        <!-- 搜索框 -->
        <q-input v-model="availableSearch" placeholder="搜索权限..." outlined dense class="q-mb-sm">
          <template v-slot:prepend>
            <q-icon name="search" />
          </template>
        </q-input>

        <!-- 权限列表 -->
        <q-list bordered separator class="rounded-borders" style="max-height: 350px; overflow-y: auto">
          <q-item v-for="permission in filteredAvailablePermissions" :key="permission.id" clickable
            @click="assignPermission(permission)">
            <q-item-section>
              <q-item-label>{{ permission.name }}</q-item-label>
              <q-item-label caption>{{ permission.code }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-icon name="chevron_right" color="primary" />
            </q-item-section>
          </q-item>
          <q-item v-if="filteredAvailablePermissions.length === 0">
            <q-item-section class="text-center text-grey-5">
              无可用权限
            </q-item-section>
          </q-item>
        </q-list>
      </div>

      <!-- 已选权限列表 -->
      <div class="col-6">
        <div class="row items-center justify-between q-mb-sm">
          <div class="text-subtitle1 text-weight-medium text-grey-7">已选权限</div>
          <q-btn flat dense size="sm" color="primary" label="全选" @click="selectAllAssigned" />
        </div>

        <!-- 搜索框 -->
        <q-input v-model="assignedSearch" placeholder="搜索权限..." outlined dense class="q-mb-sm">
          <template v-slot:prepend>
            <q-icon name="search" />
          </template>
        </q-input>

        <!-- 权限列表 -->
        <q-list bordered separator class="rounded-borders" style="max-height: 350px; overflow-y: auto">
          <q-item v-for="permission in filteredAssignedPermissions" :key="permission.id" clickable
            @click="unassignPermission(permission)">
            <q-item-section side>
              <q-icon name="chevron_left" color="primary" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ permission.name }}</q-item-label>
              <q-item-label caption>{{ permission.code }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-item v-if="filteredAssignedPermissions.length === 0">
            <q-item-section class="text-center text-grey-5">
              尚未分配权限
            </q-item-section>
          </q-item>
        </q-list>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="row q-mt-md justify-end">
      <q-btn outline color="grey" label="取消" class="q-mr-sm" @click="cancelChanges" />
      <q-btn color="primary" label="保存权限" @click="saveRolePermissions" :disable="!selectedRole || saving"
        :loading="saving" />
    </div>

  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import {
  fetchAllPermissions,
  fetchRolePermissions,
  updateRolePermissions
} from 'src/services/authApi'

const $q = useQuasar()

// 状态
const selectedRole = ref('')
const allPermissions = ref([])
const rolePermissions = ref([])
const saving = ref(false)
const availableSearch = ref('')
const assignedSearch = ref('')

// 角色选项
const roleOptions = [
  { label: '系统管理员', value: 'admin' },
  { label: '仓库经理', value: 'manager' },
  { label: '仓库操作员', value: 'storekeeper' },
  { label: '财务人员', value: 'accountant' },
  { label: '维修技术人员', value: 'technician' },
  { label: '仪器总监', value: 'recorder_supervisor' },
  { label: '仪器操作员', value: 'observer' },
  { label: '访问用户', value: 'guest' }
]

// 计算属性：过滤后的可用权限
const filteredAvailablePermissions = computed(() => {
  if (!availableSearch.value) {
    return allPermissions.value.filter(perm => !perm.assigned)
  }

  const search = availableSearch.value.toLowerCase()
  return allPermissions.value.filter(perm =>
    !perm.assigned &&
    (perm.name.toLowerCase().includes(search) || perm.code.toLowerCase().includes(search))
  )
})

// 计算属性：过滤后的已分配权限
const filteredAssignedPermissions = computed(() => {
  if (!assignedSearch.value) {
    return allPermissions.value.filter(perm => perm.assigned)
  }

  const search = assignedSearch.value.toLowerCase()
  return allPermissions.value.filter(perm =>
    perm.assigned &&
    (perm.name.toLowerCase().includes(search) || perm.code.toLowerCase().includes(search))
  )
})

// 加载所有权限
const loadAllPermissions = async () => {
  try {
    const permissions = await fetchAllPermissions()
    allPermissions.value = permissions.data.results.map((perm) => ({
      ...perm,
      assigned: false
    }))
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: '获取权限列表失败: ' + (error.message || '未知错误')
    })
  }
}

// 加载角色权限
const loadRolePermissions = async () => {
  if (!selectedRole.value) return

  try {
    const permissions = await fetchRolePermissions(selectedRole.value.value)
    rolePermissions.value = permissions.map((perm) => perm.permission.id)

    // 更新权限勾选状态
    updatePermissionAssignments()
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: '获取角色权限失败: ' + (error.message || '未知错误')
    })
  }
}

// 更新权限的分配状态
const updatePermissionAssignments = () => {
  allPermissions.value.forEach((perm) => {
    perm.assigned = rolePermissions.value.includes(perm.id)
  })
}

// 分配权限
const assignPermission = (permission) => {
  permission.assigned = true
  if (!rolePermissions.value.includes(permission.id)) {
    rolePermissions.value.push(permission.id)
  }
}

// 取消分配权限
const unassignPermission = (permission) => {
  permission.assigned = false
  rolePermissions.value = rolePermissions.value.filter((id) => id !== permission.id)
}

// 全选可用权限
const selectAllAvailable = () => {
  filteredAvailablePermissions.value.forEach(permission => {
    assignPermission(permission)
  })
}

// 全选已分配权限
const selectAllAssigned = () => {
  filteredAssignedPermissions.value.forEach(permission => {
    unassignPermission(permission)
  })
}

// 取消更改
const cancelChanges = () => {
  selectedRole.value = ''
  rolePermissions.value = []
  updatePermissionAssignments()
  availableSearch.value = ''
  assignedSearch.value = ''
}

// 保存角色权限
const saveRolePermissions = async () => {
  if (!selectedRole.value) return

  try {
    saving.value = true
    await updateRolePermissions(selectedRole.value.valueOf, rolePermissions.value)
    $q.notify({
      color: 'positive',
      message: '权限保存成功'
    })
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: '保存权限失败: ' + (error.message || '未知错误')
    })
  } finally {
    saving.value = false
  }
}

// 初始化
onMounted(() => {
  loadAllPermissions()
})
</script>

<style scoped>
.rounded-borders {
  border-radius: 8px;
}
</style>
