<script setup>
import axios from 'axios'
import { ref, onMounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'

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

let files = ref([])
async function selectFile() {
  let dialog = new mdui.Dialog('#file-dialog')
  files.value = (await axios.get(`/api/video`)).data
  await nextTick()
  dialog.open()
}

function replay(file) {
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

    <button class="mdui-btn mdui-color-theme-accent mdui-ripple" @click="selectFile">播放回放</button>

    <div id="danmu-chart" style="height: 400px;"></div>
  </template>
  <div class="mdui-dialog" id="file-dialog">
    <div class="mdui-dialog-title">选择视频文件</div>
    <div class="mdui-dialog-content">
      <ul class="mdui-list">
        <li v-for="file in files" class="mdui-list-item mdui-ripple" @click="replay(file)">{{ file }}</li>
      </ul>
    </div>
  </div>
</template>