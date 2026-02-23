import { createRouter, createWebHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHistory('/fc-voc/'),
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
      path: '/decks-edit',
      name: '/decks-edit',
      component: async () => import('./pages/DecksEditPage.vue')
    },
    {
      path: '/history',
      name: '/history',
      component: async () => import('./pages/HistoryPage.vue')
    },
    {
      path: '/stats',
      name: '/stats',
      component: async () => import('./pages/CardsManPage.vue')
    },
    {
      path: '/info',
      name: '/info',
      component: async () => import('./pages/ScoringRulesPage.vue')
    }
  ]
})
