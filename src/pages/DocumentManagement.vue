<template>
  <q-page class="q-pa-md">
    <!-- 页面标题和操作区 -->
    <div class="col-12 flex flex-wrap justify-between items-center mb-4 gap-4">
      <div>
        <h4 class="text-h4 text-weight-bold text-grey-8 q-mb-xs">文档管理</h4>
        <p class="text-grey-5 text-sm">管理和组织您的所有文档和文件</p>
      </div>

      <div class="col-12 flex-col flex-wrap justify-between items-center gap-4">
        <div class="flex items-center gap-2">
          <q-input v-model="searchQuery" placeholder="搜索文件和文件夹..." outlined dense class="w-full md:w-64 lg:w-80"
            @input="handleSearch">
            <template v-slot:prepend>
              <q-icon name="search" />
            </template>
          </q-input>

          <div class="flex items-center gap-2">
            <q-select v-model="sortBy" :options="sortOptions" label="排序方式" outlined dense class="w-36"
              @update:model-value="handleSortChange" />
            <q-toggle v-model="isGridView" color="primary" label="网格视图" @update:model-value="handleViewChange" />
          </div>
        </div>

        <div v-if="selectedDocuments.length > 0"
          class="flex items-center justify-center gap-3 py-2 px-4 bg-grey-2 rounded-lg">
          <q-badge color="primary" :label="`已选择 ${selectedDocuments.length} 项`" class="mx-1" />
          <q-btn label="批量删除" color="negative" icon="delete" size="sm" @click="confirmBulkDelete"
            :loading="bulkActionLoading" class="mx-1" />
          <q-btn label="移动到分类" color="secondary" icon="folder_move" size="sm" @click="showBulkMoveDialog = true"
            :loading="bulkActionLoading" class="mx-1" />
          <q-btn label="取消选择" color="grey" size="sm" @click="selectedDocuments = []" class="mx-1" />
        </div>
      </div>

      <div class="flex flex-wrap gap-2">
        <q-btn-group>
          <q-btn label="上传文档" color="primary" icon="cloud_upload"
            class="shadow-md transition-all duration-300 hover:shadow-lg" @click="showUploadDialog = true"
            :loading="uploadLoading" />
          <q-btn label="新建分类" color="secondary" icon="create_new_folder"
            class="shadow-md transition-all duration-300 hover:shadow-lg" @click="showNewCategoryDialog = true"
            :loading="categoryActionLoading" />
        </q-btn-group>
      </div>
    </div>

    <div class="row col-12">
      <!-- 左侧分类 -->
      <div class="col-2 q-gutter-md">
        <div v-if="!loadingCategories && categories.length > 0">
          <q-card class="shadow-md h-full">
            <q-card-section class="p-0">
              <q-list bordered>
                <q-item clickable active-class="bg-primary/10 text-primary" :active="currentCategory === 'all'"
                  @click="currentCategory = 'all'">
                  <q-item-section avatar>
                    <q-icon name="folder" />
                  </q-item-section>
                  <q-item-section>所有文档</q-item-section>
                  <q-item-section side>
                    <q-badge color="grey-4" :label="documents.length" />
                  </q-item-section>
                </q-item>

                <q-item v-for="category in categories" :key="category.id" clickable
                  active-class="bg-primary/10 text-primary" :active="currentCategory === category.id"
                  @click="currentCategory = category.id">
                  <q-item-section avatar>
                    <q-icon name="folder" color="blue" />
                  </q-item-section>
                  <q-item-section>{{ category.name }}</q-item-section>
                  <q-item-section side>
                    <q-badge color="grey-4" :label="getCategoryDocumentCount(category.id)" />
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card-section>
          </q-card>
        </div>

        <div v-if="loadingCategories">
          <q-card class="shadow-md h-full">
            <q-card-section class="flex justify-center p-6">
              <q-spinner-dots color="primary" size="30px" />
            </q-card-section>
          </q-card>
        </div>

        <div v-if="!loadingCategories && categories.length === 0">
          <q-card class="shadow-md h-full">
            <q-card-section class="p-6 text-center">
              <q-icon name="category" size="48px" color="grey-3" class="mb-4" />
              <p class="text-grey-500 mb-4">暂无分类</p>
              <q-btn label="新建分类" color="secondary" icon="add" size="sm" @click="showNewCategoryDialog = true" />
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- 右侧内容 -->
      <div class="col-10 q-gutter-md">
        <div v-if="loadingDocuments" class="flex justify-center p-8">
          <q-spinner-dots color="primary" size="50px" />
        </div>

        <div v-if="!loadingDocuments && filteredAndSortedDocuments.length === 0" class="col-12 text-center p-8">
          <q-icon name="folder_open" size="64px" color="grey-3" class="mb-4" />
          <h5 class="text-grey-500 mb-2">没有找到文档</h5>
          <p class="text-grey-400 mb-6">尝试调整筛选条件或上传新文档</p>
          <q-btn label="上传文档" color="primary" icon="cloud_upload" @click="showUploadDialog = true" />
        </div>

        <!-- 网格视图 -->
        <div v-if="isGridView && !loadingDocuments && filteredAndSortedDocuments.length > 0" class="row col-12">
          <div v-for="(doc) in filteredAndSortedDocuments" :key="doc.id" class="col-3">
            <q-card flat bordered
              class="transition-transform duration-200 hover:-translate-y-1 hover:shadow-xl cursor-pointer"
              :class="{ 'ring-2 ring-primary': selectedDocuments.includes(doc.id) }" @dblclick="previewDocument(doc)"
              tabindex="0" @keydown.enter.prevent="previewDocument(doc)">

              <q-card-section class="q-pb-none">
                <div class="w-16 h-16 flex items-center justify-center rounded-lg"
                  :class="getFileIconClass(doc.file_extension)">
                  <q-img v-if="isImageType(doc.file_extension) && doc.file" :src="doc.file" style="height: 128px;"
                    fit="cover" ratio="16/9" />
                  <q-icon v-else :name="getFileIcon(doc.file_extension)" size="128px" />
                </div>
              </q-card-section>

              <q-card-section class="q-pt-sm q-pb-sm text-center">
                <div class="text-truncate">{{ doc.title }}</div>
                <div class="text-xs text-grey-6 mt-1">{{ doc.category_name || '未分类' }}</div>
                <div class="text-xs text-grey-5 mt-1">
                  {{ formatSize(doc.file_size) }} • {{ formatDate(doc.created_at) }}
                </div>

                <div class="flex justify-center gap-4 mt-2">
                  <q-btn dense flat icon="visibility" @click="previewDocument(doc)" />
                  <q-btn dense flat icon="download" @click="downloadClick(doc)" />
                  <q-btn dense flat icon="edit" @click="editDocument(doc)" />
                  <q-btn dense flat icon="delete" color="negative" @click="confirmDeleteDocument(doc)" />
                </div>

                <!--<q-checkbox v-model="selectedDocuments" :val="doc.id" class="absolute top-2 left-2 z-10" @click.stop />-->
              </q-card-section>
            </q-card>
          </div>
        </div>

        <!-- 列表视图 -->
        <div v-else-if="!isGridView && !loadingDocuments && filteredAndSortedDocuments.length > 0">
          <q-table :rows="filteredAndSortedDocuments" :columns="tableColumns" row-key="id" dense wrap-cells
            :loading="loadingDocuments" selection="multiple" v-model:selected="selectedDocuments">
            <template v-slot:body="props">
              <q-tr :props="props">
                <q-td>
                  <q-toggle v-model="props.selected" :val="props.row.id" />
                </q-td>
                <q-td key="title">
                  <span class="cursor-pointer text-primary" @click="previewDocument(props.row)">{{ props.row.title
                  }}</span>
                </q-td>
                <q-td key="cat">{{ props.row.category_name || '未分类' }}</q-td>
                <q-td key="desc" wrap-cells style="max-width: 240px;">
                  <span v-if="props.row.description">
                    {{ props.row.description }}
                    <q-tooltip>{{ props.row.description }}</q-tooltip>
                  </span>
                  <span v-else>-</span>
                </q-td>
                <q-td key="size">{{ formatSize(props.row.file_size) }}</q-td>
                <q-td key="date">{{ formatDate(props.row.created_at) }}</q-td>
                <q-td key="act" align="right">
                  <q-btn dense flat icon="visibility" @click="previewDocument(props.row)" />
                  <q-btn dense flat icon="download" @click="downloadClick(props.row)" />
                  <q-btn dense flat icon="edit" @click="editDocument(props.row)" />
                  <q-btn dense flat icon="delete" color="negative" @click="confirmDeleteDocument(props.row)" />
                </q-td>
              </q-tr>
            </template>
          </q-table>
        </div>
      </div>
    </div>

    <!-- 上传对话框 -->
    <q-dialog v-model="showUploadDialog">
      <q-card style="width: 500px;">
        <q-card-section>
          <h5 class="text-h5">上传文档</h5>
          <q-select v-model="uploadCategory" :options="categories" option-label="name" option-value="id" label="分类*"
            class="mt-4" />
          <q-input v-model="uploadForm.title" label="标题" class="mt-4" />
          <q-input v-model="uploadForm.description" label="描述" type="textarea" rows="2" class="mt-4" />
          <q-uploader ref="uploaderRef" label="选择文件" :max-files="5" class="mt-4" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn label="取消" @click="handleCancelUpload" />
          <q-btn label="上传" color="primary" @click="handleFileUpload" :loading="uploadLoading" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 新建分类 -->
    <q-dialog v-model="showNewCategoryDialog">
      <q-card style="width: 400px;">
        <q-card-section>
          <h5 class="text-h5">新建分类</h5>
          <q-input v-model="categoryForm.name" label="名称*" class="mt-4" />
          <q-input v-model="categoryForm.description" label="描述" class="mt-4" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn label="取消" @click="showNewCategoryDialog = false" />
          <q-btn label="创建" color="primary" @click="handleCreateCategory" :loading="categoryActionLoading" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 批量移动 -->
    <q-dialog v-model="showBulkMoveDialog">
      <q-card style="width: 400px;">
        <q-card-section>
          <h5 class="text-h5">批量移动</h5>
          <q-select v-model="bulkMoveCategory" :options="categories" option-label="name" label="目标分类" class="mt-2" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn label="取消" @click="showBulkMoveDialog = false" />
          <q-btn label="移动" color="primary" @click="handleBulkMove" :loading="bulkActionLoading" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 重命名 -->
    <q-dialog v-model="showRenameDialog">
      <q-card>
        <q-card-section>
          <h5 class="text-h5">编辑文档</h5>
          <q-input v-model="renamedItem.title" label="标题" class="mt-4" />
          <q-input v-model="renamedItem.description" label="描述" type="textarea" rows="2" class="mt-4" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn label="取消" @click="showRenameDialog = false" />
          <q-btn label="保存" color="primary" @click="confirmRename" :loading="renameLoading" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 删除确认 -->
    <q-dialog v-model="showDeleteDialog">
      <q-card>
        <q-card-section>
          <span class="text-h6">确认删除</span>
        </q-card-section>
        <q-card-section>
          <p>确定删除《{{ documentToDelete?.title }}》？此操作不可撤销。</p>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="取消" v-close-popup />
          <q-btn color="negative" label="删除" @click="handleDeleteConfirmed" :loading="deleteLoading" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 批量删除 -->
    <q-dialog v-model="showBulkDeleteDialog">
      <q-card>
        <q-card-section>
          <span class="text-h6">批量删除确认</span>
        </q-card-section>
        <q-card-section>
          <p>确定删除 {{ selectedDocuments.length }} 个文档？</p>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="取消" v-close-popup />
          <q-btn color="negative" label="删除" @click="handleBulkDeleteConfirmed" :loading="bulkActionLoading" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 预览 -->
    <q-dialog v-model="previewDialog.show">
      <q-card style="max-width:90vw;max-height:90vh;">
        <q-card-section class="p-0">
          <img :src="previewDialog.fileUrl" style="max-width:100%;max-height:70vh;" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn label="关闭" @click="previewDialog.show = false" />
          <q-btn label="下载" color="primary" @click="downloadClick(previewDialog.document)" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 下载二次验证 -->
    <q-dialog v-model="showDownloadVerifyDialog">
      <q-card style="width:450px;">
        <q-card-section>
          <div class="text-h6">安全验证</div>
          <p class="text-grey-7">请输入登录密码以确认下载</p>
        </q-card-section>
        <q-card-section>
          <q-input v-model="verifyPassword" label="密码" type="password" outlined dense required />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="取消" @click="resetVerify" />
          <q-btn color="primary" label="确认下载" @click="submitDownloadVerify" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import { format, parseISO } from 'date-fns'
