<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <q-btn label="新增菜单" color="primary" @click="openDialog()" v-perm="'add_menu'" />
    </div>

    <q-table :rows="menus" :columns="columns" row-key="id" :loading="loading" :rows-per-page-options="[50, 0]" dense>
      <!-- 序号 -->
      <template v-slot:body-cell-index="props">
        <q-td class="text-center">{{ props.rowIndex + 1 }}</q-td>
      </template>

      <!-- 菜单名称 + 缩进 -->
      <template v-slot:body-cell-name="props">
        <q-td>
          <div :style="props.row.parent ? 'padding-left: 30px' : ''">
            {{ props.row.name }}
          </div>
        </q-td>
      </template>

      <!-- 图标 -->
      <template v-slot:body-cell-icon="props">
        <q-td class="text-center">
          <q-icon :name="props.row.icon" color="primary" size="sm" />
        </q-td>
      </template>

      <!-- 操作 -->
      <template v-slot:body-cell-actions="props">
        <q-td class="text-center">
          <q-btn flat size="sm" color="primary" label="编辑" @click="openDialog(props.row)" />
          <q-btn flat size="sm" color="red" label="删除" @click="delMenu(props.row.id)" />
        </q-td>
      </template>
    </q-table>

    <!-- 弹窗 -->
    <q-dialog v-model="dialogVisible" max-width="650px">
      <q-card>
        <q-card-section>
          <h5 class="text-h5">{{ form.id ? '编辑菜单' : '新增菜单' }}</h5>
        </q-card-section>

        <q-card-section class="q-pa-md">
          <q-input v-model="form.name" label="菜单名称" class="q-mb-sm" required />
          <q-input v-model="form.path" label="路由地址" class="q-mb-sm" />
          <q-input v-model="form.icon" label="图标" placeholder="mdi-home" class="q-mb-sm" />
          <q-input v-model="form.perm_code" label="权限码" class="q-mb-sm" />

          <q-select v-model="form.parent" label="上级菜单" :options="parentMenuOptions" option-label="name"
            option-value="id" emit-value map-options class="q-mb-sm" />

          <q-input v-model.number="form.sort" label="排序号" type="number" class="q-mb-sm" />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn label="取消" @click="dialogVisible = false" />
          <q-btn label="保存" color="primary" @click="saveMenu" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useQuasar } from 'quasar'
import {
  fetchAllMenus,
  createMenu,
  updateMenu,
  deleteMenu
} from 'src/services/authApi'

const $q = useQuasar()
const menus = ref([])
const loading = ref(false)
const dialogVisible = ref(false)

const form = ref({
  id: null,
  name: '',
  path: '',
  icon: '',
  perm_code: '',
  parent: null,
  sort: 1
})

const columns = [
  { name: 'index', label: '序号', field: 'index', align: 'center' },
  { name: 'name', label: '菜单名称', field: 'name', align: 'left' },
  { name: 'path', label: '路由地址', field: 'path', align: 'center' },
  { name: 'icon', label: '图标', field: 'icon', align: 'center' },
  { name: 'perm_code', label: '权限码', field: 'perm_code', align: 'center' },
  { name: 'parent_name', label: '上级菜单', field: 'parent_name', align: 'center' },
  { name: 'sort', label: '排序', field: 'sort', align: 'center' },
  { name: 'actions', label: '操作', field: 'actions', align: 'center' },
]

// 加载菜单并排序（和左侧菜单栏完全一致）
const loadMenus = async () => {
  loading.value = true
  try {
    const res = await fetchAllMenus()
    const list = res.data?.results || res.data || res

    // 🔥 核心排序：和左侧菜单完全一样的顺序
    menus.value = sortMenuLikeSidebar(list)
  } finally {
    loading.value = false
  }
}

/**
 * 🔥 核心函数：让菜单顺序和左侧边栏完全一致
 * 1. 主菜单按 sort 排序
 * 2. 子菜单跟在主菜单下面
 * 3. 子菜单也按 sort 排序
 */
function sortMenuLikeSidebar(menuList) {
  const map = {}
  const rootMenus = []

  // 1. 先分类
  menuList.forEach(menu => {
    map[menu.id] = menu
    if (!menu.parent) {
      rootMenus.push(menu)
    }
  })

  // 2. 主菜单排序
  rootMenus.sort((a, b) => a.sort - b.sort)

  // 3. 拼接主菜单 + 子菜单
  const result = []
  rootMenus.forEach(root => {
    result.push(root)

    // 把子菜单找出来排序
    const children = menuList.filter(m => m.parent === root.id)
    children.sort((a, b) => a.sort - b.sort)
    result.push(...children)
  })

  return result
}

// 上级菜单选项（只显示主菜单）
const parentMenuOptions = computed(() => {
  return menus.value.filter(item => !item.parent)
})

// 打开弹窗
const openDialog = (row = null) => {
  if (row) {
    form.value = { ...row }
  } else {
    form.value = { id: null, name: '', path: '', icon: '', perm_code: '', parent: null, sort: 1 }
  }
  dialogVisible.value = true
}

// 保存
const saveMenu = async () => {
  try {
    if (form.value.id) {
      await updateMenu(form.value.id, form.value)
    } else {
      await createMenu(form.value)
    }
    $q.notify('保存成功')
    dialogVisible.value = false
    loadMenus()
  } catch (err) {
    $q.notify('保存失败：' + err.message)
  }
}

// 删除
const delMenu = async (id) => {
  $q.dialog({
    title: '确认删除',
    message: '确定删除？',
    ok: { color: 'red' },
    cancel: true
  }).onOk(async () => {
    try {
      await deleteMenu(id)
      $q.notify('删除成功')
      loadMenus()
    } catch (e) {
      $q.notify('删除失败：' + e.message)
    }
  })
}

onMounted(() => loadMenus())
</script>
