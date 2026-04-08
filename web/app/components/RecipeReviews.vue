<script setup lang="ts">
/**
 * RecipeReviews - Recipe reviews component
 *
 * Features:
 * - Display paginated list of reviews
 * - Show user avatar and name for each review
 * - Display review timestamps
 * - Interactive review submission/editing
 * - Delete own review
 * - Pagination controls
 */
import type { SizeVariant } from '~/types/component-props'

interface Props {
  recipeId: string
  size?: SizeVariant
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
})

const {
  reviews,
  userReview,
  loading,
  submitting,
  currentPage,
  totalPages,
  totalReviews,
  init,
  submitReview,
  deleteReview,
  nextPage,
  prevPage,
} = useRecipeReviews(props.recipeId)

const showReviewForm = ref(false)
const reviewContent = ref('')
const isEditing = ref(false)

// Text sizes based on component size
const textSizes: Record<SizeVariant, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
}

const avatarSizes: Record<SizeVariant, string> = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
}

// Initialize on mount
onMounted(() => {
  init()
})

// Open review form
const openReviewForm = () => {
  if (userReview.value) {
    reviewContent.value = userReview.value.content
    isEditing.value = true
  } else {
    reviewContent.value = ''
    isEditing.value = false
  }
  showReviewForm.value = true
}

// Cancel review form
const cancelReviewForm = () => {
  showReviewForm.value = false
  reviewContent.value = ''
  isEditing.value = false
}

// Submit review
const handleSubmit = async () => {
  const success = await submitReview(reviewContent.value)
  if (success) {
    showReviewForm.value = false
    reviewContent.value = ''
    isEditing.value = false
  }
}

// Delete review
const handleDelete = async () => {
  if (confirm('Are you sure you want to delete your review?')) {
    await deleteReview()
  }
}

// Format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Calculate displayed rating from userReview
const hasUserReview = computed(() => !!userReview.value)
</script>

<template>
  <div class="recipe-reviews">
    <!-- Header with count and write button -->
    <div class="reviews-header flex items-center justify-between mb-4">
      <h3 :class="['font-semibold text-gray-900 dark:text-white', textSizes[size]]">
        Reviews ({{ totalReviews }})
      </h3>
      <button
        v-if="!showReviewForm"
        type="button"
        class="px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors"
        @click="openReviewForm"
      >
        {{ hasUserReview ? 'Edit Review' : 'Write a Review' }}
      </button>
    </div>

    <!-- Review Form -->
    <div v-if="showReviewForm" class="review-form mb-6 p-4 bg-gray-50 dark:bg-stone-800 rounded-lg">
      <label :class="['block mb-2 font-medium text-gray-700 dark:text-stone-200', textSizes[size]]">
        {{ isEditing ? 'Edit your review' : 'Write a review' }}
      </label>
      <textarea
        v-model="reviewContent"
        rows="4"
        maxlength="2000"
        :class="[
          'w-full px-3 py-2 border border-gray-300 dark:border-stone-600 rounded-lg',
          'bg-white dark:bg-stone-700 text-gray-900 dark:text-white',
          'placeholder-gray-400 dark:placeholder-stone-400',
          'focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent',
          'resize-none',
        ]"
        placeholder="Share your thoughts about this recipe..."
      />
      <div class="flex items-center justify-between mt-2">
        <span class="text-xs text-gray-500 dark:text-stone-400">
          {{ reviewContent.length }}/2000 characters
        </span>
        <div class="flex gap-2">
          <button
            type="button"
            class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-stone-200 bg-gray-200 dark:bg-stone-600 hover:bg-gray-300 dark:hover:bg-stone-500 rounded-lg transition-colors"
            @click="cancelReviewForm"
          >
            Cancel
          </button>
          <button
            type="button"
            :disabled="!reviewContent.trim() || submitting"
            class="px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors"
            @click="handleSubmit"
          >
            {{ submitting ? 'Submitting...' : (isEditing ? 'Update' : 'Submit') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="reviews-loading py-8">
      <div class="animate-pulse space-y-4">
        <div v-for="i in 3" :key="i" class="flex gap-3">
          <div class="w-10 h-10 bg-gray-200 dark:bg-stone-700 rounded-full" />
          <div class="flex-1 space-y-2">
            <div class="h-4 bg-gray-200 dark:bg-stone-700 rounded w-1/4" />
            <div class="h-3 bg-gray-200 dark:bg-stone-700 rounded" />
            <div class="h-3 bg-gray-200 dark:bg-stone-700 rounded w-5/6" />
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="reviews.length === 0" class="reviews-empty py-8 text-center">
      <p class="text-gray-500 dark:text-stone-400">
        No reviews yet. Be the first to share your thoughts!
      </p>
    </div>

    <!-- Reviews list -->
    <div v-else class="reviews-list space-y-4">
      <div
        v-for="review in reviews"
        :key="review.id"
        class="review-item p-4 bg-white dark:bg-stone-800 rounded-lg border border-gray-200 dark:border-stone-700"
      >
        <div class="flex items-start gap-3">
          <!-- User avatar -->
          <div
            :class="[
              'flex-shrink-0 rounded-full bg-gray-200 dark:bg-stone-600',
              'flex items-center justify-center overflow-hidden',
              avatarSizes[size],
            ]"
          >
            <img
              v-if="review.user.avatarUrl"
              :src="review.user.avatarUrl"
              :alt="review.user.name"
              class="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
            <span v-else class="text-gray-500 dark:text-stone-400 text-lg font-medium">
              {{ review.user.name?.charAt(0)?.toUpperCase() || '?' }}
            </span>
          </div>

          <!-- Review content -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between mb-1">
              <span class="font-medium text-gray-900 dark:text-white">
                {{ review.user.name || 'Anonymous' }}
              </span>
              <span class="text-xs text-gray-500 dark:text-stone-400">
                {{ formatDate(review.createdAt) }}
              </span>
            </div>
            <p :class="['text-gray-700 dark:text-stone-300 whitespace-pre-wrap', textSizes[size]]">
              {{ review.content }}
            </p>

            <!-- Delete button for own review -->
            <div v-if="userReview?.id === review.id" class="mt-2">
              <button
                type="button"
                class="text-xs text-red-500 hover:text-red-600"
                @click="handleDelete"
              >
                Delete review
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="pagination flex items-center justify-center gap-2 mt-6">
      <button
        type="button"
        :disabled="currentPage <= 1"
        class="px-3 py-1 text-sm font-medium text-gray-700 dark:text-stone-200 bg-gray-200 dark:bg-stone-600 hover:bg-gray-300 dark:hover:bg-stone-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
        @click="prevPage"
      >
        Previous
      </button>
      <span class="text-sm text-gray-500 dark:text-stone-400">
        Page {{ currentPage }} of {{ totalPages }}
      </span>
      <button
        type="button"
        :disabled="currentPage >= totalPages"
        class="px-3 py-1 text-sm font-medium text-gray-700 dark:text-stone-200 bg-gray-200 dark:bg-stone-600 hover:bg-gray-300 dark:hover:bg-stone-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
        @click="nextPage"
      >
        Next
      </button>
    </div>
  </div>
</template>