import {
  getCategories,
  getAllDocuments,
  createCategory,
  uploadDocument,
  updateDocument,
  deleteDocument,
  verifyPasswordBeforeDownload
} from 'src/services/documentServiceApi'


const $q = useQuasar()


// ==============================================
// 一、基础状态
// ==============================================
const currentCategory = ref('all')
const categories = ref([])
const documents = ref([])
const isGridView = ref(false)
const selectedDocuments = ref([])

const showUploadDialog = ref(false)
const showNewCategoryDialog = ref(false)
const showDeleteDialog = ref(false)
const showBulkDeleteDialog = ref(false)
const showBulkMoveDialog = ref(false)
const showRenameDialog = ref(false)
const previewDialog = ref({ show: false, fileUrl: '', fileName: '', document: null })

const loadingCategories = ref(false)
const loadingDocuments = ref(false)
const uploadLoading = ref(false)
const categoryActionLoading = ref(false)
const deleteLoading = ref(false)
const renameLoading = ref(false)
const bulkActionLoading = ref(false)

// ==============================================
// 二、搜索 / 排序 / 筛选
// ==============================================
const searchQuery = ref('')
const sortBy = ref('modified-desc')
const sortOptions = [
  { label: '名称 A-Z', value: 'name-asc' },
  { label: '名称 Z-A', value: 'name-desc' },
  { label: '最新', value: 'modified-desc' },
  { label: '最早', value: 'modified-asc' },
  { label: '大小 ↑', value: 'size-asc' },
  { label: '大小 ↓', value: 'size-desc' }
]

