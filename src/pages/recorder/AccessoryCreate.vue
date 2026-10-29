<template>
  <q-dialog v-model="show" style="min-width:550px">
    <q-card>
      <q-card-section>
        <h5 class="text-center">新增附件</h5>
      </q-card-section>
      <q-card-section class="q-pa-lg">
        <q-select v-model="form.acc_type" label="附件类型" :options="options" options-label="label" options-value="value"
          emit-value required class="q-mb-sm" />

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
import { createRecorderAccessory } from 'src/services/recorderServiceApi'
import { useQuasar } from 'quasar'
const $q = useQuasar()

const props = defineProps({
  show: Boolean,
  recorder_id: Number,
  options: Array
})
const emit = defineEmits(['update:show', 'success'])

const show = computed({
  get: () => props.show,
  set: v => emit('update:show', v)
})

const loading = ref(false)

// 初始化表单
const initForm = {
  recorder: props.recorder_id,
  acc_type: '',
  acc_name: '',
  acc_sn: '',
  remark: ''
}
const form = ref({ ...initForm })

// ✅ 监听弹窗打开：每次打开都重置表单（关键修复）
watch(() => props.show, (newVal) => {
  if (newVal) {
    form.value = { ...initForm }
  }
})

async function submit() {
  loading.value = true
  try {
    await createRecorderAccessory(form.value)
    $q.notify({ type: 'positive', message: '创建成功' })
    emit('success')
    close()
  } finally {
    loading.value = false
  }
}

function close() {
  show.value = false
}
</script>
