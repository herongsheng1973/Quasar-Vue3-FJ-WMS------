<template>
  <q-page class="row justify-center q-pa-md">
    <q-card class="full-width-card">
      <q-card-section class="row items-center justify-between">
        <q-btn flat dense icon="arrow_back" color="primary" label="返回" @click="handleClose">
          <q-tooltip>返回</q-tooltip>
        </q-btn>
        <h5 class="text-h5 q-my-none">新增入库单</h5>
      </q-card-section>

      <q-card-section>
        <stock-in-form @saved="onOrderSaved" @close="handleClose" />
      </q-card-section>
    </q-card>

  </q-page>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import StockInForm from 'src/components/operations/StockInForm.vue'
import { createStockInOrder } from 'src/services/inventoryServiceApi'
const $q = useQuasar()
const router = useRouter()

// 提交保存

// 订单保存后刷新列表
const onOrderSaved = async (formData) => {
  try {

    // 新增逻辑
    await createStockInOrder(formData)
    $q.notify({
      color: 'positive',
      message: '入库单创建成功'
    })
    router.back()

  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.response?.data?.error || '保存入库单失败'
    })
  }

}
// 关闭返回
const handleClose = () => {
  router.back()
}
</script>
<style scoped>
/* 核心：强制卡片 100% 宽度 */
.full-width-card {
  width: 100% !important;
  max-width: 100% !important;
  min-width: 100% !important;
}
</style>