const tableColumns = [
  { name: 'title', label: '标题', field: 'title', sortable: true },
  { name: 'category', label: '分类', field: 'category_name' },
  { name: 'desc', label: '描述', field: 'description', width: '240px' },
  { name: 'size', label: '大小', field: 'file_size' },
  { name: 'time', label: '时间', field: 'created_at' },
  { name: 'act', label: '操作', field: 'actions', align: 'right' }
]

// ==============================================
// 三、表单
// ==============================================
const uploadCategory = ref('')
const uploadForm = ref({ title: '', description: '' })
const categoryForm = ref({ name: '', description: '' })
const renamedItem = ref({ title: '', description: '' })
const itemToRename = ref(null)
const documentToDelete = ref(null)
const bulkMoveCategory = ref('')
const uploaderRef = ref(null)

// ==============================================
// 四、工具函数
// ==============================================
const formatSize = (size) => {
  if (!size && size !== 0) return ''
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

const formatDate = (str) => str ? format(parseISO(str), 'yyyy-MM-dd HH:mm') : ''

const getFileIcon = (ext) => {
  if (!ext) return 'description'
  const t = ext.toLowerCase()
  if (t.includes('pdf')) return 'picture_as_pdf'
  if (t.includes('doc')) return 'article'
  if (t.includes('xls')) return 'grid_on'
  if (t.includes('jpg') || t.includes('png')) return 'image'
  return 'description'
}

const getFileIconClass = (ext) => {
  if (!ext) return 'bg-grey-1'
  const t = ext.toLowerCase()
  if (t.includes('pdf')) return 'bg-red-1'
  if (t.includes('doc')) return 'bg-blue-1'
  if (t.includes('xls')) return 'bg-green-1'
  if (t.includes('jpg') || t.includes('png')) return 'bg-purple-1'
  return 'bg-grey-1'
}

const isImageType = (ext) => {
  if (!ext) return false
  const exts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg']
  return exts.some(i => ext.toLowerCase().includes(i.replace('.', '')))
}

const guessMimeByExtension = (name) => {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  const map = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    pdf: 'application/pdf'
  }
  return map[ext] || ''
}

