<template>
  <q-page class="q-pa-md">
    <div class="row justify-between items-center mb-4">
      <div>
        <h5 class="text-h5 q-my-none">仪器组件管理</h5>
        <p class="text-subtitle1 text-grey">
          仪器 SN：{{ $route.query.device_name }}
        </p>
      </div>
      <q-btn label="返回列表" color="primary" @click="goBack" />
    </div>

    <component-table :recorder_id="recorderId" />
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ComponentTable from 'src/components/recorder/ComponentTable.vue'

const route = useRoute()
const router = useRouter()

const recorderId = ref(route.params.id)

function goBack() {
  router.go(-1)
}
</script>
