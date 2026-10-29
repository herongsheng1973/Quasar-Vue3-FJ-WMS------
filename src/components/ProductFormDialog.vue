<template>
  <q-dialog v-model="dialogVisible" position="standard">
    <q-card style="width: 800px; max-width: 90vw; height: auto;">
      <!-- 弹窗标题 -->
      <q-card-section class="bg-primary text-white q-py-sm q-px-md">
        <h2 class="text-h6 q-ma-none">{{ currentProduct ? '编辑商品' : '新增商品' }}</h2>
      </q-card-section>

      <q-card-section class="row">
        <!-- 左侧图片区域 -->
        <div class="col-5 q-pr-md">
          <q-item-section>
            <label class="text-base q-mb-sm block">商品主图</label>

            <!-- 图片预览区域 -->
            <div v-if="imagePreviewUrl" class="flex justify-center q-mb-md">
              <img :src="imagePreviewUrl" alt="商品主图预览" style="width: 256px; height: 256px; object-fit: contain;"
                class="rounded-md" :class="{ 'opacity-50': loading }">
            </div>

            <div class="flex justify-center q-mb-md">
              <q-btn v-if="imagePreviewUrl" size="sm" color="negative" icon="delete" @click="handleImageRemove"
                :disabled="loading">
                移除图片
              </q-btn>
            </div>

            <q-uploader v-model="selectedImages" label="选择主图（支持JPG/PNG，最大2MB）" accept="image/jpeg, image/png"
              max-files="1" @added="handleImageAdd" @removed="handleImageRemove" class="q-mb-md" :disabled="loading"
              :hide-upload-button="imagePreviewUrl" :error-message="imageError">
            </q-uploader>
          </q-item-section>
        </div>

        <!-- 右侧表单区域 -->
        <div class="col-7 q-pl-md">
          <q-form class="row q-gutter-sm" @submit.prevent="handleSubmit">
            <!-- 商品名称（必填） -->
            <div class="col-12">
              <q-input v-model.trim="form.name" label="商品名称 *" required :error="!!errors.name"
                :error-message="errors.name" dense outlined hide-bottom-space />
            </div>

            <!-- 商品编码（必填） -->
            <div class="col-12">
              <q-input v-model.trim="form.code" label="商品编码 *" required :error="!!errors.code"
                :error-message="errors.code" dense outlined hide-bottom-space />
            </div>

            <!-- 分类（必填） -->
            <div class="col-12">
              <q-select v-model="form.category" label="商品分类 *" :options="categories" option-label="name" emit-value
                map-options option-value="id" required clearable :error="!!errors.category"
                :error-message="errors.category" dense outlined hide-bottom-space />
            </div>

            <!-- 商品描述 -->
            <div class="col-12">
              <q-input v-model.trim="form.description" label="商品描述" type="textarea" :error="!!errors.description"
                :error-message="errors.description" dense outlined hide-bottom-space />
            </div>

            <!-- 是否启用 -->
            <div class="col-12">
              <q-select v-model="form.is_active" label="是否启用" :options="[
                { label: '启用', value: true },
                { label: '禁用', value: false }
              ]" option-label="label" option-value="value" emit-value map-options dense outlined hide-bottom-space />
            </div>
          </q-form>
        </div>
      </q-card-section>

      <!-- 弹窗底部按钮 -->
      <q-card-actions align="center" class="q-pa-md">
        <q-btn label="取消" color="grey" @click="handleCancel" size="md" :disabled="loading" />
        <q-btn label="提交" color="primary" :loading="loading" @click="handleSubmit" class="q-ml-md" size="md" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
<script setup>
import { ref, watch, computed } from 'vue'

// 图片相关状态
const selectedImages = ref([])  // 符合uploader组件的数组格式
const imagePreviewUrl = ref('')
const isImageChanged = ref(false)
const imageError = ref('')

// 接收父组件参数
const props = defineProps({
  modelValue: { type: Boolean, required: true },
  currentProduct: { type: Object, default: null },
  categories: { type: Array, required: true },
  loading: { type: Boolean, default: false }
})

