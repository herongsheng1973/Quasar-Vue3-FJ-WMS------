<template>
  <div>
    <div class="mb-3"><b>操作日志记录</b></div>
    <q-table :rows="rows" :columns="columns" row-key="id" :loading="loading" class="shadow-1 rounded bg-white">
      <template v-slot:body-cell-log_type="props">
        <q-td :props="props">
          <q-chip size="sm" :color="props.row.log_type === 'status_change'
            ? 'yellow'
            : props.row.log_type === 'repair'
              ? 'orange'
              : props.row.log_type === 'scrap'
                ? 'red'
                : 'grey'
            ">
            {{ props.row.log_type }}
          </q-chip>
        </q-td>
      </template>
    </q-table>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { getLogList } from 'src/services/recorderServiceApi'

const props = defineProps({
  recorder_id: [String, Number]
})

const rows = ref([])
const loading = ref(false)

const columns = [
  { name: 'log_type', label: '类型', field: 'log_type', align: 'center' },
  { name: 'log_content', label: '操作内容', field: 'log_content' },
  { name: 'remark', label: '备注', field: 'remark' },
  { name: 'operator', label: '操作人', field: 'operator' },
  { name: 'operate_time', label: '操作时间', field: 'operate_time' }
]

async function fetchList() {
  if (!props.recorder_id) return
  loading.value = true
  try {
    const res = await getLogList({ recorder: props.recorder_id })
    rows.value = res.data.results
  } finally {
    loading.value = false
  }
}

watch(() => props.recorder_id, fetchList, { immediate: true })
defineExpose({
  fetchList
})
</script>
