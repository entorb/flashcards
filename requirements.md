# App 3: Spelling Trainier "Eisi's Lernwörter"

App 3 is for pupils in grades 2-4 who needs to train spelling of certain words.

Again a flashcards app, similar to voc app, but much simpler

locaton: apps/spell

## Data Model

### Card Deck

- a collection of cards
- Decks are called "Kiste" in this app.
- Default: Haus, Schule, Wald, Mathe, Deutsch, Sport, Musik

### Cards

word: string
level: number (1-5)
time: seconds (max 60, default 60) - record time for mode "Verdeckt"

## Pages

### Home Page

- similar to voc app home page
- Deck selection
- Modes selection
- Focus

#### Mascot: Eisi the ice beer

Eisi is a cute ice bear mascot for the spelling trainer app. Eisi encourages users to practice their spelling skills and makes learning more enjoyable.
in game over page he can smile or grin, same rules as in voc app.
Write the smiling Eisi also as svg ao assets/icon.svg for the app icon.

#### Modes

- "Abschreiben": the word is shown, user has to type it correctly.
- "Verdeckt": the word is shown for 3 seconds, then hidden, user has to type it from memory.
- Mode "Abschreiben" is disabled if there is no card with level <3

### Game Page

- up to 10 cards per game
- The word is displayed to the user.
- for mode "Verdeckt": after user clicks ok, the word is hidden, a countdown of 3sec is shown, after 3s the user has to type the word from memory.
- for mode "Abschreiben": user types the word while it is still shown.
- correct spelling increase the level of the card and gives points: (6-<level-of the card>) (same as in voc app)
- incorrect spelling decrease the level of the card and gives no points
- checks are case sensitive
- for mode "Verdeckt": close match is accepted, similar to the voc app: 1 char off still gives 75% of the points. but level is not increased.
- for mode "Verdeckt": measure the time user needs to type the word, if word is correct and user was  faster than record for the card, give 5 bonus points.

### Info page

- same as in voc app, show the scoring rules
- show the close match scoring for mode "Verdeckt"

### History Page

- similar to voc app history page

### Cards Page

- similar to voc app cards page
- manage decks
- manage cards in current deck

## Technical

- similar tech stack as voc app
- reuse components from voc app where possible
- use same code structure as voc app
- prevent redundant code where possible
