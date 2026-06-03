import { createRouter, createWebHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHistory('/fc-lwk/'),
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
      path: '/cards',
      name: '/CardsManPage',
      component: async () => import('./pages/CardsManPage.vue')
    },
    {
      path: '/cards-edit',
      name: '/CardsEditPage',
      component: async () => import('./pages/CardsEditPage.vue')
    },
    {
      path: '/decks',
      name: '/DecksEditPage',
      component: async () => import('./pages/DecksEditPage.vue')
    },
    {
      path: '/history',
      name: '/HistoryPage',
      component: async () => import('./pages/HistoryPage.vue')
    },
    {
      path: '/info',
      name: '/InfoPage',
      component: async () => import('./pages/InfoPage.vue')
    }
  ]
})
