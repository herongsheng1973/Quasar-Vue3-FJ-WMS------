<template>
  <q-page class="q-pa-md">
    <div class="row col-12 flex flex-wrap justify-between items-center gap-4">
      <div class="col-6 q-py-none">
        <h5 class="text-h5 text-grey-8 q-ma-none">盘库单管理</h5>
        <p class="text-grey-5 text-subtitle2">查看和管理所有盘库单</p>
      </div>
      <div class="col-6 flex items-center justify-end">
        <q-btn color="primary" label="新增盘库单" @click="openFormDialog" />
      </div>
    </div>
    <!-- 搜索和过滤区域 -->
    <div class="row flex flex-wrap gap-4 mb-4">
      <q-input class="col-3 q-pr-md" v-model="filters.check_no" label="搜索盘库单号" @keyup.enter="fetchCheckOrders" dense>
        <template #append>
          <q-icon name="search" />
        </template>
      </q-input>
      <q-select class="col-2" v-model="filters.warehouse" label="仓库" :options="warehouseOptions" option-label="name"
        option-value="id" emit-value map-options dense @update:model-value="fetchCheckOrders" />
      <q-input v-model="filters.sku_code" label="商品编码" class="col-2" dense />
      <q-select v-model="filters.status" label="状态" :options="statusOptions" class="col-2" dense
        @update:model-value="fetchCheckOrders" />

      <q-btn label="重置" color="secondary" @click="resetFilters" style="width: 120px;margin-left: 24px;" />
      <q-btn label="搜索" color="teal" @click="fetchCheckOrders" style="width: 120px;margin-left: 24px;" />
    </div>


    <!-- 盘库单列表 -->
    <q-table :rows="checks" :columns="columns" row-key="id" :loading="loading" class="mt-4"
      v-model:pagination="pagination" :rows-per-page-options="[10, 20, 30, 50, 100]" @request="onRequest">
      <template v-slot:body-cell-actual_quantity="props">
        <q-td :props="props">
          <q-input v-if="props.row.status === 'draft'" v-model.number="props.row.actual_quantity" type="number" dense
            @update:model-value="updateDiffQuantity(props.row)" outlined class="quantity-input" />
          <span v-else>{{ props.row.actual_quantity }}</span>
        </q-td>
      </template>

      <template v-slot:body-cell-actions="props">
        <q-td :props="props">
          <q-btn size="sm" label="查看" color="primary" @click="viewDetails(props.row)" />
          <q-btn size="sm" label="编辑" color="secondary" @click="editCheck(props.row)" v-if="canEdit(props.row)" />
          <q-btn size="sm" label="完成" color="positive" @click="handleCompleteCheck(props.row)"
            v-if="canComplete(props.row)" />
          <q-btn size="sm" label="取消" color="negative" @click="handleCancelCheck(props.row)"
            v-if="canCancel(props.row)" />
        </q-td>
      </template>

      <template v-slot:body-cell-difference="props">
        <q-td :props="props">
          <span :class="props.row.difference !== 0 ? 'text-negative' : ''">
            {{ props.row.difference }}
          </span>
        </q-td>
      </template>
    </q-table>

    <!-- 确认完成盘库对话框 -->
    <q-dialog v-model="confirmDialogVisible">
      <q-card style="width: 500px; max-width: 90vw;">
        <q-card-section>
          <h5 class="text-h5">确认完成盘库</h5>
          <div class="row">
            <div class="col-4 text-grey-7">盘库单号:</div>
            <div class="col-8">{{ confirmCheckData.check_no }}</div>
          </div>
          <div class="q-mt-md">
            <div class="row q-mb-sm">
              <div class="col-4 text-grey-7">商品:</div>
              <div class="col-8">{{ confirmCheckData.sku_name }} ({{ confirmCheckData.sku_code }})</div>
            </div>
            <div class="row q-mb-sm">
              <div class="col-4 text-grey-7">仓库/库位:</div>
              <div class="col-8">{{ confirmCheckData.warehouse_name }} / {{ confirmCheckData.location_name }}</div>
            </div>
            <div class="row q-mb-sm">
              <div class="col-4 text-grey-7">系统库存:</div>
              <div class="col-8">{{ confirmCheckData.system_quantity }}</div>
            </div>
            <div class="row q-mb-sm">
              <div class="col-4 text-grey-7">实际库存:</div>
              <div class="col-8">{{ confirmCheckData.actual_quantity }}</div>
            </div>
            <div class="row q-mb-sm">
              <div class="col-4 text-grey-7">差异量:</div>
              <div class="col-8" :class="confirmCheckData.difference !== 0 ? 'text-negative' : ''">
                {{ confirmCheckData.difference }}
              </div>
            </div>
            <div class="row q-mb-sm">
              <div class="col-12 text-grey-7">盘库数量:</div>
              <div class="col-12">
                <q-input v-model.number="confirmCheckData.confirm_quantity" label="盘库数量" type="number" dense outlined />
              </div>
              <div class="col-12 text-grey-7">盘库差异:</div>

              <div class="col-12">
                <q-input v-model.number="confirmCheckData.confirm_difference" label="盘库差异" type="number" dense
                  outlined />
              </div>
            </div>
            <div class="row q-mt-md">
              <div class="col-12">
                <q-input v-model="confirmCheckData.notes" label="备注" type="textarea" rows="3" outlined />
              </div>
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn label="取消" @click="confirmDialogVisible = false" />
          <q-btn label="确认完成" color="positive" @click="confirmCompleteCheck" />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <!-- 盘库单表单对话框 -->
    <check-form v-if="formDialogVisible" class="col-12" :visible="formDialogVisible" :check="currentCheck"
      :products="products" :locations="locations" @cancel="formDialogVisible = false" @saved="onCheckSaved" />

    <!-- 详情对话框 -->
    <q-dialog v-model="detailDialogVisible">
      <q-card style="width: 800px; max-width: 90vw;">
        <q-card-section>
          <h5 class="text-h5">盘库单详情</h5>

          <!-- 上部分：左侧信息，右侧图片 -->
          <div class="row q-col-gutter-md">
            <!-- 左侧信息 -->
            <div class="col-7">
              <div class="q-gutter-y-sm">
                <div>
                  <span class="text-grey-500">盘库单号：</span>
                  <span>{{ currentCheckDetail.check_no }}</span>
                </div>
                <div>
                  <span class="text-grey-500">商品：</span>
                  <span>{{ currentCheckDetail.product_name || '无' }}
                    ({{ currentCheckDetail.product_code || '无' }})</span>
                </div>
                <div>
                  <span class="text-grey-500">规格：</span>
                  <span>{{ currentCheckDetail.sku_spec || '无' }}
                    {{ currentCheckDetail.sku_batch_number || '无批次号' }}
                  </span>
                </div>
                <div>
                  <span class="text-grey-500">仓库名称/代码：</span>
                  <span>{{ currentCheckDetail.warehouse_name || '无' }} /
                    {{ currentCheckDetail.warehouse_code || '无' }}</span>
                </div>
                <div>
                  <span class="text-grey-500">库位名称/代码：</span>
                  <span>{{ currentCheckDetail.location_name || '无' }} /
                    {{ currentCheckDetail.location_code || '无' }}</span>
                </div>
                <div>
                  <span class="text-grey-500">系统库存：</span>
                  <span>{{ currentCheckDetail.system_quantity }}</span>
                </div>
                <div>
                  <span class="text-grey-500">实际库存：</span>
                  <span>{{ currentCheckDetail.actual_quantity }}</span>
                </div>
                <div>
                  <span class="text-grey-500">差异量：</span>
                  <span :class="currentCheckDetail.difference !== 0 ? 'text-negative' : ''">
                    {{ currentCheckDetail.difference }}
                  </span>
                </div>
                <div>
                  <span class="text-grey-500">状态：</span>
                  <span :class="getStatusColor(currentCheckDetail.status)">
                    {{ getStatusText(currentCheckDetail.status) }}</span>
                </div>
                <div>
                  <span class="text-grey-500">盘库备注：</span>
                  <p class="q-ma-none">{{ currentCheckDetail.notes || '无' }}</p>
                </div>
              </div>
            </div>

            <!-- 右侧图片 -->
            <div class="col-5 flex flex-center">
              <q-img :src="currentCheckDetail.sku_info?.image" :ratio="1" style="max-width: 400px;"
                spinner-color="primary" fit="contain">
                <template v-slot:error>
                  <div class="absolute-full flex flex-center bg-grey-2 text-grey-5">
                    无图片
                  </div>
                </template>
              </q-img>
            </div>
          </div>

          <!-- 下部分：人员和时间信息 -->
          <div class="q-mt-lg q-pt-md" style="border-top: 1px solid #eee;">
            <div class="row q-col-gutter-md">
              <div class="col-6">
                <div class="text-subtitle2 text-grey-8 q-mb-sm">操作信息</div>
                <div class="q-gutter-y-sm">
                  <div v-if="currentCheckDetail.status === 'completed'">
                    <span class="text-grey-500">盘点人：</span>
                    <span>{{ currentCheckDetail.checked_by_username }}</span>
                  </div>
                  <div v-if="currentCheckDetail.status === 'completed'">
                    <span class="text-grey-500">盘点时间：</span>
                    <span>{{ formatDate(currentCheckDetail.checked_at) }}</span>
                  </div>
                  <div>
                    <span class="text-grey-500">创建人：</span>
                    <span>{{ currentCheckDetail.created_by_username }}</span>
                  </div>
                  <div>
                    <span class="text-grey-500">创建时间：</span>
                    <span>{{ formatDate(currentCheckDetail.created_at) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn label="关闭" @click="detailDialogVisible = false" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import CheckForm from 'components/CheckForm.vue'
import {
  getAllChecks,
  getCheckDetail,
  completeCheck,
  cancelCheck,
  createCheckbyInventoryId,
} from 'src/services/inventoryServiceApi'

const $q = useQuasar()

const checks = ref([])
// 状态选项
const statusOptions = [
  { label: '草稿', value: 'draft' },
  { label: '已完成', value: 'completed' },
  { label: '已取消', value: 'cancelled' }
]

// 表格列定义 - 根据后端返回数据优化
const columns = [
  { name: 'check_no', label: '盘库单号', field: 'check_no' },
  { name: 'product', label: '商品', field: row => `${row.product_name} (${row.product_code})` },
  { name: 'warehouse_location', label: '仓库/库位', field: row => `${row.warehouse_code} / ${row.location_code}` },
  { name: 'sku_code', label: '规格', field: 'sku_code' },
  { name: 'batch_number', label: '批次号', field: 'batch_number', align: 'right' },
  { name: 'system_quantity', label: '系统库存', field: 'system_quantity', align: 'right' },
  { name: 'actual_quantity', label: '实际库存', field: 'actual_quantity', align: 'right' },
  { name: 'difference', label: '差异量', field: 'difference', align: 'right' },
  { name: 'status', label: '状态', field: row => getStatusText(row.status) },
  { name: 'actions', label: '操作', field: 'actions', align: 'center' }
]

const filters = ref({
  check_no: '',
  sku_code: '',
  warehouse: null,
  status: null
})

const pagination = ref({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
  sortBy: 'created_at',
  desc: true
})
const loading = ref(false)
const warehouseOptions = ref([])
import { getWarehouseOptions } from 'src/services/settingsServiceApi'
const fetchWarehouses = async () => {
  try {
    const response = await getWarehouseOptions({})
    warehouseOptions.value = response.data || []
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.response?.data?.error || '获取仓库列表失败'
    })
  }
}

