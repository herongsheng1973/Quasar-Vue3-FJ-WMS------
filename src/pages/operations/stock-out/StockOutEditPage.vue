<template>
  <q-page class="row justify-center q-pa-md">
    <q-card>
      <q-card-section class="row flex justify-between items-center">
        <q-btn flat dense icon="arrow_back" label="返回" @click="handleClose" />
        <h5 class="text-subtitle1 q-my-none">编辑出库单</h5>
      </q-card-section>
      <q-card-section>
        <stock-out-form :order="orderData" @close="handleClose" @saved="handleUpdate" />
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import StockOutForm from 'src/components/operations/StockOutForm.vue'
import { getStockOutOrderDetail, updateStockOutOrder } from 'src/services/inventoryServiceApi'

const router = useRouter()
const route = useRoute()
const $q = useQuasar()
const orderData = ref(null)
const id = route.params.id

onMounted(() => loadDetail())
const loadDetail = async () => {
  const res = await getStockOutOrderDetail(id)
  orderData.value = res.data
}

const handleUpdate = async (formData) => {
  try {
    await updateStockOutOrder(id, formData)
    $q.notify({ color: 'positive', message: '修改成功' })
    router.back()
  } catch (error) {
    $q.notify({ color: 'negative', message: error.response?.data?.error || '修改失败' })
  }
}

const handleClose = () => router.back()
</script>
