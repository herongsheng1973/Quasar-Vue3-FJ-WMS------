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
        <q-table :rows="backups" :columns="columns" row-key="id" :loading="loading" v-model:pagination="pagination"
          :rows-per-page-options="[10, 20, 50]" @request="onRequest" wrap-cells>
          <template v-slot:body-cell-index="props">
            <q-td :props="props">
              <q-badge color="primary">
                {{ (pagination.page - 1) * pagination.rowsPerPage + props.pageIndex + 1 }}
              </q-badge>
            </q-td>
          </template>
          <!-- 备份状态列自定义渲染 -->
          <template v-slot:body-cell-status="props">
            <q-td :props="props">
              <q-chip
                :color="props.row.status === 'success' ? 'positive' : props.row.status === 'pending' ? 'warning' : 'negative'"
                text-color="white" dense>
                {{ props.row.status === 'success' ? '成功' : props.row.status === 'pending' ? '待执行' : '失败' }}
              </q-chip>
            </q-td>
          </template>

          <!-- 文件大小列直接使用后端格式化值 -->
          <template v-slot:body-cell-file_size="props">
            <q-td :props="props">
              {{ props.row.file_size_human }}
            </q-td>
          </template>

          <!-- 操作列 -->
          <template v-slot:body-cell-actions="props">
            <q-td :props="props" class="text-center">
              <!-- 仅成功的备份可下载/恢复 -->
              <q-btn size="sm" color="primary" icon="cloud_download" flat round @click="downloadBackup(props.row)"
                :loading="downloadingBackupId === props.row.id" :disabled="props.row.status !== 'success'">
                <q-tooltip>下载</q-tooltip>
              </q-btn>
              <q-btn size="sm" color="secondary" icon="settings_backup_restore" flat round
                @click="confirmRestoreBackup(props.row)" class="q-ml-xs" :disabled="props.row.status !== 'success'">
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
            您确定要从备份 <strong>{{ selectedBackup.filename }}</strong> 恢复数据吗？
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
            您确定要删除备份文件 <strong>{{ selectedBackup.filename }}</strong> 吗？
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
                <q-item-label>{{ selectedBackup.filename }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                <q-item-label caption>创建人</q-item-label>
                <q-item-label>{{ selectedBackup.created_by_username }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                <q-item-label caption>创建时间</q-item-label>
                <q-item-label>{{ selectedBackup.created_at_format }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                <q-item-label caption>完成时间</q-item-label>
                <q-item-label>{{ selectedBackup.completed_at_format || '未完成' }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                <q-item-label caption>文件大小</q-item-label>
                <q-item-label>{{ selectedBackup.file_size_human }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                <q-item-label caption>备份状态</q-item-label>
                <q-item-label>
                  <q-chip
                    :color="selectedBackup.status === 'success' ? 'positive' : selectedBackup.status === 'pending' ? 'warning' : 'negative'"
                    text-color="white" dense>
                    {{ selectedBackup.status === 'success' ? '成功' : selectedBackup.status === 'pending' ? '待执行' : '失败'
                    }}
                  </q-chip>
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-item v-if="selectedBackup.error_msg">
              <q-item-section>
                <q-item-label caption>错误信息</q-item-label>
                <q-item-label class="text-negative">{{ selectedBackup.error_msg }}</q-item-label>
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

const $q = useQuasar()
import { downloadDbBackup, deleteDbBackup, createDbBackup, restoreDbBackup, getDbBackupList } from '../services/backupServiceApi'

// ===================== 状态管理 =====================
// 保持原有状态不变
const backups = ref([])
const loading = ref(false)
const pagination = ref({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
  sortBy: 'created_at',
  descending: true
})
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
const backupOptions = ref({
  includeData: true,
  includeSchema: true,
  compress: true
})

// 表格列配置（保持不变）
const columns = [
  { name: "index", label: '序号', field: 'index', align: 'center', width: '80px' },
  {
    name: 'filename',
    label: '备份文件名',
    field: 'filename',
    align: 'left',
    sortable: true
  },
  {
    name: 'created_at_format',
    label: '创建时间',
    field: 'created_at_format',
    align: 'left',
    sortable: true
  },
  {
    name: 'created_by_username',
    label: '创建人',
    field: 'created_by_username',
    align: 'left',
    sortable: true
  },
  {
    name: 'status',
    label: '备份状态',
    field: 'status',
    align: 'center',
    sortable: true
  },
  {
    name: 'file_size',
    label: '文件大小',
    field: 'file_size',
    align: 'right',
    sortable: true
  },
  {
    name: 'actions',
    label: '操作',
    align: 'center'
  }
]

// ===================== 接口方法 =====================
// 获取备份列表（保持不变）
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
    const response = await getDbBackupList(params)
    console.log(response.data)
    backups.value = response.data.results || []
    pagination.value.rowsNumber = response.data.total || 0
    pagination.value.total = response.data.total || 0
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: '获取备份列表失败: ' + error.message
    })
  } finally {
    loading.value = false
  }
}

// 创建备份（保持不变）
const createBackup = async () => {
  try {
    creatingBackup.value = true
    backupProgress.value = 0
    const progressInterval = setInterval(() => {
      if (backupProgress.value < 95) {
        backupProgress.value += 5
      }
    }, 150)
    await createDbBackup(backupOptions.value)
    clearInterval(progressInterval)
    backupProgress.value = 100
    await fetchBackups()
    $q.notify({
      color: 'positive',
      message: '备份创建请求已提交，稍后刷新查看结果'
    })
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: '备份创建失败: ' + error.message
    })
  } finally {
    setTimeout(() => {
      creatingBackup.value = false
      backupProgress.value = 0
    }, 1000)
  }
}

