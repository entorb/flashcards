/**
 * German language text strings for educational apps
 * All user-facing text is centralized here for easy maintenance and i18n
 * Future: Support additional languages with i18n plugin
 */

// cspell:disable

// Common text constants to avoid duplication
const SCORING_TITLE = 'Scoring-Regeln' as const
const BASE_POINTS_TITLE = '1. Basispunkte' as const
const BASE_POINTS_DESCRIPTION =
  'Die Grundlage für die Punktzahl ist das Level der Karte. Aufgaben, die du weniger gut kennst (niedrigeres Level), geben mehr Punkte.' as const

const LEVEL_TEXT = {
  level1: 'Level 1: 5 Punkte',
  level2: 'Level 2: 4 Punkte',
  level3: 'Level 3: 3 Punkte',
  level4: 'Level 4: 2 Punkte',
  level5: 'Level 5: 1 Punkt'
} as const

const DAILY_BONUS_TEXT = {
  firstGame: 'Erstes Spiel des Tages: +5 Bonuspunkte',
  streakGame: 'Alle 5 Spiele des Tages: +5 Bonuspunkte'
} as const

const SPEED_BONUS_TEXT =
  'Wenn du eine Aufgabe schneller als beim letzten Mal richtig beantwortest: +5 Bonuspunkte' as const

