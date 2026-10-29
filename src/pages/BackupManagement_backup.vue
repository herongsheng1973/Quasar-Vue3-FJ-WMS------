<template>
  <q-page class="row q-pa-md">
    <!-- 页面标题 -->
    <div class="col-6 mb-6">
      <h1 class="text-h5 text-weight-bold text-grey-8">数据备份管理</h1>
      <p class="text-grey-5 q-mt-sm">创建、恢复和管理数据库备份</p>
    </div>

    <div class="col-4 q-mt-md">
      <div class="text-subtitle1">创建新的数据库备份</div>
      <div class="text-caption text-grey-6">
        备份将包含所有数据库表和数据，可用于灾难恢复
      </div>
    </div>


    <div class="col-2 q-pt-md justify-end">
      <q-btn color="primary" label="创建备份" icon="add" @click="createBackup" :loading="creatingBackup" size="md" />
    </div>
    <!-- 备份操作区域 -->
    <q-card class="col-12 q-mb-md">
      <q-card-section>
        <!-- 备份选项 -->
        <div class="row q-mt-md q-col-gutter-md">
          <div class="col-md-4">
            <q-checkbox v-model="backupOptions.includeData" label="包含数据" dense />
          </div>
          <div class="col-md-4">
            <q-checkbox v-model="backupOptions.includeSchema" label="包含表结构" dense />
          </div>
          <div class="col-md-4">
            <q-checkbox v-model="backupOptions.compress" label="压缩备份文件" dense />
          </div>
        </div>

        <!-- 备份进度 -->
        <div v-if="backupProgress > 0 && backupProgress < 100" class="q-mt-md">
          <div class="row items-center">
            <div class="col-3 text-caption">备份进度:</div>
            <div class="col-9">
              <q-linear-progress :value="backupProgress / 100" color="primary" rounded />
            </div>
          </div>
          <div class="text-right text-caption text-primary">{{ backupProgress }}%</div>
        </div>
      </q-card-section>
    </q-card>

    <!-- 备份列表 -->
    <q-card class="col-12">
      <q-card-section>
        <div class="row justify-between items-center q-mb-md">
          <div class="text-subtitle1">备份文件列表</div>
          <q-btn flat round icon="refresh" @click="fetchBackups" :loading="loading">
            <q-tooltip>刷新</q-tooltip>
          </q-btn>
        </div>

        <!-- 备份表格 -->
        <q-table :rows="backups" :columns="columns" row-key="id" :loading="loading" :pagination="pagination"
          @request="onRequest" wrap-cells>
          <template v-slot:body-cell-size="props">
            <q-td :props="props">
              {{ formatFileSize(props.row.size) }}
            </q-td>
          </template>

          <template v-slot:body-cell-actions="props">
            <q-td :props="props" class="text-center">
              <q-btn size="sm" color="primary" icon="cloud_download" flat round @click="downloadBackup(props.row)"
                :loading="downloadingBackupId === props.row.id">
                <q-tooltip>下载</q-tooltip>
              </q-btn>
              <q-btn size="sm" color="secondary" icon="settings_backup_restore" flat round
                @click="confirmRestoreBackup(props.row)" class="q-ml-xs">
                <q-tooltip>恢复</q-tooltip>
              </q-btn>
              <q-btn size="sm" color="negative" icon="delete" flat round @click="confirmDeleteBackup(props.row)"
                class="q-ml-xs">
                <q-tooltip>删除</q-tooltip>
              </q-btn>
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <!-- 恢复备份确认对话框 -->
    <q-dialog v-model="showRestoreDialog">
      <q-card>
        <q-card-section>
          <div class="row items-center">
            <q-icon name="warning" color="warning" size="24px" class="q-mr-sm" />
            <span class="text-h6">确认恢复备份</span>
          </div>
        </q-card-section>

        <q-card-section v-if="selectedBackup">
          <p>
            您确定要从备份 <strong>{{ selectedBackup.name }}</strong> 恢复数据吗？
            这将覆盖当前数据库中的所有数据，且不可撤销。
          </p>
          <q-input v-model="restoreConfirmText" label="请输入 'CONFIRM' 确认操作" outlined dense :error="restoreConfirmError"
            error-message="请输入 'CONFIRM' 以确认恢复操作" />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="取消" v-close-popup />
          <q-btn color="secondary" label="确认恢复" @click="restoreBackup" :disable="restoreConfirmText !== 'CONFIRM'"
            :loading="restoringBackup" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 删除备份确认对话框 -->
    <q-dialog v-model="showDeleteDialog">
      <q-card>
        <q-card-section>
          <div class="row items-center">
            <q-icon name="delete" color="negative" size="24px" class="q-mr-sm" />
            <span class="text-h6">确认删除备份</span>
          </div>
        </q-card-section>

        <q-card-section v-if="selectedBackup">
          <p>
            您确定要删除备份文件 <strong>{{ selectedBackup.name }}</strong> 吗？
            此操作不可撤销。
          </p>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="取消" v-close-popup />
          <q-btn color="negative" label="确认删除" @click="deleteBackup" :loading="deletingBackup" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 备份详情对话框 -->
    <q-dialog v-model="showBackupDetail">
      <q-card style="width: 500px; max-width: 90vw;">
        <q-card-section>
          <div class="text-h6">备份详情</div>
        </q-card-section>

        <q-card-section v-if="selectedBackup">
          <q-list separator>
            <q-item>
              <q-item-section>
                <q-item-label caption>文件名</q-item-label>
                <q-item-label>{{ selectedBackup.name }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                <q-item-label caption>创建时间</q-item-label>
                <q-item-label>{{ formatDate(selectedBackup.created_at) }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                <q-item-label caption>文件大小</q-item-label>
                <q-item-label>{{ formatFileSize(selectedBackup.size) }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                <q-item-label caption>包含数据</q-item-label>
                <q-item-label>
                  <q-chip :color="selectedBackup.include_data ? 'positive' : 'negative'" text-color="white" dense>
                    {{ selectedBackup.include_data ? '是' : '否' }}
                  </q-chip>
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                <q-item-label caption>包含表结构</q-item-label>
                <q-item-label>
                  <q-chip :color="selectedBackup.include_schema ? 'positive' : 'negative'" text-color="white" dense>
                    {{ selectedBackup.include_schema ? '是' : '否' }}
                  </q-chip>
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                <q-item-label caption>压缩</q-item-label>
                <q-item-label>
                  <q-chip :color="selectedBackup.compressed ? 'positive' : 'negative'" text-color="white" dense>
                    {{ selectedBackup.compressed ? '是' : '否' }}
                  </q-chip>
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="关闭" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { format } from 'date-fns'


// 模拟API服务
const backupService = {
  // 获取备份列表
  async fetchBackups(params) {
    // 模拟API调用
    return new Promise((resolve) => {
      setTimeout(() => {
        // 生成模拟备份数据
        const backups = []
        const count = 15

        for (let i = 0; i < count; i++) {
          backups.push({
            id: i + 1,
            name: `backup_${new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)}.sql`,
            created_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
            size: Math.floor(Math.random() * 10000000) + 1000000, // 1MB - 10MB
            include_data: Math.random() > 0.2,
            include_schema: true,
            compressed: Math.random() > 0.5
          })
        }

        resolve({
          results: backups.slice((params.page - 1) * params.rowsPerPage, params.page * params.rowsPerPage),
          count: count
        })
      }, 500)
    })
  },

  // 创建备份
  async createBackup(options) {
    // 模拟创建备份过程
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: Date.now(),
          name: `backup_${new Date().toISOString().slice(0, 10)}.sql`,
          created_at: new Date().toISOString(),
          size: Math.floor(Math.random() * 10000000) + 1000000,
          include_data: options.includeData,
          include_schema: options.includeSchema,
          compressed: options.compress
        })
      }, 3000)
    })
  },

  // 下载备份
  async downloadBackup(backup) {
    // 模拟下载过程
    return new Promise((resolve) => {
      setTimeout(() => {
        // 创建模拟文件下载
        const element = document.createElement('a')
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent('模拟备份文件内容'))
        element.setAttribute('download', backup.name)
        element.style.display = 'none'
        document.body.appendChild(element)
        element.click()
        document.body.removeChild(element)
        resolve()
      }, 1000)
    })
  },

  // 恢复备份
  async restoreBackup() {
    // 模拟恢复过程
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // 90%成功率模拟
        if (Math.random() > 0.1) {
          resolve()
        } else {
          reject(new Error('恢复过程中发生错误'))
        }
      }, 3000)
    })
  },

  // 删除备份
  async deleteBackup() {
    // 模拟删除过程
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve()
      }, 500)
    })
  }
}

