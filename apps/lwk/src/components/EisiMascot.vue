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
    viewBox="0 0 100 100"
    :width="size"
    :height="size"
    class="inline-block"
    aria-labelledby="eisi-title"
  >
    <title id="eisi-title">Eisi the Ice Bear</title>
    <g>
      <!-- Body (ice blue/white) -->
      <ellipse
        cx="50"
        cy="60"
        rx="25"
        ry="30"
        fill="#E0F2F7"
      />
      <!-- Head -->
      <circle
        cx="50"
        cy="35"
        r="22"
        fill="#F0F8FF"
      />
      <!-- Ears -->
      <circle
        cx="35"
        cy="20"
        r="8"
        fill="#E0F2F7"
      />
      <circle
        cx="65"
        cy="20"
        r="8"
        fill="#E0F2F7"
      />
      <!-- Inner ears -->
      <circle
        cx="35"
        cy="22"
        r="4"
        fill="#B0E0E6"
      />
      <circle
        cx="65"
        cy="22"
        r="4"
        fill="#B0E0E6"
      />
      <!-- Eyes -->
      <circle
        cx="42"
        cy="32"
        r="3"
        fill="#000000"
      />
      <circle
        cx="58"
        cy="32"
        r="3"
        fill="#000000"
      />
      <!-- Nose -->
      <ellipse
        cx="50"
        cy="40"
        rx="4"
        ry="3"
        fill="#000000"
      />
      <!-- Grin (100% success) -->
      <path
        v-if="grin"
        d="M 38,46 Q 50,58 62,46"
        stroke="#00BCD4"
        stroke-width="3"
        fill="none"
        stroke-linecap="round"
      />
      <!-- Smile (70%+ success) -->
      <path
        v-else-if="smile"
        d="M 40,46 Q 50,54 60,46"
        stroke="#4FC3F7"
        stroke-width="2.5"
        fill="none"
        stroke-linecap="round"
      />
      <!-- Neutral mouth -->
      <line
        v-else
        x1="42"
        y1="46"
        x2="58"
        y2="46"
        stroke="#000000"
        stroke-width="2"
        stroke-linecap="round"
      />
      <!-- Paws (front) -->
      <ellipse
        cx="35"
        cy="75"
        rx="8"
        ry="10"
        fill="#E0F2F7"
      />
      <ellipse
        cx="65"
        cy="75"
        rx="8"
        ry="10"
        fill="#E0F2F7"
      />
    </g>
  </svg>
</template>
