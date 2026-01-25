import { createRouter, createWebHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHistory('/fc-lwk/'),
  routes: [
    {
      path: '/',
      name: '/',
      component: () => import('./pages/HomePage.vue')
    },
    {
      path: '/game',
      name: '/game',
      component: () => import('./pages/GamePage.vue')
    },
    {
      path: '/game-over',
      name: '/game-over',
      component: () => import('./pages/GameOverPage.vue')
    },
    {
      path: '/cards',
      name: '/cards',
      component: () => import('./pages/CardsPage.vue')
    },
    {
      path: '/cards-edit',
      name: '/cards-edit',
      component: () => import('./pages/CardsEditPage.vue')
    },
    {
      path: '/decks',
      name: '/decks',
      component: () => import('./pages/DecksEditPage.vue')
    },
    {
      path: '/history',
      name: '/history',
      component: () => import('./pages/HistoryPage.vue')
    },
    {
      path: '/info',
      name: '/info',
      component: () => import('./pages/ScoringRules.vue')
    }
  ]
})
