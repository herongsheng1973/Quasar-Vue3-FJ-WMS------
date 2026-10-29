<template>
  <q-page class="row q-pa-md flex-center">
    <div class="col-12 col-md-10 col-lg-8 q-my-md">
      <h3 class="text-primary q-my-none align-center text-center">📝 工作日志管理</h3>
    </div>
    <!-- 顶部操作栏 -->

    <div class="row q-mb-md items-center justify-between">
      <div class="row items-center gap-4 q-mb-none">
        <!-- 入作日志日期范围筛选 -->
        <q-input class="col-6 q-mb-none" outlined dense readonly>
          <template v-slot:prepend>
            <q-icon name="event" class="cursor-pointer">
              <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                <q-date v-model="dateRange" range mask="YYYY-MM-DD" :locale="datePickerLocale">
                  <div class="row items-center justify-end">
                    <q-btn label="清除" color="primary" flat @click="clearDateRange" />
                    <q-btn v-close-popup label="确定" color="primary" flat @click="applyDateRange" />
                  </div>
                </q-date>
              </q-popup-proxy>
            </q-icon>
          </template>

          <template v-slot:append>
            <span v-if="finalParams?.from && finalParams?.to">
              {{ finalParams.from }} ~ {{ finalParams.to }}
            </span>
            <span v-else-if="finalParams?.from && !finalParams?.to">
              从 {{ finalParams.from }}
            </span>
            <span v-else-if="!finalParams?.from && finalParams?.to">
              至 {{ finalParams.to }}
            </span>
            <span v-else>
              工作日志日期范围
            </span>
          </template>
        </q-input>
        <q-btn class="col-2 q-mx-md" color="primary" label="搜索" icon="search" @click="getList" size="md" />
        <q-btn class="col-2" color="primary" label="重置" icon="refresh" @click="clearDateRange" size="md" />
      </div>

      <q-btn color="primary" label="新增日志" icon="add" @click="openAddModal" size="md" />
    </div>
    <div class="col-12 col-md-10 col-lg-8 q-my-md">



      <!-- 时间线展示 -->
      <q-card class="q-mb-lg">
        <q-card-section>
          <div v-if="loading" class="text-center q-py-lg">
            <q-spinner color="primary" size="40" />
            <div class="q-mt-sm">加载中...</div>
          </div>

          <div v-else-if="Object.keys(timelineData).length === 0" class="text-center q-py-xl">
            <div class="text-grey-5 text-h6">暂无工作日志，点击右上角新增</div>
          </div>

          <!-- Quasar Timeline 组件 -->
          <q-timeline v-else color="secondary" side="right">
            <q-timeline-entry heading body="Timeline heading" />
            <div v-for="(monthItem, monthKey) in timelineData" :key="monthKey">

              <!-- 月份标题 -->
              <q-timeline-entry heading :body="formatMonthToEnglish(monthKey)" />



              <div v-for="(dayLogs, dayKey) in monthItem" :key="dayKey" class="q-mb-sm">
                <q-timeline-entry :title="dayKey + '工作日志'"
                  :subtitle="formatChineseDate(dayKey, { showWeekday: true, showLunar: true })" icon="event">


                  <div v-for="log in dayLogs" :key="log.id" class="q-mb-md">

                    <div>
                      <q-card bordered class="q-pa-sm">
                        <!-- 标题 + 操作按钮 -->
                        <div class="row justify-between items-center">
                          <div class="text-weight-bold text-body1">{{ log.title }}</div>
                          <div>
                            <q-btn size="sm" flat color="blue" icon="edit" @click="openEditModal(log)" />
                            <q-btn size="sm" flat color="red" icon="delete" @click="deleteLog(log.id)" />
                          </div>
                        </div>

                        <!-- 内容 -->
                        <div class="text-grey-8 q-my-xs" v-html="log.content"></div>

                        <!-- 附件/图片展示 -->
                        <div v-if="log.attachments && log.attachments.length" class="q-mt-sm">
                          <div class="text-caption text-grey-5 q-mb-xs">附件：</div>
                          <div class="row q-gutter-sm">
                            <!-- 图片预览 -->
                            <q-img v-for="item in log.attachments" :key="item.id" :src="item.file_url"
                              :alt="item.filename" class="col-6 col-sm-4 col-md-3"
                              style="height: 100px; object-fit: cover" @click="previewImage(item.file_url)">
                              <template #error>
                                <div class="bg-grey-2 flex-center">
                                  <q-icon name="attachment" size="md" />
                                </div>
                              </template>
                            </q-img>
                          </div>
                          <!-- 下载按钮 -->
                          <div class="q-mt-xs">
                            <q-btn v-for="item in log.attachments" :key="item.id" size="xs" flat :label="item.filename"
                              icon="download" @click="downloadFile(item.file_url, item.filename)" />
                          </div>
                        </div>
                      </q-card>
                    </div>
                  </div>
                </q-timeline-entry>
              </div>

              <!-- 按天展示 -->

            </div>
          </q-timeline>
        </q-card-section>
      </q-card>
    </div>

    <!-- 新增/编辑 弹窗 -->
    <q-dialog v-model="modalVisible" max-width="700px">
      <q-card>
        <q-card-section class="text-h6">
          {{ isEdit ? '编辑日志' : '新增日志' }}
        </q-card-section>
        <q-card-section class="q-pa-md">
          <q-input v-model="form.title" label="工作标题" class="q-mb-sm" required />
          <q-editor v-model="form.content" label="工作内容" class="q-mb-sm" min-height="150" required />
          <!-- 多文件上传 -->
          <q-uploader label="上传图片/附件" accept=".png,.jpg,.jpeg,.gif,.pdf,.doc,.docx,.xls,.xlsx" multiple
            :auto-upload="false" class="q-mt-sm" @added="handleFileAdded" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn label="取消" @click="closeModal" />
          <q-btn color="primary" label="保存" @click="submitForm" :loading="submitting" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 图片预览 -->
    <q-dialog v-model="previewVisible" maximized>
      <q-card class="bg-black">
        <q-card-section class="text-right">
          <q-btn flat icon="close" color="white" @click="previewVisible = false" />
        </q-card-section>
        <q-card-section class="flex-center">
          <q-img :src="previewUrl" class="max-w-full max-h-screen" fit="contain" />
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useQuasar } from 'quasar'
// 引入 工作日志 API
import workLogApi from 'src/services/worklogapi'
import {
  //formatDateToEnglish,
  formatMonthToEnglish,
  formatChineseDate

} from 'src/utils/date_transfer_utils'
const $q = useQuasar()

