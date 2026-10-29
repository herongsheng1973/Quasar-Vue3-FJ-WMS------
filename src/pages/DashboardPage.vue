<template>
  <q-page class="q-pa-md dashboard">


    <div class="row flex justify-between items-center q-col-gutter-md">
      <h2 class="text-weight-bold">🏠 库房管理仪表盘</h2>
      <q-select v-model="selectedWarehouse" label="请选择库房（必选）" :options="warehouseList" option-label="name"
        option-value="id" :disable="loadingWarehouse" emit-value map-options required @update:model-value="load" />
    </div>
    <!-- 数据卡片 -->
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-12 col-md-6 col-lg-3">
        <q-card class="card-total">
          <q-card-section class="text-center">
            <div class="text-h5 text-weight-bold">{{ data.overview.total_products }}</div>
            <div class="text-grey-8">总商品</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-6 col-lg-3">
        <q-card class="card-total">
          <q-card-section class="text-center">
            <div class="text-h5 text-weight-bold">{{ data.overview.total_skus }}</div>
            <div class="text-grey-8">总SKU</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-6 col-lg-3">
        <q-card class="card-total">
          <q-card-section class="text-center">
            <div class="text-h5 text-weight-bold">{{ data.overview.total_stock }}</div>
            <div class="text-grey-8">总库存数量</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-6 col-lg-3">
        <q-card class="card-warning">
          <q-card-section class="text-center">
            <div class="text-h5 text-weight-bold">{{ data.overview.low_stock }}</div>
            <div class="text-grey-8">库存预警</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- 今日出入库 + 效期预警 -->
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-12 col-lg-6">
        <q-card>
          <q-card-section>
            <h5 class="q-mb-sm">今日出入库</h5>
            <div class="row q-col-gutter-md">
              <div class="col-6 text-center">
                <div class="text-h4 text-positive text-weight-bold">{{ data.overview.today_in }}</div>
                <div class="text-grey-7">今日入库</div>
              </div>
              <div class="col-6 text-center">
                <div class="text-h4 text-negative text-weight-bold">{{ data.overview.today_out }}</div>
                <div class="text-grey-7">今日出库</div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-lg-6">
        <q-card>
          <q-card-section>
            <h5 class="q-mb-sm">效期预警</h5>
            <div class="row q-col-gutter-md">
              <div class="col-6 text-center">
                <div class="text-h4 text-orange text-weight-bold">{{ data.overview.near_expired }}</div>
                <div class="text-grey-7">30天内临期</div>
              </div>
              <div class="col-6 text-center">
                <div class="text-h4 text-negative text-weight-bold">{{ data.overview.expired }}</div>
                <div class="text-grey-7">已过期</div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
    <!-- 指定产品库存统计 -->
    <q-card class="q-mb-lg">
      <q-card-section>
        <h5 class="q-mb-sm">大线库存统计（按产品名称）</h5>
      </q-card-section>
      <q-card-section class="row q-col-gutter-md">
        <div class="col-12 col-md-6 col-lg-3">
          <q-item>
            <q-item-section class="text-h6">428ST-3FDU-55M</q-item-section>
          </q-item>
          <q-item>
            <q-item-section>Total Cable:</q-item-section>
            <q-item-section class="text-h6 text-weight-bold">
              {{ data.cable_statistics?.['ACQ-428ST-3FDU-55M']?.cable_count || 0 }}
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>Total FDU:</q-item-section>
            <q-item-section class="text-h6 text-weight-bold">
              {{ data.cable_statistics?.['ACQ-428ST-3FDU-55M']?.total_fdu || 0 }}
            </q-item-section>
          </q-item>
        </div>

        <div class="col-12 col-md-6 col-lg-3">
          <q-item>
            <q-item-section class="text-h6">428ST-4FDU-55M</q-item-section>
          </q-item>
          <q-item>
            <q-item-section>Total Cable:</q-item-section>
            <q-item-section class="text-weight-bold">
              {{ data.cable_statistics?.['ACQ-428ST-4FDU-55M']?.cable_count || 0 }}
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>Total FDU:</q-item-section>
            <q-item-section class="text-h6 text-weight-bold">
              {{ data.cable_statistics?.['ACQ-428ST-4FDU-55M']?.total_fdu || 0 }}
            </q-item-section>
          </q-item>
        </div>

        <div class="col-12 col-md-6 col-lg-3">
          <q-item>
            <q-item-section class="text-h6">428WPSR-3FDU-55M</q-item-section>
          </q-item>
          <q-item>
            <q-item-section>Total Cable:</q-item-section>
            <q-item-section class="text-h6 text-weight-bold">
              {{ data.cable_statistics?.['ACQ-428WPSR-3FDU-55M']?.cable_count || 0 }}
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>Total FDU:</q-item-section>
            <q-item-section class="text-h6 text-weight-bold">
              {{ data.cable_statistics?.['ACQ-428WPSR-3FDU-55M']?.total_fdu || 0 }}
            </q-item-section>
          </q-item>
        </div>

        <div class="col-12 col-md-6 col-lg-3">
          <q-item>
            <q-item-section class="text-h6">428WPSR-4FDU-55M</q-item-section>
          </q-item>
          <q-item>
            <q-item-section>Total Cable:</q-item-section>
            <q-item-section class="text-h6 text-weight-bold">
              {{ data.cable_statistics?.['ACQ-428WPSR-4FDU-55M']?.cable_count || 0 }}
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>Total FDU:</q-item-section>
            <q-item-section class="text-h6 text-weight-bold">
              {{ data.cable_statistics?.['ACQ-428WPSR-4FDU-55M']?.total_fdu || 0 }}
            </q-item-section>
          </q-item>
        </div>
      </q-card-section>
    </q-card>
    <!-- 大线库存统计（按断点）-->
    <q-card class="q-mb-lg">
      <q-card-section>
        <h5 class="q-mb-sm">大线库存统计（按断点）</h5>
      </q-card-section>
      <q-card-section class="row q-col-gutter-md">
        <div class="col-12 col-md-6 col-lg-3">
          <q-item>
            <q-item-section>428 Link 0CUT</q-item-section>
            <q-item-section side class="text-h6 text-weight-bold">
              {{ data.fdu_statistics?.['total_fdu_0cut'] || 0 }}
            </q-item-section>
          </q-item>
        </div>

        <div class="col-12 col-md-6 col-lg-3">
          <q-item>
            <q-item-section>428 Link 1CUT</q-item-section>
            <q-item-section side class="text-h6 text-weight-bold">
              {{ data.fdu_statistics?.['total_fdu_1cut'] || 0 }}
            </q-item-section>
          </q-item>
        </div>

        <div class="col-12 col-md-6 col-lg-3">
          <q-item>
            <q-item-section>428 Link 2CUT</q-item-section>
            <q-item-section side class="text-h6 text-weight-bold">
              {{ data.fdu_statistics?.['total_fdu_2cut'] || 0 }}
            </q-item-section>
          </q-item>
        </div>

        <div class="col-12 col-md-6 col-lg-3">
          <q-item>
            <q-item-section>428 Link 3CUT</q-item-section>
            <q-item-section side class="text-h6 text-weight-bold">
              {{ data.fdu_statistics?.['total_fdu_3cut'] || 0 }}
            </q-item-section>
          </q-item>
        </div>
      </q-card-section>
    </q-card>
    <!-- 指定产品库存统计 -->
    <q-card class="q-mb-lg">
      <q-card-section>
        <h5 class="q-mb-sm">小线库存统计（按产品名称）</h5>
      </q-card-section>
      <q-card-section class="row q-col-gutter-md">
        <div class="col-12 col-md-6 col-lg-3">
          <q-item>
            <q-item-section>ACQ-GEO-SN6-4.5HZ</q-item-section>
            <q-item-section side class="text-h6 text-weight-bold">{{ data.geo_statistics['ACQ-GEO-SN6-4.5Hz']
              }}</q-item-section>
          </q-item>
        </div>
        <div class="col-12 col-md-6 col-lg-3">
          <q-item>
            <q-item-section>ACQ-GEO-SN7X-7HZ</q-item-section>
            <q-item-section side class="text-h6 text-weight-bold">{{ data.geo_statistics['ACQ-GEO-SN7X-7Hz']
              }}</q-item-section>
          </q-item>
        </div>
        <div class="col-12 col-md-6 col-lg-3">
          <q-item>
            <q-item-section>ACQ-GEO-SG10-10HZ</q-item-section>
            <q-item-section side class="text-h6 text-weight-bold">{{ data.geo_statistics['ACQ-GEO-SG10-10Hz']
              }}</q-item-section>
          </q-item>
        </div>
        <div class="col-12 col-md-6 col-lg-3">
          <q-item>
            <q-item-section>ACQ-GEO-30DX-10HZ</q-item-section>
            <q-item-section side class="text-h6 text-weight-bold">{{ data.geo_statistics['ACQ-GEO-30DX-10Hz']
            }}</q-item-section>
          </q-item>
        </div>
      </q-card-section>
    </q-card>
    <!-- 指定产品库存统计 -->
    <q-card class="q-mb-lg">
      <q-card-section>
        <h5 class="q-mb-sm">关键外设库存统计（按产品名称）</h5>
      </q-card-section>
      <q-card-section class="row q-col-gutter-md">
        <div class="col-12 col-md-6 col-lg-3">
          <q-item>
            <q-item-section>ACQ-TFOI-428</q-item-section>
            <q-item-section side class="text-h6 text-weight-bold">{{ data.acq_statistics['ACQ-TFOI-428']
              }}</q-item-section>
          </q-item>
        </div>
        <div class="col-12 col-md-6 col-lg-3">
          <q-item>
            <q-item-section>ACQ-LAUX-428</q-item-section>
            <q-item-section side class="text-h6 text-weight-bold">{{ data.acq_statistics['ACQ-LAUX-428']
              }}</q-item-section>
          </q-item>
        </div>
        <div class="col-12 col-md-6 col-lg-3">
          <q-item>
            <q-item-section>ACQ-LAUL-428</q-item-section>
            <q-item-section side class="text-h6 text-weight-bold">{{ data.acq_statistics['ACQ-LAUL-428']
              }}</q-item-section>
          </q-item>
        </div>
        <div class="col-12 col-md-6 col-lg-3">
          <q-item>
            <q-item-section>ACQ-LEAD-428</q-item-section>
            <q-item-section side class="text-h6 text-weight-bold">{{ data.acq_statistics['ACQ-LEAD-428']
              }}</q-item-section>
          </q-item>
        </div>
      </q-card-section>
    </q-card>
    <!-- 最近库存变动 -->
    <q-card>
      <q-card-section>
        <h5 class="q-mb-sm">最近库存变动</h5>
      </q-card-section>
      <q-table :rows="data.recent_transactions" :columns="columns" row-key="id" flat bordered />
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getDashboard } from 'src/services/dashboardServiceApi'
import { getWarehouseOptions } from 'src/services/settingsServiceApi'
import { useQuasar } from 'quasar'
const $q = useQuasar()


