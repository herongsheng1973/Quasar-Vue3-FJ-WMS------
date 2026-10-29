<template>
  <q-page class="q-pa-md">
    <!-- 顶部标题 + 添加按钮 -->
    <div class="row justify-between items-center q-mb-md">
      <!-- 左侧：返回 + 标题 -->
      <div class="row items-center">
        <q-btn flat icon="arrow_back" label="返回" @click="goBack" class="q-mr-md" />
        <h5 class="text-h5 q-my-none">
          仪器操作日志：{{ $route.query.device_name || '未知设备' }}
        </h5>
      </div>

      <!-- 右侧：添加日志按钮 -->
      <q-btn color="primary" icon="add" label="添加日志" @click="showAddLog = true" />
    </div>

    <!-- 日志表格 -->
    <div class="bg-white rounded shadow-1 q-pa-md">
      <log-table :recorder_id="recorderId" ref="logTableRef" />
    </div>

    <!-- ================== 添加日志弹窗 ================== -->
    <q-dialog v-model="showAddLog" max-width="600px">
      <q-card>
        <q-card-section>
          <h5 class="text-center">添加仪器操作日志</h5>
        </q-card-section>

        <q-card-section class="q-pa-lg">
          <q-select v-model="form.log_type" label="日志类型" :options="logTypeOps" emit-value required
            :rules="rules.log_type" class="q-mb-sm" dense />
          <q-input v-model="form.log_content" label="日志内容" type="textarea" rows="3" class="q-mb-sm" dense
            :rules="rules.log_content" />
          <q-input v-model="form.remark" label="备注说明" type="textarea" rows="2" dense />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="取消" @click="closeAdd" />
          <q-btn color="primary" label="确认保存" :loading="loading" @click="submitAddLog" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import LogTable from 'src/components/recorder/LogTable.vue'
import { createLog } from 'src/services/recorderServiceApi'

const $q = useQuasar()
const route = useRoute()
const router = useRouter()

const recorderId = ref(route.params.id)
const logTableRef = ref(null)

// 弹窗控制
const showAddLog = ref(false)
const loading = ref(false)

// 表单
const form = ref({
  recorder_id: recorderId.value,
  log_type: 'maintain',
  log_content: '',
  remark: ''
})
const rules = ref({
  log_content: [
    val => !!val || '请填写日志内容'
  ],
  log_type: [
    val => !!val || '请选择日志类型'
  ]
})
// 日志类型
const logTypeOps = ref([
  { label: '日常维护', value: 'maintain' },
  { label: '故障处理', value: 'repair' },
  { label: '报废处理', value: 'scrap' },
  { label: '其他操作', value: 'other' }
])

// 返回
function goBack() {
  router.go(-1)
}

// 关闭弹窗
function closeAdd() {
  showAddLog.value = false
  form.value = {
    recorder_id: recorderId.value,
    log_type: 'maintain',
    log_content: '',
    remark: ''
  }
}

// 提交保存
async function submitAddLog() {
  if (!form.value.log_content) {
    $q.notify({ type: 'warning', message: '请填写日志内容' })
    return
  }

  loading.value = true
  try {
    await createLog({
      ...form.value,
    })
    $q.notify({ type: 'positive', message: '日志添加成功' })
    closeAdd()

    // 刷新日志列表
    if (logTableRef.value) {
      logTableRef.value.fetchList()
    }
  } catch (err) {
    $q.notify({ type: 'negative', message: '添加失败：' + err.message })
  } finally {
    loading.value = false
  }
}
</script>
