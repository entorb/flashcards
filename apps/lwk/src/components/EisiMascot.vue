<script setup lang="ts">
interface Props {
  smile?: boolean
  grin?: boolean
  size?: number
}

withDefaults(defineProps<Props>(), {
  smile: false,
  grin: false,
  size: 60
})
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="20 20 60 55"
    :width="size"
    :height="size"
    class="inline-block"
    aria-labelledby="eisi-title"
  >
    <title id="eisi-title">Eisi the Ice Bear</title>
    <g>
      <!-- Head -->
      <circle
        cx="50"
        cy="45"
        r="22"
        fill="#F0F8FF"
      />
      <!-- Ears -->
      <circle
        cx="35"
        cy="30"
        r="8"
        fill="#E0F2F7"
      />
      <circle
        cx="65"
        cy="30"
        r="8"
        fill="#E0F2F7"
      />
      <!-- Inner ears -->
      <circle
        cx="35"
        cy="32"
        r="4"
        fill="#B0E0E6"
      />
      <circle
        cx="65"
        cy="32"
        r="4"
        fill="#B0E0E6"
      />
      <!-- Eyes -->
      <circle
        cx="42"
        cy="42"
        r="3"
        fill="#000000"
      />
      <circle
        cx="58"
        cy="42"
        r="3"
        fill="#000000"
      />
      <!-- Nose -->
      <ellipse
        cx="50"
        cy="50"
        rx="4"
        ry="3"
        fill="#000000"
      />
      <!-- Grin (100% success) -->
      <path
        v-if="grin"
        d="M 38,56 Q 50,66 62,56"
        stroke="#00BCD4"
        stroke-width="3"
        fill="none"
        stroke-linecap="round"
      />
      <!-- Smile (70%+ success) -->
      <path
        v-else-if="smile"
        d="M 40,56 Q 50,62 60,56"
        stroke="#4FC3F7"
        stroke-width="2.5"
        fill="none"
        stroke-linecap="round"
      />
      <!-- Neutral mouth -->
      <line
        v-else
        x1="42"
        y1="56"
        x2="58"
        y2="56"
        stroke="#000000"
        stroke-width="2"
        stroke-linecap="round"
      />
    </g>
  </svg>
</template>
