<template>
  <div class="body">
    <form class="box" @submit.prevent="handleRegister">
      <h5>注册账号</h5>
      <q-input v-model="email" type="email" autocomplete="off" placeholder="邮箱地址" :error="error1"
        :error-message="errorMessage1" @blur="validateEmail" color="primary" outlined rounded
        class="username-input input-transparent" @focus="error1 = false">
        <template v-slot:prepend>
          <q-icon name="email" />
        </template>
      </q-input>
      <q-input v-model="username" autocomplete="off" placeholder="请输入用户名" :error="error4" :error-message="errorMessage4"
        @blur="validateUsername" color="primary" outlined rounded class="username-input input-transparent"
        @focus="error4 = false">
        <template v-slot:prepend>
          <q-icon name="person" />
        </template>
      </q-input>
      <q-input v-model="name" type="text" autocomplete="off" placeholder="请输入姓名" :error="error5"
        :error-message="errorMessage5" @blur="validateName" color="primary" outlined rounded
        class="name-input input-transparent" @focus="error5 = false">
        <template v-slot:prepend>
          <q-icon name="person" />
        </template>
      </q-input>

      <q-input v-model="password" :type="showPassword ? 'text' : 'password'" autocomplete="new-password"
        placeholder="请输入密码" :error="error2" :error-message="errorMessage2" @blur="validatePassword" color="primary"
        outlined rounded class="password-input input-transparent" @focus="error2 = false">
        <template v-slot:prepend>
          <q-icon name="lock" />
        </template>
        <template v-slot:append>
          <q-icon :name="showPassword ? 'visibility' : 'visibility_off'" @click="showPassword = !showPassword" />
        </template>
      </q-input>
      <q-input v-model="confirmPassword" :type="showConfirmPassword ? 'text' : 'password'" autocomplete="new-password"
        placeholder="请确认密码" :error="error3" :error-message="errorMessage3" @blur="validateConfirmPassword"
        color="primary" outlined rounded class="password-input input-transparent" @focus="error3 = false">
        <template v-slot:prepend>
          <q-icon name="lock" />
        </template>
        <template v-slot:append>
          <q-icon :name="showConfirmPassword ? 'visibility' : 'visibility_off'"
            @click="showConfirmPassword = !showConfirmPassword" />
        </template>
      </q-input>
      <q-btn type="submit" label="注册" color="primary" :loading="loading"
        :disabled="loading || !email || !password || !confirmPassword" class="q-mt-md">
        <template #default>
          <q-icon name="person_add" />
        </template>
      </q-btn>
      <q-btn label="已有账号？登录" flat class="q-mt-md" @click="router.push('/login')" />
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
const { register } = useAuth();
const username = ref('');
const name = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const showPassword = ref(false); // 默认显示密码
const showConfirmPassword = ref(false); // 默认显示确认密码
const loading = ref(false);

const error1 = ref(false);
const error2 = ref(false);
const error3 = ref(false);
const error4 = ref(false);
const error5 = ref(false);

const errorMessage1 = ref('');
const errorMessage2 = ref('');
const errorMessage3 = ref('');
const errorMessage4 = ref('');
const errorMessage5 = ref('');


function validateUsername() {
  if (username.value.length < 3) {
    error4.value = true;
    errorMessage4.value = '用户名需至少3个字符';
  } else {
    error4.value = false;
    errorMessage4.value = '';
  }
}
function validateName() {
  if (name.value.length < 2) {
    error5.value = true;
    errorMessage5.value = '姓名需至少2个字符';
  } else {
    error5.value = false;
    errorMessage5.value = '';
  }
}
function validateEmail() {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!pattern.test(email.value)) {
    error1.value = true;
    errorMessage1.value = '请输入有效的邮箱地址';
  } else {
    error1.value = false;
    errorMessage1.value = '';
  }
}

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

function validateConfirmPassword() {
  if (confirmPassword.value !== password.value) {
    error3.value = true;
    errorMessage3.value = '两次输入的密码不一致';
  } else {
    error3.value = false;
    errorMessage3.value = '';
  }
}

const handleRegister = async () => {
  validateEmail();
  validatePassword();
  validateConfirmPassword();
  validateUsername();
  validateName();

  if (error1.value || error2.value || error3.value || error4.value || error5.value) {
    return;
  }

  loading.value = true;
  try {
    await register(email.value, password.value, confirmPassword.value, username.value, name.value);
    $q.notify({
      type: 'positive',
      message: '注册成功，请登录'
    });
    router.push('/login');
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || '注册失败'
    });
  } finally {
    loading.value = false;
  }
};
onMounted(() => {
  email.value = '';
  password.value = '';
  confirmPassword.value = '';
  username.value = '';
  name.value = '';
  error1.value = false;
  error2.value = false;
  error3.value = false;
  error4.value = false;
  error5.value = false;
  errorMessage1.value = '';
  errorMessage2.value = '';
  errorMessage3.value = '';
  errorMessage4.value = '';
  errorMessage5.value = '';
  showPassword.value = false;
  showConfirmPassword.value = false;
});

</script>

<style scoped>
.body {
  width: 100%;
  height: 100vh;
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

.box h5 {
  color: white;
  text-transform: uppercase;
  font-weight: 400;
}

.input-transparent .q-field__control,
.input-transparent .q-field__native {
  background: transparent !important;
}
</style>
