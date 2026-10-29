<template>
  <q-page class="flex items-center justify-center q-pa-md bg-grey-1 min-h-screen">
    <div>
      <q-card class="q-pa-lg" style="width: 400px; margin: 0 auto">
        <q-card-section class="text-center q-mb-lg">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
            <q-icon name="lock" size="2.5em" />
          </div>
          <h3 class="text-h4 font-bold text-grey-800">欢迎回来</h3>
          <p class="text-grey-500">请登录您的账户继续</p>
        </q-card-section>

        <q-card-section>
          <q-form ref="loginFormRef" @submit="handleLogin" class="space-y-5">
            <q-input v-model="username" label="用户名" type="text" autocomplete="username" :error="error && !username"
              error-message="请输入有效的用户名" class="rounded-lg" :disable="loading" @focus="error = false"
              prefix-icon="circle-user" prefix-icon-color="primary" />

            <q-input v-model="password" label="密码" autocomplete="current-password"
              :type="showPassword ? 'text' : 'password'" :error="error && !password" error-message="请输入密码"
              class="rounded-lg" :disable="loading" @focus="error = false" prefix-icon="lock"
              prefix-icon-color="primary" :suffix-icon="showPassword ? 'visibility_off' : 'visibility'"
              @suffix-icon-click="showPassword = !showPassword" />

            <div v-if="error && errorMessage" class="text-red-500 text-sm flex items-center">
              <q-icon name="error" class="mr-2" />
              {{ errorMessage }}
            </div>

            <q-btn type="submit" label="登录" color="primary" text-color="white" class="rounded-lg q-mt-md"
              :loading="loading" :disable="loading || !username || !password" unelevated
              :class="{ 'opacity-75 cursor-not-allowed': loading }" />

            <div class="text-center q-mt-md">
              <span class="text-grey-600">没有账号？</span>
              <q-btn label="立即注册" flat text-color="primary" class="p-0 ml-1 hover:text-primary/80 transition-colors"
                @click="goRegister" />
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
  error.value = false
  errorMessage.value = ''

  if (!username.value) {
    error.value = true
    errorMessage.value = '请输入用户名'
    shakeForm()
    return
  }
  if (!password.value) {
    error.value = true
    errorMessage.value = '请输入密码'
    shakeForm()
    return
  }

  loading.value = true
  try {
    const user = await login(username.value, password.value)

    // 使用 userStore 设置用户资料
    userStore.setProfile(user)

    $q.notify({
      type: 'positive',
      message: '登录成功，正在进入...',
      position: 'top-right',
      icon: 'check_circle',
      timeout: 1500
    })

    // 登录成功后跳转到首页
    setTimeout(() => {
      router.push('/')
    }, 1500)
  } catch (err) {
    error.value = true
    errorMessage.value =
      err.message?.includes('email') ? '邮箱地址不存在'
        : err.message?.includes('password') ? '密码不正确'
          : '登录失败，请稍后再试'
    shakeForm()
  } finally {
    loading.value = false
  }
}

const shakeForm = () => {
  if (loginFormRef.value?.$el) {
    loginFormRef.value.$el.classList.add('animate-shake')
    setTimeout(() => {
      loginFormRef.value.$el.classList.remove('animate-shake')
    }, 500)
  }
}

const goRegister = () => {
  router.push('/register')
}

// 页面加载时检查是否已登录
onMounted(() => {
  if (userStore.isLoggedIn) {
    router.push('/')
  }
})
</script>

<style scoped>
.animate-shake {
  animation: shake 0.5s cubic-bezier(.36, .07, .19, .97) both;
  transform: translate3d(0, 0, 0);
  backface-visibility: hidden;
  perspective: 1000px;
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
