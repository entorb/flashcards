import {
  answerCurrentCardCorrectly,
  startTypingGameMode,
  playThroughAndVerifyGameOver,
  seedTestCards
} from '../support/test-helpers'

describe('VOC Endless Level 5 mode', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.clearAllSessionStorage()
    cy.visit('/', {
      onBeforeLoad(win) {
        // Seed 4 cards with varying levels (all below level 5)
        const testCards = [
          { voc: 'Where', de: 'Wo', level: 1, time: 60 },
          { voc: 'Who', de: 'Wer', level: 2, time: 60 },
          { voc: 'What', de: 'Was', level: 3, time: 60 },
          { voc: 'Why', de: 'Warum', level: 4, time: 60 }
        ]
        win.localStorage.setItem('fc-voc-cards', JSON.stringify([{ name: 'en', cards: testCards }]))
      }
    })
  })

  it('should complete game in typing mode', () => {
    startTypingGameMode('start-endless-level5')

    // 4 cards below level 5
    cy.get('[data-cy="card-counter"]').should('contain', '4')

    // Total correct answers: level1→5=4, level2→5=3, level3→5=2, level4→5=1 = 10
    playThroughAndVerifyGameOver(10, answerCurrentCardCorrectly)
  })
})
