<template>
  <q-dialog v-model="dialogVisible">
    <q-card style="max-width: 600px; width: 100%;">
      <q-card-section>
        <h5 class="text-h5">{{ isNewUser ? '新增用户' : '编辑用户' }}</h5>

        <q-form @submit="saveUser" class="q-mt-md">
          <q-input v-model="userForm.username" label="用户名" required :disable="!isNewUser" />

          <q-input v-model="userForm.email" label="邮箱" type="email" required />

          <q-input v-model="userForm.name" label="姓名" required />

          <q-input v-model="userForm.phone_number" label="电话号码" />

          <!-- 修复后的 q-select -->
          <q-select v-model="userForm.role" label="角色" :options="roleOptions" required
            :disable="!isNewUser && userForm.role === 'admin' && userForm.id !== currentUserId" />

          <q-toggle v-model="userForm.is_active" label="是否激活" />
          <q-toggle v-model="userForm.is_staff" label="是否是员工" />
          <q-toggle v-model="userForm.is_superuser" label="是否是超级用户" />

          <div v-if="isNewUser" class="q-mt-md">
            <q-input v-model="userForm.password" label="密码" type="password" required />
            <q-input v-model="userForm.password_confirm" label="确认密码" type="password" required class="q-mt-md" />
          </div>

          <div class="row q-mt-md justify-end">
            <q-btn label="取消" color="grey" @click="cancel" />
            <q-btn label="保存" color="primary" type="submit" class="q-ml-sm" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useQuasar } from 'quasar'
import { register, updateUser } from 'src/services/authApi'
import { useUserStore } from 'src/stores/userStore'

const $q = useQuasar()
const userStore = useUserStore()

const props = defineProps({
  roleOptions: { type: Array, default: () => [] },
  modelValue: { type: Boolean, default: false },
  user: { type: Object, default: null },

})

const emit = defineEmits(['update:modelValue', 'save'])

const dialogVisible = ref(props.modelValue)
const userForm = ref(getDefaultUserForm())
const isNewUser = computed(() => !props.user)
const currentUserId = computed(() => userStore.user?.id)

function getDefaultUserForm() {
  return {
    username: '',
    email: '',
    name: '',
    phone_number: '',
    role: null,
    is_active: true,
    is_staff: false,
    is_superuser: false,
    password: '',
    password_confirm: ''
  }
}

watch(() => props.user, (newVal) => {
  if (newVal) {
    userForm.value = {
      id: newVal.id,
      username: newVal.username,
      email: newVal.email,
      name: newVal.name,
      phone_number: newVal.phone_number || '',
      role: props.roleOptions.find(r => r.id === newVal.role) || null,
      is_active: newVal.is_active,
      is_staff: newVal.is_staff,
      is_superuser: newVal.is_superuser,
      password: '',
      password_confirm: ''
    }
  } else {
    userForm.value = getDefaultUserForm()
  }
}, { immediate: true })

watch(() => props.modelValue, (val) => {
  dialogVisible.value = val
}, { immediate: true })

watch(dialogVisible, (val) => {
  emit('update:modelValue', val)
})
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
const saveUser = async () => {
  try {
    if (isNewUser.value) {
      if (!validatePasswords()) return
      userForm.value.role = userForm.value.role?.id || null
      await register(userForm.value)
      $q.notify({ color: 'positive', message: '创建成功' })
    } else {
      const userData = { ...userForm.value }
      delete userData.password
      delete userData.password_confirm
      userData.role = userData.role?.id || null
      await updateUser(userData.id, userData)
      $q.notify({ color: 'positive', message: '更新成功' })
    }
    emit('save')
    emit('update:modelValue', false)
  } catch (error) {
    console.log('error:', error)
    showError(error)
  }
}

const validatePasswords = () => {
  if (userForm.value.password !== userForm.value.password_confirm) {
    $q.notify({ color: 'negative', message: '两次密码不一致' })
    return false
  }
  return true
}

const cancel = () => {
  emit('update:modelValue', false)
}
</script>
