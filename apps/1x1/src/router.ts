import { createRouter, createWebHistory } from 'vue-router'

import CardsManPage from './pages/CardsManPage.vue'
import GameOverPage from './pages/GameOverPage.vue'
import GamePage from './pages/GamePage.vue'
import HistoryPage from './pages/HistoryPage.vue'
import HomePage from './pages/HomePage.vue'
import ScoringRulesPage from './pages/ScoringRulesPage.vue'

export const router = createRouter({
  history: createWebHistory('/fc-1x1/'),
  routes: [
    {
      path: '/',
      name: '/',
      component: HomePage
    },
    {
      path: '/game',
      name: '/game',
      component: GamePage
    },
    {
      path: '/game-over',
      name: '/game-over',
      component: GameOverPage
    },
    {
      path: '/history',
      name: '/history',
      component: HistoryPage
    },
    {
      path: '/cards',
      name: '/cards',
      component: CardsManPage
    },
    {
      path: '/info',
      name: '/info',
      component: ScoringRulesPage
    }
  ]
})
