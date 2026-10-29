<template>
  <q-page class="q-pa-md">
    <q-card class="width-full max-w-900px">
      <!-- 头部 -->

      <q-card-section class="row items-center justify-between">
        <!-- 左侧返回箭头 -->
        <q-btn icon="arrow_back" flat round @click="goBack" />
        <!-- 中间标题 -->
        <div class="text-center">
          <h4 class="q-my-none">仪器详情</h4>
          <p class="text-grey q-my-md" v-if="detail">{{ detail.device_name }}</p>
        </div>
        <!-- 右侧返回列表按钮 -->
        <q-btn outline label="返回列表" @click="goBack" />
      </q-card-section>

      <q-inner-loading :show="loading" />

      <!-- 整个内容区只有 detail 不为空才渲染 -->
      <div v-if="detail" class="q-pa-md">
        <!-- 基本信息 -->
        <q-card flat bordered class="q-mb-md">
          <q-card-section>
            <h6 class="text-primary">📋 基本信息</h6>
          </q-card-section>
          <q-card-section class="q-pa-md text-sm leading-9">
            <div class="row">
              <div class="col-3 text-grey">设备名称</div>
              <div class="col-9 text-bold">{{ detail.device_name }}</div>
            </div>
            <div class="row">
              <div class="col-3 text-grey">合同编号</div>
              <div class="col-9">{{ detail.sn }}</div>
            </div>
            <div class="row">
              <div class="col-3 text-grey">仪器SKU</div>
              <div class="col-9">{{ detail.sku }}</div>
            </div>
            <div class="row">
              <div class="col-3 text-grey">容量</div>
              <div class="col-9">{{ detail.capacity }}</div>
            </div>
            <div class="row">
              <div class="col-3 text-grey">固件版本</div>
              <div class="col-9">{{ detail.firmware_version }}</div>
            </div>
            <div class="row">
              <div class="col-3 text-grey">启用日期</div>
              <div class="col-9">{{ detail.start_use_date }}</div>
            </div>
            <div class="row">
              <div class="col-3 text-grey">状态</div>
              <div class="col-9">
                <q-chip :color="statusColor" text-color="white" label>{{ statusText }}</q-chip>
              </div>
            </div>
            <div class="row">
              <div class="col-3 text-grey">库位</div>
              <div class="col-9">{{ detail.location_name || '未知' }}</div>
            </div>
            <div class="row">
              <div class="col-3 text-grey">备注</div>
              <div class="col-9">{{ detail.remark || '无' }}</div>
            </div>
          </q-card-section>
        </q-card>

        <!-- 组件列表 -->
        <q-card flat bordered class="q-mb-md">
          <q-card-section>
            <h6 class="text-primary">🖥 组件列表</h6>
          </q-card-section>
          <q-card-section class="q-pa-md">
            <div v-for="item in detail.component_list" :key="item.id" class="q-mb-sm q-pa-sm bg-grey-1 rounded">
              <div class="text-bold">{{ item.component_name }}</div>
              <div class="text-sm text-grey">
                类型：{{ item.component_type }} | 序列号：{{ item.component_sn }} | 数量：{{ item.quantity }}
              </div>
              <div class="text-xs text-grey-8">
                系统：{{ item.system_name }} {{ item.system_version }} | 软件：{{ item.soft_version }}
              </div>
            </div>
            <div v-if="!detail.component_list?.length" class="text-grey text-center q-py-sm">暂无组件</div>
          </q-card-section>
        </q-card>

        <!-- 配件列表 -->
        <q-card flat bordered class="q-mb-md">
          <q-card-section>
            <h6 class="text-primary">🔌 配件列表</h6>
          </q-card-section>
          <q-card-section class="q-pa-sm">
            <div v-for="item in detail.accessory_list" :key="item.id" class="q-mb-sm q-pa-sm bg-grey-1 rounded">
              {{ item.acc_name }}
              <span class="text-grey text-sm">({{ item.acc_type }})</span>
              <span class="text-xs text-grey-8">SN：{{ item.acc_sn || '无' }}</span>
            </div>
            <div v-if="!detail.accessory_list?.length" class="text-grey text-center q-py-sm">暂无配件</div>
          </q-card-section>
        </q-card>

        <!-- 操作日志 -->
        <q-card flat bordered>
          <q-card-section>
            <h6 class="text-primary">📝 操作日志</h6>
          </q-card-section>
          <q-card-section class="q-pa-sm">
            <div v-for="log in detail.log_list" :key="log.id" class="q-mb-sm q-pa-sm border-left">
              <div class="text-bold">{{ log.log_type }}：「{{ log.log_content }}」</div>
              <div class="text-xs text-grey">
                {{ formatTime(log.operate_time) }} · {{ log.operator }}
              </div>
              <div v-if="log.remark" class="text-xs text-grey-8">备注：{{ log.remark }}</div>
            </div>
            <div v-if="!detail.log_list?.length" class="text-grey text-center q-py-sm">暂无日志</div>
          </q-card-section>
        </q-card>
      </div>

      <q-card-actions align="right">
        <q-btn outline label="返回列表" @click="goBack" />
      </q-card-actions>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getRecorderDetail } from 'src/services/recorderServiceApi'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const detail = ref(null)

// 防止重复请求
let fetched = false

onMounted(() => {
  const id = route.params.id
  if (!id) return router.back()
  if (fetched) return
  fetched = true
  loadData(id)
})

async function loadData(id) {
  loading.value = true
  try {
    const res = await getRecorderDetail(id)
    detail.value = res.data
  } catch (err) {
    console.error('加载失败', err)
  } finally {
    loading.value = false
  }
}

// 状态映射（增加安全判断）
const statusText = computed(() => {
  if (!detail.value) return ''
  const map = { normal: '正常', repair: '维修中', wait_scrap: '待报废' }
  return map[detail.value.status] || '未知'
})

const statusColor = computed(() => {
  if (!detail.value) return 'grey'
  const map = { normal: 'green', repair: 'orange', wait_scrap: 'red' }
  return map[detail.value.status] || 'grey'
})

// 时间格式化
function formatTime(time) {
  if (!time) return ''
  return time.replace('T', ' ').split('.')[0]
}

function goBack() {
  router.push('/recorder')
}
</script>
