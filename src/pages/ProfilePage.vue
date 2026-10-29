<template>
  <q-page class="q-pa-md">
    <q-card class="q-pa-lg" style="max-width: 600px; margin: 0 auto">
      <q-card-section>
        <h2 class="text-h5">个人资料</h2>

        <!-- 头像区域 -->
        <div class="row items-center q-mb-lg">
          <div class="column items-center">
            <q-avatar size="120px" class="q-mb-md relative">
              <img :src="userStore.avatarUrl || 'https://picsum.photos/id/64/200/200'" alt="用户头像"
                style="object-fit: cover; width: 100%; height: 100%" @error="handleAvatarError" />
              <q-spinner v-if="uploadingAvatar" color="primary" size="2em" class="absolute-center" />
            </q-avatar>

            <q-btn color="primary" label="更换头像" size="sm" @click="triggerAvatarUpload" />
            <input ref="avatarInput" type="file" accept="image/*" @change="handleAvatarUpload" class="hidden" />

            <q-btn v-if="!!userStore.userInfo?.avatar" flat dense color="negative" label="删除头像" size="sm"
              class="q-mt-xs" @click="removeAvatarHandler" />
          </div>
        </div>

        <q-form @submit.prevent="handleUpdateProfile">
          <q-input v-model="form.email" label="邮箱" type="email" disabled class="q-mb-md" />
          <q-input v-model="form.name" label="姓名" type="text" class="q-mb-md" />
          <q-input v-model="form.phone_number" label="手机号" type="text" class="q-mb-md" />
          <q-input v-model="form.username" label="用户名" type="text" disabled class="q-mb-md" />

          <div class="row justify-end">
            <q-btn type="submit" label="更新资料" color="primary" :loading="updatingProfile" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useUserStore } from 'src/stores/userStore'
import { updateProfile, updateAvatar, removeAvatar } from 'src/services/authApi'
import { useRouter } from 'vue-router'
const router = useRouter()

const $q = useQuasar()
const userStore = useUserStore()
const avatarInput = ref(null)

const updatingProfile = ref(false)
const uploadingAvatar = ref(false)

// 表单数据
const form = reactive({
  username: '',
  name: '',
  email: '',
  phone_number: '',
})

// 初始化页面
onMounted(() => {
  const user = userStore.userInfo
  if (!user) return

  form.username = user.username || ''
  form.name = user.name || ''
  form.email = user.email || ''
  form.phone_number = user.phone_number || ''
  form.avatar = user.avatar || ''
})

// 头像加载失败处理
const handleAvatarError = (e) => {
  e.target.src = 'https://picsum.photos/id/64/200/200'
}

// 更新资料
const handleUpdateProfile = async () => {
  if (!form.name) {
    $q.notify({ type: 'negative', message: '请输入姓名' })
    return
  }

  try {
    updatingProfile.value = true
    const data = {
      name: form.name,
      phone_number: form.phone_number || '',
    }

    const updatedUser = await updateProfile(data)
    // ✅ 正确方法：updateUserInfo
    userStore.updateUserInfo(updatedUser)
    $q.notify({ type: 'positive', message: '资料更新成功' })
  } catch (err) {
    $q.notify({ type: 'negative', message: err.message || '更新失败' })
  } finally {
    updatingProfile.value = false
    router.push('/')
  }
}

// 触发上传
const triggerAvatarUpload = () => {
  avatarInput.value?.click()
}

// 上传头像（核心修复：全部用 updateUserInfo）
const handleAvatarUpload = async (e) => {
  const file = e.target.files?.[0]
  if (!file) return

  // 文件校验
  const maxSize = 5 * 1024 * 1024
  if (!file.type.startsWith('image/')) {
    $q.notify({ type: 'negative', message: '只能上传图片' })
    return
  }
  if (file.size > maxSize) {
    $q.notify({ type: 'negative', message: '图片不能超过 5MB' })
    return
  }

  uploadingAvatar.value = true
  try {
    const res = await updateAvatar(userStore.userInfo.id, file)

    // ✅ 修复：使用 updateUserInfo ！！！
    userStore.updateUserInfo({
      ...userStore.userInfo,
      avatar: res.avatar
    })

    $q.notify({ type: 'positive', message: '头像上传成功' })
  } catch (err) {
    $q.notify({ type: 'negative', message: '头像上传失败：' + err.message })
  } finally {
    uploadingAvatar.value = false
    avatarInput.value.value = ''
    router.push('/')
  }
}

// 删除头像
const removeAvatarHandler = async () => {
  try {
    await removeAvatar(userStore.userInfo.id)

    // ✅ 修复：使用 updateUserInfo ！！！
    userStore.updateUserInfo({
      ...userStore.userInfo,
      avatar: ''
    })

    $q.notify({ type: 'positive', message: '头像已删除' })
  } catch {
    $q.notify({ type: 'negative', message: '删除失败' })
  }
}
</script>

<style scoped>
.hidden {
  display: none;
}
</style>
