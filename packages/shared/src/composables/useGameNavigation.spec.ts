import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import { useGameNavigation } from './useGameNavigation'

function makeOptions(nextCardResult = false) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: '/', component: { template: '<div />' } },
      { path: '/game-over', name: '/game-over', component: { template: '<div />' } }
    ]
  })
  vi.spyOn(router, 'push')

  const nextCard = vi.fn(() => nextCardResult)
  const finishGame = vi.fn()
  const discardGame = vi.fn()
  const stopTimer = vi.fn()

  return { router, nextCard, finishGame, discardGame, stopTimer }
}

describe('useGameNavigation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('handleNextCard', () => {
    it('calls nextCard()', () => {
      const options = makeOptions(false)
      const { handleNextCard } = useGameNavigation(options)

      handleNextCard()

      expect(options.nextCard).toHaveBeenCalledOnce()
    })

    it('does not navigate when nextCard() returns false (mid-game)', () => {
      const options = makeOptions(false)
      const { handleNextCard } = useGameNavigation(options)

      handleNextCard()

      expect(options.router.push).not.toHaveBeenCalled()
      expect(options.finishGame).not.toHaveBeenCalled()
      expect(options.stopTimer).not.toHaveBeenCalled()
    })

    it('calls finishGame and navigates to /game-over when nextCard() returns true', () => {
      const options = makeOptions(true)
      const { handleNextCard } = useGameNavigation(options)

      handleNextCard()

      expect(options.finishGame).toHaveBeenCalledOnce()
      expect(options.router.push).toHaveBeenCalledWith({ name: '/game-over' })
    })

    it('calls stopTimer when nextCard() returns true (game over)', () => {
      const options = makeOptions(true)
      const { handleNextCard } = useGameNavigation(options)

      handleNextCard()

      expect(options.stopTimer).toHaveBeenCalledOnce()
    })
  })

  describe('handleGoHome', () => {
    it('calls discardGame', () => {
      const options = makeOptions()
      const { handleGoHome } = useGameNavigation(options)

      handleGoHome()

      expect(options.discardGame).toHaveBeenCalledOnce()
    })

    it('navigates to /', () => {
      const options = makeOptions()
      const { handleGoHome } = useGameNavigation(options)

      handleGoHome()

      expect(options.router.push).toHaveBeenCalledWith({ name: '/' })
    })

    it('calls stopTimer', () => {
      const options = makeOptions()
      const { handleGoHome } = useGameNavigation(options)

      handleGoHome()

      expect(options.stopTimer).toHaveBeenCalledOnce()
    })
  })
})
