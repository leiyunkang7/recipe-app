<script setup lang="ts">
defineProps<{
  stats: {
    total: number
    easy: number
    medium: number
    hard: number
  }
}>()
</script>

<template>
  <!-- Stats Cards -->
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
    <div class="bg-white rounded-xl shadow-sm p-4 text-center">
      <div class="text-3xl font-bold text-orange-600">{{ stats.total }}</div>
      <div class="text-sm text-gray-600">总食谱</div>
    </div>
    <div class="bg-white rounded-xl shadow-sm p-4 text-center">
      <div class="text-3xl font-bold text-green-600">{{ stats.easy }}</div>
      <div class="text-sm text-gray-600">简单</div>
    </div>
    <div class="bg-white rounded-xl shadow-sm p-4 text-center">
      <div class="text-3xl font-bold text-yellow-600">{{ stats.medium }}</div>
      <div class="text-sm text-gray-600">中等</div>
    </div>
    <div class="bg-white rounded-xl shadow-sm p-4 text-center">
      <div class="text-3xl font-bold text-red-600">{{ stats.hard }}</div>
      <div class="text-sm text-gray-600">困难</div>
    </div>
  </div>
</template>