const loadingWarehouse = ref(false)
const warehouseList = ref([])
const selectedWarehouse = ref(null)
const data = ref({
  overview: {},
  cable_statistics: {},
  cable_0cut_statistics: {},
  cable_1cut_statistics: {},
  cable_2cut_statistics: {},
  cable_3cut_statistics: {},
  fdu_statistics: {},
  geo_statistics: {},
  acq_statistics: {},
  recent_transactions: []
})

const columns = [
  { name: 'created_at', label: '时间', field: 'created_at' },
  { name: 'product', label: '商品', field: 'location_sku__sku__product__name' },
  { name: 'sku', label: 'SKU', field: 'location_sku__sku__sku_code' },
  {
    name: 'type',
    label: '类型',
    field: 'transaction_type',
    format: (val) => {
      if (val === 'in') return '入库'
      if (val === 'out') return '出库'
      if (val === 'adjust') return '调整'
      if (val === 'init') return '初始化'
      if (val === 'transfer_in') return '调拨入库'
      if (val === 'transfer_out') return '调拨出库'
      return '未知'
    }
  },
  { name: 'quantity', label: '数量', field: 'quantity' },
  { name: 'batch', label: '批次', field: 'batch_number' },
]
const loadWarehouse = async () => {
  loadingWarehouse.value = true
  try {
    const res = await getWarehouseOptions()
    warehouseList.value = res.data || []
    selectedWarehouse.value = 9
  } catch (error) {
    $q.notify({ type: 'negative', message: '加载库房列表失败' + error.message })
  } finally {
    loadingWarehouse.value = false
  }
}
const load = async () => {
  try {
    const res = await getDashboard({ warehouse_id: selectedWarehouse.value })
    data.value = res.data.data
  } catch (e) {
    console.error('加载仪表盘失败', e)
  }
}

onMounted(async () => {
  loadWarehouse()
  load()
}

)
</script>

<style scoped>
.dashboard {
  max-width: 1400px;
  margin: 0 auto;
}

.card-total {
  background: #e3f2fd !important;
}

.card-warning {
  background: #fff8e1 !important;
}
</style>