// 数据
const loading = ref(false)
const timelineData = ref({})
const modalVisible = ref(false)
const previewVisible = ref(false)
const previewUrl = ref('')
const isEdit = ref(false)
const submitting = ref(false)
const selectedFiles = ref([])
const fileError = ref('')
// 表单
const form = reactive({
  id: '',
  title: '',
  content: ''
})

// 日期选择器本地化设置
const datePickerLocale = {
  days: '日_一_二_三_四_五_六'.split('_'),
  daysShort: '日_一_二_三_四_五_六'.split('_'),
  months: '一月_二月_三月_四月_五月_六月_七月_八月_九月_十月_十一月_十二月'.split('_'),
  monthsShort: '1月_2月_3月_4月_5月_6月_7月_8月_9月_10月_11月_12月'.split('_')
}
// ==================== 加载时间线数据 ====================
const loadTimelineData = async () => {
  loading.value = true
  try {
    const res = await workLogApi.getTimeline()
    timelineData.value = res.data.data
  } catch (err) {
    $q.notify({ color: 'red', message: '加载失败' + err.message })
  } finally {
    loading.value = false
  }
}
// 日期范围
const dateRange = ref({ from: null, to: null })
// 清除日期范围
const clearDateRange = () => {
  dateRange.value = { from: null, to: null }
  // 刷新列表
  finalParams.value = { from: null, to: null }
  getList()
}

// 最终提交的参数
const finalParams = ref({
  from: null,
  to: null
})
// 日期验证
const isValidDate = (dateString) => {
  if (!dateString) return true
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(dateString)) return false

  const date = new Date(dateString)
  return date instanceof Date && !isNaN(date) && dateString === date.toISOString().split('T')[0]
}

