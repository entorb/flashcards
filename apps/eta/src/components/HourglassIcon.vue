<!-- cspell:ignore offsetblur -->
<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  progress: number // 0-100
  size?: number
}

const props = withDefaults(defineProps<Props>(), {
  size: 120
})

// Calculate sand heights - simpler and more accurate
const topSandHeight = computed(() => {
  // Top chamber: starts at 50, decreases to 0 as progress increases
  return Math.max(0, 50 * (1 - props.progress / 100))
})

const bottomSandHeight = computed(() => {
  // Bottom chamber: starts at 0, increases to 50 as progress increases
  return Math.max(0, 50 * (props.progress / 100))
})

const isComplete = computed(() => props.progress >= 100)
const isActive = computed(() => props.progress > 0 && props.progress < 100)
</script>

<template>
  <svg
    :width="size"
    :height="size * 1.4"
    viewBox="0 0 100 140"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <!-- Sand gradient -->
      <linearGradient
        id="sandGrad"
        x1="0%"
        y1="0%"
        x2="0%"
        y2="100%"
      >
        <stop
          offset="0%"
          stop-color="#f4a460"
        />
        <stop
          offset="100%"
          stop-color="#cd853f"
        />
      </linearGradient>

      <!-- Glass gradient -->
      <linearGradient
        id="glassGrad"
        x1="0%"
        y1="0%"
        x2="100%"
        y2="0%"
      >
        <stop
          offset="0%"
          stop-color="#e8d4b8"
          stop-opacity="0.4"
        />
        <stop
          offset="50%"
          stop-color="#f5f5dc"
          stop-opacity="0.2"
        />
        <stop
          offset="100%"
          stop-color="#e8d4b8"
          stop-opacity="0.4"
        />
      </linearGradient>
    </defs>

    <!-- Wooden base top -->
    <rect
      x="10"
      y="5"
      width="80"
      height="8"
      rx="2"
      fill="#8b4513"
    />

    <!-- Top glass chamber -->
    <path
      d="M 20 13 L 80 13 L 65 55 L 50 65 L 35 55 Z"
      fill="url(#glassGrad)"
      stroke="#8b4513"
      stroke-width="2.5"
      stroke-linejoin="round"
    />

    <!-- Top sand -->
    <path
      v-if="topSandHeight > 0"
      :d="`M ${20 + (50 - topSandHeight) * 0.6} ${13 + (50 - topSandHeight) * 0.84}
           L ${80 - (50 - topSandHeight) * 0.6} ${13 + (50 - topSandHeight) * 0.84}
           L ${65 - (50 - topSandHeight) * 0.3} ${55 - (50 - topSandHeight) * 0.2}
           L ${35 + (50 - topSandHeight) * 0.3} ${55 - (50 - topSandHeight) * 0.2} Z`"
      fill="url(#sandGrad)"
    />

    <!-- Neck/center -->
    <ellipse
      cx="50"
      cy="70"
      rx="6"
      ry="3"
      fill="#8b4513"
      opacity="0.6"
    />

    <!-- Falling sand stream -->
    <rect
      v-if="isActive"
      x="48"
      y="65"
      width="4"
      height="10"
      fill="#cd853f"
      opacity="0.7"
      class="falling-sand"
    />

    <!-- Bottom glass chamber -->
    <path
      d="M 35 85 L 50 75 L 65 85 L 80 127 L 20 127 Z"
      fill="url(#glassGrad)"
      stroke="#8b4513"
      stroke-width="2.5"
      stroke-linejoin="round"
    />

    <!-- Bottom sand -->
    <path
      v-if="bottomSandHeight > 0"
      :d="`M ${35 + (50 - bottomSandHeight) * 0.3} ${85 + (50 - bottomSandHeight) * 0.84}
           L ${65 - (50 - bottomSandHeight) * 0.3} ${85 + (50 - bottomSandHeight) * 0.84}
           L ${80 - (50 - bottomSandHeight) * 0.6} ${127 - (50 - bottomSandHeight) * 0}
           L ${20 + (50 - bottomSandHeight) * 0.6} ${127 - (50 - bottomSandHeight) * 0} Z`"
      fill="url(#sandGrad)"
    />

    <!-- Wooden base bottom -->
    <rect
      x="10"
      y="127"
      width="80"
      height="8"
      rx="2"
      fill="#8b4513"
    />

    <!-- Completion stars -->
    <g v-if="isComplete">
      <text
        x="50"
        y="25"
        text-anchor="middle"
        font-size="16"
        class="star"
      >
        ✨
      </text>
      <text
        x="70"
        y="40"
        text-anchor="middle"
        font-size="12"
        class="star"
        style="animation-delay: 0.3s"
      >
        ⭐
      </text>
      <text
        x="30"
        y="40"
        text-anchor="middle"
        font-size="12"
        class="star"
        style="animation-delay: 0.6s"
      >
        ⭐
      </text>
    </g>
  </svg>
</template>

<style scoped>
.falling-sand {
  animation: fall 1.5s linear infinite;
}

@keyframes fall {
  0% {
    opacity: 0;
    transform: translateY(-3px);
  }
  20% {
    opacity: 0.7;
  }
  80% {
    opacity: 0.7;
  }
  100% {
    opacity: 0;
    transform: translateY(3px);
  }
}

.star {
  animation: twinkle 1.5s ease-in-out infinite;
}

@keyframes twinkle {
  0%,
  100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}
</style>
