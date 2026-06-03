import { createRouter, createWebHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHistory('/fc-1x1/'),
  routes: [
    {
      path: '/',
      name: '/HomePage',
      component: async () => import('./pages/HomePage.vue')
    },
    {
      path: '/game',
      name: '/GamePage',
      component: async () => import('./pages/GamePage.vue')
    },
    {
      path: '/game-over',
      name: '/GameOverPage',
      component: async () => import('./pages/GameOverPage.vue')
    },
    {
      path: '/history',
      name: '/HistoryPage',
      component: async () => import('./pages/HistoryPage.vue')
    },
    {
      path: '/cards',
      name: '/CardsManPage',
      component: async () => import('./pages/CardsManPage.vue')
    },
    {
      path: '/info',
      name: '/InfoPage',
      component: async () => import('./pages/InfoPage.vue')
    }
  ]
})
