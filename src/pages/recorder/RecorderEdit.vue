<template>
  <q-dialog v-model="showEdit" max-width="700px" style="min-width:500px">
    <q-card>
      <q-card-section>
        <h5 class="text-center">编辑仪器</h5>
      </q-card-section>

      <q-card-section class="q-pa-lg">
        <q-input v-model="form.device_name" label="设备名称" required class="q-mb-sm" />
        <q-input v-model="form.sn" label="合同编号" required class="q-mb-sm" />

        <!-- 这里必须是小写 sku -->
        <q-input v-model="form.sku" label="SKU编号" required class="q-mb-sm" />

        <q-input v-model="form.capacity" label="容量" class="q-mb-sm" />
        <q-input v-model="form.firmware_version" label="固件版本" class="q-mb-sm" />
        <q-input v-model="form.start_use_date" type="date" label="启用日期" class="q-mb-sm" />

        <q-select v-model="form.status" label="状态" :options="statusOps" :option-label="label" :option-value="value"
          map-options emit-value required class="q-mb-sm" />
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
import { ref, computed, watch } from 'vue'
import { updateRecorder } from 'src/services/recorderServiceApi'
import { useQuasar } from 'quasar'
const $q = useQuasar()

const props = defineProps({
  show: Boolean,
  row: Object
})
const emit = defineEmits(['update:show', 'success'])

const showEdit = computed({
  get: () => props.show,
  set: (val) => emit('update:show', val)
})

const loading = ref(false)
const form = ref({})

const statusOps = ref([
  { label: '正常', value: 'normal' },
  { label: '维修中', value: 'repair' },
  { label: '待报废', value: 'scrap' }
])

watch(
  () => props.row,
  (v) => {
    if (v) {
      form.value = { ...v }
    }
  },
  { immediate: true }
)

function close() {
  showEdit.value = false
}

async function submit() {
  if (!form.value.id) return
  loading.value = true
  try {
    await updateRecorder(form.value.id, form.value)
    $q.notify({ type: 'positive', message: '保存成功' })
    emit('success')
    close()
  } catch (err) {
    $q.notify({ type: 'negative', message: '保存失败' + err.message })
  } finally {
    loading.value = false
  }
}
</script>
