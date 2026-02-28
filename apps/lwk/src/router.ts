import { createRouter, createWebHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHistory('/fc-lwk/'),
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
      path: '/cards',
      name: '/cards',
      component: async () => import('./pages/CardsManPage.vue')
    },
    {
      path: '/cards-edit',
      name: '/cards-edit',
      component: async () => import('./pages/CardsEditPage.vue')
    },
    {
      path: '/decks',
      name: '/decks',
      component: async () => import('./pages/DecksEditPage.vue')
    },
    {
      path: '/history',
      name: '/history',
      component: async () => import('./pages/HistoryPage.vue')
    },
    {
      path: '/info',
      name: '/info',
      component: async () => import('./pages/InfoPage.vue')
    }
  ]
})
