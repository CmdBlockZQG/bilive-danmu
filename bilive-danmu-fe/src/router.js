import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      component: () => import('./App.vue'),
      children: [
        {
          path: '/:start/:end',
          component: () => import('./views/Danmu.vue')
        },
        {
          path: '/live',
          component: () => import('./views/Live.vue')
        }
      ]
    },
  ]
})

export default router