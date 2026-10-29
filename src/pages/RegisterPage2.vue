<template>
  <q-page class="flex items-center justify-center q-pa-md bg-grey-1 min-h-screen">
    <div>
      <q-card class="q-pa-lg shadow-10" style="width: 460px; margin: 0 auto; border-radius: 16px;">
        <q-card-section class="text-center q-mb-lg">
          <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/12 text-primary mb-4">
            <q-icon name="app_registration" size="3em" />
          </div>
          <h3 class="text-h4 font-bold text-grey-9">用户注册</h3>
          <p class="text-grey-6 q-mt-sm">创建您的账户</p>
        </q-card-section>

        <q-card-section>
          <q-form ref="formRef" @submit="handleRegister" class="q-gutter-md">
            <q-input v-model="form.username" label="用户名" filled :rules="[val => !!val || '请输入用户名']" prefix-icon="person"
              prefix-icon-color="primary" :disable="loading" />

            <q-input v-model="form.name" label="姓名" filled :rules="[val => !!val || '请输入真实姓名']" prefix-icon="badge"
              prefix-icon-color="primary" :disable="loading" />

            <q-input v-model="form.email" label="邮箱" filled type="email" :rules="[
              val => !!val || '请输入邮箱',
              val => /^.+@.+\..+$/.test(val) || '邮箱格式不正确'
            ]" prefix-icon="email" prefix-icon-color="primary" :disable="loading" />

            <q-input v-model="form.password" label="密码" filled :type="showPwd ? 'text' : 'password'" :rules="[
              val => !!val || '请输入密码',
              val => val.length >= 6 || '至少6位'
            ]" prefix-icon="lock" prefix-icon-color="primary" :suffix-icon="showPwd ? 'visibility_off' : 'visibility'"
              @suffix-icon-click="showPwd = !showPwd" :disable="loading" />

            <q-input v-model="form.password_confirm" label="确认密码" filled :type="showPwd2 ? 'text' : 'password'" :rules="[
              val => !!val || '请确认密码',
              val => val === form.password || '两次密码不一致'
            ]" prefix-icon="lock" prefix-icon-color="primary" :suffix-icon="showPwd2 ? 'visibility_off' : 'visibility'"
              @suffix-icon-click="showPwd2 = !showPwd2" :disable="loading" />

            <div v-if="errorMsg" class="text-negative text-caption flex items-center q-mt-sm">
              <q-icon name="warning" size="1em" class="q-mr-xs" />
              {{ errorMsg }}
            </div>

            <q-btn type="submit" label="完成注册" color="primary" class="rounded-borders q-mt-md" :loading="loading"
              size="lg" />

            <div class="text-center q-mt-lg">
              <span class="text-grey-7">已有账号？</span>
              <q-btn label="返回登录" flat class="q-ml-xs" text-color="primary" @click="goLogin" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { register } from 'src/services/authApi'

const $q = useQuasar()
const router = useRouter()
const formRef = ref(null)

const form = ref({
  username: '',
  name: '',
  email: '',
  password: '',
  password_confirm: ''
})

const loading = ref(false)
const errorMsg = ref('')
const showPwd = ref(true)
const showPwd2 = ref(true)

const handleRegister = async () => {
  const valid = await formRef.value?.validate()
  if (!valid) return

  errorMsg.value = ''
  loading.value = true

  try {
    await register(form.value)
    $q.notify({ color: 'positive', message: '注册成功！' })
    router.push('/login')
  } catch (err) {
    errorMsg.value = err.response?.data?.error || '注册失败'
  } finally {
    loading.value = false
  }
}

const goLogin = () => router.push('/login')
</script>

<style scoped></style>
