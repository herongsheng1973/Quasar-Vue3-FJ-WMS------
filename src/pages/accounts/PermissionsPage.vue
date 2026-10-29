<template>

  <q-page class="q-pa-md">
    <q-btn label="新增权限" color="primary" @click="$q.notify({ color: 'positive', message: '禁止新增权限' })" class="q-mb-md" />
    <q-table :rows="permissions" :columns="columns" row-key="id" :rows-per-page-options="[10, 20, 30, 50]">
      <template v-slot:body-cell-index="props">
        <q-td :props="props">
          {{ props.rowIndex + 1 }}
        </q-td>
      </template>
    </q-table>
  </q-page>

</template>

<script setup>
import { ref, onMounted } from 'vue'
import { fetchAllPermissions } from 'src/services/authApi'


const permissions = ref([])
const columns = [
  { name: 'index', label: '序号', field: '', align: 'center', width: '50px' },
  { name: 'name', label: '权限名称', field: 'name', align: 'center' },
  { name: 'code', label: '权限码', field: 'code', align: 'center' },
  { name: 'type', label: '类型', field: 'type', align: 'center' },
  { name: 'created_at', label: '创建时间', field: 'created_at', align: 'center' },
]

onMounted(async () => {
  const res = await fetchAllPermissions()
  permissions.value = res.data
})
</script>
