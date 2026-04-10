/**
 * useEmailSubscription - Anonymous email subscription for recipe updates
 *
 * Provides functionality for unauthenticated users to subscribe to recipe
 * update notifications via email. Sends a verification email before activating.
 */

interface EmailSubscriptionResponse {
  success: boolean
  data?: {
    message: string
  }
  error?: {
    code: string
    message: string
  }
}

export interface UseEmailSubscriptionReturn {
  email: Ref<string>
  isLoading: Ref<boolean>
  message: Ref<string>
  error: Ref<string>
  subscribe: (recipeId: string) => Promise<boolean>
  reset: () => void
}

export function useEmailSubscription(): UseEmailSubscriptionReturn {
  const email = ref('')
  const isLoading = ref(false)
  const message = ref('')
  const error = ref('')
  const { t } = useI18n()

  const subscribe = async (recipeId: string): Promise<boolean> => {
    const emailValue = email.value.trim()

    // Validate email
    if (!emailValue || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      error.value = t('subscription.invalidEmail')
      return false
    }

    isLoading.value = true
    error.value = ''
    message.value = ''

    try {
      const response = await $fetch<EmailSubscriptionResponse>('/api/subscriptions/email', {
        method: 'POST',
        body: { email: emailValue, recipeId },
      })

      if (response.success) {
        message.value = response.data?.message || t('subscription.emailSubscribed')
        email.value = ''
        return true
      } else {
        error.value = response.error?.message || t('subscription.subscribeFailed')
        return false
      }
    } catch (err: unknown) {
      error.value = err?.data?.error?.message || t('subscription.subscribeFailed')
      return false
    } finally {
      isLoading.value = false
    }
  }

  const reset = () => {
    email.value = ''
    isLoading.value = false
    message.value = ''
    error.value = ''
  }

  return {
    email,
    isLoading: readonly(isLoading),
    message: readonly(message),
    error: readonly(error),
    subscribe,
    reset,
  }
}
