<script setup>
import axios from 'axios'
import { ref, onMounted } from 'vue'

let ls = ref([])

onMounted(async () => {
  const { data } = await axios.get('/api/live')
  let i = 0
  if (data[0].type) i = 1 // 现在正在直播
  // i是下播信息 i+1是开播信息
  for (; i < data.length; i += 2) {
    let start = data[i + 1].time,
        end = data[i].time
    let t = new Date(start),
        m = t.getMonth() + 1,
        d = t.getDate(),
        h = t.getHours()
    ls.value.push({
      start,
      end,
      text: `${m}月${d}日${h}点场`
    })
  }
})

function jump(i) {
  console.log(ls.value[i].start, ls.value[i].end)
}

</script>

<template>
  <div class="mdui-drawer mdui-shadow-6" id="left-drawer">
    <ul class="mdui-list">
      <li class="mdui-list-item mdui-ripple">
        <i class="mdui-list-item-icon mdui-icon material-icons">live_tv</i>
        <div class="mdui-list-item-content">直播实时</div>
      </li>
      <li class="mdui-subheader">历史直播</li>
      <li v-for="(p, i) in ls" @click="jump(i)" class="mdui-list-item mdui-ripple">{{ p.text }}</li>
    </ul>
  </div>
  <div class="mdui-container" style="padding-top: 24px;">
    <router-view></router-view>
  </div>
</template>

<style scoped>

</style>
