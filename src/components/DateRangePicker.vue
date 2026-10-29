<!-- src/components/DateRangePicker.vue -->
<template>
  <div class="row q-col-gutter-md">
    <!-- 开始日期 -->
    <div class="col-12 col-md-6">
      <q-input v-model="localStartDate" label="开始日期" mask="date" dense @update:model-value="onDateChange">
        <template v-slot:before>
          <q-icon name="calendar_today" />
        </template>
        <template v-slot:append>
          <q-icon name="event" class="cursor-pointer">
            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
              <q-date v-model="localStartDate" minimal mask="YYYY-MM-DD" @update:model-value="onStartDateChange">
                <div class="row items-center justify-end q-gutter-sm">
                  <q-btn v-close-popup label="取消" color="grey" flat dense />
                  <q-btn v-close-popup label="确定" color="primary" unelevated dense />
                </div>
              </q-date>
            </q-popup-proxy>
          </q-icon>
        </template>
      </q-input>
    </div>

    <!-- 结束日期 -->
    <div class="col-12 col-md-6">
      <q-input v-model="localEndDate" label="结束日期" mask="date" dense @update:model-value="onDateChange">
        <template v-slot:before>
          <q-icon name="calendar_today" />
        </template>
        <template v-slot:append>
          <q-icon name="event" class="cursor-pointer">
            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
              <q-date v-model="localEndDate" minimal mask="YYYY-MM-DD" @update:model-value="onEndDateChange">
                <div class="row items-center justify-end q-gutter-sm">
                  <q-btn v-close-popup label="取消" color="grey" flat dense />
                  <q-btn v-close-popup label="确定" color="primary" unelevated dense />
                </div>
              </q-date>
            </q-popup-proxy>
          </q-icon>
        </template>
      </q-input>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  startDate: {
    type: String,
    default: ''
  },
  endDate: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:dateRange'])

const localStartDate = ref(props.startDate)
const localEndDate = ref(props.endDate)

// 监听外部属性变化
watch(() => props.startDate, (newVal) => {
  localStartDate.value = newVal
})

watch(() => props.endDate, (newVal) => {
  localEndDate.value = newVal
})

// 处理开始日期变更
const onStartDateChange = (value) => {
  localStartDate.value = value
  emitDateRange()
}

// 处理结束日期变更
const onEndDateChange = (value) => {
  localEndDate.value = value
  emitDateRange()
}

// 处理输入框值变更
const onDateChange = () => {
  emitDateRange()
}

// 发送更新事件
const emitDateRange = () => {
  emit('update:dateRange', {
    startDate: localStartDate.value,
    endDate: localEndDate.value
  })
}
</script>
