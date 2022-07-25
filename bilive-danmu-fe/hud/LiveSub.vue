<template>
  <span style="font-size: 2em; font-weight: bold; color: white;">{{ sub }}</span>
</template>

<script setup>
  import { ref } from 'vue'
  let sub = ref('')
  window.addEventListener('danmu_sub', (e) => {
    sub.value = e.detail
  })
</script>