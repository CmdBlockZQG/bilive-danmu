<template>
  <video controls :src="x.videoFile" id="video"></video>

  <div id="danmu">
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
    <div id="danmu-container" @scroll="onScorll">
      <div class="danmu" v-for="i in danmu" style="margin-bottom: 8px;">
        <template v-if="i.medal.name">
          {{ i.medal.name + i.medal.level + boatDic[i.medal.boat] }} |
        </template>
        {{ i.user.name }}：<span :style="{ color: '#' + i.color }">{{ i.content }}</span>
      </div>
      <div id="anchor"></div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
const boatDic = { 0: '', 1: '总', 2: '提', 3: '舰' }

const x = window.rawData
let video, scTab, dmCtr
let hover = ref(false)
let lock = false

let pd, ps
let danmu = ref([])
let sc = ref([])
let sub = ref('')

function addSc(cur) {
  sc.value.unshift(cur)
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

function listAddDanmu(cur) {
  danmu.value.push(cur)
  if ((danmu.value.length > 1000 && hover.value === false) || danmu.value.length > 5000) {
    danmu.value.splice(0, danmu.value.length - 1000)
  }

  const l = cur.content.indexOf('【'),
        r = cur.content.indexOf('】')
  if (l !== -1 && r !== -1 && l + 1 !== r) {
    sub.value = cur.content
  }

  if (!hover.value) {
    nextTick(() => {
      lock = true
      dmCtr.scrollTop = dmCtr.scrollHeight
    })
  }
}

function frame() {
  if (video.paused) return
  let now = video.currentTime * 1000 + x.start
  for (; ps < x.sc.length; ++ps) {
    const cur = x.sc[ps]
    if(cur.time > now) break
    addSc(cur)
  }
  for (; pd < x.danmu.length; ++pd) {
    const cur = x.danmu[pd]
    if(cur.time > now) break
    listAddDanmu(cur)
  }
  window.requestAnimationFrame(frame)
}

function locateDanmu(t) {
  let l = 0, r = x.danmu.length
  for (; l + 2 < r;) {
    const m = Math.floor((l + r) / 2)
    const n = x.danmu[m].time
    if (n < t) l = m
    else r = m
  }
  for (pd = l; pd < x.danmu.length; ++pd) {
    if (x.danmu[pd].time >= t) break
  }
}

function onplay() {
  let start = video.currentTime * 1000 + x.start
  danmu.value = []
  locateDanmu(start)
  sc.value = []
  for (ps = 0; ps < x.sc.length; ++ps) {
    if (x.sc[ps].time >= start) break
    sc.value.unshift(x.sc[ps])
  }
  showSc(0)
  lockScroll()
  frame()
}



onMounted(() => {
  video = document.getElementById('video')
  scTab = new mdui.Tab('#sc-tab')
  dmCtr = document.getElementById('danmu-container')

  video.onplaying = onplay

  video.onpause = () => {

  }
})

</script>

<style scoped>
  #danmu {
    position: fixed;
    top: 0;
    left: calc(100vw - 280px);

    width: 280px;
    height: calc(100vh - 4px);
  }

  #video {
    background-color: black;
    width: calc(100vw - 280px);
    height: calc(100vh - 4px);
  }

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