<!-- 仪器状态变更 -->
<!-- src\pages\recorder\RecorderStatus.vue -->
<template>
  <q-dialog v-model="visible" max-width="500px">
    <q-card>
      <q-card-section>
        <h5 class="text-center">仪器状态变更</h5>
      </q-card-section>
      <q-card-section class="q-pa-lg">
        <q-select v-model="form.new_status" label="选择新状态" :options="statusOps" options-label="label"
          options-value="value" emit-value class="q-mb-sm" />
        <q-input v-model="form.remark" type="textarea" label="备注说明" rows="2" />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="取消" @click="close" />
        <q-btn color="purple" label="确认变更" :loading="loading" @click="submit" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { changeRecorderStatus } from 'src/services/recorderServiceApi'
import { useQuasar } from 'quasar'

const $q = useQuasar()

const props = defineProps({
  show: Boolean,
  row: Object
})
const emit = defineEmits(['update:show', 'success'])

// 计算属性绑定对话框（正确）
const visible = computed({
  get: () => props.show,
  set: (val) => emit('update:show', val)
})

const loading = ref(false)
const form = ref({
  new_status: null,
  remark: ''
})

const statusOps = ref([
  { label: '正常', value: 'normal' },
  { label: '维修中', value: 'repair' },
  { label: '待报废', value: 'wait_scrap' },
  { label: '已报废', value: 'scrap' }
])

function close() {
  visible.value = false
}

async function submit() {
  if (!form.value.new_status) {
    return $q.notify({
      type: 'warning',
      message: '请选择状态'
    })
  }

  loading.value = true
  try {
    // 调用接口
    await changeRecorderStatus(props.row.id, form.value)

    $q.notify({
      type: 'positive',
      message: '状态已更新'
    })
    close()
    emit('success') // 只调用一次
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err.message || '状态修改失败，请重试'
    })
  } finally {
    loading.value = false
  }
}
</script>
