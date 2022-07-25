<template>
<button class="mdui-btn mdui-color-theme-accent mdui-ripple" @click="open">打开实时弹幕窗口</button>
</template>

<script setup>

function open() {
  window.open(
    '/hud/#/live_danmu',
    'live_danmu',
    'height=600,width=300,esizable'
  )
}

</script>