<script setup lang="ts">
const { t } = useI18n()
const { isAuthenticated } = useAuth()
const { groups, loading, error, pagination, fetchGroups, createGroup } = useCookingGroups()
const { trackPageView } = useAnalytics()
const searchQuery = ref('')
const showCreateModal = ref(false)
const createForm = reactive({
  name: '',
  description: '',
  imageUrl: '',
  isPublic: true,
})
const createLoading = ref(false)
const createError = ref<string | null>(null)
async function handleSearch() {
  await fetchGroups({ search: searchQuery.value || undefined, page: 1 })
}
async function handlePageChange(page: number) {
  await fetchGroups({ page, search: searchQuery.value || undefined })
}
async function handleCreateGroup() {
  if (!createForm.name.trim()) return
  createLoading.value = true
  createError.value = null
  const result = await createGroup({
    name: createForm.name,
    description: createForm.description || undefined,
    imageUrl: createForm.imageUrl || undefined,
    isPublic: createForm.isPublic,
  })
  createLoading.value = false
  if (result.success) {
    showCreateModal.value = false
    createForm.name = ''
    createForm.description = ''
    createForm.imageUrl = ''
    createForm.isPublic = true
    await fetchGroups({ page: 1 })
  } else {
    createError.value = result.error?.message || '创建失败'
  }
}
onMounted(() => {
  fetchGroups({ page: 1 })
  trackPageView('groups')
})
</script>
<template>
  <div class="min-h-screen pb-16 md:pb-0 bg-gradient-to-br from-orange-50 via-stone-50 to-orange-50 dark:from-stone-900 dark:via-stone-800 dark:to-stone-900 transition-colors duration-300">
    <HeaderSection />

    <main id="main-content" tabindex="-1" class="max-w-7xl mx-auto px-4 py-6">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-stone-900 dark:text-stone-100">{{ t('group.title', 'Cooking Groups') }}</h1>
        <button
          v-if="isAuthenticated"
          type="button"
          class="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
          @click="showCreateModal = true"
        >
          {{ t('group.create', 'Create Group') }}
        </button>
      </div>

      <div class="mb-6">
        <div class="flex gap-2">
          <div class="relative flex-1">
            <label for="group-search-input" class="sr-only">{{ t('group.searchPlaceholder', 'Search groups') }}</label>
            <input
              id="group-search-input"
              v-model="searchQuery"
              type="text"
              :placeholder="t('group.searchPlaceholder', 'Search groups...')"
              class="w-full px-4 py-2 pl-10 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              @keyup.enter="handleSearch"
            />
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button
            type="button"
            class="px-4 py-2 bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-700 dark:text-stone-200 rounded-lg font-medium transition-colors"
            @click="handleSearch"
          >
            {{ t('common.search', 'Search') }}
          </button>
        </div>
      </div>

      <div v-if="loading && groups.length === 0" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>

      <div v-else-if="error" class="text-center py-12">
        <p class="text-red-500 dark:text-red-400">{{ error }}</p>
        <button
          type="button"
          class="mt-4 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
          @click="fetchGroups({ page: 1 })"
        >
          {{ t('common.retry', 'Retry') }}
        </button>
      </div>

      <div v-else-if="groups.length === 0" class="text-center py-12">
        <p class="text-stone-500 dark:text-stone-400">{{ t('group.empty', 'No groups found') }}</p>
        <button
          v-if="isAuthenticated"
          type="button"
          class="mt-4 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
          @click="showCreateModal = true"
        >
          {{ t('group.createFirst', 'Create the first group') }}
        </button>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <NuxtLink
          v-for="group in groups"
          :key="group.id"
          :to="'/groups/' + group.id"
          class="bg-white dark:bg-stone-800 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
        >
          <div v-if="group.imageUrl" class="aspect-video w-full">
            <img :src="group.imageUrl" :alt="group.name" class="w-full h-full object-cover" />
          </div>
          <div v-else class="aspect-video w-full bg-gradient-to-br from-orange-100 to-stone-100 dark:from-stone-700 dark:to-stone-600 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div class="p-4">
            <h3 class="font-semibold text-lg text-stone-900 dark:text-stone-100 mb-1">{{ group.name }}</h3>
            <p v-if="group.description" class="text-sm text-stone-500 dark:text-stone-400 line-clamp-2 mb-3">{{ group.description }}</p>
            <div class="flex items-center gap-4 text-sm text-stone-500 dark:text-stone-400">
              <span>{{ group.memberCount || 0 }} {{ t('group.members', 'members') }}</span>
              <span>{{ group.challengeCount || 0 }} {{ t('group.challenges', 'challenges') }}</span>
            </div>
            <div v-if="!group.isPublic" class="mt-2">
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-stone-200 dark:bg-stone-600 text-stone-600 dark:text-stone-200">
                {{ t('group.private', 'Private') }}
              </span>
            </div>
          </div>
        </NuxtLink>
      </div>

      <div v-if="pagination.totalPages > 1" class="mt-8 flex justify-center gap-2">
        <button
          v-for="page in pagination.totalPages"
          :key="page"
          type="button"
          class="w-10 h-10 rounded-lg font-medium transition-colors"
          :class="page === pagination.page ? 'bg-orange-500 text-white' : 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-300 dark:hover:bg-stone-600'"
          @click="handlePageChange(page)"
        >
          {{ page }}
        </button>
      </div>
    </main>

    <Teleport to="body">
      <div v-if="showCreateModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" @click.self="showCreateModal = false">
        <div class="bg-white dark:bg-stone-800 rounded-xl shadow-xl w-full max-w-md p-6">
          <h2 class="text-xl font-bold text-stone-900 dark:text-stone-100 mb-4">{{ t('group.create', 'Create Cooking Group') }}</h2>
          <form @submit.prevent="handleCreateGroup">
            <div class="mb-4">
              <label for="group-name-input" class="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">{{ t('group.name', 'Group Name') }} *</label>
              <input id="group-name-input" v-model="createForm.name" type="text" required maxlength="100" class="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
            </div>
            <div class="mb-4">
              <label for="group-description-input" class="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">{{ t('group.description', 'Description') }}</label>
              <textarea id="group-description-input" v-model="createForm.description" rows="3" maxlength="500" class="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent"></textarea>
            </div>
            <div class="mb-4">
              <label for="group-image-url-input" class="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">{{ t('group.imageUrl', 'Image URL') }}</label>
              <input id="group-image-url-input" v-model="createForm.imageUrl" type="url" class="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
            </div>
            <div class="mb-6">
              <label class="flex items-center gap-2 cursor-pointer">
                <input v-model="createForm.isPublic" type="checkbox" class="w-4 h-4 rounded border-stone-300 text-orange-500 focus:ring-orange-500" />
                <span class="text-sm text-stone-700 dark:text-stone-300">{{ t('group.isPublic', 'Public group') }}</span>
              </label>
            </div>
            <p v-if="createError" class="mb-4 text-sm text-red-500 dark:text-red-400">{{ createError }}</p>
            <div class="flex justify-end gap-3">
              <button type="button" class="px-4 py-2 bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-700 dark:text-stone-200 rounded-lg font-medium transition-colors" @click="showCreateModal = false">{{ t('common.cancel', 'Cancel') }}</button>
              <button type="submit" :disabled="createLoading || !createForm.name.trim()" class="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white rounded-lg font-medium transition-colors">{{ createLoading ? t('common.creating', 'Creating...') : t('common.create', 'Create') }}</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <LazyFooterSection />
    <LazyBottomNav />
  </div>
</template>
