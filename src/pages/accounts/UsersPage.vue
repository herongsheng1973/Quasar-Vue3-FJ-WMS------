<template>
  <q-page class="q-pa-md">
    <div class="row q-mb-md">
      <q-btn label="新增用户" color="primary" @click="editDialog = true" v-perm="'manage_user'" />
    </div>

    <q-table :rows="users" :columns="columns" row-key="id" pagination dense>
      <template v-slot:body-cell-actions="props">
        <q-btn flat color="primary" label="编辑" size="sm" @click="edit(props.row)" v-perm="'manage_user'" />
      </template>
    </q-table>

    <!-- 编辑弹窗 -->
    <q-dialog v-model="editDialog">
      <q-card style="width:600px">
        <q-card-section>
          <h5 class="text-h5">用户编辑</h5>
          <q-input v-model="form.username" label="用户名" class="q-mb-sm" />
          <q-input v-model="form.name" label="姓名" class="q-mb-sm" />
          <q-select v-model="form.role" label="角色" :options="roleOptions" class="q-mb-sm" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn label="保存" color="primary" @click="save" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { axios } from 'boot/axios'
const users = ref([])
const roles = ref([])
const editDialog = ref(false)
const form = ref({ id: 0, username: '', name: '', role: null })

const columns = [
  { name: 'username', label: '用户名', align: 'left' },
  { name: 'name', label: '姓名', align: 'left' },
  { name: 'role_name', label: '角色', align: 'left' },
  { name: 'actions', label: '操作', align: 'center' }
]

onMounted(() => {
  loadUsers()
  loadRoles()
})

const loadUsers = async () => {
  const { data } = await axios.get('/api/users/')
  users.value = data
}

const loadRoles = async () => {
  const { data } = await axios.get('/api/roles/')
  roles.value = data
}

const roleOptions = roles.value.map(r => ({ label: r.name, value: r.id }))
const save = async () => { }
</script>
