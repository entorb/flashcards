import { useQuasar } from "quasar"

import { TEXT_DE } from "../text-de"

interface DeckDialogDeps {
  appPrefix: () => "voc" | "lwk"
  addDeck: (name: string) => boolean
  renameDeck: (oldName: string, newName: string) => boolean
  removeDeck: (name: string) => boolean
  selectDeck: (name: string) => void
}

/**
 * Dialogs for creating, renaming and removing decks (voc, lwk).
 * `onChanged` runs after any successful create/rename/remove.
 */
export function useDeckDialogs(deps: DeckDialogDeps, onChanged: () => void) {
  const $q = useQuasar()
  const texts = () => TEXT_DE[deps.appPrefix()].decks

  function promptName(title: string, model: string, onName: (name: string) => void): void {
    const text = texts()
    $q.dialog({
      title,
      message: text.newDeckMessage,
      prompt: {
        model,
        type: "text",
        placeholder: text.deckNamePlaceholder,
        autocorrect: "off",
        isValid: (val: string) => val.trim() !== "",
        "data-cy": "deck-name-input",
      },
      cancel: true,
    }).onOk((value: string) => {
      onName(value.trim())
    })
  }

  function notifyDuplicate(): void {
    $q.notify({ type: "negative", message: texts().duplicateNameError })
  }

  /** Ask for a name, create the (empty) deck and make it the active deck */
  function promptCreateDeck(): void {
    promptName(texts().newDeckTitle, "", (name) => {
      if (!deps.addDeck(name)) {
        notifyDuplicate()
        return
      }
      deps.selectDeck(name)
      onChanged()
    })
  }

  function promptRenameDeck(oldName: string): void {
    promptName(texts().renameDeckTitle, oldName, (name) => {
      if (name === oldName) return
      if (!deps.renameDeck(oldName, name)) {
        notifyDuplicate()
        return
      }
      onChanged()
    })
  }

  function confirmRemoveDeck(name: string): void {
    const text = texts()
    $q.dialog({
      title: text.confirmRemoveTitle,
      message: text.confirmRemoveMessage.replace("{name}", name),
      cancel: true,
    }).onOk(() => {
      if (deps.removeDeck(name)) {
        onChanged()
      } else {
        $q.notify({ type: "negative", message: text.lastDeckError })
      }
    })
  }

  return { promptCreateDeck, promptRenameDeck, confirmRemoveDeck }
}
