<template>
  <q-page class="row justify-center q-pa-md">
    <q-card>
      <q-card-section class="row flex justify-between">
        <q-btn flat dense icon="arrow_back" color="primary" label="返回" @click="handleClose">
          <q-tooltip>返回</q-tooltip>
        </q-btn>
        <h5 class="text-h5 q-my-none">编辑入库单</h5>
      </q-card-section>

      <q-card-section>
        <stock-in-form :order="orderData" @saved="handleUpdate" @close="handleClose" />
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import StockInForm from 'src/components/operations/StockInForm.vue'
import { getStockInOrderDetail, updateStockInOrder } from 'src/services/inventoryServiceApi'

const router = useRouter()
const route = useRoute()
const $q = useQuasar()
const orderData = ref(null)
const id = route.params.id

onMounted(() => {
  loadDetail()
})

const loadDetail = async () => {
  const res = await getStockInOrderDetail(id)
  orderData.value = res.data
}

const handleUpdate = async (formData) => {
  try {
    await updateStockInOrder(id, formData)
    $q.notify({
      color: 'positive',
      message: '入库单修改成功'
    })
    router.back()
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.response?.data?.error || '修改入库单失败'
    })
  }
}

const handleClose = () => {
  router.back()
}
</script>