// 通用下载工具函数（优化版）
// const handleFileDownload = (blobData, filename) => {
//   try {
//     if (!blobData) throw new Error('文件数据为空')
//     const blob = new Blob([blobData])
//     const url = URL.createObjectURL(blob)
//     const a = document.createElement('a')
//     a.href = url
//     a.download = filename || 'backup.tar.gz'
//     document.body.appendChild(a)
//     a.click()
//     setTimeout(() => {
//       document.body.removeChild(a)
//       URL.revokeObjectURL(url)
//     }, 200)
//     return true
//   } catch (err) {
//     console.error('下载处理失败：', err)
//     throw new Error('文件下载失败，请重试')
//   }
// }

// 下载备份（最终稳定版）
const downloadBackup = async (backup) => {
  try {
    downloadingBackupId.value = backup.id

    // ⚠️ 现在直接返回 { blob, filename }
    const { blob, filename } = await downloadDbBackup(backup.id)

    // 直接下载
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)

    $q.notify({ color: 'positive', message: '下载成功' })
  } catch (error) {
    console.error('下载失败：', error)
    $q.notify({ color: 'negative', message: '下载失败' })
  } finally {
    downloadingBackupId.value = null
  }
}

// 恢复备份（保持不变）
const restoreBackup = async () => {
  if (restoreConfirmText.value !== 'CONFIRM') {
    restoreConfirmError.value = true
    return
  }

  try {
    restoringBackup.value = true
    await restoreDbBackup(selectedBackup.value.id)
    $q.notify({
      color: 'positive',
      message: '数据恢复请求已提交，请等待完成'
    })
    showRestoreDialog.value = false
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: '数据恢复失败: ' + error.message
    })
  } finally {
    restoringBackup.value = false
  }
}

// 删除备份（保持不变）
const deleteBackup = async () => {
  try {
    deletingBackup.value = true
    await deleteDbBackup(selectedBackup.value.id)
    await fetchBackups()
    $q.notify({
      color: 'positive',
      message: '备份删除成功'
    })
    showDeleteDialog.value = false
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: '备份删除失败: ' + error.message
    })
  } finally {
    deletingBackup.value = false
  }
}

// ===================== 事件处理 =====================
const onRequest = (props) => {
  fetchBackups(props)
}

const confirmRestoreBackup = (backup) => {
  selectedBackup.value = backup
  restoreConfirmText.value = ''
  restoreConfirmError.value = false
  showRestoreDialog.value = true
}

const confirmDeleteBackup = (backup) => {
  selectedBackup.value = backup
  showDeleteDialog.value = true
}

// ===================== 初始化 =====================
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
