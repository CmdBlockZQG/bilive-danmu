<script setup>
import axios from 'axios'
import { ref, onMounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { saveAs } from 'file-saver'

const route = useRoute()

let start = ref(0)
let end = ref(0)

let danmuList = ref([])
let scList = ref([])
let rawData

let loading = ref(true)

const init = async () => {
  loading.value = true
  start.value = Number(route.params.start)
  end.value = Number(route.params.end) || Date.now()

  rawData = {
    danmu: (await axios.get(`/api/danmu/${start.value}/${end.value}`)).data,
    sc: (await axios.get(`/api/sc/${start.value}/${end.value}`)).data
  }

  danmuList.value = rawData.danmu
  scList.value = rawData.sc

  loading.value = false

  await nextTick()
  const sl = 30
  let danmuChart = echarts.init(document.getElementById('danmu-chart'))
  let data = []
  let p = 0;
  for (let rt = 0; start.value + rt <= end.value + sl * 1000 ; rt += sl * 1000) {
    let res = 0
    const t = start.value + rt
    for (;; ++p) {
      if (!danmuList.value[p] || danmuList.value[p].time > t) break
      ++res;
    }
    data.push([t, res])
  }
  danmuChart.setOption({
    tooltip: {
      trigger: 'axis',
      position: function (pt) {
        return [pt[0], '10%'];
      }
    },
    toolbox: {
      feature: {
        dataZoom: {
          yAxisIndex: 'none'
        },
        restore: {},
        saveAsImage: {}
      }
    },
    xAxis: {
      type: 'time',
      boundaryGap: false
    },
    yAxis: {
      type: 'value',
      boundaryGap: [0, '100%'],
      max: 'dataMax'
    },
    dataZoom: [
      {
        type: 'inside',
        start: 0,
        end: 100
      },
      {
        start: 0,
        end: 100
      }
    ],
    series: [
      {
        name: '弹幕数',
        type: 'line',
        smooth: true,
        symbol: 'none',
        areaStyle: {},
        data: data
      }
    ]
  })

}
onMounted(init)
watch(() => route.params.start, init)
watch(() => route.params.end, init)

function timeToText(time) {
  let t = new Date(time),
        m = t.getMonth() + 1,
        d = t.getDate(),
        h = t.getHours()
  return `${m}月${d}日${h}点场`
}

async function replay() {
  const files = (await axios.get(`/api/video`)).data
  let file = '', timeText = timeToText(start.value)
  for (let i = 0; i < files.length; ++i) {
    if (files[i].indexOf(timeText) !== -1) {
      file = files[i]
      break
    }
  }
  if (!file) {
    mdui.alert('未找到直播录像！请先下载')
    return
  }
  let win = window.open(
    '/hud/#/play', 
    `replay${Date.now()}`,
    'height=450,width=960,esizable'
  )
  win.rawData = {
    videoFile: `/api/video/${file}`,
    danmu: rawData.danmu,
    sc: rawData.sc,
    start: start.value,
    end: end.value
  }
}

async function cloud() {
  const exp = Number(document.getElementById('cloud-exp').value)
  const ratio = Number(document.getElementById('cloud-ratio').value)
  let { data } = await axios.get(`/api/seg/${start.value}/${end.value}`)
  data = data.slice(0, 99)
  for (let i = 0; i < data.length; ++i) {
    data[i][1] = Math.pow(data[i][1], exp) * ratio
  }
  WordCloud(document.getElementById('cloud-canvas'), { list: data })
}

function formatTime(t) {
  let x = t - start.value
  const h = Math.floor(x / (3600 * 1000)).toString().padStart(2, '0')
  x %= 3600 * 1000
  const m = Math.floor(x / (60 * 1000)).toString().padStart(2, '0')
  x %= 60 * 1000
  const s = Math.floor(x / 1000).toString().padStart(2, '0')
  x %= 1000
  return `${h}:${m}:${s},${x}`
}

function srt() {
  let res = ''
  let p = 0
  let last = null
  for (let i of rawData.danmu) {
    const l = i.content.indexOf('【'),
          r = i.content.indexOf('】')
    if (l === -1 || r === -1 || l + 1 === r) continue
    if (!last) {
      last = i
      continue
    }
    const endTime = Math.min(last.time + 5000, i.time - 1)
    res += `${++p}\r\n${formatTime(last.time)} --> ${formatTime(endTime)}\r\n${last.content}\r\n\r\n`
    last = i
  }
  if (last) res += `${++p}\r\n${formatTime(last.time)} --> ${formatTime(last.time + 5000)}\r\n${last.content}\r\n\r\n`
  const blob = new Blob([res], {
    type: 'text/plain;charset=utf-8'
  })
  saveAs(blob, `${start.value}.srt`)
}

</script>

<template>
  <template v-if="loading">
    <div class="mdui-progress">
      <div class="mdui-progress-indeterminate"></div>
    </div>
  </template>
  <template v-else>
    <button v-if="route.params.end === 0" class="mdui-fab mdui-fab-fixed mdui-ripple" @click="init">
      <i class="mdui-icon material-icons">refresh</i>
    </button>
    <div class="mdui-table-fluid">
      <table class="mdui-table">
        <tbody>
          <tr>
            <td>开始时间</td>
            <td>{{ (new Date(start)).toLocaleString() }}</td>
          </tr>
          <tr>
            <td>结束时间</td>
            <td>{{ (new Date(end)).toLocaleString() }}</td>
          </tr>
          <tr>
            <td>弹幕总数</td>
            <td>{{ danmuList.length }}</td>
          </tr>
          <tr>
            <td>SC总数</td>
            <td>{{ scList.length }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <button class="mdui-btn mdui-color-theme-accent mdui-ripple button" @click="replay">播放回放</button>
    <button class="mdui-btn mdui-color-theme-accent mdui-ripple button" @click="srt">下载同传srt</button>

    <div id="danmu-chart" style="height: 400px;"></div>
  </template>
  <div class="mdui-textfield input">
    <label class="mdui-textfield-label">权值乘方</label>
    <input class="mdui-textfield-input" type="text" value="0.6" id="cloud-exp"/>
  </div>
  <div class="mdui-textfield input">
    <label class="mdui-textfield-label">缩放</label>
    <input class="mdui-textfield-input" type="text" value="0.4" id="cloud-ratio"/>
  </div>
  <button class="mdui-btn mdui-color-theme-accent mdui-ripple button" @click="cloud">计算词云</button>
  <canvas width="1200" height="900" id="cloud-canvas"></canvas>

</template>

<style scoped>
.button {
  margin-top: 8px;
  margin-right: 16px;
}

.input {
  display: inline-block;
  width: 96px;
  margin-top: 8px;
  margin-right: 16px;
}
</style>