const $q = useQuasar()

// 状态
const backups = ref([])
const loading = ref(false)
const creatingBackup = ref(false)
const backupProgress = ref(0)
const downloadingBackupId = ref(null)
const restoringBackup = ref(false)
const deletingBackup = ref(false)
const showRestoreDialog = ref(false)
const showDeleteDialog = ref(false)
const showBackupDetail = ref(false)
const selectedBackup = ref(null)
const restoreConfirmText = ref('')
const restoreConfirmError = ref(false)

// 备份选项
const backupOptions = ref({
  includeData: true,
  includeSchema: true,
  compress: true
})

// 分页配置
const pagination = ref({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
  sortBy: 'created_at',
  descending: true
})

// 表格列配置
const columns = [
  {
    name: 'name',
    label: '备份文件名',
    field: 'name',
    align: 'left',
    sortable: true
  },
  {
    name: 'created_at',
    label: '创建时间',
    field: 'created_at',
    align: 'left',
    sortable: true,
    format: (val) => formatDate(val)
  },
  {
    name: 'size',
    label: '文件大小',
    field: 'size',
    align: 'right',
    sortable: true
  },
  {
    name: 'actions',
    label: '操作',
    align: 'center'
  }
]

// 格式化日期
const formatDate = (dateString) => {
  return format(new Date(dateString), 'yyyy-MM-dd HH:mm:ss')
}

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 获取备份列表
const fetchBackups = async (props) => {
  const { page, rowsPerPage, sortBy, descending } = props?.pagination || pagination.value

  try {
    loading.value = true

    const params = {
      page: page,
      rowsPerPage: rowsPerPage,
      sortBy: sortBy,
      descending: descending
    }

    const response = await backupService.fetchBackups(params)
    backups.value = response.results
    pagination.value.rowsNumber = response.count
    pagination.value.page = page
    pagination.value.rowsPerPage = rowsPerPage
    pagination.value.sortBy = sortBy
    pagination.value.descending = descending
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: '获取备份列表失败: ' + (error.message || '未知错误')
    })
  } finally {
    loading.value = false
  }
}

