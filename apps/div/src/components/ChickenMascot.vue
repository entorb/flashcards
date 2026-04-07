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
    aria-labelledby="chicken-title"
  >
    <title id="chicken-title">Diva</title>
    <g>
      <!-- Body -->
      <ellipse
        cx="50"
        cy="65"
        rx="25"
        ry="20"
        fill="#FFD54F"
      />
      <!-- Wing -->
      <ellipse
        cx="30"
        cy="62"
        rx="10"
        ry="14"
        fill="#FFC107"
        transform="rotate(-10 30 62)"
      />
      <!-- Head -->
      <circle
        cx="50"
        cy="38"
        r="18"
        fill="#FFD54F"
      />
      <!-- Comb -->
      <path
        d="M 44,22 Q 46,14 50,20 Q 54,14 56,22"
        fill="#E53935"
      />
      <!-- Eyes -->
      <circle
        cx="43"
        cy="35"
        r="3"
        fill="#000000"
      />
      <circle
        cx="57"
        cy="35"
        r="3"
        fill="#000000"
      />
      <!-- Beak -->
      <polygon
        points="50,40 56,44 50,48"
        fill="#FF8F00"
      />
      <!-- Grin (shown when grinning - 100% success) -->
      <path
        v-if="grin"
        d="M 38,50 Q 50,60 62,50"
        stroke="#000000"
        stroke-width="2.5"
        fill="none"
        stroke-linecap="round"
      />
      <!-- Smile (shown when smiling - 70%+ success) -->
      <path
        v-else-if="smile"
        d="M 42,50 Q 50,56 58,50"
        stroke="#000000"
        stroke-width="2"
        fill="none"
        stroke-linecap="round"
      />
      <!-- Neutral mouth (shown when not smiling) -->
      <line
        v-else
        x1="44"
        y1="50"
        x2="56"
        y2="50"
        stroke="#000000"
        stroke-width="1.5"
        stroke-linecap="round"
      />
      <!-- Feet -->
      <path
        d="M 40,84 L 36,92 M 40,84 L 40,92 M 40,84 L 44,92"
        stroke="#FF8F00"
        stroke-width="2"
        stroke-linecap="round"
        fill="none"
      />
      <path
        d="M 60,84 L 56,92 M 60,84 L 60,92 M 60,84 L 64,92"
        stroke="#FF8F00"
        stroke-width="2"
        stroke-linecap="round"
        fill="none"
      />
    </g>
  </svg>
</template>
