import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/live_danmu',
      component: () => import('./LiveDanmu.vue'),
    }
  ]
})

export default router