// 盘库单表单对话框
const formDialogVisible = ref(false)
const currentCheck = ref(null)
const onCheckSaved = async (savedItems) => {
  const inventoryRecordIds = savedItems.map(item => item.id)
  try {
    await createCheckbyInventoryId({ inventory_record_ids: inventoryRecordIds })
    $q.notify({
      color: 'positive',
      message: '盘库单创建成功'
    })
    formDialogVisible.value = false
    fetchCheckOrders()
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.response?.data?.error || '盘库单创建失败'
    })
  }
}

const editCheck = (row) => {
  currentCheck.value = row
  formDialogVisible.value = true
}
// 修正 updateDiffQuantity 函数
const updateDiffQuantity = (row) => {
  // 确保系统库存和实际库存都存在
  const systemQuantity = Number(row.system_quantity) || 0;
  const actualQuantity = Number(row.actual_quantity) || 0;

  // 实时计算差异
  row.difference = actualQuantity - systemQuantity;
};
// 确认对话框相关数据
const confirmDialogVisible = ref(false)
const confirmCheckData = ref({
  id: null,
  sku_name: '',
  sku_code: '',
  warehouse_name: '',
  location_name: '',
  system_quantity: 0,
  actual_quantity: 0,
  confirm_quantity: 0,
  confirm_difference: 0,
  difference: 0,
  notes: '',
  status: 'draft'
})

