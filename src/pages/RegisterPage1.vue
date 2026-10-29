<template>
  <q-page class="flex items-center justify-center q-pa-md bg-grey-1 min-h-screen">
    <!-- 背景装饰 -->
    <div class="fixed inset-0 overflow-hidden pointer-events-none">
      <div class="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 to-primary/10"></div>
      <div class="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-primary/10 blur-3xl"></div>
      <div class="absolute -bottom-32 -left-20 w-96 h-96 rounded-full bg-primary/10 blur-3xl"></div>
    </div>

    <div>
      <q-card class="q-pa-lg" style="width: 400px; margin: 0 auto">
        <!-- 注册卡片头部 -->
        <q-card-section class="text-center q-mb-lg">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
            <q-icon name="person_add" size="2.5em" />
          </div>
          <h3 class="text-h4 font-bold text-grey-800">创建账户</h3>
          <p class="text-grey-500">填写信息以创建新账户</p>
        </q-card-section>

        <!-- 注册表单 -->
        <q-card-section>
          <q-form @submit="handleRegister" class="space-y-5">
            <!-- 用户名输入框 -->
            <q-input v-model="formData.username" label="用户名" type="text" :error="errors.username.hasError"
              :error-message="errors.username.message" class="rounded-lg" :disable="loading"
              @focus="clearError('username')" prefix-icon="circle-user" prefix-icon-color="primary" />

            <!-- 邮箱输入框 -->
            <q-input v-model="formData.email" label="邮箱" type="email" :error="errors.email.hasError"
              :error-message="errors.email.message" class="rounded-lg" :disable="loading" @focus="clearError('email')"
              prefix-icon="mail" prefix-icon-color="primary" />

            <!-- 密码输入框 -->
            <q-input v-model="formData.password" label="密码" :type="showPassword ? 'text' : 'password'"
              :error="errors.password.hasError" :error-message="errors.password.message" class="rounded-lg"
              :disable="loading" @focus="clearError('password')" prefix-icon="lock" prefix-icon-color="primary"
              :suffix-icon="showPassword ? 'visibility_off' : 'visibility'"
              @suffix-icon-click="showPassword = !showPassword" />

            <!-- 确认密码输入框 -->
            <q-input v-model="formData.confirmPassword" label="确认密码" :type="showConfirmPassword ? 'text' : 'password'"
              :error="errors.confirmPassword.hasError" :error-message="errors.confirmPassword.message"
              class="rounded-lg" :disable="loading" @focus="clearError('confirmPassword')" prefix-icon="lock"
              prefix-icon-color="primary" :suffix-icon="showConfirmPassword ? 'visibility_off' : 'visibility'"
              @suffix-icon-click="showConfirmPassword = !showConfirmPassword" />

            <!-- 错误提示 -->
            <div v-if="generalError" class="text-red-500 text-sm flex items-center">
              <q-icon name="error" class="mr-2" />
              {{ generalError }}
            </div>

            <!-- 注册按钮 -->
            <q-btn type="submit" label="注册" color="primary" text-color="white" class="rounded-lg q-mt-md"
              :loading="loading" :disable="loading || !isFormValid" unelevated
              :class="{ 'opacity-75 cursor-not-allowed': loading }" />

            <!-- 登录链接 -->
            <div class="text-center q-mt-md">
              <span class="text-grey-600">已有账户？</span>
              <q-btn label="立即登录" flat text-color="primary" class="p-0 ml-1 hover:text-primary/80 transition-colors"
                @click="$router.push('/login')" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, reactive } from 'vue';

import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const router = useRouter();
import { createUser } from 'src/services/authApi';

// 表单数据
const formData = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
});

// 错误状态
const errors = reactive({
  username: { hasError: false, message: '' },
  email: { hasError: false, message: '' },
  password: { hasError: false, message: '' },
  confirmPassword: { hasError: false, message: '' }
});

// 其他状态
const loading = ref(false);
const generalError = ref('');
const showPassword = ref(false);
const showConfirmPassword = ref(false);

// 表单验证
const isFormValid = computed(() => {
  return (
    formData.username.trim() !== '' &&
    formData.email.trim() !== '' &&
    formData.password.trim() !== '' &&
    formData.confirmPassword.trim() !== '' &&
    !errors.username.hasError &&
    !errors.email.hasError &&
    !errors.password.hasError &&
    !errors.confirmPassword.hasError
  );
});

// 清除特定字段错误
const clearError = (field) => {
  errors[field].hasError = false;
  errors[field].message = '';
  generalError.value = '';
};

// 验证表单
const validateForm = () => {
  let isValid = true;

  // 验证用户名
  if (!formData.username.trim()) {
    errors.username.hasError = true;
    errors.username.message = '请输入用户名';
    isValid = false;
  } else if (formData.username.length < 3) {
    errors.username.hasError = true;
    errors.username.message = '用户名至少3个字符';
    isValid = false;
  }

  // 验证邮箱
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!formData.email.trim()) {
    errors.email.hasError = true;
    errors.email.message = '请输入邮箱地址';
    isValid = false;
  } else if (!emailRegex.test(formData.email)) {
    errors.email.hasError = true;
    errors.email.message = '请输入有效的邮箱地址';
    isValid = false;
  }

  // 验证密码
  if (!formData.password) {
    errors.password.hasError = true;
    errors.password.message = '请输入密码';
    isValid = false;
  } else if (formData.password.length < 6) {
    errors.password.hasError = true;
    errors.password.message = '密码至少6个字符';
    isValid = false;
  }

  // 验证确认密码
  if (!formData.confirmPassword) {
    errors.confirmPassword.hasError = true;
    errors.confirmPassword.message = '请确认密码';
    isValid = false;
  } else if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword.hasError = true;
    errors.confirmPassword.message = '两次输入的密码不一致';
    isValid = false;
  }

  return isValid;
};

// 处理注册
const handleRegister = async () => {
  // 重置错误状态
  generalError.value = '';

  // 表单验证
  if (!validateForm()) {
    // 添加抖动动画效果
    const formElement = document.querySelector('q-form');
    if (formElement) {
      formElement.classList.add('animate-shake');
      setTimeout(() => {
        formElement.classList.remove('animate-shake');
      }, 500);
    }
    return;
  }

  loading.value = true;

  try {
    // 调用注册API
    await createUser({
      username: formData.username,
      email: formData.email,
      password: formData.password
    });

    // 注册成功提示
    $q.notify({
      type: 'positive',
      message: '注册成功，正在跳转到登录页面...',
      position: 'top-right',
      icon: 'check_circle',
      timeout: 1500
    });

    // 延迟跳转到登录页面
    setTimeout(() => {
      router.push('/login');
    }, 1500);
  } catch (err) {
    console.error('注册失败:', err);
    generalError.value = err.message || '注册失败，请稍后再试';

    // 添加抖动动画效果
    const formElement = document.querySelector('q-form');
    if (formElement) {
      formElement.classList.add('animate-shake');
      setTimeout(() => {
        formElement.classList.remove('animate-shake');
      }, 500);
    }
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
/* 添加抖动动画 */
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
