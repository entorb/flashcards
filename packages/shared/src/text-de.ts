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
  appTitle_lwk: "Eisi's Lernwörter",

  shared: {
    footer: {
      gamesPlayedByAll: 'Spiele gespielt.',
      noDataStored: 'Es werden keine persönlichen Daten gespeichert.'
    },
    common: {
      start: 'Starten',
      continue: 'Weiter',
      check: 'Prüfen',
      wait: 'Merken...',
      yes: 'Ja',
      no: 'Nein',
      reset: 'Zurücksetzen'
    },
    nav: {
      history: 'Verlauf',
      cards: 'Karten',
      backToHome: 'Zurück zur Startseite',
      infoTooltip: 'Info'
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
    words: {
      cards: 'Karten',
      level: 'Level',
      focus: 'Fokus',
      mode: 'Modus',
      direction: 'Richtung',
      bonusPoints: 'Bonus',
      firstGameBonus: 'Erstes Spiel heute',
      streakGameBonus: 'Spiel des Tages',
      vocable: 'Vokabel',
      german: 'Deutsch',
      delete: 'Löschen',
      deck: 'Kiste',
      points: 'Punkte'
    },
    focusOptions: {
      weak: 'Schwache',
      strong: 'Starke',
      medium: 'Mittlere',
      slow: 'Langsame'
    },
    info: {
      title: 'Info',
      cardDescriptionTitle: 'Karten',
      cardDescription1x1: 'Eine Karte ist eine Rechenaufgabe (z.B. 3×4=12).',
      cardDescriptionVoc: 'Eine Karte ist ein Wort mit Übersetzung.',
      cardDescriptionLwk: 'Eine Karte ist ein Lernwort zum Üben der Rechtschreibung.',
      levelSystemTitle: 'Level-System',
      levelSystem:
        'Jede Karte hat ein Level von 1 (unbekannt) bis 5 (sicher). Richtige Antworten erhöhen das Level, falsche verringern es.',
      scoringSectionTitle: 'Punktevergabe',
      decksTitle: 'Kisten',
      decksVoc: 'Karten werden in Kisten organisiert (z.B. pro Kapitel oder Sprache).',
      decksLwk: 'Wörter werden in Kisten organisiert. Du kannst Kisten haben.',
      focusTitle: 'Fokus',
      focusDescription: 'Bestimmt, welche Karten bevorzugt abgefragt werden:',
      startButtonsTitle: 'Spielmodi',
      startStandard: 'Normales Spiel (max. 10 Karten).',
      startEndlessLevel1: 'Endlos: Nur Level-1-Karten, bis alle aufgestiegen sind.',
      startThreeRounds: '3 Runden: Jede Karte wird 3× abgefragt (max. 10 Karten).',
      startEndlessLevel5: 'Endlos: Alle Karten, bis alle Level 5 erreicht haben.',
      modesTitle: 'Spielarten',
      aboutTitle: 'Über diese App',
      aboutPrefix: 'Teil von',
      aboutTorben: "Torben's",
      aboutOpenSource: 'Open-Source',
      aboutProject: 'Flashcards',
      aboutSuffix: 'Hobbyprojekt. Kostenlos, werbefrei und ohne Tracking.',
      aboutShare: 'Gerne teilen'
    },
    scoring: {
      title: 'Scoring-Regeln',
      basePointsTitle: 'Levelpunkte',
      basePointsLevel1: 'Level 1: 5 Punkte',
      basePointsLevel2: 'Level 2: 4 Punkte',
      basePointsLevel3: 'Level 3: 3 Punkte',
      basePointsLevel4: 'Level 4: 2 Punkte',
      basePointsLevel5: 'Level 5: 1 Punkt',
      difficultyTitle: 'Schwierigkeit',
      bonusTitle: 'Bonuspunkte',
      speedBonusDescription: 'Schneller als Rekord: +{points} Punkte',
      dailyBonusFirstGame: 'Erstes Spiel des Tages: +{points} Punkte',
      dailyBonusStreak: 'Alle {interval} Spiele des Tages: +{points} Punkte',
      breakdown: {
        levelPoints: 'Level',
        difficultyPoints: 'Schwierigkeit',
        closeAdjustment: 'Knapp daneben',
        languageBonus: 'Sprachrichtung',
        timeBonus: 'Zeitbonus'
      }
    },
    cardActions: {
      moveAll: 'Verschieben',
      dangerZoneTitle: 'Gefahrenzone',
      confirmMoveTitle: 'Verschieben bestätigen',
      confirmMoveMessage: 'Alle {count} Karten auf Level {level} setzen?',
      confirmResetTitle: 'Zurücksetzen bestätigen',
      confirmResetMessage: 'Alle Karten zurück auf Level 1?',
      resetSuccess: 'Zurücksetzung erfolgreich!',
      share: 'Teilen',
      copied: 'Kopiert!',
      emptyTextError: 'Das Textfeld ist leer.',
      clipboardError: 'Zugriff auf Zwischenablage fehlgeschlagen.',
      invalidLevelError: 'Bitte gib ein Level zwischen {min} und {max} ein.',
      lastCardError: 'Die letzte Karte kann nicht entfernt werden.'
    },
    pwa: {
      install: {
        title: 'Als App installieren',
        android: 'Android:',
        androidInstructions: 'Menü (3 Punkte) → "Zum Startbildschirm hinzufügen"',
        iPhone: 'iPhone:',
        iPhoneInstructions: 'Teilen-Symbol → "Zum Home-Bildschirm"'
      },
      update: {
        confirmMessage: 'Neue Version verfügbar. Neu laden?'
      }
    },
    gameModes: {
      endlessLevel1: 'Endlos Level 1',
      endlessLevel5: 'Endlos Level 5',
      threeRounds: '3 Runden',
      noLevel1Cards: 'Keine Karten auf Level 1',
      noCardsBelow5: 'Alle Karten bereits auf Level 5'
    }
  },

  // 1x1 App specific
  multiply: {
    selection: 'Reihe',
    selectionSquares: 'x²',
    cards: {
      title: 'Karten'
    },
    extendedCards: {
      title: 'Weitere Karten',
      feature1x2: '1x2',
      feature1x12: '1x12',
      feature1x20: '1x20'
    },
    info: {
      difficulty: 'Das 1x1: 4x8 -> 4',
      modeDescription: 'Wähle die Zahlenreihen (2-10 oder x²), die geübt werden sollen.'
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
      wasYourAnswerCorrect: 'War deine Antwort richtig?'
    },
    direction: {
      voc_de: 'Voc → DE',
      de_voc: 'DE → Voc'
    },
    cards: {
      // title: 'Kartenverwaltung',
      header:
        'Du kannst mehrere Karten-<strong>Kisten</strong> anlegen (z.B. Kapitel deines Buches oder verschiedene Sprachen). Eine Kiste enthält mehrere <strong>Karten</strong>. Jede Karte hat ein <strong>Level</strong> (1=unbekannt bis 5=sicher). Richtige Antworten im Spiel erhöhen das Level, falsche verringern es.',
      export: 'Raus kopieren',
      import: 'Rein kopieren',
      copied: 'Kopiert!',
      importDialogTitle: 'Karten importieren',
      importDialogMessage: 'Füge deine Karten aus Excel (oder so) ein (Format: Voc | De | Level)',
      importHintExcel:
        'Tipps: Unterstützt Wortalternativen mit "/": "Welche/Welcher". Verwende Excel order Google Tabellen um mehrere Vokabellisten zu verwalten und zu speichern.',
      noDelimiterError: 'Konnte kein Trennzeichen (Tab, Komma, Semikolon) finden.',
      noCardsFoundError:
        'Keine gültigen Karten gefunden. Format: Voc{delimiter}De{delimiter}LEVEL (optional)',
      importSuccess: '{count} Karten erfolgreich importiert!',
      editCardsTitle: 'Karten Bearbeiten',
      addNewCard: 'Neue Karte',
      vocPlaceholder: 'Vocable',
      dePlaceholder: 'Deutsch',
      validationEnEmpty: 'Das englische Wort darf nicht leer sein.',
      validationDeEmpty: 'Das deutsche Wort darf nicht leer sein.',
      moveAllTitle: 'Alle verschieben',
      reset: 'Zurücksetzen'
    },
    decks: {
      title: 'Kiste',
      duplicateNameError: 'Eine Kiste mit diesem Namen existiert bereits.',
      lastDeckError: 'Die letzte Kiste kann nicht entfernt werden.',
      confirmRemoveTitle: 'Kiste entfernen',
      confirmRemoveMessage:
        'Möchtest du die Kiste "{name}" wirklich entfernen? Alle Karten darin gehen verloren.',
      emptyNameError: 'Der Kisten-Name darf nicht leer sein.',
      editDecksTitle: 'Kisten bearbeiten',
      addDeck: 'Kiste hinzufügen',
      deckNamePlaceholder: 'Kisten-Name'
    },
    info: {
      modeMultipleChoice: 'Multiple Choice: einfach',
      modeBlindInfo: 'Blind: mittel',
      modeTypingInfo: 'Schreiben: schwer',
      modeDirection: 'Sprachrichtung: Voc→DE oder DE→Voc',
      modeChoice: 'Multiple Choice: 1 Punkt',
      modeBlind: 'Blind: {points} Punkte',
      modeTyping: 'Schreiben: {points} Punkte',
      additionalRulesTitle: 'Zusätzliche Regeln',
      closeMatchDescription:
        '"Fast richtig": Im Schreib-Modus erhältst du bei kleinen Fehlern 75% der Punkte.',
      additionalRuleLangDirection:
        'Sprachrichtung: Für die Richtung Deutsch → Voc +{points} Punkte.'
    }
  },
  // LWK app specific
  lwk: {
    mode: {
      copy: 'Abschreiben',
      hidden: 'Verdeckt',
      tooGoodForCopy: 'Dafür bist du zu gut'
    },
    game: {
      timeBonus: 'Geschwindigkeits-Bonus!'
    },
    home: {},
    cards: {
      header:
        'Du kannst mehrere Lernwort-<strong>Kisten</strong> anlegen. Eine Kiste enthält mehrere <strong>Karten</strong>. Jede Karte ist ein Lernwort und hat ein <strong>Level</strong> (1=unbekannt bis 5=sicher). Richtige Antworten im Spiel erhöhen das Level, falsche verringern es.',
      reset: 'Alle Kisten und Wörter löschen',
      importDialogMessage: 'Füge deine Wörter ein (eines pro Zeile)',
      importDialogTitle: 'Wörter importieren',
      importHintExcel:
        'Tipps: Verwende Excel oder Google Tabellen um mehrere Wortlisten zu verwalten und zu speichern.',
      noDelimiterError:
        'Keine Trennzeichen gefunden. Bitte verwende Tab, Semikolon, Komma oder Schrägstrich.',
      noCardsFoundError: 'Keine gültigen Karten mit Trennzeichen "{delimiter}" gefunden.',
      importSuccess: '{count} Wörter erfolgreich importiert!',
      editCardsTitle: 'Wörter Bearbeiten',
      addNewCard: 'Neues Wort',
      wordPlaceholder: 'Wort',
      validationWordEmpty: 'Das Wort darf nicht leer sein.',
      noCardsYet: 'Noch keine Wörter vorhanden',
      moveAllTitle: 'Alle verschieben'
    },
    decks: {
      title: 'Kiste',
      duplicateNameError: 'Eine Kiste mit diesem Namen existiert bereits.',
      lastDeckError: 'Die letzte Kiste kann nicht entfernt werden.',
      confirmRemoveTitle: 'Kiste entfernen',
      confirmRemoveMessage:
        'Möchtest du die Kiste "{name}" wirklich entfernen? Alle Wörter darin gehen verloren.',
      emptyNameError: 'Der Kisten-Name darf nicht leer sein.',
      editDecksTitle: 'Kisten bearbeiten',
      addDeck: 'Kiste hinzufügen',
      deckNamePlaceholder: 'Kisten-Name'
    },
    gameOver: {
      points: 'Punkte:'
    },
    info: {
      modeCopyInfo: 'Abschreiben: Level 1-2 (zum Üben)',
      modeHiddenInfo: 'Verdeckt: Wort kurz merken, dann schreiben',
      modeCopy: 'Abschreiben: Nur für Karten mit Level 1 oder 2 (zum Üben). 1 Punkt',
      modeHidden: 'Verdeckt: Wort wird 3 Sekunden gezeigt, dann verdeckt. {points} Punkte',
      additionalRulesTitle: 'Zusätzliche Regeln',
      closeMatchDescription:
        'Wenn du nur einen Buchstaben falsch hast, bekommst du 75% der Punkte. Das Level wird aber nicht erhöht.'
    }
  },

  // ETA App specific
  eta: {
    config: {
      title: 'Hausi-Zeit-Schätzer',
      totalTasksPlaceholder: 'Aufgaben'
    },
    tracking: {
      inputPlaceholderCompleted: '# fertig',
      inputPlaceholderRemaining: '# noch'
    },
    info: {
      title: 'Info',
      descriptionTitle: 'Was ist das?',
      description:
        'Der Hausi-Zeit-Schätzer hilft dir, die verbleibende Zeit für deine Hausaufgaben abzuschätzen.',
      howToTitle: 'So geht\u2019s',
      step1: 'Gib die Gesamtanzahl der Aufgaben ein und starte.',
      step2: 'Trage nach jeder Aufgabe deinen Fortschritt ein (Anzahl fertig oder noch übrig).',
      step3:
        'Die App berechnet anhand deiner Geschwindigkeit die voraussichtliche Restzeit und Fertig-Uhrzeit.',
      tipTitle: 'Tipps',
      tipPlusOne: 'Tippe auf + um schnell eine weitere Aufgabe als erledigt zu melden.',
      tipToggle: 'Wechsle zwischen „fertig" und „noch übrig" Eingabemodus.',
      tipTable: 'Die Tabelle zeigt deine Geschwindigkeit pro Aufgabe.'
    }
  }
} as const
