<script setup lang="ts">
const { t } = useI18n()

const searchQuery = defineModel<string>('searchQuery', { default: '' })
const selectedCategory = defineModel<string>('selectedCategory', { default: '' })

const emit = defineEmits<{
  search: []
}>()

const categories = defineModel<Array<{ id: number; name: string; displayName: string }>>('categories', { default: [] })

const handleSearch = () => {
  emit('search')
}
</script>

<template>
  <!-- 桌面端导航 -->
  <DesktopNavbar v-model="searchQuery" @search="handleSearch" />

  <!-- 分类筛选 - 移动端 -->
  <section class="md:hidden px-4 py-4 -mt-2">
    <CategoryNav
      :categories="categories"
      :selected="selectedCategory"
      @select="selectedCategory = $event"
    />
  </section>

  <!-- 分类筛选 - 桌面端 -->
  <section class="hidden md:block px-4 py-3 -mt-2 bg-white/50 dark:bg-stone-800/50 backdrop-blur-sm border-b border-gray-200 dark:border-stone-700">
    <div class="max-w-7xl mx-auto">
      <CategoryNav
        :categories="categories"
        :selected="selectedCategory"
        @select="selectedCategory = $event"
      />
    </div>
  </section>
</template>
