<template>
  <q-btn :icon="isPlaying ? 'volume_up' : 'volume_off'" color="primary" @click="toggleMusic"
    class="fixed-bottom-right q-mb-md q-mr-md" fab mini />
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const isPlaying = ref(false)
const audio = ref(null)

// 初始化音频
onMounted(() => {
  audio.value = new Audio('/audio/bgm.mp3')
  audio.value.loop = true // 循环播放
  audio.value.volume = 0.3 // 音量调整
})

// 切换音乐播放状态
const toggleMusic = () => {
  if (!audio.value) return

  if (isPlaying.value) {
    audio.value.pause()
  } else {
    audio.value.play().catch(err => {
      console.error('播放失败:', err)
      // 处理自动播放限制（需要用户交互触发）
    })
  }
  isPlaying.value = !isPlaying.value
}

// 组件卸载时暂停音乐
onUnmounted(() => {
  if (audio.value) {
    audio.value.pause()
  }
})
</script>
