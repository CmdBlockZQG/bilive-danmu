import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      component: () => import('./App.vue'),
      children: [
        {
          path: '/',
          component: () => import('./views/Live.vue')
        },
        {
          path: '/file',
          component: () => import('./views/File.vue')
        },
        {
          path: '/:start/:end',
          component: () => import('./views/Danmu.vue')
        }
      ]
    }
  ]
})

export default router