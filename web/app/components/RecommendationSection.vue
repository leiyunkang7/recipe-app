<script setup lang="ts">
import type { RecipeListItem } from "@/types";

interface Props {
  title: string;
  reason?: string | null;
  recipes: RecipeListItem[];
  isLoading?: boolean;
  seeMoreLink?: string;
}

const props = withDefaults(defineProps<Props>(), {
  reason: null,
  isLoading: false,
  seeMoreLink: undefined,
});
</script>

<template>
  <section class="recommendation-section py-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900">{{ title }}</h3>
      <NuxtLink
        v-if="seeMoreLink"
        :to="seeMoreLink"
        class="text-sm text-primary hover:text-primary/80"
      >
        查看更多
      </NuxtLink>
    </div>

    <p v-if="reason" class="text-sm text-gray-500 mb-3">{{ reason }}</p>

    <div v-if="isLoading" class="flex gap-4 overflow-hidden">
      <div
        v-for="i in 4"
        :key="i"
        class="w-64 flex-shrink-0 animate-pulse"
      >
        <div class="bg-gray-200 rounded-lg h-40 mb-2"></div>
        <div class="bg-gray-200 rounded h-4 w-3/4 mb-1"></div>
        <div class="bg-gray-200 rounded h-3 w-1/2"></div>
      </div>
    </div>

    <template v-else-if="recipes.length > 0">
      <RecipeGridLazy :recipes="recipes" />
    </template>

    <EmptyStateIllustration
      v-else-if="!isLoading"
      title="暂无推荐"
      description="稍后再来看看吧"
      class="my-8"
    />
  </section>
</template>
