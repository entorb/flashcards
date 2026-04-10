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
    aria-labelledby="raccoon-title"
  >
    <title id="raccoon-title">Plumi</title>
    <g>
      <!-- Body -->
      <ellipse
        cx="50"
        cy="70"
        rx="22"
        ry="18"
        fill="#78909C"
      />
      <!-- Tail (striped) -->
      <path
        d="M 28,68 Q 14,55 10,42 Q 8,36 14,38 Q 20,40 24,50 Q 28,58 30,65"
        fill="#607D8B"
        stroke="#37474F"
        stroke-width="1"
      />
      <!-- Tail stripes -->
      <path
        d="M 16,42 Q 18,46 22,50"
        stroke="#37474F"
        stroke-width="3"
        fill="none"
        stroke-linecap="round"
      />
      <path
        d="M 20,48 Q 22,52 25,56"
        stroke="#37474F"
        stroke-width="3"
        fill="none"
        stroke-linecap="round"
      />
      <!-- Head -->
      <circle
        cx="50"
        cy="40"
        r="20"
        fill="#90A4AE"
      />
      <!-- Ears -->
      <circle
        cx="34"
        cy="24"
        r="7"
        fill="#607D8B"
      />
      <circle
        cx="34"
        cy="24"
        r="4"
        fill="#B0BEC5"
      />
      <circle
        cx="66"
        cy="24"
        r="7"
        fill="#607D8B"
      />
      <circle
        cx="66"
        cy="24"
        r="4"
        fill="#B0BEC5"
      />
      <!-- Eye mask (raccoon characteristic) -->
      <ellipse
        cx="40"
        cy="38"
        rx="9"
        ry="6"
        fill="#37474F"
      />
      <ellipse
        cx="60"
        cy="38"
        rx="9"
        ry="6"
        fill="#37474F"
      />
      <!-- Eyes -->
      <circle
        cx="40"
        cy="38"
        r="3"
        fill="#FFFFFF"
      />
      <circle
        cx="60"
        cy="38"
        r="3"
        fill="#FFFFFF"
      />
      <circle
        cx="41"
        cy="37"
        r="1.5"
        fill="#000000"
      />
      <circle
        cx="61"
        cy="37"
        r="1.5"
        fill="#000000"
      />
      <!-- Light muzzle area -->
      <ellipse
        cx="50"
        cy="48"
        rx="8"
        ry="6"
        fill="#CFD8DC"
      />
      <!-- Nose -->
      <ellipse
        cx="50"
        cy="46"
        rx="3"
        ry="2"
        fill="#263238"
      />
      <!-- Grin (shown when grinning - 100% success) -->
      <path
        v-if="grin"
        d="M 40,52 Q 50,62 60,52"
        stroke="#000000"
        stroke-width="2.5"
        fill="none"
        stroke-linecap="round"
      />
      <!-- Smile (shown when smiling - 70%+ success) -->
      <path
        v-else-if="smile"
        d="M 43,52 Q 50,58 57,52"
        stroke="#000000"
        stroke-width="2"
        fill="none"
        stroke-linecap="round"
      />
      <!-- Neutral mouth (shown when not smiling) -->
      <line
        v-else
        x1="45"
        y1="52"
        x2="55"
        y2="52"
        stroke="#000000"
        stroke-width="1.5"
        stroke-linecap="round"
      />
      <!-- Feet -->
      <ellipse
        cx="40"
        cy="88"
        rx="6"
        ry="3"
        fill="#455A64"
      />
      <ellipse
        cx="60"
        cy="88"
        rx="6"
        ry="3"
        fill="#455A64"
      />
    </g>
  </svg>
</template>