const getFileTypeFromUrl = async (url) => {
  try {
    const r = await fetch(url, { method: 'HEAD' })
    return r.headers.get('content-type')?.split(';')[0] || ''
  } catch {
    return ''
  }
}

const showNotification = (type, msg) => {
  $q.notify({ color: type, message: msg, position: 'top-right', timeout: 3000 })
}

// ==============================================
// 五、数据加载
// ==============================================
const fetchCategories = async () => {
  loadingCategories.value = true
  try {
    const res = await getCategories()
    categories.value = res.data.results
  } catch (error) {
    showNotification('negative', '加载分类失败: ' + (error.message || '未知错误'))
  } finally {
    loadingCategories.value = false
  }
}

const fetchAllDocuments = async () => {
  loadingDocuments.value = true
  try {
    const res = await getAllDocuments()
    documents.value = res.data.results
  } catch (error) {
    showNotification('negative', '加载文档失败: ' + (error.message || '未知错误'))
  } finally {
    loadingDocuments.value = false
  }
}

// ==============================================
// 六、文档操作
// ==============================================
const getCategoryDocumentCount = (id) => documents.value.filter(d => d.category === id).length

const handleSearch = (val) => searchQuery.value = val
const handleSortChange = (val) => sortBy.value = val
const handleViewChange = (val) => isGridView.value = val

