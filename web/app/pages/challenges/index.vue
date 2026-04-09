<script setup lang="ts">
const { t } = useI18n()
const { isAuthenticated } = useAuth()
const { challenges, loading, error, pagination, fetchChallenges } = useCookingChallenges()
const { trackPageView } = useAnalytics()

const searchQuery = ref('')
const statusFilter = ref<string>('')

async function handleSearch() {
  await fetchChallenges({
    search: searchQuery.value || undefined,
    status: statusFilter.value || undefined,
    page: 1
  })
}

async function handlePageChange(page: number) {
  await fetchChallenges({
    page,
    search: searchQuery.value || undefined,
    status: statusFilter.value || undefined
  })
}

onMounted(() => {
  fetchChallenges({ page: 1 })
  trackPageView('challenges')
})
</script>

<template>
  <div class="min-h-screen pb-16 md:pb-0 bg-gradient-to-br from-orange-50 via-stone-50 to-orange-50 dark:from-stone-900 dark:via-stone-800 dark:to-stone-900 transition-colors duration-300">
    <HeaderSection />

    <main id="main-content" tabindex="-1" class="max-w-7xl mx-auto px-4 py-6">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-stone-900 dark:text-stone-100">{{ t('challenge.title', 'Cooking Challenges') }}</h1>
      </div>

      <!-- Search Bar -->
      <div class="mb-6 flex gap-4 flex-wrap">
        <div class="relative flex-1 min-w-[200px]">
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="t('challenge.searchPlaceholder', 'Search challenges...')"
            class="w-full px-4 py-2 pl-10 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            @keyup.enter="handleSearch"
          />
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <select
          v-model="statusFilter"
          class="px-4 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          @change="handleSearch"
        >
          <option value="">All Status</option>
          <option value="upcoming">Upcoming</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
        </select>
        <button
          type="button"
          class="px-4 py-2 bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-700 dark:text-stone-200 rounded-lg font-medium transition-colors"
          @click="handleSearch"
        >
          {{ t('common.search', 'Search') }}
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loading && challenges.length === 0" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-12">
        <p class="text-red-500 dark:text-red-400">{{ error }}</p>
        <button
          type="button"
          class="mt-4 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
          @click="fetchChallenges({ page: 1 })"
        >
          {{ t('common.retry', 'Retry') }}
        </button>
      </div>

      <!-- Empty State -->
      <div v-else-if="challenges.length === 0" class="text-center py-12">
        <p class="text-stone-500 dark:text-stone-400">{{ t('challenge.empty', 'No challenges found') }}</p>
      </div>

      <!-- Challenges Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <NuxtLink
          v-for="challenge in challenges"
          :key="challenge.id"
          :to="'/challenges/' + challenge.id"
          class="bg-white dark:bg-stone-800 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
        >
          <div class="p-4">
            <div class="flex items-center justify-between mb-2">
              <span
                class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                :class="{
                  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300': challenge.status === 'upcoming',
                  'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300': challenge.status === 'active',
                  'bg-stone-100 text-stone-600 dark:bg-stone-700 dark:text-stone-400': challenge.status === 'completed'
                }"
              >
                {{ challenge.status }}
              </span>
              <span class="text-sm text-stone-500 dark:text-stone-400">
                {{ challenge.participantCount || 0 }} {{ t('challenge.participants', 'participants') }}
              </span>
            </div>
            <h3 class="font-semibold text-lg text-stone-900 dark:text-stone-100 mb-1">{{ challenge.title }}</h3>
            <p v-if="challenge.description" class="text-sm text-stone-500 dark:text-stone-400 line-clamp-2 mb-3">{{ challenge.description }}</p>
            <div class="text-sm text-stone-500 dark:text-stone-400">
              <span>{{ new Date(challenge.startDate).toLocaleDateString() }} - {{ new Date(challenge.endDate).toLocaleDateString() }}</span>
            </div>
          </div>
        </NuxtLink>
      </div>

      <!-- Pagination -->
      <div v-if="pagination.totalPages > 1" class="mt-8 flex justify-center gap-2">
        <button
          v-for="page in pagination.totalPages"
          :key="page"
          type="button"
          class="w-10 h-10 rounded-lg font-medium transition-colors"
          :class="page === pagination.page
            ? 'bg-orange-500 text-white'
            : 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-300 dark:hover:bg-stone-600'"
          @click="handlePageChange(page)"
        >
          {{ page }}
        </button>
      </div>
    </main>

    <LazyFooterSection />
    <LazyBottomNav />
  </div>
</template>
