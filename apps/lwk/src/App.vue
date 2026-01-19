<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <q-layout view="hHh lpR fFf">
    <q-page-container>
      <RouterView />
    </q-page-container>
  </q-layout>
</template>

<style>
html,
body,
#app {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
}
</style>
