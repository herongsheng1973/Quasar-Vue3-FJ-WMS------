<!-- 参考模板：https://codepen.io/Chewbaccaa/project/full/DxErdn -->
<template>
  <div class="body">
    <form class="box">
      <h5>欢迎登录员工考勤系统</h5>
      <q-input v-model="email" type="email" placeholder="邮箱地址" :error="error1" :error-message="errorMessage1"
        @blur="validateEmail" color="primary" outlined rounded @focus="error1 = false"
        class="username-input input-transparent">
        <template v-slot:prepend>
          <q-icon name="email" />
        </template>
      </q-input>
      <q-input v-model="password" :type="showPassword ? 'password' : 'text'" placeholder="请输入密码" :error="error2"
        :error-message="errorMessage2" @blur="validatePassword" color="primary" outlined rounded @focus="error2 = false"
        class="username-input input-transparent">
        <template v-slot:prepend>
          <q-icon name="lock" />
        </template>
        <template v-slot:append>
          <q-icon :name="showPassword ? 'visibility' : 'visibility_off'" @click="showPassword = !showPassword" />
        </template>
      </q-input>
      <q-btn label="忘记密码？" flat class="q-mt-md" @click="router.push('/reset-password')" />
      <q-btn class="q-mt-md" label="登录" @click="handleLogin" :loading="loading"
        :disabled="loading || !email || !password">
        <template #default>
          <q-icon name="send" />
        </template>
      </q-btn>

      <q-btn label="没有账号？注册" flat class="q-mt-md" @click="router.push('/register')" />
    </form>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useAuth } from 'src/composables/useAuth';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const router = useRouter();
const { login } = useAuth();

// 表单状态
const email = ref('');
const password = ref('');
const loading = ref(false);
const error1 = ref(false);
const error2 = ref(false);
const errorMessage1 = ref('');
const errorMessage2 = ref('');
function validateEmail() {
  // 简单的邮箱格式验证
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!pattern.test(email.value)) {
    error1.value = true;
    errorMessage1.value = '请输入有效的邮箱地址';
  } else {
    error1.value = false;
    errorMessage1.value = '';
  }
}
const showPassword = ref(false);
function validatePassword() {
  // 至少8位，包含大小写字母和特殊字符
  const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{9,}$/;
  if (!pattern.test(password.value)) {
    error2.value = true;
    errorMessage2.value = '密码需大于8位，包含大小写字母、数字和特殊字符';
  } else {
    error2.value = false;
    errorMessage2.value = '';
  }
}

const handleLogin = async () => {
  error1.value = false;
  errorMessage1.value = '';
  error2.value = false;
  errorMessage2.value = '';

  // 表单验证
  if (!email.value) {
    error1.value = true;
    errorMessage1.value = '请输入邮箱地址';
    return;
  }

  if (!password.value) {
    error2.value = true;
    errorMessage2.value = '请输入密码';
    return;
  }

  loading.value = true;

  try {
    // 调用登录API
    await login(email.value, password.value);

    // 登录成功提示
    $q.notify({
      type: 'positive',
      message: '登录成功，正在进入...',
      position: 'top-right',
      icon: 'check_circle',
      timeout: 1500
    });

    // 延迟跳转，给用户提示时间
    setTimeout(() => {
      router.push('/dashboard');
    }, 1500);
  } catch (err) {
    console.error('登录失败:', err);
    error2.value = true;
    errorMessage2.value = '登录失败，请稍后再试';
    // 根据错误类型显示不同的提示
    if (err.message.includes('email')) {
      error1.value = true;
      errorMessage1.value = '邮箱地址不存在';
    } else if (err.message.includes('password')) {
      error2
      errorMessage2.value = '密码不正确';
    } else {
      error2.value = true;
      errorMessage2.value = '登录失败，请稍后再试';
    }

    // 显示错误提示动画
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
onMounted(() => {
  email.value = 'admin@example.com';
  password.value = 'Admin123!';
  showPassword.value = true; // 默认显示密码
});
</script>

<style scoped>
.body {
  width: 100%;
  height: 100vh-100px;

  justify-content: center;
  align-items: center;
  font-family: "Montserrat", sans-serif;
  font-size: 12px;
  background-image: url("/images/baqground.jpg");
  color: #a0a5a8;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

/* Now we will prepare our box. */
.box {
  border-radius: 50px;
  width: 400px;
  padding: 40px;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #34495E;
  text-align: center;
}

/* With the box finished we can continue with the "Login" text. */
.box h5 {
  color: white;
  text-transform: uppercase;
  font-weight: 400;
}

/* Now we need to configure our inputs. */
.box input[type="text"],
.box input[type="password"] {
  background: none;
  display: block;
  margin: 20px auto;
  text-align: center;
  border: 2px solid #3498db;
  padding: 14px 10px;
  width: 200px;
  outline: none;
  color: white;
  border-radius: 24px;
  transition: 0.25s;
}

.box input[type="text"]:focus,
.box input[type="password"]:focus {
  width: 280px;
  border-color: #2ecc71;
}

.box input[type="button"] {

  background: none;
  display: block;
  margin: 20px auto;
  text-align: center;
  border: 2px solid #2ECC71;
  padding: 14px 40px;
  outline: none;
  color: white;
  border-radius: 24px;
  transition: 1s;
  cursor: pointer;
}

.box input[type="button"]:hover {
  background: #2ECC71;
}
</style>
