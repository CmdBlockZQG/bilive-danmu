import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/live_danmu',
      component: () => import('./LiveDanmu.vue'),
    },
    {
      path: '/live_sub',
      component: () => import('./LiveSub.vue'),
    }
  ]
})

export default router