// 显示确认对话框
const showConfirmDialog = (row) => {
  if (row.status !== 'draft') return

  // 设置确认数据
  confirmCheckData.value = {
    id: row.id,
    sku_name: row.sku_name,
    sku_code: row.sku_code,
    batch_number: row.batch_number || '无批次号',
    warehouse_name: row.warehouse_name,
    location_name: row.location_name,
    system_quantity: row.system_quantity,
    actual_quantity: row.actual_quantity || 0,
    difference: (row.actual_quantity || 0) - row.system_quantity,
    notes: row.notes || '',
    status: row.status
  }

  // 显示对话框
  confirmDialogVisible.value = true
}

// 确认完成盘库
const confirmCompleteCheck = async () => {

  const { actual_quantity, confirm_quantity, difference, confirm_difference, id, notes } = confirmCheckData.value;
  if (!notes.trim()) {
    $q.notify({
      color: 'negative',
      message: '请输入盘库备注'
    });
    return;
  }
  // 验证必要字段
  if (actual_quantity === null || actual_quantity === undefined) {
    $q.notify({
      color: 'negative',
      message: '请输入实际库存数量'
    });
    return;
  }

  if (isNaN(actual_quantity) || actual_quantity < 0) {
    $q.notify({
      color: 'negative',
      message: '实际库存数量必须是非负数字'
    });
    return;
  }

  if (isNaN(confirm_difference)) {
    $q.notify({
      color: 'negative',
      message: '请输入盘库差异数量'
    });
    return;
  }

  // 验证一致性
  if (actual_quantity !== confirm_quantity) {
    $q.notify({
      color: 'negative',
      message: '两次输入的盘库数量不一致，请确认'
    });
    return;
  }

  if (confirm_difference !== difference) {
    $q.notify({
      color: 'negative',
      message: '盘库差异数量和系统计算的差异不一致，请输入正确的差异数量'
    });
    return;
  }

  if (!id) {
    $q.notify({
      color: 'negative',
      message: '无效的盘库单'
    });
    return;
  }

  const formData = {
    actual_quantity,
    difference,
    notes: confirmCheckData.value.notes
  };

  try {
    await completeCheck(id, formData);
    $q.notify({
      color: 'positive',
      message: '盘库单已完成'
    });

    // 关闭对话框并刷新数据
    confirmDialogVisible.value = false;
    fetchCheckOrders();
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.response?.data?.error || '完成盘库失败'
    });
  } finally {
    confirmDialogVisible.value = false;
    // 重置确认数据
    confirmCheckData.value = {
      id: null,
      sku_name: '',
      sku_code: '',
      batch_number: '',
      warehouse_name: '',
      location_name: '',
      system_quantity: 0,
      actual_quantity: 0,
      confirm_quantity: 0,
      confirm_difference: 0,
    }
  }

};