const filteredAndSortedDocuments = computed(() => {
  let res = [...documents.value]
  if (currentCategory.value !== 'all') res = res.filter(d => d.category === currentCategory.value)
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    res = res.filter(d =>
      d.title.toLowerCase().includes(q) ||
      (d.description && d.description.toLowerCase().includes(q))
    )
  }
  switch (sortBy.value) {
    case 'name-asc':
      return res.sort((a, b) => a.title.localeCompare(b.title))
    case 'name-desc':
      return res.sort((a, b) => b.title.localeCompare(a.title))
    case 'modified-desc':
      return res.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    case 'modified-asc':
      return res.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    case 'size-asc':
      return res.sort((a, b) => a.file_size - b.file_size)
    case 'size-desc':
      return res.sort((a, b) => b.file_size - a.file_size)
    default:
      return res
  }
})

// ==============================================
// 七、上传 / 新建分类 / 编辑 / 删除
// ==============================================
const handleCancelUpload = () => {
  showUploadDialog.value = false
  uploadCategory.value = ''
  uploadForm.value = { title: '', description: '' }
  uploaderRef.value?.reset()
}

const handleFileUpload = async () => {
  if (!uploadCategory.value) return showNotification('negative', '请选分类')
  const files = uploaderRef.value?.files || []
  if (!files.length) return showNotification('negative', '请选文件')
  uploadLoading.value = true
  try {
    for (const f of files) {
      const fd = new FormData()
      fd.append('file', f)
      fd.append('category', uploadCategory.value.id)
      fd.append('title', uploadForm.value.title || f.name.split('.')[0])
      fd.append('description', uploadForm.value.description || '')
      await uploadDocument(fd)
    }
    showUploadDialog.value = false
    fetchAllDocuments()
    showNotification('positive', '上传成功')
  } catch (error) {
    showNotification('negative', '上传失败: ' + (error.message || '未知错误'))
  } finally {
    uploadLoading.value = false
  }
}

const handleCreateCategory = async () => {
  if (!categoryForm.value.name) return
  categoryActionLoading.value = true
  try {
    await createCategory(categoryForm.value)
    showNewCategoryDialog.value = false
    categoryForm.value = { name: '', description: '' }
    fetchCategories()
    showNotification('positive', '创建成功')
  } catch (error) {
    showNotification('negative', '创建失败: ' + (error.message || '未知错误'))
  } finally {
    categoryActionLoading.value = false
  }
}

const confirmDeleteDocument = (doc) => {
  documentToDelete.value = doc
  showDeleteDialog.value = true
}

const handleDeleteConfirmed = async () => {
  if (!documentToDelete.value) return
  deleteLoading.value = true
  try {
    await deleteDocument(documentToDelete.value.id)
    documents.value = documents.value.filter(d => d.id !== documentToDelete.value.id)
    showNotification('positive', '删除成功')
  } catch (error) {
    showNotification('negative', '删除失败: ' + (error.message || '未知错误'))
  } finally {
    showDeleteDialog.value = false
    deleteLoading.value = false
  }
}

const editDocument = (doc) => {
  itemToRename.value = doc
  renamedItem.value = { title: doc.title, description: doc.description }
  showRenameDialog.value = true
}