export const TEXT_DE = {
  // App titles (used in vite.config.ts manifests)
  appTitle_1x1: "Vyvit's 1x1 Spiel",
  appTitle_voc: "Rabat's Wortspiel",
  appTitle_spell: "Eisi's Lernwörter",

  footer: {
    gamesPlayedByAll: 'Spiele gespielt.',
    noDataStored: 'Es werden keine persönlichen Daten gespeichert.'
  },

  pwaInstall: {
    title: 'Als App installieren',
    android: 'Android:',
    androidInstructions: 'Menü (3 Punkte) → "Zum Startbildschirm hinzufügen"',
    iPhone: 'iPhone:',
    iPhoneInstructions: 'Teilen-Symbol → "Zum Home-Bildschirm"'
  },

  pwaUpdate: {
    confirmMessage: 'Neue Version verfügbar. Neu laden?'
  },

  // Common actions
  common: {
    start: 'Starten',
    continue: 'Weiter',
    reset: 'Zurücksetzen', // in LevelDistribution
    check: 'Prüfen',
    wait: 'Merken...',
    yes: 'Ja',
    no: 'Nein',
    cancel: 'Abbrechen',
    correct: 'Richtig',
    incorrect: 'Falsch'
  },

  // Navigation
  nav: {
    history: 'Verlauf',
    cards: 'Karten',
    backToHome: 'Zurück zur Startseite',
    infoTooltip: 'Info zu Scoring-Regeln'
  },

  cards: {
    cardsPerLevel: 'Karten pro Level',
    legend: 'Legende',
    edit: 'Bearbeiten',
    rename: 'Umbenennen',
    delete: 'Löschen',
    legendBackground: 'Hintergrund: Level (Rot=1 → Grün=5)',
    legendTextColor: 'Schriftfarbe: Zeit (Grün=schnell → Rot=langsam)'
  },

  // Common words
  words: {
    cards: 'Karten',
    level: 'Level',
    focus: 'Fokus',
    mode: 'Modus',
    direction: 'Richtung',
    points: 'Punkte',
    bonusPoints: 'Bonus',
    firstGameBonus: 'Erstes Spiel heute',
    streakGameBonus: 'Spiel des Tages',
    vocable: 'Vokabel',
    german: 'Deutsch',
    actions: 'Aktionen',
    delete: 'Löschen',
    deck: 'Deck'
  },

  // Common focus options
  focusOptions: {
    weak: 'Schwache',
    strong: 'Starke',
    medium: 'Mittlere',
    slow: 'Langsame'
  },

  // 1x1 App specific
  multiply: {
    selection: 'Reihe',
    selectionSquares: 'x²',
    extendedCards: {
      title: 'Weitere Karten',
      feature1x2: '1x2',
      feature1x12: '1x12',
      feature1x20: '1x20'
    },
    info: {
      title: SCORING_TITLE,
      description:
        'Dein Punktestand (Score) wird basierend auf mehreren Faktoren berechnet, um einen Anreiz für das Lernen schwierigerer Aufgaben zu schaffen.',
      basePointsTitle: BASE_POINTS_TITLE,
      basePointsDescription: BASE_POINTS_DESCRIPTION,
      basePointsLevel1: LEVEL_TEXT.level1,
      basePointsLevel2: LEVEL_TEXT.level2,
      basePointsLevel3: LEVEL_TEXT.level3,
      basePointsLevel4: LEVEL_TEXT.level4,
      basePointsLevel5: LEVEL_TEXT.level5,
      dailyBonusesTitle: '2. Tages-Boni',
      dailyBonusFirstGame: DAILY_BONUS_TEXT.firstGame,
      dailyBonusStreak: DAILY_BONUS_TEXT.streakGame,
      speedBonusTitle: '3. Geschwindigkeits-Bonus',
      speedBonusDescription: SPEED_BONUS_TEXT
    }
  },

  // Wordplay App specific
  voc: {
    mode: {
      multipleChoice: 'Multiple Choice',
      blind: 'Blind',
      typing: 'Schreiben',
      tooGoodForMultipleChoice: 'Dafür bist du zu gut'
    },
    game: {
      revealAnswer: 'Antwort aufdecken',
      wasYourAnswerCorrect: 'War deine Antwort richtig?',
      typePlaceholder: 'Antwort schreiben...'
    },
    direction: {
      voc_de: 'Voc → DE',
      de_voc: 'DE → Voc'
    },
    cards: {
      // title: 'Kartenverwaltung',
      header:
        'Du kannst mehrere Karten-<strong>Decks</strong> anlegen (z.B. Kapitel deines Buches oder verschiedene Sprachen). Ein Deck enthält mehrere <strong>Karten</strong>. Jede Karte hat ein <strong>Level</strong> (1=unbekannt bis 5=sicher). Richtige Antworten im Spiel erhöhen das Level, falsche verringern es.',
      export: 'Raus kopieren',
      import: 'Rein kopieren',
      copied: 'Kopiert!',
      reset: 'Alle Karten löschen',
      moveAll: 'Verschieben',
      moveAllTitle: 'Alle Karten verschieben',
      dangerZoneTitle: 'Gefahrenzone',
      importDialogTitle: 'Karten importieren',
      importDialogMessage: 'Füge deine Karten aus Excel (oder so) ein (Format: Voc | De | Level)',
      importHintExcel:
        'Tipps: Unterstützt Wortalternativen mit "/": "Welche/Welcher". Verwende Excel order Google Tabellen um mehrere Vokabellisten zu verwalten und zu speichern.',
      confirmMoveTitle: 'Verschieben bestätigen',
      confirmMoveMessage: 'Alle {count} Karten auf Level {level} setzen?',
      confirmResetTitle: 'Zurücksetzen bestätigen',
      confirmResetMessage:
        'Diese Aktion setzt alle Karten und deinen Lernfortschritt zurück. Fortfahren?',
      emptyTextError: 'Das Textfeld ist leer.',
      noDelimiterError: 'Konnte kein Trennzeichen (Tab, Komma, Semikolon) finden.',
      noCardsFoundError:
        'Keine gültigen Karten gefunden. Format: Voc{delimiter}De{delimiter}LEVEL (optional)',
      clipboardError: 'Zugriff auf Zwischenablage fehlgeschlagen.',
      invalidLevelError: 'Bitte gib ein Level zwischen {min} und {max} ein.',
      importSuccess: '{count} Karten erfolgreich importiert!',
      resetSuccess: 'Kartenstapel wurde zurückgesetzt!',
      editCardsTitle: 'Karten Bearbeiten',
      editCardsButton: 'Bearbeiten',
      addNewCard: 'Neue Karte',
      vocPlaceholder: 'Vocable',
      dePlaceholder: 'Deutsch',
      save: 'Speichern',
      validationEnEmpty: 'Das englische Wort darf nicht leer sein.',
      validationDeEmpty: 'Das deutsche Wort darf nicht leer sein.',
      unsavedChangesTitle: 'Ungespeicherte Änderungen',
      unsavedChangesMessage: 'Du hast ungespeicherte Änderungen. Möchtest du die Seite verlassen?'
    },
    decks: {
      title: 'Deck',
      addDeck: 'Neues Deck',
      deckNamePlaceholder: 'Deck Name',
      confirmRemoveTitle: 'Deck entfernen?',
      confirmRemoveMessage: 'Möchtest du das Deck "{name}" wirklich löschen?',
      lastDeckError: 'Das letzte Deck kann nicht gelöscht werden.',
      duplicateNameError: 'Ein Deck mit diesem Namen existiert bereits.',
      emptyNameError: 'Der Deck-Name darf nicht leer sein.'
    },
    info: {
      title: SCORING_TITLE,
      description:
        'Dein Punktestand (Score) wird basierend auf mehreren Faktoren berechnet, um einen Anreiz für das Lernen schwierigerer Wörter und die Verwendung anspruchsvollerer Spielmodi zu schaffen.',
      basePointsTitle: BASE_POINTS_TITLE,
      basePointsDescription:
        'Die Grundlage für die Punktzahl ist das Level der Karte. Wörter, die du weniger gut kennst (niedrigeres Level), geben mehr Punkte.',
      basePointsLevel1: LEVEL_TEXT.level1,
      basePointsLevel2: LEVEL_TEXT.level2,
      basePointsLevel3: LEVEL_TEXT.level3,
      basePointsLevel4: LEVEL_TEXT.level4,
      basePointsLevel5: LEVEL_TEXT.level5,
      modeMultiplierTitle: '2. Modus-Multiplikator',
      modeMultiplierDescription: 'Die Basispunkte werden mit einem Multiplikator versehen:',
      modeMultiplierChoice: 'Multiple Choice: x1 (Standard)',
      modeMultiplierBlind: 'Blind: x2',
      modeMultiplierTyping: 'Schreiben: x4',
      additionalRulesTitle: '3. Zusätzliche Regeln',
      additionalRuleFastCorrect:
        '"Fast richtig": Im Schreib-Modus erhältst du bei kleinen Fehlern (ein Buchstabe falsch) 75% der möglichen Punkte.',
      additionalRuleLanguageBonus:
        'Sprachrichtung: Für eine richtige Antwort in der Richtung Deutsch → Englisch erhältst du +1 Zusatzpunkt.',
      additionalRuleWrong: 'Falsche Antworten geben immer 0 Punkte.',
      dailyBonusesTitle: '4. Tages-Boni',
      dailyBonusFirstGame: DAILY_BONUS_TEXT.firstGame,
      dailyBonusStreak: DAILY_BONUS_TEXT.streakGame,
      speedBonusTitle: '5. Geschwindigkeits-Bonus',
      speedBonusDescription: SPEED_BONUS_TEXT
    }
  },

  // Spelling App specific
  spell: {
    mode: {
      copy: 'Abschreiben',
      hidden: 'Verdeckt',
      tooGoodForCopy: 'Dafür bist du zu gut'
    },
    game: {
      showWord: 'Wort zeigen',
      hideWord: 'Wort verbergen',
      wordHiddenIn: 'Wort wird verdeckt in',
      typePlaceholder: 'Schreibe...',
      correct: 'Richtig!',
      incorrect: 'Leider falsch',
      closeMatch: 'Fast richtig!',
      timeBonus: 'Geschwindigkeits-Bonus!',
      newRecord: 'Neue Bestzeit!'
    },
    home: {
      selectDeck: 'Wähle eine Kiste',
      selectMode: 'Wähle einen Modus',
      noCardsForMode: 'Keine Karten für diesen Modus verfügbar'
    },
    cards: {
      header:
        'Du kannst mehrere Lernwort-<strong>Kisten</strong> anlegen. Eine Kiste enthält mehrere <strong>Karten</strong>. Jede Karte ist ein Lernwort und hat ein <strong>Level</strong> (1=unbekannt bis 5=sicher). Richtige Antworten im Spiel erhöhen das Level, falsche verringern es.',
      importDialogMessage: 'Füge deine Wörter ein (eines pro Zeile)',
      importDialogTitle: 'Wörter importieren',
      import: 'Importieren',
      export: 'Exportieren',
      copied: 'Kopiert!',
      confirmMoveTitle: 'Verschieben bestätigen',
      confirmMoveMessage: 'Alle {count} Karten auf Level {level} setzen?',
      confirmResetTitle: 'Zurücksetzen bestätigen',
      confirmResetMessage:
        'Diese Aktion setzt alle Karten und deinen Lernfortschritt zurück. Fortfahren?',
      emptyTextError: 'Das Textfeld ist leer.',
      noWordsFoundError: 'Keine gültigen Wörter gefunden.',
      clipboardError: 'Zugriff auf Zwischenablage fehlgeschlagen.',
      invalidLevelError: 'Bitte gib ein Level zwischen {min} und {max} ein.',
      importSuccess: '{count} Wörter erfolgreich importiert!',
      resetSuccess: 'Kiste wurde zurückgesetzt!',
      editCardsTitle: 'Wörter Bearbeiten',
      editCardsButton: 'Bearbeiten',
      addNewCard: 'Neues Wort',
      wordPlaceholder: 'Wort',
      save: 'Speichern',
      saveSuccess: 'Änderungen gespeichert!',
      validationWordEmpty: 'Das Wort darf nicht leer sein.',
      unsavedChangesTitle: 'Ungespeicherte Änderungen',
      unsavedChangesMessage: 'Du hast ungespeicherte Änderungen. Möchtest du die Seite verlassen?',
      noCardsYet: 'Noch keine Wörter vorhanden'
    },
    decks: {
      title: 'Kiste',
      selectDeck: 'Wähle eine Kiste',
      editDecksTitle: 'Kisten Bearbeiten',
      addDeck: 'Neue Kiste',
      deckNamePlaceholder: 'Kisten Name',
      confirmRemoveTitle: 'Kiste entfernen?',
      confirmRemoveMessage: 'Möchtest du die Kiste "{name}" wirklich löschen?',
      lastDeckError: 'Die letzte Kiste kann nicht gelöscht werden.',
      duplicateNameError: 'Eine Kiste mit diesem Namen existiert bereits.',
      emptyNameError: 'Der Kisten-Name darf nicht leer sein.',
      deckAdded: 'Kiste "{name}" wurde hinzugefügt',
      deckRemoved: 'Kiste "{name}" wurde gelöscht',
      deckRenamed: 'Kiste wurde umbenannt'
    },
    info: {
      title: SCORING_TITLE,
      description:
        'Dein Punktestand (Score) wird basierend auf mehreren Faktoren berechnet, um einen Anreiz für das Lernen schwierigerer Wörter zu schaffen.',
      basePointsTitle: BASE_POINTS_TITLE,
      basePointsDescription:
        'Die Grundlage für die Punktzahl ist das Level der Karte. Wörter, die du weniger gut kennst (niedrigeres Level), geben mehr Punkte.',
      basePointsLevel1: LEVEL_TEXT.level1,
      basePointsLevel2: LEVEL_TEXT.level2,
      basePointsLevel3: LEVEL_TEXT.level3,
      basePointsLevel4: LEVEL_TEXT.level4,
      basePointsLevel5: LEVEL_TEXT.level5,
      modeTitle: '2. Modus',
      modeCopy: 'Abschreiben: Für Karten mit Level 1 oder 2 (zum Üben)',
      modeHidden: 'Verdeckt: Wort wird 3 Sekunden gezeigt, dann verdeckt (schwieriger)',
      closeMatchTitle: '3. Fast richtig (nur Verdeckt)',
      closeMatchDescription:
        'Wenn du nur einen Buchstaben falsch hast, bekommst du 75% der Punkte. Das Level wird aber nicht erhöht.',
      speedBonusTitle: '4. Geschwindigkeits-Bonus (nur Verdeckt)',
      speedBonusDescription:
        'Wenn du schneller als deine Bestzeit bist: +5 Bonuspunkte und neue Bestzeit!',
      dailyBonusesTitle: '5. Tages-Boni',
      dailyBonusFirstGame: DAILY_BONUS_TEXT.firstGame,
      dailyBonusStreak: DAILY_BONUS_TEXT.streakGame,
      mascotTitle: 'Eisi der Eisbär',
      mascotDescription:
        'Eisi begleitet dich beim Lernen und freut sich über deine Fortschritte! Je besser du spielst, desto glücklicher ist Eisi.'
    }
  }
} as const

export type TextKey = keyof typeof TEXT_DE