// 应用日期范围（支持同一天）
const applyDateRange = () => {
  let start = null
  let end = null
  console.log(dateRange.value.from, dateRange.value.to)
  // 情况1：只选了一个日期 → 起止都用这个日期
  if (dateRange.value.from && !dateRange.value.to) {
    start = dateRange.value.from
    end = dateRange.value.from
  }
  else if (!dateRange.value.from && dateRange.value.to) {
    start = dateRange.value.to
    end = dateRange.value.to
  }
  // 情况2：正常范围
  else if (dateRange.value.from && dateRange.value.to) {
    if (dateRange.value.from <= dateRange.value.to) {
      start = dateRange.value.from
      end = dateRange.value.to
    } else {
      start = dateRange.value.to
      end = dateRange.value.from
    }
  } else if (!dateRange.value.from && !dateRange.value.to && dateRange.value) {
    start = dateRange.value
    end = dateRange.value
  }

  // 验证
  if ((start && !isValidDate(start)) || (end && !isValidDate(end))) {
    dateRange.value = { from: null, to: null }
    $q.notify({ color: 'negative', message: '日期格式无效' })
    return
  }

  // 赋值给最终参数
  finalParams.value.from = start
  finalParams.value.to = end
  // 刷新列表
  getList()
}


// 获取列表（自动带日期筛选）
const getList = async () => {
  loading.value = true
  try {
    const params = {}
    const { from, to } = finalParams.value

    if (from) params.created_at_after = from
    if (to) params.created_at_before = to

    const res = await workLogApi.getTimeline(params)
    timelineData.value = res.data.data
  } finally {
    loading.value = false
  }
}
// ==================== 打开新增弹窗 ====================
const openAddModal = () => {
  isEdit.value = false
  form.id = ''
  form.title = ''
  form.content = ''
  selectedFiles.value = []
  modalVisible.value = true
}

// ==================== 打开编辑弹窗 ====================
const openEditModal = (log) => {
  isEdit.value = true
  form.id = log.id
  form.title = log.title
  form.content = log.content
  selectedFiles.value = []
  modalVisible.value = true
}

const closeModal = () => {
  modalVisible.value = false
}
const handleFileAdded = (files) => {
  // files 是一个 FileList 对象
  if (files.length === 0) return

  // 重置之前的错误状态
  fileError.value = ''


  files.forEach(file => {
    fileError.value = validateFile(file)
    if (fileError.value) {
      selectedFiles.value = []
      $q.notify({ color: 'red', message: fileError.value })
      return
    }
    selectedFiles.value.push(file)

  })

}
const validateFile = (file) => {
  if (!file) return '请选择文件'
  if (!file.type.match('image|pdf|doc|docx|xxls|xlsx')) return '请上传图片、PDF、Word、Excel文件'
  if (file.size > 2 * 1024 * 1024) {
    return '图片大小不能超过2MB'
  }
  return null
}
// ==================== 提交保存 ====================
const submitForm = async () => {
  if (!form.title || !form.content) {
    $q.notify({ color: 'red', message: '请填写完整信息' })
    return
  }

  submitting.value = true
  try {
    const fd = new FormData()
    fd.append('title', form.title)
    fd.append('content', form.content)

    // ✅ 关键：数组格式 attachments[]
    selectedFiles.value.forEach(file => {
      fd.append('attachments[]', file)
    })

    if (isEdit.value) {
      await workLogApi.updateLog(form.id, fd)
      $q.notify({ color: 'green', message: '修改成功' })
    } else {
      console.log('fd', fd)
      await workLogApi.createLog(fd)
      $q.notify({ color: 'green', message: '创建成功' })
    }

    closeModal()
    loadTimelineData()
  } catch (err) {
    $q.notify({ color: 'red', message: '保存失败：' + err.message })
  } finally {
    submitting.value = false
  }
}

// ==================== 删除日志 ====================
const deleteLog = async (id) => {
  await $q.dialog({
    title: '确认删除',
    message: '确定要删除这条日志吗？',
    ok: { color: 'red' },
    cancel: true
  })

  try {
    await workLogApi.deleteLog(id)
    $q.notify({ color: 'green', message: '删除成功' })
    loadTimelineData()
  } catch (err) {
    $q.notify({ color: 'red', message: '删除失败' + err.message })
  }
}

// ==================== 预览图片 ====================
const previewImage = (url) => {
  previewUrl.value = url
  previewVisible.value = true
}

// ==================== 下载文件 ====================
const downloadFile = (url, name) => {
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.target = '_blank'
  a.click()
}

// 初始化
onMounted(() => {
  loadTimelineData()
})
</script>

<style scoped>
.q-timeline {
  padding-left: 0 !important;
}
</style>
