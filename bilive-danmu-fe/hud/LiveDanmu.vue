<template>
<div class="mdui-tab mdui-tab-scrollable mdui-theme-layout-dark" id="sc-tab" mdui-tab style="padding: 0; min-height: 32px;">
  <a v-for="(p, i) in sc" class="mdui-ripple sc-tab-item" @click="showSc(i)">￥{{ p.price }} {{ p.user.name }}</a>
</div>
<div id="sc-content">
  <template v-if="sc[0]">
    <p><b>￥{{ sc[curSc].price }} | {{ sc[curSc].user.name }}</b></p>
    {{ sc[curSc].content }}
  </template>
</div>
<div class="mdui-divider"></div>
<button v-if="hover" @click="lockScroll" style="position: fixed; right: 0; top: 160px;" class="mdui-btn mdui-btn-icon mdui-btn-dense mdui-color-theme-accent mdui-ripple">
  <i class="mdui-icon material-icons">arrow_downward</i>
</button>

<button @click="openSub" style="position: fixed; left: 0; top: 120px;" class="mdui-btn mdui-btn-icon mdui-btn-dense mdui-color-theme-accent mdui-ripple">
  <i class="mdui-icon material-icons">subtitles</i>
</button>
<div id="danmu-container" @scroll="onScorll">
  <div class="danmu" v-for="i in danmu" style="margin-bottom: 8px;">
    <template v-if="i.medal.name">
      {{ i.medal.name + i.medal.level + boatDic[i.medal.boat] }} |
    </template>
    {{ i.user.name }}：<span :style="{ color: '#' + i.color }">{{ i.content }}</span>
  </div>
  <div id="anchor"></div>
</div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
const boatDic = { 0: '', 1: '总', 2: '提', 3: '舰' }

let scTab
let dmCtr
let subWin

let ws
let danmu = ref([])
let sc = ref([])

let hover = ref(false)
let lock = false

onMounted(() => {
  scTab = new mdui.Tab('#sc-tab')
  dmCtr = document.getElementById('danmu-container')

  ws = new WebSocket('ws://127.0.0.1:3001/')
  ws.onopen = () => {
    console.log('* Websocket链接建立')
  }

  ws.onmessage = (e) => {
    const data = JSON.parse(e.data)
    if (data.price) {
      onSc(data)
    } else {
      onDanmu(data)
    }
  }
})

function onDanmu(data) {
  danmu.value.push(data)
  if (subWin) {
    const l = data.content.indexOf('【'),
          r = data.content.indexOf('】')
    if (l !== -1 && r !== -1 && l + 1 !== r) {
      subWin.dispatchEvent(new CustomEvent('danmu_sub', { detail: data.content }))
    }
  }
  if (hover.value) return
  nextTick(() => {
    lock = true
    dmCtr.scrollTop = dmCtr.scrollHeight
  })
}

function onSc(data) {
  sc.value.unshift(data)
  showSc(0)
}

let curSc = ref(0)

function showSc(index) {
  curSc.value = index
  nextTick(() => {
    scTab.handleUpdate()
    scTab.show(index)
  })
}

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
  dmCtr.scrollTop = dmCtr.scrollHeight
}

function openSub() {
  subWin = window.open(
    '/hud/#/live_sub',
    'live_sub',
    'height=20,width=800,esizable'
  )
  subWin.onbeforeunload = () => {
    subWin = null
  }
}

</script>

<style scoped>
  a.sc-tab-item {
    padding: 8px;
    min-height: 0;
  }

  #sc-content {
    background-color: #303030;
    color: white;
    border-bottom: solid white 1px;

    height: 108px;
    padding: 8px;
    word-break: break-all;
    overflow-y: scroll;
  }

  #danmu-container {
    background-color: #303030;
    color: white;

    height: calc(100vh - 180px);
    overflow-y: scroll;

    padding: 8px;
  }
</style>