// 处理表格请求
const onRequest = (props) => {
  fetchBackups(props)
}

// 创建备份
const createBackup = async () => {
  try {
    creatingBackup.value = true
    backupProgress.value = 0

    // 模拟备份进度
    const progressInterval = setInterval(() => {
      if (backupProgress.value < 95) {
        backupProgress.value += 5
      }
    }, 150)

    const backup = await backupService.createBackup(backupOptions.value)

    clearInterval(progressInterval)
    backupProgress.value = 100

    // 添加新备份到列表顶部
    backups.value.unshift(backup)
    pagination.value.rowsNumber++

    $q.notify({
      color: 'positive',
      message: '备份创建成功'
    })
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: '备份创建失败: ' + (error.message || '未知错误')
    })
  } finally {
    setTimeout(() => {
      creatingBackup.value = false
      backupProgress.value = 0
    }, 1000)
  }
}

// 下载备份
const downloadBackup = async (backup) => {
  try {
    downloadingBackupId.value = backup.id
    await downloadBackup(backup)
    $q.notify({
      color: 'positive',
      message: '备份下载开始'
    })
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: '备份下载失败: ' + (error.message || '未知错误')
    })
  } finally {
    downloadingBackupId.value = null
  }
}

// 确认恢复备份
const confirmRestoreBackup = (backup) => {
  selectedBackup.value = backup
  restoreConfirmText.value = ''
  restoreConfirmError.value = false
  showRestoreDialog.value = true
}

// 恢复备份
const restoreBackup = async () => {
  if (restoreConfirmText.value !== 'CONFIRM') {
    restoreConfirmError.value = true
    return
  }

  try {
    restoringBackup.value = true
    await backupService.restoreBackup(selectedBackup.value)

    $q.notify({
      color: 'positive',
      message: '数据恢复成功'
    })

    showRestoreDialog.value = false
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: '数据恢复失败: ' + (error.message || '未知错误')
    })
  } finally {
    restoringBackup.value = false
  }
}

// 确认删除备份
const confirmDeleteBackup = (backup) => {
  selectedBackup.value = backup
  showDeleteDialog.value = true
}

// 删除备份
const deleteBackup = async () => {
  try {
    deletingBackup.value = true
    await backupService.deleteBackup(selectedBackup.value)

    // 从列表中移除
    const index = backups.value.findIndex(b => b.id === selectedBackup.value.id)
    if (index !== -1) {
      backups.value.splice(index, 1)
      pagination.value.rowsNumber--
    }

    $q.notify({
      color: 'positive',
      message: '备份删除成功'
    })

    showDeleteDialog.value = false
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: '备份删除失败: ' + (error.message || '未知错误')
    })
  } finally {
    deletingBackup.value = false
  }
}

// 查看备份详情
// const viewBackupDetail = (backup) => {
//   selectedBackup.value = backup
//   showBackupDetail.value = true
// }

// 初始化
onMounted(() => {
  fetchBackups()
})
</script>

<style scoped>
.backup-options {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}
</style>
