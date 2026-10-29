<template>
  <q-form ref="transferForm" v-model="formState" @submit="handleSubmit" class="q-pa-md">
    <q-card>
      <q-card-section>
        <h5 class="text-subtitle1 q-mb-md">移库信息</h5>
        <q-grid :columns="12" column-gap="16px" row-gap="16px">
          <!-- 源仓库 -->
          <q-col xs="12" md="6">
            <q-input label="源仓库 *" v-model="form.source_warehouse" :rules="[val => !!val || '请选择源仓库']">
              <template #append>
                <q-select v-model="form.source_warehouse" :options="warehouseOptions" option-label="name"
                  option-value="id" popup-content-class="w-56" toggle-icon="swap_vert" />
              </template>
            </q-input>
          </q-col>

          <!-- 目标仓库 -->
          <q-col xs="12" md="6">
            <q-input label="目标仓库 *" v-model="form.target_warehouse" :rules="[val => !!val || '请选择目标仓库']">
              <template #append>
                <q-select v-model="form.target_warehouse" :options="warehouseOptions" option-label="name"
                  option-value="id" popup-content-class="w-56" toggle-icon="swap_vert" />
              </template>
            </q-input>
          </q-col>

          <!-- 源库位 -->
          <q-col xs="12" md="6">
            <q-input label="源库位" v-model="form.source_location">
              <template #append>
                <q-select v-model="form.source_location" :options="locationOptions" option-label="name"
                  option-value="id" popup-content-class="w-56" toggle-icon="swap_vert" />
              </template>
            </q-input>
          </q-col>

          <!-- 目标库位 -->
          <q-col xs="12" md="6">
            <q-input label="目标库位" v-model="form.target_location">
              <template #append>
                <q-select v-model="form.target_location" :options="locationOptions" option-label="name"
                  option-value="id" popup-content-class="w-56" toggle-icon="swap_vert" />
              </template>
            </q-input>
          </q-col>

          <!-- 商品 -->
          <q-col xs="12" md="4">
            <q-input label="商品 *" v-model="form.product" :rules="[val => !!val || '请选择商品']">
              <template #append>
                <q-select v-model="form.product" :options="productOptions" option-label="name" option-value="id"
                  popup-content-class="w-56" toggle-icon="swap_vert" />
              </template>
            </q-input>
          </q-col>

          <!-- 批次号 -->
          <q-col xs="12" md="4">
            <q-input label="批次号" v-model="form.batch_number" />
          </q-col>

          <!-- 移库数量 -->
          <q-col xs="12" md="4">
            <q-input label="移库数量 *" v-model.number="form.quantity" type="number" min="1"
              :rules="[val => val > 0 || '数量必须大于0']" />
          </q-col>

          <!-- 备注 -->
          <q-col xs="12">
            <q-input label="备注" v-model="form.notes" type="textarea" rows="2" />
          </q-col>
        </q-grid>
      </q-card-section>
    </q-card>

    <!-- 操作按钮 -->
    <div class="flex justify-end q-mt-md gap-3">
      <q-btn label="重置" type="reset" color="grey" />
      <q-btn label="提交" type="submit" color="primary" />
      <q-btn label="关闭" @click="hideDialog" />
    </div>
  </q-form>
</template>

<script setup>
import { ref, reactive } from 'vue'

// 表单状态
const formState = ref(false)
const transferForm = ref(null)

// 表单数据
const form = reactive({
  source_warehouse: null,
  source_location: null,
  target_warehouse: null,
  target_location: null,
  product: null,
  batch_number: '',
  quantity: 1,
  notes: ''
})

// 下拉选项
const warehouseOptions = ref([
  { id: 1, name: '主仓库' },
  { id: 2, name: '备用仓库' }
])
const locationOptions = ref([
  { id: 1, name: 'A区-01货架' },
  { id: 2, name: 'B区-02货架' }
])
const productOptions = ref([
  { id: 1, name: '商品A', code: 'P001' },
  { id: 2, name: '商品B', code: 'P002' }
])
// 定义 emits 用于向父组件发送事件
const emit = defineEmits(['close', 'saved'])
// 提交表单
const handleSubmit = () => {
  console.log('提交移库单:', form)
  emit('saved', form)
  transferForm.value.resetValidation()
}

// 关闭表单对话框
const hideDialog = () => {
  emit('close')
}
</script>
