<!-- src/pages/SystemSettingsManagement.vue -->
<template>
  <q-page class="row q-pa-md">
    <!-- 页面标题和操作按钮 -->
    <div class="col-12 flex justify-between items-center mb-4">
      <h1 class="text-h5">系统设置管理</h1>
      <div class="flex gap-2">
        <q-btn label="批量更新" color="primary" @click="batchUpdateSettings" icon="save" />
        <q-btn label="恢复默认" color="secondary" @click="confirmRestoreDefaults" icon="refresh" />
      </div>
    </div>

    <!-- 设置搜索区域 -->
    <div class="col-12 q-pa-md bg-white rounded-borders shadow-sm mb-4">
      <q-form class="row gap-4">
        <q-input v-model="searchQuery" label="搜索设置项（名称/键）" class="col-md-4" @keyup.enter="fetchSettings"
          style="margin-left: 24px;">
          <template #append>
            <q-icon name="search" />
          </template>
        </q-input>

        <q-select v-model="filterGroup" label="设置分组" class="col-md-2" :options="groupOptions" option-label="label"
          option-value="value" clearable @update:model-value="fetchSettings" style="margin-left: 24px;" />

        <div class="col-md-2 flex items-end gap-2" style="margin-left: 24px;">
          <q-btn label="重置" color="secondary" @click="resetFilters" style="width: 120px;margin-right: 12px;" />
          <q-btn label="搜索" color="primary" @click="fetchSettings" style="width: 120px;" />
        </div>
      </q-form>
    </div>

    <!-- 设置列表 -->
    <div class="col-12 bg-white rounded-borders shadow-sm">
      <q-table :rows="settings" :columns="columns" row-key="id" :loading="loading" v-model:pagination="pagination"
        :rows-per-page-options="[10, 20, 50, 100]" @request="onRequest">
        <template v-slot:body-cell-value="props">
          <q-td :props="props">
            <q-input v-model="props.row.value" :label="props.row.name" :type="getInputType(props.row.data_type)"
              :disabled="!props.row.editable" class="q-p-0" @blur="handleValueChange(props.row)" />
          </q-td>
        </template>

        <template v-slot:body-cell-editable="props">
          <q-td :props="props">
            <q-checkbox :model-value="props.row.editable" disable />
          </q-td>
        </template>
        <template v-slot:body-cell-actions="props">
          <q-td :props="props">
            <q-btn size="sm" color="primary" icon="edit" @click="openEditDialog(props.row)" class="q-mr-1"
              :disabled="!props.row.editable" />
          </q-td>
        </template>

        <template #no-data>
          <q-item>
            <q-item-section class="text-center">
              暂无系统设置数据
            </q-item-section>
          </q-item>
        </template>
      </q-table>
    </div>

    <!-- 编辑设置对话框 -->
    <q-dialog v-model="editDialogVisible">
      <q-card class="q-w-full q-mt-md" style="width: 400px; max-width: 600px;">
        <q-card-section>
          <h5 class="text-h5">{{ isEditMode ? '编辑设置' : '新增设置' }}</h5>
          <q-form ref="editForm" class="q-pa-md" @submit="saveSetting">
            <q-input v-model="formData.name" label="设置名称" required :error="!!formErrors.name"
              @blur="validateNameError" />

            <q-input v-model="formData.key" label="设置键名" required :disabled="isEditMode" :error="!!formErrors.key"
              @blur="validateKeyError" />

            <q-select v-model="formData.group" label="设置分组" required :error="!!formErrors.group" :options="groupOptions"
              option-label="label" option-value="value" emit-value map-options />

            <q-select v-model="formData.data_type" label="数据类型" required :error="!!formErrors.data_type" :options="[
              { label: '文本', value: 'string' },
              { label: '数字', value: 'number' },
              { label: '布尔值', value: 'boolean' },
              { label: '多行文本', value: 'text' }
            ]" option-label="label" option-value="value" emit-value map-options />

            <component :is="getInputComponent(formData.data_type)" v-model="formData.value" :label="`设置值（${formData.data_type === 'string' ? '文本' :
              formData.data_type === 'number' ? '数字' :
                formData.data_type === 'boolean' ? '布尔值' : '多行文本'}）`" :error="!!formErrors.value" />

            <q-input v-model="formData.description" label="描述" type="textarea" rows="2" />

            <q-checkbox v-model="formData.editable" label="允许编辑" :checked="true" />

            <div class="row q-mt-md">
              <q-btn label="取消" color="secondary" @click="closeEditDialog" class="col-5" />
              <q-btn label="保存" color="primary" type="submit" class="col-5 offset-2" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- 恢复默认确认对话框 -->
    <q-dialog v-model="restoreDialogVisible">
      <q-card class="q-w-full q-mt-md" style="max-width: 400px;">
        <q-card-section>
          <h5 class="text-h5 text-negative">⚠️ 确认恢复默认设置</h5>
          <p class="mt-2">此操作将把所有系统设置恢复为默认值，当前设置将被覆盖，是否继续？</p>

          <div class="row q-mt-md">
            <q-btn label="取消" color="secondary" @click="restoreDialogVisible = false" class="col-5" />
            <q-btn label="确认恢复" color="negative" @click="handleRestoreDefaults" class="col-5 offset-2" />
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useQuasar } from 'quasar'
// import { format } from 'date-fns'

// 导入API
import {
  getSystemSettings,
  updateSystemSetting,
  batchUpdateSystemSettings,
  createSystemSetting,
  // deleteSystemSetting,
  restoreDefaultSettings
} from 'src/services/settingsServiceApi'

const $q = useQuasar()

// 状态变量
const settings = ref([])
const loading = ref(false)

// 搜索和过滤条件
const searchQuery = ref('')
const filterGroup = ref(null)
const editForm = ref(null)

// 分页配置
const pagination = ref({
  page: 1,
  rowsPerPage: 10,
  sortBy: 'group',
  descending: false,
})

// 对话框状态
const editDialogVisible = ref(false)
const restoreDialogVisible = ref(false)

// 表单数据
const formData = reactive({
  name: '',
  key: '',
  group: '',
  data_type: 'string',
  value: '',
  description: '',
  editable: true
})

// 表单错误
const formErrors = reactive({
  name: '',
  key: '',
  group: '',
  data_type: '',
  value: ''
})

// 编辑模式标识
const isEditMode = ref(false)
const currentSettingId = ref(null)

// 设置分组选项
const groupOptions = ref([
  { label: '基础设置', value: 'basic' },
  { label: '显示设置', value: 'display' },
  { label: '安全设置', value: 'security' },
  { label: '通知设置', value: 'notification' },
  { label: '数据设置', value: 'data' }
])

// 表格列配置
const columns = [
  { name: 'name', label: '设置名称', field: 'name', sortable: true },
  { name: 'key', label: '设置键名', field: 'key', sortable: true },
  { name: 'group', label: '设置分组', field: row => getGroupName(row.group), sortable: true },
  { name: 'value', label: '设置值', field: 'value' },
  { name: 'data_type', label: '数据类型', field: 'data_type', sortable: true },
  { name: 'editable', label: '可编辑', field: 'editable', sortable: true },
  { name: 'updated_at', label: '更新时间', field: 'updated_at', sortable: true },
  { name: 'actions', label: '操作', align: 'center' }
]

// 初始化
onMounted(() => {
  fetchSettings()
})

// 获取设置分组名称
const getGroupName = (groupValue) => {
  const group = groupOptions.value.find(g => g.value === groupValue)
  return group ? group.label : groupValue
}

// 根据数据类型获取输入组件
const getInputType = (dataType) => {
  switch (dataType) {
    case 'number': return 'number'
    case 'boolean': return 'checkbox'
    case 'text': return 'textarea'
    default: return 'text'
  }
}

// 动态输入组件
const getInputComponent = (dataType) => {
  switch (dataType) {
    case 'boolean':
      return {
        template: `<q-checkbox v-model="modelValue" :label="label" />`,
        props: ['modelValue', 'label'],
        emits: ['update:modelValue']
      }
    case 'number':
      return {
        template: `<q-input v-model.number="modelValue" :label="label" type="number" />`,
        props: ['modelValue', 'label'],
        emits: ['update:modelValue']
      }
    case 'text':
      return {
        template: `<q-input v-model="modelValue" :label="label" type="textarea" rows="4" />`,
        props: ['modelValue', 'label'],
        emits: ['update:modelValue']
      }
    default:
      return {
        template: `<q-input v-model="modelValue" :label="label" />`,
        props: ['modelValue', 'label'],
        emits: ['update:modelValue']
      }
  }
}

// 验证方法
const validateNameError = () => {
  if (!formData.name.trim()) {
    formErrors.name = '设置名称不能为空'
  } else {
    formErrors.name = ''
  }
}

const validateKeyError = () => {
  if (!formData.key.trim()) {
    formErrors.key = '设置键名不能为空'
  } else if (!/^[a-zA-Z_]+$/.test(formData.key)) {
    formErrors.key = '键名只能包含字母和下划线'
  } else {
    formErrors.key = ''
  }
}

// 获取系统设置列表
const fetchSettings = async () => {
  try {
    loading.value = true
    const params = new URLSearchParams()
    params.append('page', pagination.value.page)
    params.append('page_size', pagination.value.rowsPerPage)

    if (pagination.value.sortBy) {
      params.append('ordering', pagination.value.descending ? `-${pagination.value.sortBy}` : pagination.value.sortBy)
    }

    if (searchQuery.value) params.append('search', searchQuery.value)
    if (filterGroup.value) params.append('group', filterGroup.value)

    const response = await getSystemSettings(params)
    settings.value = response.data.results
    pagination.value.rowsNumber = response.data.count
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: '获取系统设置失败: ' + (error.response?.data?.message || error.message)
    })
  } finally {
    loading.value = false
  }
}

// 处理表格请求
const onRequest = (props) => {
  pagination.value = {
    ...pagination.value,
    page: props.pagination.page,
    rowsPerPage: props.pagination.rowsPerPage,
    sortBy: props.pagination.sortBy,
    descending: props.pagination.descending
  }
  fetchSettings()
}

// 打开编辑对话框
const openEditDialog = (setting = null) => {
  // 重置表单
  Object.keys(formData).forEach(key => {
    formData[key] = key === 'editable' ? true : key === 'data_type' ? 'string' : ''
  })

  // 重置错误状态
  Object.keys(formErrors).forEach(key => {
    formErrors[key] = ''
  })

  if (setting) {
    // 编辑模式
    isEditMode.value = true
    currentSettingId.value = setting.id
    formData.name = setting.name
    formData.key = setting.key
    formData.group = setting.group
    formData.data_type = setting.data_type
    formData.value = setting.value
    formData.description = setting.description || ''
    formData.editable = setting.editable
  } else {
    // 新增模式
    isEditMode.value = false
    currentSettingId.value = null
  }
  editDialogVisible.value = true
}

// 关闭编辑对话框
const closeEditDialog = () => {
  editDialogVisible.value = false
  if (editForm.value) {
    editForm.value.resetValidation()
  }
}

// 保存设置
const saveSetting = async () => {
  // 验证
  validateNameError()
  validateKeyError()

  if (!formData.group) formErrors.group = '请选择设置分组'
  else formErrors.group = ''

  if (!formData.data_type) formErrors.data_type = '请选择数据类型'
  else formErrors.data_type = ''

  const hasErrors = Object.values(formErrors).some(err => err)
  if (hasErrors) {
    $q.notify({ type: 'negative', message: '请检查输入的信息' })
    return
  }

  try {
    loading.value = true

    if (isEditMode.value) {
      // 更新设置
      await updateSystemSetting(currentSettingId.value, {
        name: formData.name,
        group: formData.group,
        data_type: formData.data_type,
        value: formData.value,
        description: formData.description,
        editable: formData.editable
      })

      $q.notify({ type: 'positive', message: '系统设置更新成功' })
    } else {
      // 创建新设置
      await createSystemSetting({
        name: formData.name,
        key: formData.key,
        group: formData.group,
        data_type: formData.data_type,
        value: formData.value,
        description: formData.description,
        editable: formData.editable
      })

      $q.notify({ type: 'positive', message: '系统设置创建成功' })
    }

    closeEditDialog()
    fetchSettings()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: (isEditMode.value ? '更新' : '创建') + '系统设置失败: ' +
        (error.response?.data?.message || error.response?.data?.non_field_errors?.[0] || error.message)
    })
  } finally {
    loading.value = false
  }
}

// 处理值变更
const handleValueChange = async (setting) => {
  try {
    await updateSystemSetting(setting.id, {
      value: setting.value
    })
    $q.notify({
      type: 'positive',
      message: '设置已更新',
      timeout: 1000
    })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: '更新失败: ' + (error.response?.data?.message || error.message)
    })
    // 恢复原始值
    fetchSettings()
  }
}

// 批量更新设置
const batchUpdateSettings = async () => {
  try {
    loading.value = true
    const updateData = settings.value
      .filter(setting => setting.editable)
      .map(setting => ({ id: setting.id, value: setting.value }))

    await batchUpdateSystemSettings(updateData)

    $q.notify({
      type: 'positive',
      message: '批量更新成功'
    })
    fetchSettings()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: '批量更新失败: ' + (error.response?.data?.message || error.message)
    })
  } finally {
    loading.value = false
  }
}

// 确认恢复默认设置
const confirmRestoreDefaults = () => {
  restoreDialogVisible.value = true
}

// 处理恢复默认设置
const handleRestoreDefaults = async () => {
  try {
    loading.value = true
    await restoreDefaultSettings()

    $q.notify({
      type: 'positive',
      message: '系统设置已恢复为默认值'
    })
    restoreDialogVisible.value = false
    fetchSettings()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: '恢复默认设置失败: ' + (error.response?.data?.message || error.message)
    })
  } finally {
    loading.value = false
  }
}

// 重置筛选条件
const resetFilters = () => {
  searchQuery.value = ''
  filterGroup.value = null
  pagination.value.page = 1
  fetchSettings()
}
</script>
