<template>
  <button v-if="hover" @click="lockScroll" style="position: fixed; right: 0; top: 0;" class="mdui-btn mdui-btn-icon mdui-btn-dense mdui-color-theme-accent mdui-ripple">
    <i class="mdui-icon material-icons">arrow_downward</i>
  </button>

  <div id="sub-container" @scroll="onScorll">
    <div v-for="i in sub" style="font-size: 2em; font-weight: bold; color: white;">{{ i }}</div>
  </div>
</template>

<script setup>
  import { ref, onMounted, nextTick } from 'vue'

  let subCtr

  let sub = ref([])
  let hover = ref(false)
  let lock = false

  onMounted(() => {
    subCtr = document.getElementById('sub-container')
  })

  window.addEventListener('danmu_sub', (e) => {
    sub.value.push(e.detail)
    if ((sub.value.length > 100 && hover.value === false) || sub.value.length > 1000) {
      sub.value.splice(0, danmu.value.length - 100)
    }
    if (hover.value) return
    nextTick(() => {
      lock = true
      subCtr.scrollTop = subCtr.scrollHeight
    })
  })

  function onScorll() {
    if (lock) {
      lock = false
    } else {
      hover.value = true
    }
  }

  function lockScroll() {
    hover.value = false
    lock = true
    subCtr.scrollTop = subCtr.scrollHeight
  }
</script>

<style scoped>
  #sub-container {
    background-color: #303030;
    color: white;

    height: calc(100vh - 16px);
    overflow-y: scroll;

    padding: 8px;
  }
</style>