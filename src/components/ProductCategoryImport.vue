<!-- components/ProductCategoryImport.vue -->
<template>
  <q-dialog v-model="showDialog">
    <q-card style="max-width: 600px; width: 90vw;">
      <q-card-section>
        <h5 class="text-subtitle1">导入商品分类</h5>

        <!-- 上传区域 -->
        <div class="mt-4">
          <q-uploader label="拖放Excel文件或点击选择" accept=".xlsx, .xls" :max-files="1" @added="handleFileSelected"
            @remove-file="handleFileRemoved" class="q-mt-2" />
        </div>

        <!-- 模板下载 -->
        <div class="mt-2 text-sm text-secondary">
          <q-btn label="下载导入模板" size="sm" color="primary" flat @click="downloadTemplate" />
        </div>

        <!-- 导入结果 -->
        <div v-if="showResult" class="mt-4">
          <div v-if="importResult.success" class="text-positive">
            导入成功！成功{{ importResult.success_count }}条，失败{{ importResult.error_count }}条
          </div>
          <div v-else class="text-negative">
            导入失败：{{ importResult.message }}
          </div>

          <!-- 错误详情 -->
          <q-expansion-item v-if="importResult.error_count > 0" label="查看错误详情" dense>
            <q-table :data="importResult.errors" :columns="errorColumns" row-key="row" dense flat />
          </q-expansion-item>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="p-4">
        <q-btn label="取消" @click="closeDialog" class="mr-2" />
        <q-btn label="开始导入" color="primary" @click="submitImport" :disabled="!selectedFile" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import { importProductCategoryApi, downloadProductCategoryTemplate } from 'src/services/productServiceApi'

const $q = useQuasar()
const showDialog = ref(false)
const selectedFile = ref(null)
const importResult = ref({})
const showResult = ref(false)

// 错误详情表格列
const errorColumns = ref([
  { name: 'row', label: '行号', field: 'row' },
  { name: 'code', label: '类别编码', field: row => row.data['类别编码'] },
  { name: 'error', label: '错误原因', field: 'error' }
])

const emit = defineEmits(['close', 'saved'])

// 打开导入弹窗
const openDialog = () => {
  showDialog.value = true
  selectedFile.value = null
  importResult.value = {}
  showResult.value = false
}

// 选择文件
// ProductCategoryImport.vue - handleFileSelected
// 修正文件选择逻辑
const handleFileSelected = (uploaderFiles) => {
  // q-uploader的@added事件参数结构：{ files: [File对象], ... }
  const file = uploaderFiles.files[0]  // 取第一个真实的File对象
  if (!file) return

  // 前端提前校验文件类型（兜底）
  const allowedExts = ['.xlsx', '.xls']
  const fileExt = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
  if (!allowedExts.includes(fileExt)) {
    $q.notify({
      color: 'negative',
      message: `仅支持Excel文件（${allowedExts.join(', ')}）`
    })
    selectedFile.value = null
    return
  }

  selectedFile.value = file  // 赋值真实的File对象，而非FormData/其他对象
}

// 修正文件移除逻辑
const handleFileRemoved = () => {
  selectedFile.value = null
}

// 下载模板
const downloadTemplate = () => {
  downloadProductCategoryTemplate().then(response => {
    // 处理文件下载（后端返回文件流）
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const a = document.createElement('a')
    a.href = url
    a.download = '商品分类导入模板.xlsx'
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
  })
}


// 提交导入
const submitImport = async () => {
  if (!selectedFile.value) return
  // 可选：如果需要传递is_init参数（初始化导入）
  // formData.append('is_init', false)

  $q.loading.show({ message: '导入中...' })
  try {
    // 直接传递formData给接口（而非file）
    const res = await importProductCategoryApi(selectedFile.value)
    importResult.value = res.data
    showResult.value = true
    emit('saved')
  } catch (error) {
    // 优化错误提示：匹配后端返回的error字段
    $q.notify({
      color: 'negative',
      message: error.response?.data?.error || '导入失败'
    })
  } finally {
    $q.loading.hide()
  }
}
const closeDialog = () => {
  emit('close')
}


// 暴露打开弹窗的方法
defineExpose({ openDialog })
</script>