// 向父组件emit事件
const emit = defineEmits(['cancel', 'submit', 'update:modelValue'])

// 表单数据
const form = ref({
  name: '',
  code: '',
  category: null,
  description: '',
  main_image: null,
  is_active: true
})

const errors = ref({})

// 对话框显示状态双向绑定
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 处理图片选择
const handleImageAdd = (files) => {
  // files 是一个 FileList 对象
  if (files.length === 0) return

  // 重置之前的错误状态
  imageError.value = ''

  const file = files[0]  // 获取第一个文件
  const validationError = validateImage(file)

  if (validationError) {
    imageError.value = validationError
    selectedImages.value = []
    return
  }

  // 读取图片并显示预览
  const reader = new FileReader()
  reader.onload = (e) => {
    imagePreviewUrl.value = e.target.result
  }
  reader.readAsDataURL(file)
  selectedImages.value = [file]  // 保持数组格式
  isImageChanged.value = true
}

// 处理图片移除
const handleImageRemove = () => {
  imagePreviewUrl.value = ''
  selectedImages.value = []
  isImageChanged.value = true
}

const validateImage = (file) => {
  if (file.size > 2 * 1024 * 1024) {
    return '图片大小不能超过2MB'
  }
  if (!['image/jpeg', 'image/png'].includes(file.type)) {
    return '请上传JPG或PNG格式的图片'
  }
  return null
}

// 表单验证
const validateForm = () => {
  const newErrors = {}

  if (!form.value.name) newErrors.name = '请输入商品名称'
  if (!form.value.code) newErrors.code = '请输入商品编码'
  if (!form.value.category) newErrors.category = '请选择商品分类'

  errors.value = newErrors
  return Object.keys(newErrors).length === 0
}

// 表单提交
const handleSubmit = () => {
  if (!validateForm()) return

  const formData = new FormData()

  // 添加文本字段
  Object.entries(form.value).forEach(([key, value]) => {
    // 跳过main_image字段，单独处理文件
    if (key !== 'main_image') {
      formData.append(key, value ?? '')
    }
  })

  // 处理图片
  if (selectedImages.value.length > 0) {
    // 如果用户选择了新图片，则上传新图片
    formData.append('main_image', selectedImages.value[0])
  } else if (props.currentProduct && isImageChanged.value && imagePreviewUrl.value === '') {
    // 如果用户移除了原有图片，则通知后端删除图片
    formData.append('main_image', '')
  }
  // 如果既没有选择新图片，也没有移除旧图片，则不处理main_image字段

  emit('submit', formData)
}

// 取消操作
const handleCancel = () => {
  emit('cancel')
}

// 重置表单
const resetForm = () => {
  form.value = {
    name: '',
    code: '',
    category: null,
    description: '',
    main_image: null,
    is_active: true
  }
  errors.value = {}
  selectedImages.value = []
  imagePreviewUrl.value = ''
  isImageChanged.value = false
}

// 监听当前产品变化，填充表单（编辑模式）
watch(
  () => props.currentProduct,
  (product) => {
    if (product) {
      // 填充基本信息
      form.value = {
        name: product.name || '',
        code: product.code || '',
        category: product.category || null,
        description: product.description || '',
        main_image: product.main_image || null,
        is_active: product.is_active !== undefined ? product.is_active : true
      }

      // 处理现有图片预览
      const imageUrl = product.main_image_url || product.main_image
      if (imageUrl) {
        imagePreviewUrl.value = `${imageUrl}?t=${Date.now()}`
        selectedImages.value = [] // 重置选择的图片数组
        isImageChanged.value = false
      } else {
        imagePreviewUrl.value = ''
        selectedImages.value = []
        isImageChanged.value = false
      }
    } else {
      resetForm()
    }
  },
  { immediate: true }
)

// 监听对话框关闭，重置表单
watch(
  () => dialogVisible.value,
  (isVisible) => {
    if (!isVisible) {
      resetForm()
    }
  }
)
</script>

<style scoped>
/* 可以根据需要添加一些额外的样式 */
</style>
