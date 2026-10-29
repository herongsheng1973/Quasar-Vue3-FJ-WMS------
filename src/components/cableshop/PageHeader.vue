<template>
  <div class="page-header q-mb-md flex">
    <h3 class="text-primary text-weight-bold">{{ title }}</h3>

  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true
  }
})
</script>

<style scoped>
.page-header {
  padding-bottom: 8px;
}
</style>
