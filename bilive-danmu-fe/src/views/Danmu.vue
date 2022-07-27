<script setup>
import axios from 'axios'
import { ref, onMounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

let start = ref(0)
let end = ref(0)

let danmuList = ref([])
let scList = ref([])

let loading = ref(true)

const init = async () => {
  loading.value = true
  start.value = Number(route.params.start)
  end.value = Number(route.params.end) || Date.now()

  danmuList.value = (await axios.get(`/api/danmu/${start.value}/${end.value}`)).data
  scList.value = (await axios.get(`/api/sc/${start.value}/${end.value}`)).data

  loading.value = false

  await nextTick()
  let danmuChart = echarts.init(document.getElementById('danmu-chart'))
  let data = []
  let p = 0;
  for (let rt = 0; start.value + rt <= end.value + 30 * 1000 ; rt += 30 * 1000) {
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
      boundaryGap: [0, '100%']
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
watch(() => route.params, init)

</script>

<template>
<template v-if="loading">
  <div class="mdui-progress">
    <div class="mdui-progress-indeterminate"></div>
  </div>
</template>
<template v-else>
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

  <div id="danmu-chart" style="height: 500px;"></div>

</template>
</template>