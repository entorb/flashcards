/**
 * German language text strings for educational apps
 * All user-facing text is centralized here for easy maintenance and i18n
 * Future: Support additional languages with i18n plugin
 */

// cspell:disable

export const TEXT_DE = {
  // App titles (used in vite.config.ts manifests)
  appTitle_1x1: "Vyvit's 1x1 Spiel",
  appTitle_voc: "Rabat's Wortspiel",

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
    cancel: 'Abbrechen'
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
      editDecksButton: 'Karten Decks/Sprachen bearbeiten',
      addDeck: 'Neues Deck',
      removeDeck: 'Löschen',
      renameDeck: 'Umbenennen',
      deckNamePlaceholder: 'Deck Name',
      confirmRemoveTitle: 'Deck entfernen?',
      confirmRemoveMessage: 'Möchtest du das Deck "{name}" wirklich löschen?',
      lastDeckError: 'Das letzte Deck kann nicht gelöscht werden.',
      duplicateNameError: 'Ein Deck mit diesem Namen existiert bereits.',
      emptyNameError: 'Der Deck-Name darf nicht leer sein.'
    },
    info: {
      title: 'Scoring-Regeln',
      description:
        'Dein Punktestand (Score) wird basierend auf mehreren Faktoren berechnet, um einen Anreiz für das Lernen schwierigerer Wörter und die Verwendung anspruchsvollerer Spielmodi zu schaffen.',
      basePointsTitle: '1. Basispunkte',
      basePointsDescription:
        'Die Grundlage für die Punktzahl ist das Level der Karte. Wörter, die du weniger gut kennst (niedrigeres Level), geben mehr Punkte.',
      basePointsLevel1: 'Level 1: 5 Punkte',
      basePointsLevel2: 'Level 2: 4 Punkte',
      basePointsLevel3: 'Level 3: 3 Punkte',
      basePointsLevel4: 'Level 4: 2 Punkte',
      basePointsLevel5: 'Level 5: 1 Punkt',
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
      additionalRuleWrong: 'Falsche Antworten geben immer 0 Punkte.'
    }
  }
} as const

export type TextKey = keyof typeof TEXT_DE
