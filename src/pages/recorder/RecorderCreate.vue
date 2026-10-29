<template>
  <q-dialog v-model="show" style="min-width: 500px; max-width: 700px;">
    <q-card>
      <q-card-section>
        <h5 class="text-center">新增仪器</h5>
      </q-card-section>

      <q-card-section class="q-pa-lg">
        <q-input v-model="form.device_name" label="设备名称" required class="q-mb-sm" />
        <q-input v-model="form.sn" label="合同编号" required class="q-mb-sm" />
        <q-input v-model="form.sku" label="sku编号" class="q-mb-sm" />
        <q-input v-model="form.capacity" label="容量" class="q-mb-sm" />
        <q-input v-model="form.firmware_version" label="固件版本" class="q-mb-sm" />
        <q-input v-model="form.start_use_date" type="date" label="启用日期" class="q-mb-sm" />
        <q-select v-model="form.status" label="状态" :options="statusOps" class="q-mb-sm" />
        <q-input v-model="form.remark" type="textarea" label="备注" rows="2" />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="取消" @click="close" />
        <q-btn color="primary" label="保存" :loading="loading" @click="submit" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { createRecorder } from 'src/services/recorderServiceApi'
import { useQuasar } from 'quasar'
const $q = useQuasar()

// 👇 固定写法：父组件 v-model:show 必须对应这里
const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
})
const emit = defineEmits(['update:show', 'success'])

// 计算属性绑定 v-model
const show = computed({
  get: () => props.show,
  set: (val) => emit('update:show', val)
})

const loading = ref(false)
const form = ref({
  status: 'normal'
})

const statusOps = ref([
  { label: '正常', value: 'normal' },
  { label: '维修中', value: 'repair' },
  { label: '待报废', value: 'scrap' }
])

// 关闭
function close() {
  show.value = false
}

// 提交
async function submit() {
  loading.value = true
  try {
    await createRecorder(form.value)
    $q.notify({ type: 'positive', message: '创建成功' })
    emit('success')
    show.value = false
  } finally {
    loading.value = false
  }
}
</script>
