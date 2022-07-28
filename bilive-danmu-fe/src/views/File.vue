<template>
<button class="mdui-btn mdui-color-theme-accent mdui-ripple" @click="download">下载视频</button>
<ul class="mdui-list">
  <li v-for="file in files" class="mdui-list-item">
    <span>{{ file }}</span>
    <button class="mdui-btn mdui-btn-icon" @click="open(file)">
      <i class="mdui-icon material-icons">open_in_browser</i>
    </button>
    <button class="mdui-btn mdui-btn-icon" @click="del(file)">
      <i class="mdui-icon material-icons">delete</i>
    </button>
  </li>
</ul>
<button class="mdui-fab mdui-fab-fixed mdui-ripple" @click="init">
  <i class="mdui-icon material-icons">refresh</i>
</button>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import axios from 'axios'

let files = ref([])

const init = async () => {
  files.value = (await axios.get(`/api/video`)).data
}

function download() {
  mdui.prompt('输入BV号(带BV两个字母) 请耐心等待，自行刷新文件列表',
    (val) => {
      axios.post(`/api/youget/${val}`)
    }
  )
}

function del(file) {
  mdui.confirm(`确认要删除${file}吗？`, async () => {
    await axios.delete(`/api/video/${file}`)
    init()
  })
}

function open(file) {
  window.open(`/api/video/${file}`)
}

onMounted(init)

</script>