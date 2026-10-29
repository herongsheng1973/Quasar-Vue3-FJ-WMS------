<template>
  <div class="page-container">
    <div class="row items-center justify-between">
      <div class="col-2">
      </div>
      <page-header title="项目数据 Excel 导入" />
      <q-select v-model="selectedProject" label="请选择导入项目（必选）" :options="projectList" :disable="loadingProject"
        emit-value map-options required />
    </div>
    <q-separator />
    <div class="row flex justify-between items-center">
      <!-- 说明区域 -->
      <q-card class="col-12 q-my-md" elevation="2">
        <q-card-section horizontal>
          <q-card-section>
            <h3 class="text-primary">导入说明</h3>
            <p class="text-grey-6 q-mt-sm">✅ 生产数据导入工作表：</p>
            <ul class="text-body1 q-ml-md q-mt-xs">
              <li>接收线汇总（RP）</li>
              <li>检波点明细（R）</li>
              <li>激发线汇总（SP）</li>
              <li>激发点明细（S）</li>
            </ul>

            <p class="text-green q-mt-md">✅ 激发点生产数据导入：</p>
            <ul class="text-body1 q-ml-md q-mt-xs">
              <li>批量更新：激发日期、重激发日期、重激发次数、原因</li>
              <li>按激发线号 + 站位匹配，重复导入自动覆盖更新</li>
            </ul>

            <p class="text-purple q-mt-md">✅ 收放线日期导入工作表：</p>
            <ul class="text-body1 q-ml-md q-mt-xs">
              <li><b>Layout&Pickup</b>：检波器 / 大线 布设、回收日期自动批量更新</li>
            </ul>

            <p class="text-positive q-mt-md font-bold">
              空字段会自动处理，重复导入只更新、不重复
            </p>
          </q-card-section>
          <q-separator vertical />
          <q-card-section class="q-ma-md import-area">
            <!-- 导入区域：生产数据 -->
            <q-tabs v-model="tab" class="text-grey" active-color="primary" indicator-color="primary" align="justify"
              narrow-indicator>
              <q-tab name="projectData" label="项目数据批量导入" />
              <q-tab name="sourceLineData" label="激发点生产数据导入" />
              <q-tab name="layoutData" label="布局&回收日期导入" />
            </q-tabs>

            <q-separator />

            <q-tab-panels v-model="tab" animated>
              <q-tab-panel name="projectData">
                <!-- 🔥 项目数据批量导入 -->
                <q-card class="col-12 q-my-md" elevation="2">
                  <q-card-section>
                    <h3 class="text-primary">项目数据批量导入</h3>
                    <p class="text-grey-6">
                      自动导入 4 个工作表：接收线汇总、检波点明细、激发线汇总、激发点明细<br>
                      支持空字段自动填充（日期/区块/重炮数据）
                    </p>
                  </q-card-section>

                  <q-card-section>
                    <q-uploader label="选择导入文件（.xlsx/.xls）" accept=".xlsx, .xls" :max-files="1"
                      @added="handleFileSelected" @remove-file="() => { selectedFile = null; importResult = null; }"
                      dense />

                    <q-btn color="primary" expand :loading="importLoading" :disabled="!selectedFile || !selectedProject"
                      @click="handleImport" class="q-mt-sm">
                      开始导入生产数据
                    </q-btn>
                  </q-card-section>

                  <q-card-section v-if="importResult">
                    <h5 class="q-mt-sm">导入结果</h5>
                    <div v-for="(msg, key) in importResult.details" :key="key" class="text-body1 q-mt-xs">
                      {{ key }}：{{ msg }}
                    </div>
                  </q-card-section>
                </q-card>
              </q-tab-panel>

              <q-tab-panel name="sourceLineData">
                <!-- 🔥 激发点生产数据（激发日期/重激发）导入 -->
                <div class="row col-12 flex justify-between items-center">
                  <q-card class="col-6 q-px-md q-py-md" elevation="2">
                    <q-card-section>
                      <h3 class="text-green">生产数据总表导入</h3>
                      <p class="text-grey-6">
                        批量更新激发点：<br>
                        激发日期、重激发日期、重激发次数、重激发原因
                      </p>
                    </q-card-section>

                    <q-card-section>
                      <q-uploader label="选择生产数据总表文件" accept=".xlsx, .xls" :max-files="1"
                        @added="handleSourcePointFileSelected"
                        @remove-file="() => { sourcePointFile = null; sourcePointResult = null; }" dense />

                      <q-btn color="green" expand :loading="sourcePointLoading"
                        :disabled="!sourcePointFile || !selectedProject" @click="handleSourcePointImport"
                        class="q-mt-sm">
                        开始导入激发点生产数据
                      </q-btn>
                    </q-card-section>

                    <q-card-section v-if="sourcePointResult">
                      <h5 class="q-mt-sm">导入结果</h5>
                      <div class="text-body1 q-mt-xs">成功导入：{{ sourcePointResult.success }} 条</div>
                      <div class="text-body1 q-mt-xs">失败：{{ sourcePointResult.failed }} 条</div>
                      <div v-if="sourcePointResult.details.length > 0" class="text-red q-mt-xs">
                        错误：{{ sourcePointResult.details.join('，') }}
                      </div>
                    </q-card-section>
                  </q-card>
                  <q-card class="col-6 q-px-md q-py-sm" elevation="2">
                    <q-card-section>
                      <h3 class="text-purple">炮点数据S文件导入</h3>
                      <p class="text-grey-6">
                        批量更新炮点：<br />
                        根据Recorder Observer的S文件更新炮点数据
                      </p>
                      <q-input class="col-4 col-md-2" v-model="shootingDate" label="采集日期" type="date" outlined dense />
                      <q-uploader label="选择炮点数据S文件" accept=".s" multiple :max-files="10"
                        @added="handleShotPointFileSelected"
                        @remove-file="() => { shotPointFileList.value = []; shotPointResult = null; }" dense />

                      <q-btn color="green" expand :loading="shotPointLoading"
                        :disabled="!(shotPointFileList?.length) || !selectedProject || !shootingDate"
                        @click="handleShotPointImport" class="q-mt-sm">
                        开始导入炮点数据S文件
                      </q-btn>
                    </q-card-section>

                    <q-card-section v-if="shotPointResult">
                      <h5 class="q-mt-sm">导入结果</h5>
                      <div class="text-body1 q-mt-xs">成功导入：{{ shotPointResult.success }} 条</div>
                      <div class="text-body1 q-mt-xs">失败：{{ shotPointResult.failed }} 条</div>
                      <div v-if="shotPointResult.details.length > 0" class="text-red q-mt-xs">
                        错误：{{ shotPointResult.details.join('，') }}
                      </div>
                    </q-card-section>
                  </q-card>
                </div>

              </q-tab-panel>

              <q-tab-panel name="layoutData">
                <!-- 🔥 收放线日期导入 -->
                <q-card class="col-12 q-my-md" elevation="2">
                  <q-card-section>
                    <h3 class="text-purple">检波点收放线日期导入</h3>
                    <p class="text-grey-6">
                      从施工日志中批量更新：<br>
                      检波器布设/回收日期、大线布设/回收日期
                    </p>
                  </q-card-section>

                  <q-card-section>
                    <q-uploader label="选择施工日志文件" accept=".xlsx, .xls" :max-files="1" @added="handleLayoutFileSelected"
                      @remove-file="() => { layoutFile = null; layoutResult = null; }" dense />

                    <q-btn color="purple" expand :loading="layoutLoading" :disabled="!layoutFile || !selectedProject"
                      @click="handleLayoutImport" class="q-mt-sm">
                      开始更新收放线日期
                    </q-btn>
                  </q-card-section>

                  <q-card-section v-if="layoutResult">
                    <h5 class="q-mt-sm">更新结果</h5>
                    <div class="text-body1 q-mt-xs">总数据行：{{ layoutResult.total_rows }}</div>
                    <div class="text-body1 q-mt-xs">放线更新点位：{{ layoutResult.layout_updated }}</div>
                    <div class="text-body1 q-mt-xs">收线更新点位：{{ layoutResult.pickup_updated }}</div>
                    <div class="text-body1 q-mt-xs" v-if="layoutResult.error_rows > 0">
                      错误行数：{{ layoutResult.error_rows }}
                    </div>
                  </q-card-section>
                </q-card>
              </q-tab-panel>
            </q-tab-panels>
          </q-card-section>
        </q-card-section>

      </q-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import PageHeader from 'src/components/cableshop/PageHeader.vue'