// 修改原有的 handleCompleteCheck 函数
const handleCompleteCheck = (row) => {
  showConfirmDialog(row)
}
const handleCancelCheck = async (row) => {
  if (row.status !== 'draft') return
  if (!row.id) {
    $q.notify({
      color: 'negative',
      message: '请选择要取消的盘库单'
    })
    return
  }

  try {
    await cancelCheck(row.id)
    $q.notify({
      color: 'positive',
      message: '盘库单已取消'
    })
    fetchCheckOrders()
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.response?.data?.error || '操作失败'
    })
  }
}

const locations = ref([])
import { getLocations } from 'src/services/settingsServiceApi'
const fetchLocations = async () => {
  const params = {
    page: 1,
    page_size: 1000,
    warehouse_id: 1
  }

  try {
    const response = await getLocations(params)
    locations.value = response.data.results || []
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.response?.data?.error || '获取库位列表失败'
    })
  }
}

const products = ref([])
import { getProductList } from 'src/services/productServiceApi'

const fetchProducts = async () => {
  try {
    const response = await getProductList()
    products.value = response.data.results || []
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.response?.data?.error || '获取商品列表失败'
    })
  }
}

// 重置筛选器
const resetFilters = () => {
  filters.value = {
    check_no: '',
    sku_code: null,
    warehouse: null,
    status: null
  }
  fetchCheckOrders({
    page: 1,
    page_size: 10,
    ...filters.value
  })
}

