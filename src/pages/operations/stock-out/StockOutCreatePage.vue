<template>
  <q-page class="row justify-center q-pa-md">
    <q-card>
      <q-card-section class="row flex justify-between items-center">
        <q-btn flat dense icon="arrow_back" label="返回" @click="handleClose" />
        <h5 class="text-subtitle1 q-my-none">新增出库单</h5>
      </q-card-section>
      <q-card-section>
        <stock-out-form @close="handleClose" @saved="onOrderSaved" />
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import StockOutForm from 'src/components/operations/StockOutForm.vue'
import { createStockOutOrder } from 'src/services/inventoryServiceApi'

const $q = useQuasar()
const router = useRouter()

const onOrderSaved = async (formData) => {
  try {
    await createStockOutOrder(formData)
    $q.notify({ color: 'positive', message: '创建成功' })
    router.back()
  } catch (error) {
    $q.notify({ color: 'negative', message: error.response?.data?.error || '创建失败' })
  }
}

const handleClose = () => router.back()
</script>