import { projectExcelApi, projectSettingApi, receiverPointApi } from 'src/services/projectServiceApi'
// 引入激发点 API
import { sourcePointApi } from 'src/services/projectServiceApi'
import { useQuasar } from 'quasar'

const $q = useQuasar()

const tab = ref('projectData')
// ==================== 生产数据导入 ====================
const selectedFile = ref(null)
const importLoading = ref(false)
const importResult = ref(null)

// ==================== 激发点生产数据导入 ====================
const sourcePointFile = ref(null)
const sourcePointLoading = ref(false)
const sourcePointResult = ref(null)
// ==================== 炮点数据导入 ====================
const shootingDate = ref('')
const shotPointFileList = ref([])
const shotPointLoading = ref(false)
const shotPointResult = ref(null)

// ==================== 收放线日期导入 ====================
const layoutFile = ref(null)
const layoutLoading = ref(false)
const layoutResult = ref(null)

// 项目选择（共用）
const selectedProject = ref('')
const projectList = ref([])
const loadingProject = ref(false)

// 获取项目列表
const loadProjectList = async () => {
  loadingProject.value = true
  try {
    const res = await projectSettingApi.list()
    projectList.value = (res.data.results || res.data || []).map(item => ({
      label: item.project_name,
      value: item.id
    }))
    if (projectList.value.length > 0) {
      const maxId = Math.max(...projectList.value.map(item => item.value))
      selectedProject.value = maxId
    }
  } catch (e) {
    $q.notify({ type: 'negative', message: '加载项目列表失败：' + e.message })
  } finally {
    loadingProject.value = false
  }
}