const canComplete = (row) => {
  return row.status === 'draft'
}

const canEdit = (row) => {
  return row.status === 'draft'
}

const canCancel = (row) => {
  return row.status === 'draft'
}

// 辅助方法
const getStatusText = (status) => {
  const statusMap = {
    'draft': '草稿',
    'completed': '已完成',
    'cancelled': '已取消'
  }
  return statusMap[status] || status
}

const getStatusColor = (status) => {
  const colorMap = {
    'draft': 'text-grey',
    'completed': 'text-positive',
    'cancelled': 'text-negative'
  }
  return colorMap[status] || ''
}

// 日期格式化函数
const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).replace(/\//g, '-')
}
const buildRequestParams = () => {
  const params = {
    page: pagination.value.page || 1,
    page_size: pagination.value.rowsPerPage || 10,
    sortBy: pagination.value.desc ? `-${pagination.value.sortBy}` : pagination.value.sortBy || '',
  }


  if (filters.value.check_no) {
    params['check_no'] = filters.value.check_no
  }
  if (filters.value.sku_code) {
    params['sku_code'] = filters.value.sku_code
  }
  if (filters.value.warehouse) {
    params['warehouse'] = filters.value.warehouse
  }
  if (filters.value.status) {
    params['status'] = filters.value.status.value
  }
  return params
}
const fetchCheckOrders = async () => {
  loading.value = true
  try {
    const params = buildRequestParams()
    const response = await getAllChecks(params)
    checks.value = response.data.results || []
    pagination.value.rowsNumber = response.data.count || 0
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.response?.data?.error || '获取盘库单失败' + error.message
    })
  } finally {
    loading.value = false
  }
}
const onRequest = (props) => {
  pagination.value.page = props.pagination.page
  pagination.value.rowsPerPage = props.pagination.rowsPerPage
  fetchCheckOrders()
}
const currentCheckDetail = ref(null)
const detailDialogVisible = ref(false)

const viewDetails = async (row) => {
  try {
    const response = await getCheckDetail(row.id)
    currentCheckDetail.value = response.data
    detailDialogVisible.value = true
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.response?.data?.error || '获取盘库单详情失败' + error.message
    })
  }
}

const openFormDialog = () => {
  currentCheck.value = null
  formDialogVisible.value = true
}

onMounted(() => {
  fetchWarehouses()
  fetchLocations()
  fetchProducts()
  fetchCheckOrders({
    page: 1,
    page_size: 10
  })
})
</script>

<style scoped>
.quantity-input {
  width: 80px;
}
</style>
