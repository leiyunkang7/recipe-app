<script setup lang="ts">
/**
 * RecipeTipButton - Recipe Tip/Support component
 *
 * Features:
 * - Tip button that opens a tip modal
 * - Support recipe creators with virtual tips
 * - Anonymous tipping support
 * - Success confirmation
 */
const props = defineProps<{
  recipe: {
    id: string;
    title?: string;
    authorId?: string;
  }
}>();

const emit = defineEmits<{
  tip: [{ amount: number; message?: string; displayName?: string }]
}>();

const { t } = useI18n();
const { isAuthenticated } = useAuth();

const showTipModal = ref(false);
const selectedAmount = ref(5);
const customAmount = ref<number | null>(null);
const message = ref('');
const displayName = ref('');
const isSubmitting = ref(false);
const tipSuccess = ref(false);

const tipAmounts = [1, 5, 10, 20, 50];

const effectiveAmount = computed(() => {
  return customAmount.value || selectedAmount.value;
});

const handleTip = async () => {
  if (effectiveAmount.value <= 0) return;

  isSubmitting.value = true;
  try {
    const response = await $fetch('/api/tips', {
      method: 'POST',
      body: {
        recipeId: props.recipe.id,
        amount: effectiveAmount.value,
        message: message.value || undefined,
        displayName: displayName.value || undefined,
      },
    });

    if (response.success) {
      tipSuccess.value = true;
      emit('tip', {
        amount: effectiveAmount.value,
        message: message.value,
        displayName: displayName.value,
      });
      setTimeout(() => {
        showTipModal.value = false;
        tipSuccess.value = false;
        message.value = '';
        customAmount.value = null;
        selectedAmount.value = 5;
      }, 2000);
    }
  } catch (error) {
    console.error('Tip failed:', error);
  } finally {
    isSubmitting.value = false;
  }
};

const openTipModal = () => {
  showTipModal.value = true;
};
</script>

<template>
  <div>
    <!-- Tip Button -->
    <button
      @click="openTipModal"
      class="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-3 px-4 rounded-lg hover:from-amber-600 hover:to-orange-600 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{{ t('tip.support') }}</span>
    </button>

    <!-- Tip Modal -->
    <Teleport to="body">
      <div
        v-if="showTipModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        @click.self="showTipModal = false"
      >
        <div class="bg-white dark:bg-stone-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
          <!-- Header -->
          <div class="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white">
            <div class="flex items-center justify-between">
              <h2 class="text-xl font-bold">{{ t('tip.title') }}</h2>
              <button
                @click="showTipModal = false"
                class="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p class="text-amber-100 mt-1">{{ t('tip.subtitle') }}</p>
          </div>

          <!-- Success State -->
          <div v-if="tipSuccess" class="p-8 text-center">
            <div class="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 class="text-xl font-bold text-gray-900 dark:text-stone-100 mb-2">{{ t('tip.thankYou') }}</h3>
            <p class="text-gray-600 dark:text-stone-400">{{ t('tip.successMessage') }}</p>
          </div>

          <!-- Tip Form -->
          <div v-else class="p-6 space-y-6">
            <!-- Amount Selection -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-stone-300 mb-3">
                {{ t('tip.selectAmount') }}
              </label>
              <div class="grid grid-cols-5 gap-2">
                <button
                  v-for="amount in tipAmounts"
                  :key="amount"
                  @click="selectedAmount = amount; customAmount = null"
                  :class="[
                    'py-3 px-2 rounded-lg font-semibold transition-all',
                    selectedAmount === amount && !customAmount
                      ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
                      : 'bg-stone-100 dark:bg-stone-700 text-gray-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-600'
                  ]"
                >
                  ${{ amount }}
                </button>
              </div>
            </div>

            <!-- Custom Amount -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-stone-300 mb-2">
                {{ t('tip.customAmount') }}
              </label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  v-model.number="customAmount"
                  type="number"
                  min="1"
                  :placeholder="t('tip.enterAmount')"
                  class="w-full pl-8 pr-4 py-3 border border-gray-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:bg-stone-700 dark:text-stone-100"
                  @focus="selectedAmount = 0"
                />
              </div>
            </div>

            <!-- Display Name (optional) -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-stone-300 mb-2">
                {{ t('tip.yourName') }} ({{ t('common.optional') }})
              </label>
              <input
                v-model="displayName"
                type="text"
                maxlength="100"
                :placeholder="t('tip.namePlaceholder')"
                class="w-full px-4 py-3 border border-gray-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:bg-stone-700 dark:text-stone-100"
              />
            </div>

            <!-- Message (optional) -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-stone-300 mb-2">
                {{ t('tip.message') }} ({{ t('common.optional') }})
              </label>
              <textarea
                v-model="message"
                rows="3"
                maxlength="500"
                :placeholder="t('tip.messagePlaceholder')"
                class="w-full px-4 py-3 border border-gray-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:bg-stone-700 dark:text-stone-100 resize-none"
              />
            </div>

            <!-- Submit Button -->
            <button
              @click="handleTip"
              :disabled="isSubmitting || effectiveAmount <= 0"
              class="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-4 px-4 rounded-lg hover:from-amber-600 hover:to-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <svg v-if="isSubmitting" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span v-else>{{ t('tip.sendTip', { amount: effectiveAmount }) }}</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
