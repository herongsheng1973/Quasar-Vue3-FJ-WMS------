<template>
  <q-layout view="lHh Lpr lFf">
    <!-- 顶部导航栏 -->
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <!-- 汉堡菜单按钮 -->
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />

        <!-- 应用标题 -->
        <q-toolbar-title>
          <span class="text-h6 font-bold">物资管理系统 Quasar 2.18</span>
        </q-toolbar-title>

        <q-space />

        <!-- 用户菜单 -->
        <div class="row items-center">
          <template v-if="!userStore.isLoggedIn">
            <!-- 登录按钮 -->
            <q-btn label="登录" flat color="white" @click="goToLogin" />
          </template>
          <template v-else>
            <q-btn flat color="white" :label="userName" icon="person" class="q-mr-sm" dropdown>
              <q-menu v-model="showUserMenu" anchor="bottom right" self="top right">
                <q-list>
                  <q-item clickable @click="navigateTo('profile')">
                    <q-item-section avatar>
                      <q-avatar icon="person" />
                    </q-item-section>
                    <q-item-section>个人资料</q-item-section>
                  </q-item>

                  <q-item clickable @click="navigateTo('change-password')">
                    <q-item-section avatar>
                      <q-avatar icon="lock" />
                    </q-item-section>
                    <q-item-section>修改密码</q-item-section>
                  </q-item>

                  <q-separator />

                  <q-item clickable @click="handleLogout">
                    <q-item-section avatar>
                      <q-avatar icon="logout" color="red" />
                    </q-item-section>
                    <q-item-section class="text-red">退出登录</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </template>
        </div>
      </q-toolbar>
    </q-header>

    <!-- 左侧边栏 → 支持二级菜单 -->
    <q-drawer v-model="leftDrawerOpen" show-if-above bordered :width="260" class="bg-white shadow-lg">
      <q-scroll-area class="fit">
        <q-list class="q-pt-md">
          <q-item-label header class="text-primary font-bold q-pl-md">
            主导航
          </q-item-label>

          <!-- 一级菜单（支持二级子菜单） -->
          <template v-for="item in userStore.menu" :key="item.path || item.name">
            <!-- 情况1：没有子菜单 → 普通菜单项 -->
            <q-item v-if="!item.children || item.children.length === 0" :to="item.path" clickable router-link
              class="q-px-md hover:bg-primary/10">
              <q-item-section avatar>
                <q-avatar :icon="item.icon" class="bg-primary/10 text-primary" />
              </q-item-section>
              <q-item-section>{{ item.name }}</q-item-section>
            </q-item>

            <!-- 情况2：有子菜单 → 折叠面板（二级菜单） -->
            <q-expansion-item v-else v-model="item.open" :label="item.name" :icon="item.icon" class="q-px-sm q-py-sm"
              header-class="font-medium text-body1 hover:bg-primary/10 rounded-borders">
              <!-- 子菜单 -->
              <q-item v-for="child in item.children" :key="child.path" :to="child.path" clickable router-link
                class="q-px-lg q-py-sm hover:bg-primary/10">
                <q-item-section avatar>
                  <q-avatar :icon="child.icon" class="bg-primary/10 text-primary" size="sm" />
                </q-item-section>
                <q-item-section>{{ child.name }}</q-item-section>
              </q-item>
            </q-expansion-item>
          </template>
        </q-list>
      </q-scroll-area>
    </q-drawer>
    <!-- 主内容 -->
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar, Loading } from 'quasar'
import { useUserStore } from 'src/stores/userStore'

const userStore = useUserStore()
const $q = useQuasar()
const router = useRouter()

const leftDrawerOpen = ref(false)
const showUserMenu = ref(false)

userStore.init()
// 用户名
const userName = computed(() => {
  return userStore.userInfo?.name || userStore.userInfo?.username || '用户'
})

// 切换侧边栏
function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

// 路由跳转
function navigateTo(path) {
  showUserMenu.value = false
  router.push(path).catch(err => console.log('导航错误：', err))
}

// ✅ 专门处理登录跳转（强制刷新，解决重复跳转无响应）
function goToLogin() {
  showUserMenu.value = false

  // 如果已经在登录页，强制刷新确保页面可操作
  if (router.currentRoute.value.path === '/login') {
    window.location.reload()
    return
  }

  router.push('/login').catch(err => {
    console.log('登录跳转失败：', err)
    // 降级方案：原生跳转
    window.location.href = '/login'
  })
}

// 登出
async function handleLogout() {
  try {
    Loading.show({ message: '退出中...' })

    // 先登出
    userStore.logout()

    $q.notify({ type: 'positive', message: '已安全退出' })

    // ✅ 退出后强制刷新，确保状态重置
    router.push('/login').then(() => {
      window.location.reload()
    })
  } catch (err) {
    console.error('退出失败：', err)
    $q.notify({ type: 'negative', message: '退出失败' })
  } finally {
    Loading.hide()
  }
}
</script>
