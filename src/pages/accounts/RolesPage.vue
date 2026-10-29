<template>
  <q-page class="q-pa-md">
    <!-- 新增角色按钮 -->
    <q-btn label="新增角色" color="primary" @click="openAddRole" class="q-mb-md" v-perm="'manage_role'" />

    <q-table :rows="roles" :columns="columns" row-key="id" :loading="loading" :rows-per-page-options="[10, 20, 30, 50]">
      <template v-slot:body-cell-index="props">
        <q-td :props="props">
          {{ props.rowIndex + 1 }}
        </q-td>
      </template>
      <template v-slot:body-cell-actions="props">
        <q-td :props="props" class="text-center">
          <!-- 编辑角色 -->
          <q-btn flat color="warning" size="sm" label="编辑" @click="openEditRole(props.row)" v-perm="'manage_role'">
            <q-tooltip>编辑角色</q-tooltip>
          </q-btn>

          <q-btn flat color="primary" size="sm" label="权限分配" @click="openPerm(props.row)" v-perm="'manage_role'">
            <q-tooltip>权限分配</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>

    <!-- 权限分配弹窗 -->
    <q-dialog v-model="permDialog" max-width="700px">
      <q-card>
        <q-card-section>
          <h5 class="text-h5">角色权限分配：{{ currentRole.name }}</h5>
          <q-checkbox v-for="p in permissions" :key="p.id" v-model="checkedPermIds" :val="p.id"
            :label="`${p.name} (${p.code})`" class="q-mb-xs" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn label="取消" @click="permDialog = false" />
          <q-btn label="保存权限" color="primary" @click="savePermissions" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 🔥 新增/编辑角色弹窗 -->
    <q-dialog v-model="roleDialog" @close="resetRoleForm">
      <q-card style="width: 550px; max-width: 95vw;">
        <q-card-section>
          <h5 class="text-h5">{{ isEdit ? '编辑角色' : '新增角色' }}</h5>
          <q-form class="q-gutter-md mt-3" @submit="submitRole">
            <q-input v-model="roleForm.name" label="角色名称" required class="col-12" />
            <q-input v-model="roleForm.code" label="角色编码" required class="col-12" />
            <q-input v-model="roleForm.description" label="角色描述" type="textarea" class="col-12" />

            <div class="row justify-end q-mt-md gap-2">
              <q-btn label="取消" @click="roleDialog = false" />
              <q-btn label="保存" color="primary" type="submit" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import {
  getRolesList,
  fetchAllPermissions,
  updateRolePermissions,
  createRole,     // 新增
  updateRole      // 编辑
} from 'src/services/authApi'

const $q = useQuasar()
const roles = ref([])
const permissions = ref([])
const permDialog = ref(false)
const currentRole = ref({})
const checkedPermIds = ref([])
const loading = ref(false)

// 角色弹窗
const roleDialog = ref(false)
const isEdit = ref(false)

// 角色表单
const roleForm = ref({
  name: '',
  code: '',
  description: ''
})

const columns = [
  { name: 'index', label: '序号', field: '', align: 'center' },
  { name: 'name', label: '角色名', field: 'name', align: 'center' },
  { name: 'code', label: '编码', field: 'code', align: 'center' },
  { name: 'description', label: '描述', field: 'description', align: 'center' },
  { name: 'actions', label: '操作', align: 'center' }
]

// 重置表单
const resetRoleForm = () => {
  roleForm.value = {
    name: '',
    code: '',
    description: ''
  }
  isEdit.value = false
}

// 打开新增
const openAddRole = () => {
  resetRoleForm()
  roleDialog.value = true
}

// 打开编辑
const openEditRole = (row) => {
  isEdit.value = true
  roleForm.value = { ...row }
  currentRole.value = row
  roleDialog.value = true
}

// 提交保存
const submitRole = async () => {
  try {
    if (isEdit.value) {
      await updateRole(currentRole.value.id, roleForm.value)
      $q.notify({ color: 'positive', message: '修改成功' })
    } else {
      await createRole(roleForm.value)
      $q.notify({ color: 'positive', message: '创建成功' })
    }
    roleDialog.value = false
    fetchRoles() // 刷新列表
  } catch (e) {
    $q.notify({ color: 'negative', message: e.response?.data?.error || '保存失败' })
  }
}

// 刷新角色列表
const fetchRoles = async () => {
  loading.value = true
  try {
    const res = await getRolesList()
    roles.value = res.data
  } finally {
    loading.value = false
  }
}

// 页面加载
onMounted(async () => {
  loading.value = true
  try {
    await fetchRoles()
    const permRes = await fetchAllPermissions()
    permissions.value = permRes.data
  } finally {
    loading.value = false
  }
})

// 打开权限弹窗
const openPerm = (row) => {
  currentRole.value = row
  checkedPermIds.value = row.permissions.map(p => p.id)
  permDialog.value = true
}

// 保存权限
const savePermissions = async () => {
  try {
    await updateRolePermissions(currentRole.value.id, {
      permission_ids: checkedPermIds.value
    })
    currentRole.value.permissions = permissions.value.filter(p =>
      checkedPermIds.value.includes(p.id)
    )
    permDialog.value = false
    $q.notify({ color: 'positive', message: '权限保存成功' })
  } catch (e) {
    $q.notify({ color: 'negative', message: e.response?.data?.error || '保存失败' })
  }
}
</script>
