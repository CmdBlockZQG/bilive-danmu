<script setup>
import axios from 'axios'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

let ls = ref([])
let live = ref(0)

function timeToText(time) {
  let t = new Date(time),
        m = t.getMonth() + 1,
        d = t.getDate(),
        h = t.getHours()
  return `${m}月${d}日${h}点场`
}

onMounted(async () => {
  const { data } = await axios.get('/api/live')
  let i = 0
  if (data[0].type) { // 现在正在直播
    live.value = data[0].time
    i = 1
  }
  // i是下播信息 i+1是开播信息
  for (; i < data.length; i += 2) {
    let start = data[i + 1].time,
        end = data[i].time
    ls.value.push({
      start,
      end,
      text: timeToText(start)
    })
  }
})

function jumpHome() {
  router.push(`/`)
}

function jumpLive() {
  router.push(`/${live.value}/0`)
}

function jump(i) {
  router.push(`/${ls.value[i].start}/${ls.value[i].end}`)
}

</script>

<template>
  <div class="mdui-drawer mdui-shadow-6" id="left-drawer">
    <ul class="mdui-list">
      <li class="mdui-list-item mdui-ripple">
        <i class="mdui-list-item-icon mdui-icon material-icons">live_tv</i>
        <div class="mdui-list-item-content" @click="jumpHome">直播实时</div>
      </li>

      <li class="mdui-subheader">进行中的直播</li>
      <li v-if="live" @click="jumpLive()" class="mdui-list-item mdui-ripple">{{ timeToText(live) }}</li>

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
