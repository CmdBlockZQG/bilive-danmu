<template>
  <video controls :src="x.videoFile" id="video"></video>
  <canvas id="canvas"></canvas>
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
      <div class="danmu" v-for="i in danmu" style="margin-bottom: 8px; ">
        <template v-if="i.medal.name">
          {{ i.medal.name + i.medal.level + boatDic[i.medal.boat] }} |
        </template>
        {{ i.user.name }}：<span :style="{ color: '#' + i.color }">{{ i.content }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
const boatDic = { 0: '', 1: '总', 2: '提', 3: '舰' }
const pixelRatio = (() => {
  const ctx = document.createElement('canvas').getContext('2d'),
        dpr = window.devicePixelRatio || 1,
        bsr = ctx.backingStorePixelRatio || 1
  return dpr / bsr
})()

const x = window.rawData
let video, scTab, dmCtr, canvas
let canvasCtx
let hover = ref(false)
let lock = false

let pd, ps
let danmu = ref([])
let sc = ref([])
let sub = ref('')

const renderFontSize = 24
const renderGap = 12
let canvasW, canvasH
let renderQueue = []
let rowMaxX = []
let rowNum = 1

let bottomDanmu = [], topDanmu = []

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

function resizeCanvas() {
  const h = video.offsetHeight,
        w = video.offsetWidth
  if (canvas.offsetHeight !== h || canvas.offsetWidth !== w) {
    rowNum = Math.floor(h / renderFontSize)
    canvasW = w
    canvasH = h
    canvas.width = w * pixelRatio
    canvas.height = h * pixelRatio
    canvas.style.width = w + 'px'
    canvas.style.height = h + 'px'

    canvasCtx = canvas.getContext('2d')
    canvasCtx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
    canvasCtx.textBaseline = 'top'
    canvasCtx.font = `bold ${renderFontSize}px Microsoft YaHei`
    canvasCtx.strokeStyle = '#000000'
  }
}

function renderText(content, x, y, color) {
  canvasCtx.strokeText(content, x, y)
  canvasCtx.fillStyle = color
  canvasCtx.fillText(content, x, y)
}

function renderDanmu(cur) {
  let row = -1, minX = 0
  for (let i = 0; i < rowNum; ++i) {
    if (rowMaxX[i] < rowMaxX[minX]) minX = i
    if (rowMaxX[i] <= canvasW - renderGap) {
      row = i
      break
    }
  }
  if (row === -1) row = minX
  const next = {
    x: canvasW,
    y: row * renderFontSize,
    w: canvasCtx.measureText(cur.content).width,
    row: row,
    color: '#' + cur.color,
    content: cur.content
  }
  rowMaxX[next.row] = Math.max(rowMaxX[next.row], next.x + next.w)
  renderQueue.push(next)

  renderText(next.content, next.x, next.y, next.color)
}

function renderFixedDanmu() {
  for (let i = 0; i < topDanmu.length; ++i) {
    let next = topDanmu[i]
    if (!next) continue
    next.x = (canvasW - next.w) / 2
    next.y = i * renderFontSize
    renderText(next.content, next.x, next.y, next.color)
  }
  for (let i = 0; i < bottomDanmu.length; ++i) {
    let next = bottomDanmu[i]
    if (!next) continue
    next.x = (canvasW - next.w) / 2
    next.y = canvasH - (i + 1) * renderFontSize
    renderText(next.content, next.x, next.y, next.color)
  }
}

function frame() {
  if (video.paused) return
  
  var w = canvasW
  var h = canvasH
  canvasCtx.clearRect(0, 0, w, h)
  rowMaxX = Array(rowNum).fill(0)

  renderQueue = renderQueue.filter((cur) => {
    if (cur.x + cur.w < 0) return false
    cur.x -= 1
    rowMaxX[cur.row] = Math.max(rowMaxX[cur.row], cur.x + cur.w)

    renderText(cur.content, cur.x, cur.y, cur.color)

    return true
  })

  let t = Date.now()
  bottomDanmu = bottomDanmu.map((cur) => {
    if (cur && cur.time + 5000 < t) return false
    else return cur
  })
  topDanmu = topDanmu.map((cur) => {
    if (cur && cur.time + 5000 < t) return false
    else return cur
  })

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
    switch (cur.position) {
      case 1:
        renderDanmu(cur)
        break
      case 4:
        for (let i = 0; i <= bottomDanmu.length; ++i) {
          if (!bottomDanmu[i]) {
            bottomDanmu[i] = {
              w: canvasCtx.measureText(cur.content).width,
              time: Date.now(),
              color: '#' + cur.color,
              content: cur.content
            }
            break
          }
        }
        break
      case 5:
        for (let i = 0; i <= topDanmu.length; ++i) {
          if (!topDanmu[i]) {
            topDanmu[i] = {
              w: canvasCtx.measureText(cur.content).width,
              time: Date.now(),
              color: '#' + cur.color,
              content: cur.content
            }
            break
          }
        }
        break
    }
  }
  renderFixedDanmu()
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
  canvas = document.getElementById('canvas')
  scTab = new mdui.Tab('#sc-tab')
  dmCtr = document.getElementById('danmu-container')

  resizeCanvas()
  window.onresize = resizeCanvas

  video.onplaying = onplay
})

</script>

<style scoped>
  body {
    margin: 0;
  }

  #danmu {
    position: fixed;
    top: 0;
    left: calc(100vw - 280px);

    width: 280px;
    height: calc(100vh - 4px);
  }

  #video {
    width: calc(100vw - 280px);
    height: calc(100vh - 4px);

    background-color: black;
  }

  #canvas {
    position: fixed;
    top: 0;
    left: 0;

    z-index: 10;

    pointer-events: none;
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
    word-break: break-all;

    padding: 8px;
  }
</style>