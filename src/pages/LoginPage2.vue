<template>
  <q-page class="flex items-center justify-center q-pa-md bg-grey-1 min-h-screen">
    <div>
      <q-card class="q-pa-lg shadow-10" style="width: 420px; margin: 0 auto; border-radius: 16px;">
        <q-card-section class="text-center q-mb-lg">
          <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/12 text-primary mb-4">
            <q-icon name="storage" size="3em" />
          </div>
          <h3 class="text-h4 font-bold text-grey-9">仓库管理系统</h3>
          <p class="text-grey-6 q-mt-sm">请登录您的账户</p>
        </q-card-section>

        <q-card-section>
          <q-form ref="loginFormRef" @submit="handleLogin" class="q-gutter-md">
            <q-input v-model="username" label="用户名" filled autocomplete="username" class="rounded-borders"
              :disable="loading" @focus="error = false" prefix-icon="person" prefix-icon-color="primary" />

            <q-input v-model="password" label="密码" filled autocomplete="current-password"
              :type="showPassword ? 'text' : 'password'" class="rounded-borders" :disable="loading"
              @focus="error = false" prefix-icon="lock" prefix-icon-color="primary"
              :suffix-icon="showPassword ? 'visibility_off' : 'visibility'"
              @suffix-icon-click="showPassword = !showPassword" />

            <div v-if="error && errorMessage" class="text-negative text-caption flex items-center q-mt-sm">
              <q-icon name="warning" size="1em" class="q-mr-xs" />
              {{ errorMessage }}
            </div>

            <q-btn type="submit" label="登录系统" color="primary" class="rounded-borders q-mt-md" :loading="loading"
              :disable="loading || !username || !password" size="lg" />

            <div class="text-center q-mt-lg">
              <span class="text-grey-7">还没有账号？</span>
              <q-btn label="立即注册" flat class="q-ml-xs" text-color="primary" @click="goRegister" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { login } from 'src/services/authApi'
import { useUserStore } from 'src/stores/userStore'

const userStore = useUserStore()
const $q = useQuasar()
const router = useRouter()

const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref(false)
const errorMessage = ref('')
const showPassword = ref(false)
const loginFormRef = ref(null)

const handleLogin = async () => {
  // 防止重复点击（最关键！）
  if (loading.value) return

  error.value = false
  errorMessage.value = ''

  if (!username.value || !password.value) {
    error.value = true
    errorMessage.value = '请输入用户名和密码'
    shakeForm()
    return
  }

  loading.value = true
  try {
    // 登录（内部已经设置 token + userInfo）
    await login(username.value, password.value)
    $q.notify({
      color: 'positive',
      message: '登录成功',
      position: 'top',
      icon: 'check_circle'
    })

    router.push('/')
  } catch (err) {
    error.value = true
    errorMessage.value = err.msg || err.detail || '登录失败'
    shakeForm()
  } finally {
    loading.value = false
  }
}
const shakeForm = () => {
  const el = loginFormRef.value?.$el
  if (!el) return
  el.classList.add('animate-shake')
  setTimeout(() => el.classList.remove('animate-shake'), 500)
}

const goRegister = () => router.push('/register')

onMounted(() => {
  if (userStore.isLoggedIn) router.push('/')
})
</script>

<style scoped>
.animate-shake {
  animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}

@keyframes shake {

  10%,
  90% {
    transform: translate3d(-1px, 0, 0);
  }

  20%,
  80% {
    transform: translate3d(2px, 0, 0);
  }

  30%,
  50%,
  70% {
    transform: translate3d(-4px, 0, 0);
  }

  40%,
  60% {
    transform: translate3d(4px, 0, 0);
  }
}
</style>
