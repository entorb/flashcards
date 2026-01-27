# TODO

## Tech

## all

## 1x1

## lwk

## voc

## Code Review

One high-level point to consider is the adoption of the new useGameStateFlow.ts. While initializeGameFlow is used to start a game, the other functions in that file for managing the game session (like getGameCards, updateGameStats, etc.) are not yet used. The apps still rely on their own mechanisms for state management during the game. This might be intentional for a phased rollout, but it's worth noting that the new game state flow pattern is not fully implemented yet.

apps/1x1/src/composables/useGameStore.ts
The logic for calculating points is re-implemented here. This PR introduces a shared calculatePoints function in packages/shared/src/services/scoring.ts. To promote code reuse and consistency, consider using it here. You would need to import it first.

---

## Additional Code Improvement Proposals

### High Priority

#### Progressive Enhancement

- Add loading states with skeletons for better perceived performance
- Implement service worker caching strategies for faster subsequent loads
- Add offline mode indicator

#### Accessibility Improvements

- Add ARIA labels to interactive elements
- Improve keyboard navigation (tab order, focus indicators)
- Add screen reader announcements for game feedback
- Ensure color contrast meets WCAG AA standards
- Add skip navigation links

#### Performance Optimization

- Lazy load route components
- Add virtual scrolling for history list when it grows large
- Debounce localStorage writes
- Use shallowRef where deep reactivity isn't needed

### Medium Priority

#### Enhanced Statistics

- Add charts/graphs for progress over time (using Chart.js or similar)
- Show average time per level
- Display success rate trends
- Add weekly/monthly statistics views

#### Gamification

- Add achievements/badges system
- Implement streaks (days played consecutively)
- Add sound effects for correct/wrong answers (with mute toggle)
- Celebrate milestones (100 correct answers, all level 5, etc.)

#### Settings Page

- Add dedicated settings page
- Allow customization of auto-submit behavior
- Configurable timer settings
- Theme selection
- Sound effects toggle

#### Advanced Game Modes

- Timed challenge mode (60 seconds, max points)
- Endless mode
- Multiplayer mode (local)
- Practice mode for specific cards