// 选择生产数据文件
function handleFileSelected(files) {
  if (files && files.length > 0) {
    selectedFile.value = files[0]
    importResult.value = null
  }
}

// 选择激发点生产数据文件
function handleSourcePointFileSelected(files) {
  if (files && files.length > 0) {
    sourcePointFile.value = files[0]
    sourcePointResult.value = null
  }
}
// 选择炮点数据S文件
function handleShotPointFileSelected(files) {
  // quasar uploader 回调 files 大概率为数组，再做一层兜底
  if (Array.isArray(files) && files.length > 0) {
    shotPointFileList.value = files
    shotPointResult.value = null
  } else {
    // 异常情况置空数组
    shotPointFileList.value = []
  }
}
// 选择施工日志文件
function handleLayoutFileSelected(files) {
  if (files && files.length > 0) {
    layoutFile.value = files[0]
    layoutResult.value = null
  }
}

// 生产数据导入
const handleImport = async () => {
  if (!selectedFile.value || !selectedProject.value) return

  importLoading.value = true
  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    formData.append('project', selectedProject.value)
    const res = await projectExcelApi.import(formData)
    importResult.value = res
    $q.notify({ type: 'positive', message: '项目数据导入成功' })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: '导入失败：' + (error.message || '格式错误或数据不匹配')
    })
  } finally {
    importLoading.value = false
  }
}

// ==================== 🔥 激发点生产数据导入 ====================
const handleSourcePointImport = async () => {
  if (!sourcePointFile.value || !selectedProject.value) {
    $q.notify({ type: 'negative', message: '请选择文件和项目' })
    return
  }

  sourcePointLoading.value = true
  try {
    const formData = new FormData()
    formData.append('file', sourcePointFile.value)
    formData.append('project_id', selectedProject.value)

    const res = await sourcePointApi.importExcel(formData)
    sourcePointResult.value = res.data
    $q.notify({ type: 'positive', message: '激发点生产数据导入成功' })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: '导入失败：' + (error.message || '文件格式错误')
    })
  } finally {
    sourcePointLoading.value = false
  }
}

// ==================== 炮点数据导入 ====================
const handleShotPointImport = async () => {
  if (!shotPointFileList.value.length || !selectedProject.value || !shootingDate.value) {
    $q.notify({ type: 'negative', message: '请选择文件、项目、日期' })
    return
  }

  shotPointLoading.value = true
  try {
    const formData = new FormData()

    // 🔴 修复：循环逐个添加文件，不要直接 append 数组
    shotPointFileList.value.forEach(file => {
      formData.append('files', file)
    })

    formData.append('project_id', selectedProject.value)
    // 统一日期分隔符
    const formatDate = shootingDate.value.replace(/\//g, '-')
    formData.append('date', formatDate)

    const res = await sourcePointApi.importSPSs(formData)
    shotPointResult.value = res.data
    $q.notify({ type: 'positive', message: '炮点数据导入请求完成' })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: '导入失败：' + (error.message || '文件格式错误')
    })
  } finally {
    shotPointLoading.value = false
  }
}
// ==================== 收放线日期导入调用 ====================
const handleLayoutImport = async () => {
  if (!layoutFile.value || !selectedProject.value) {
    $q.notify({ type: 'negative', message: '请选择文件和项目' })
    return
  }

  layoutLoading.value = true
  try {
    const formData = new FormData()
    formData.append('file', layoutFile.value)
    formData.append('project_id', selectedProject.value)

    const res = await receiverPointApi.layout(formData)
    layoutResult.value = res
    $q.notify({ type: 'positive', message: '收放线日期更新完成' })
  } catch (error) {
    console.error('上传错误', error)
    $q.notify({
      type: 'negative',
      message: '更新失败：' + (error.message || '文件格式错误')
    })
  } finally {
    layoutLoading.value = false
  }
}

onMounted(() => {
  loadProjectList()
})
</script>

<style scoped>
.page-container {
  padding: 20px;
}

.import-area {
  width: 98%;
}
</style>
