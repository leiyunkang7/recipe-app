<script setup lang="ts">
const route = useRoute()
const { t } = useI18n()
const { isAuthenticated } = useAuth()
const { fetchChallenge, currentChallenge, loading, error, joinChallenge, submitToChallenge } = useCookingChallenges()
const { trackPageView } = useAnalytics()

const challengeId = route.params.id as string
const joinLoading = ref(false)
const joinError = ref<string | null>(null)
const submitLoading = ref(false)
const submitError = ref<string | null>(null)
const submitRecipeId = ref('')

async function handleJoin() {
  joinLoading.value = true
  joinError.value = null
  const result = await joinChallenge(challengeId)
  joinLoading.value = false
  if (!result.success) {
    joinError.value = result.error?.message || 'Join failed'
  } else {
    await fetchChallenge(challengeId)
  }
}

async function handleSubmit() {
  if (!submitRecipeId.value.trim()) return
  submitLoading.value = true
  submitError.value = null
  const result = await submitToChallenge(challengeId, submitRecipeId.value)
  submitLoading.value = false
  if (result.success) {
    submitRecipeId.value = ''
    await fetchChallenge(challengeId)
  } else {
    submitError.value = result.error?.message || 'Submit failed'
  }
}

onMounted(() => {
  fetchChallenge(challengeId)
  trackPageView('challenge-detail')
})
</script>