const confirmRename = async () => {
  if (!renamedItem.value.title) return
  renameLoading.value = true
  try {
    await updateDocument(itemToRename.value.id, renamedItem.value)
    const i = documents.value.findIndex(d => d.id === itemToRename.value.id)
    if (i !== -1) {
      documents.value[i].title = renamedItem.value.title
      documents.value[i].description = renamedItem.value.description
    }
    showRenameDialog.value = false
    showNotification('positive', '保存成功')
  } catch (error) {
    showNotification('negative', '保存失败: ' + (error.message || '未知错误'))
  } finally {
    renameLoading.value = false
  }
}

const previewDocument = async (doc) => {
  if (!doc.file) return showNotification('negative', '无文件')
  // 检查是否为私人文档
  if (doc.category_name === '私人文档')
    return showNotification('negative', '私人文档不能预览，只能下载！')
  const ft = await getFileTypeFromUrl(doc.file) || guessMimeByExtension(doc.file)
  if (ft.startsWith('image/')) {
    previewDialog.value = { show: true, fileUrl: doc.file, document: doc }
  } else if (ft === 'application/pdf') {
    window.open(doc.file, '_blank')
  } else {
    downloadClick(doc)
  }
}

// ==============================================
// 八、批量操作
// ==============================================
const confirmBulkDelete = () => showBulkDeleteDialog.value = true

const handleBulkDeleteConfirmed = async () => {
  bulkActionLoading.value = true
  try {
    for (const id of selectedDocuments.value) await deleteDocument(id)
    documents.value = documents.value.filter(d => !selectedDocuments.value.includes(d.id))
    selectedDocuments.value = []
    showNotification('positive', '批量删除成功')
  } catch (error) {
    showNotification('negative', '批量删除失败: ' + (error.message || '未知错误'))
  } finally {
    bulkActionLoading.value = false
    showBulkDeleteDialog.value = false
  }
}

const handleBulkMove = async () => {
  if (!bulkMoveCategory.value) return
  bulkActionLoading.value = true
  try {
    for (const id of selectedDocuments.value) {
      await updateDocument(id, { category: bulkMoveCategory.value })
    }
    fetchAllDocuments()
    selectedDocuments.value = []
    showNotification('positive', '移动成功')
  } catch (error) {
    showNotification('negative', '移动失败: ' + (error.message || '未知错误'))
  } finally {
    bulkActionLoading.value = false
    showBulkMoveDialog.value = false
  }
}

// ==============================================
// 九、下载二次密码验证（核心功能）
// ==============================================
const showDownloadVerifyDialog = ref(false)
const verifyPassword = ref('')
const waitingDownloadItem = ref(null)

const openDownloadVerify = (item) => {
  waitingDownloadItem.value = item
  verifyPassword.value = ''
  showDownloadVerifyDialog.value = true
}

const resetVerify = () => {
  verifyPassword.value = ''
  waitingDownloadItem.value = null
  showDownloadVerifyDialog.value = false
}

const submitDownloadVerify = async () => {
  try {
    const res = await verifyPasswordBeforeDownload({
      document_id: waitingDownloadItem.value.id,
      password: verifyPassword.value
    })

    if (!res.data?.success) throw new Error(res.data?.error || '验证失败')
    if (!res.data?.download_token) throw new Error('无下载凭证')
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
    const token = res.data.download_token
    const url = `${API_BASE_URL}/docs/documents/${waitingDownloadItem.value.id}/download/?token=${token}`

    const a = document.createElement('a')
    a.target = '_blank'
    a.href = url
    a.download = waitingDownloadItem.value.title
    document.body.appendChild(a)
    a.click()
    a.remove()

    showDownloadVerifyDialog.value = false
    showNotification('positive', '开始下载')
  } catch (error) {
    showNotification('negative', '验证失败：' + (error.message || '未知错误'))
  }
}

const downloadClick = (item) => openDownloadVerify(item)

// ==============================================
// 初始化
// ==============================================
onMounted(() => {
  fetchCategories()
  fetchAllDocuments()
})

watch(currentCategory, () => selectedDocuments.value = [])
</script>

<style scoped>
/* 自定义样式 */
</style>
