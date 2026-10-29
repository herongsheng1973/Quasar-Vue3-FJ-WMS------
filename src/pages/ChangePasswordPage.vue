<template>
  <q-page class="flex flex-center q-pa-md">
    <q-card class="change-password-card shadow-10">
      <q-card-section class="text-center bg-primary text-white rounded-t">
        <div class="text-h5 font-bold">修改登录密码</div>
        <div class="text-subtitle1 q-mt-sm opacity-7">
          请完成密码验证并设置新密码
        </div>
      </q-card-section>

      <q-form @submit="onSubmit" class="q-gutter-md" ref="passwordForm" autofocus>
        <q-card-section class="q-pa-xl">
          <!-- 当前密码 -->
          <q-input v-model="passwordData.old_password" filled :type="isCurrentPwd ? 'password' : 'text'" label="当前密码"
            hint="请输入你现在使用的密码" :rules="[val => !!val || '当前密码不能为空']" class="q-mb-md">
            <template v-slot:append>
              <q-icon :name="isCurrentPwd ? 'visibility_off' : 'visibility'" class="cursor-pointer"
                @click="isCurrentPwd = !isCurrentPwd" />
            </template>
          </q-input>

          <!-- 新密码 -->
          <q-input v-model="passwordData.new_password" filled :type="isNewPwd ? 'password' : 'text'" label="新密码"
            hint="至少6位，包含大小写字母+数字" :rules="[
              val => !!val || '新密码不能为空',
              val => val.length >= 6 || '密码长度至少6位',
            ]" class="q-mb-md">
            <template v-slot:append>
              <q-icon :name="isNewPwd ? 'visibility_off' : 'visibility'" class="cursor-pointer"
                @click="isNewPwd = !isNewPwd" />
            </template>
          </q-input>

          <!-- 确认新密码 -->
          <q-input v-model="passwordData.confirm_password" filled :type="isConfirmPwd ? 'password' : 'text'"
            label="确认新密码" hint="再次输入新密码" :rules="[
              val => !!val || '请确认新密码',
              val => val === passwordData.new_password || '两次输入密码不一致'
            ]">
            <template v-slot:append>
              <q-icon :name="isConfirmPwd ? 'visibility_off' : 'visibility'" class="cursor-pointer"
                @click="isConfirmPwd = !isConfirmPwd" />
            </template>
          </q-input>
        </q-card-section>

        <q-card-actions align="right" class="q-px-xl q-pb-xl q-pt-none">
          <q-btn label="取消" color="grey-6" flat class="q-px-xl" @click="onCancel" />
          <q-btn label="确认修改" color="primary" type="submit" class="q-px-xl" :loading="loading" size="md" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import { useUserStore } from 'src/stores/userStore'
import { changePassword } from 'src/services/authApi' // 你的用户API

const $q = useQuasar()
const $router = useRouter()
const userStore = useUserStore()
const passwordForm = ref(null)
const loading = ref(false)

// 密码可见性
const isCurrentPwd = ref(true)
const isNewPwd = ref(true)
const isConfirmPwd = ref(true)

// 表单数据（与后端字段完全一致）
const passwordData = reactive({
  old_password: '',
  new_password: '',
  confirm_password: ''
})

// 提交修改密码
const onSubmit = async () => {
  const valid = await passwordForm.value.validate()
  if (!valid) return

  loading.value = true

  try {
    // 调用真实后端接口
    await changePassword({
      old_password: passwordData.old_password,
      new_password: passwordData.new_password
    })

    $q.notify({
      color: 'positive',
      position: 'top',
      message: '密码修改成功，请重新登录',
      icon: 'check_circle'
    })

    // 重置表单
    Object.assign(passwordData, {
      old_password: '',
      new_password: '',
      confirm_password: ''
    })
    userStore.logout()
    $router.push('/login')
  } catch (err) {
    const msg = err.response?.data?.error || '密码修改失败'
    $q.notify({
      color: 'negative',
      position: 'top',
      message: msg,
      icon: 'warning'
    })
  } finally {
    loading.value = false
  }
}

// 取消
const onCancel = () => {
  $router.back()
}
</script>

<style scoped>
.change-password-card {
  width: 100%;
  max-width: 520px;
  border-radius: 12px;
  overflow: hidden;
}

:deep(.q-card__section--tight) {
  padding: 20px 28px !important;
}
</style>