<template>
  <div class="min-h-screen pb-16 md:pb-0 bg-gradient-to-br from-orange-50 via-stone-50 to-orange-50 dark:from-stone-900 dark:via-stone-800 dark:to-stone-900 transition-colors duration-300">
    <HeaderSection />

    <main v-if="loading && !currentChallenge" class="max-w-7xl mx-auto px-4 py-12 flex justify-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
    </main>

    <main v-else-if="error" class="max-w-7xl mx-auto px-4 py-12 text-center">
      <p class="text-red-500 dark:text-red-400">{{ error }}</p>
    </main>

    <main v-else-if="currentChallenge" class="max-w-7xl mx-auto px-4 py-6">
      <!-- Challenge Header -->
      <div class="bg-white dark:bg-stone-800 rounded-xl shadow-sm overflow-hidden mb-6">
        <div class="p-6">
          <div class="flex items-start justify-between mb-4">
            <div>
              <span
                class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-2"
                :class="{
                  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300': currentChallenge.status === 'upcoming',
                  'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300': currentChallenge.status === 'active',
                  'bg-stone-100 text-stone-600 dark:bg-stone-700 dark:text-stone-400': currentChallenge.status === 'completed'
                }"
              >
                {{ currentChallenge.status }}
              </span>
              <h1 class="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-2">{{ currentChallenge.title }}</h1>
              <p v-if="currentChallenge.description" class="text-stone-500 dark:text-stone-400 mb-4">{{ currentChallenge.description }}</p>
              <div class="flex items-center gap-4 text-sm text-stone-500 dark:text-stone-400">
                <span>{{ currentChallenge.participantCount || 0 }} {{ t('challenge.participants', 'participants') }}</span>
                <span>{{ t('challenge.dates', 'Dates') }}: {{ new Date(currentChallenge.startDate).toLocaleDateString() }} - {{ new Date(currentChallenge.endDate).toLocaleDateString() }}</span>
              </div>
            </div>
            <div v-if="currentChallenge.group" class="text-right">
              <p class="text-sm text-stone-500 dark:text-stone-400">{{ t('challenge.group', 'Group') }}</p>
              <NuxtLink :to="'/groups/' + currentChallenge.group.id" class="text-orange-500 hover:text-orange-600 dark:text-orange-400">
                {{ currentChallenge.group.name }}
              </NuxtLink>
            </div>
          </div>

          <div v-if="currentChallenge.rules" class="mb-4 p-4 bg-stone-50 dark:bg-stone-700 rounded-lg">
            <h3 class="font-semibold text-stone-900 dark:text-stone-100 mb-2">{{ t('challenge.rules', 'Rules') }}</h3>
            <p class="text-stone-600 dark:text-stone-300 whitespace-pre-wrap">{{ currentChallenge.rules }}</p>
          </div>

          <div class="flex gap-3">
            <button
              v-if="isAuthenticated && currentChallenge.status === 'active' && !currentChallenge.currentUserParticipation"
              type="button"
              :disabled="joinLoading"
              class="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white rounded-lg font-medium transition-colors"
              @click="handleJoin"
            >
              {{ joinLoading ? t('challenge.joining', 'Joining...') : t('challenge.join', 'Join Challenge') }}
            </button>
            <span v-if="currentChallenge.currentUserParticipation" class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
              {{ t('challenge.joined', 'Joined') }}
            </span>
          </div>
          <p v-if="joinError" class="mt-4 text-sm text-red-500 dark:text-red-400">{{ joinError }}</p>
        </div>
      </div>

      <!-- Submit Recipe Form -->
      <div v-if="isAuthenticated && currentChallenge.status === 'active' && currentChallenge.currentUserParticipation && !currentChallenge.currentUserParticipation.recipeId" class="bg-white dark:bg-stone-800 rounded-xl shadow-sm p-6 mb-6">
        <h2 class="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-4">{{ t('challenge.submitRecipe', 'Submit Your Recipe') }}</h2>
        <div class="flex gap-3">
          <input
            v-model="submitRecipeId"
            type="text"
            :placeholder="t('challenge.recipeIdPlaceholder', 'Enter recipe ID')"
            class="flex-1 px-4 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
          <button
            type="button"
            :disabled="submitLoading || !submitRecipeId.trim()"
            class="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white rounded-lg font-medium transition-colors"
            @click="handleSubmit"
          >
            {{ submitLoading ? t('challenge.submitting', 'Submitting...') : t('challenge.submit', 'Submit') }}
          </button>
        </div>
        <p v-if="submitError" class="mt-2 text-sm text-red-500 dark:text-red-400">{{ submitError }}</p>
      </div>

      <!-- Participants -->
      <div class="bg-white dark:bg-stone-800 rounded-xl shadow-sm p-6">
        <h2 class="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-4">
          {{ t('challenge.participants', 'Participants') }} ({{ currentChallenge.participants?.length || 0 }})
        </h2>
        <div v-if="currentChallenge.participants && currentChallenge.participants.length > 0" class="space-y-4">
          <div
            v-for="participant in currentChallenge.participants"
            :key="participant.id"
            class="flex items-center gap-4 p-3 bg-stone-50 dark:bg-stone-700 rounded-lg"
          >
            <div class="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
              <span class="text-orange-600 dark:text-orange-300 font-medium">{{ participant.user?.displayName?.charAt(0) || '?' }}</span>
            </div>
            <div class="flex-1">
              <p class="font-medium text-stone-900 dark:text-stone-100">{{ participant.user?.displayName || 'Unknown' }}</p>
              <p v-if="participant.recipe" class="text-sm text-stone-500 dark:text-stone-400">
                {{ t('challenge.submittedRecipe', 'Recipe') }}: {{ participant.recipe.title }}
              </p>
              <p v-else class="text-sm text-stone-400 dark:text-stone-500">
                {{ t('challenge.notSubmitted', 'Not submitted yet') }}
              </p>
            </div>
            <span v-if="participant.submittedAt" class="text-xs text-stone-400">
              {{ new Date(participant.submittedAt).toLocaleDateString() }}
            </span>
          </div>
        </div>
        <p v-else class="text-stone-500 dark:text-stone-400">{{ t('challenge.noParticipants', 'No participants yet') }}</p>
      </div>
    </main>

    <LazyFooterSection />
    <LazyBottomNav />
  </div>
</template>
