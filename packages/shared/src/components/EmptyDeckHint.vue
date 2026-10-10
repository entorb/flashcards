<script setup lang="ts">
import { TEXT_DE } from "../text-de"

defineProps<{ appPrefix: "voc" | "lwk" }>()
const emit = defineEmits<{ add: [] }>()
</script>

<template>
  <q-banner
    rounded
    class="bg-orange-1 q-mb-md"
    data-cy="empty-deck-hint"
  >
    <template #avatar>
      <q-icon
        name="inventory_2"
        color="warning"
      />
    </template>
    {{ TEXT_DE[appPrefix].decks.emptyDeck }}
    <template #action>
      <q-btn
        unelevated
        color="primary"
        icon="add"
        no-caps
        :label="TEXT_DE[appPrefix].decks.addCards"
        data-cy="empty-deck-add-cards"
        @click="emit('add')"
      />
    </template>
  </q-banner>
</template>
