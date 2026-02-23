import { createRouter, createWebHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHistory('/fc-1x1/'),
  routes: [
    {
      path: '/',
      name: '/',
      component: async () => import('./pages/HomePage.vue')
    },
    {
      path: '/game',
      name: '/game',
      component: async () => import('./pages/GamePage.vue')
    },
    {
      path: '/game-over',
      name: '/game-over',
      component: async () => import('./pages/GameOverPage.vue')
    },
    {
      path: '/history',
      name: '/history',
      component: async () => import('./pages/HistoryPage.vue')
    },
    {
      path: '/cards',
      name: '/cards',
      component: async () => import('./pages/CardsManPage.vue')
    },
    {
      path: '/info',
      name: '/info',
      component: async () => import('./pages/ScoringRulesPage.vue')
    }
  ]
})
