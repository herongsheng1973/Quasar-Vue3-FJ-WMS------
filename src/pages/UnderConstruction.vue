<template>
  <q-page class="row justify-center items-center q-pa-xl" style="min-height: calc(100vh - 60px)">
    <div class="text-center q-pa-xl" style="max-width: 600px">
      <!-- 图标 -->
      <div class="text-h1 text-grey-4 q-mb-lg">
        <i class="fa-solid fa-screwdriver-wrench text-blue-4"></i>
      </div>

      <!-- 标题 -->
      <h1 class="text-h4 q-mb-sm">页面正在开发中</h1>
      <p class="text-grey-7 q-mb-lg">
        该功能正在加紧建设中，敬请期待～
      </p>

      <!-- 进度条 -->
      <q-linear-progress indeterminate color="primary" class="q-mb-lg" style="height: 6px; border-radius: 3px" />

      <!-- 返回按钮 -->
      <q-btn label="返回首页" color="primary" push @click="$router.push('/')">
      </q-btn>
    </div>
  </q-page>
</template>

<script setup>
// 空即可
</script>

<style scoped></style>
