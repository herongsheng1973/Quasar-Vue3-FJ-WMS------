<template>
  <q-page class="row flex q-pa-md" style="min-height: 80vh">
    <!-- 项目选择器 -->
    <div class="row col-12 flex justify-between q-mb-md items-center">
      <h3 class="col-12 col-md-6 col-lg-6 text-primary text-weight-bold q-ml-md">Cableshop管理-Excel导入导出</h3>
      <div class="col-12 col-md-6 col-lg-4">
        <q-select v-model="currentProjectId" :options="projectList" label="选择导入/导出项目" options-label="label"
          options-value="id" emit-value map-options outlined dense />
      </div>
    </div>


    <div class="row col-12  flex justify-between">
      <!-- 导入区域 -->
      <q-card class="col-12 col-md-6">
        <q-card-section>
          <h3 class="text-primary">Excel批量导入</h3>
          <p class="text-grey-6">支持导入您上传的设备清单Excel文件，自动解析所有Sheet并写入数据库</p>
        </q-card-section>
        <q-card-section>
          <q-uploader label="选择导入文件（仅支持.xlsx/.xls）" accept=".xlsx, .xls" :max-files="1" @added="handleFileSelected"
            @remove-file="() => { selectedFile = null; importErrors = []; }" dense />

          <q-btn color="primary" expand :loading="importLoading" :disabled="!selectedFile || !currentProjectId"
            @click="handleImport">
            开始导入
          </q-btn>
        </q-card-section>

        <!-- 导入结果 -->
        <q-card-section v-if="importResult">
          <h5 class="q-mt-md">导入结果</h5>
          <q-badge color="positive" class="q-mr-sm">成功：{{ importResult.success }} 条</q-badge>
          <q-badge color="negative">失败：{{ importResult.failed }} 条</q-badge>
          <q-list v-if="importResult.details.length > 0" class="q-mt-md">
            <q-item v-for="(item, index) in importResult.details.slice(0, 10)" :key="index" dense>
              <q-item-label>{{ item }}</q-item-label>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>

      <!-- 导出区域 -->
      <q-card class="col-12 col-md-6">
        <q-card-section>
          <h3 class="text-primary">Excel数据导出</h3>
          <p class="text-grey-6">选择要导出的Sheet，一键生成规范的Excel文件</p>
        </q-card-section>
        <q-card-section>
          <q-select v-model="selectedSheet" label="选择导出Sheet" :options="sheetOptions" outlined dense class="q-mb-md" />
          <q-btn color="primary" expand :loading="exportLoading" :disabled="!selectedSheet || !currentProjectId"
            @click="handleExport">
            开始导出
          </q-btn>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { excelApi } from 'src/services/cableshopServiceApi'
import { projectSettingApi } from 'src/services/projectServiceApi'
import { useQuasar } from 'quasar'

const $q = useQuasar()

// ==========================================
// 项目相关（自动加载 + 默认最大ID）
// ==========================================
const projectList = ref([])
const currentProjectId = ref(null)

const loadProjectList = async () => {
  try {
    const res = await projectSettingApi.list()
    projectList.value = res.data.results.map(item => ({
      label: item.project_name,
      value: item.id
    }))
    // 默认选中 ID 最大项目
    if (projectList.value.length > 0) {
      const maxItem = projectList.value.reduce((a, b) => a.value > b.value ? a : b)
      currentProjectId.value = maxItem.value
    }
  } catch (error) {
    $q.notify({ type: 'negative', message: '项目加载失败：' + error.message })
  }
}

// ==========================================
// 导入相关
// ==========================================
const selectedFile = ref(null)
const importLoading = ref(false)
const importResult = ref(null)
const importErrors = ref([])

// ==========================================
// 导出相关
// ==========================================
const selectedSheet = ref('')
const exportLoading = ref(false)

const sheetOptions = [
  { label: '设备总表', value: 'device_total' },
  { label: '设备丢失明细', value: 'equipment_lost_detail' },
  { label: '丢失设备站号明细', value: 'lost_equipment_station' },
  { label: 'CableShop生产统计', value: 'cableshop_production' },
  { label: '仓库出入库记录', value: 'warehouse_in_out' },
]

// 文件选择
function handleFileSelected(files) {
  if (files && files.length > 0) {
    selectedFile.value = files[0]
    importErrors.value = []
    importResult.value = null
  }
}

// 执行导入（带 project）
const handleImport = async () => {
  if (!selectedFile.value || !currentProjectId.value) return
  importLoading.value = true

  try {
    const formData = new FormData()
    formData.append('excel_file', selectedFile.value)
    formData.append('project', currentProjectId.value)

    const res = await excelApi.import(formData)
    importResult.value = res.data
    $q.notify({ type: 'positive', message: '导入成功' })
  } catch (error) {
    $q.notify({ type: 'negative', message: '导入失败：' + (error.message || '格式错误') })
  } finally {
    importLoading.value = false
  }
}

// 执行导出（带 project + sheet_name）
const handleExport = async () => {
  if (!selectedSheet.value || !currentProjectId.value) return
  exportLoading.value = true

  try {
    const res = await excelApi.export({
      params: {
        sheet_name: selectedSheet.value,
        project: currentProjectId.value
      },
      responseType: 'blob'
    })

    const url = window.URL.createObjectURL(new Blob([res.data]))
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedSheet.value}_项目${currentProjectId.value}_${new Date().toISOString().slice(0, 10)}.xlsx`
    a.click()
    window.URL.revokeObjectURL(url)

    $q.notify({ type: 'positive', message: '导出成功' })
  } catch (error) {
    $q.notify({ type: 'negative', message: '导出失败：' + error.message })
  } finally {
    exportLoading.value = false
  }
}

// 初始化
onMounted(async () => {
  await loadProjectList()
})
</script>

<style scoped></style>
