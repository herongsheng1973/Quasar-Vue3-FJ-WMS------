<template>
  <q-dialog v-model="show" style="min-width:550px">
    <q-card>
      <q-card-section>
        <h5 class="text-center">编辑附件</h5>
      </q-card-section>
      <q-card-section class="q-pa-lg">
        <q-select v-model="form.acc_type" label="附件类型" :options="options" options-label="label" options-value="value"
          emit-value required />
        <q-input v-model="form.acc_name" label="附件名称" required class="q-mt-sm" />
        <q-input v-model="form.acc_sn" label="附件编号" class="q-mt-sm" />
        <q-input v-model="form.remark" label="备注" type="textarea" rows="2" class="q-mt-sm" />
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
import { updateRecorderAccessory } from 'src/services/recorderServiceApi'
import { useQuasar } from 'quasar'
const $q = useQuasar()

const props = defineProps({
  show: Boolean,
  row: Object,
  options: Array
})
const emit = defineEmits(['update:show', 'success'])

const show = computed({ get: () => props.show, set: v => emit('update:show', v) })
const loading = ref(false)
const form = ref({
  id: '',
  recorder: '',
  acc_type: '',
  acc_name: '',
  acc_sn: '',
  remark: ''
})


watch(() => props.row, v => {
  if (v) form.value = { ...v }
}, { immediate: true })

async function submit() {
  loading.value = true
  try {
    await updateRecorderAccessory(form.value.id, form.value)
    $q.notify({ type: 'positive', message: '保存成功' })
    emit('success')
    close()
  } finally { loading.value = false }
}

function close() { show.value = false }
</script>
