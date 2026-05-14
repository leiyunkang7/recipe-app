import type { User } from '@recipe-app/shared-types'

export function useAuth() {
  const user = useState<User | null>('auth-user', () => null)
  const isLoading = useState<boolean>('auth-loading', () => false)
  
  const isAuthenticated = computed(() => !!user.value)
  
  /**
   * Fetch current user from server
   */
  async function fetchUser() {
    isLoading.value = true
    try {
      const response = await $fetch('/api/auth/me')
      if (response.success && response.data) {
        // Parse date strings back to Date objects since JSON serialization converts them
        user.value = {
          ...response.data,
          createdAt: new Date(response.data.createdAt),
          updatedAt: new Date(response.data.updatedAt),
          emailVerifiedAt: response.data.emailVerifiedAt ? new Date(response.data.emailVerifiedAt) : null,
        }
      } else {
        user.value = null
      }
    } catch {
      user.value = null
    } finally {
      isLoading.value = false
    }
  }
  
  /**
   * Login with email/password
   */
  async function login(email: string, password: string) {
    isLoading.value = true
    try {
      const response = await $fetch('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      })

      if (response.success && response.data) {
        // Parse date strings back to Date objects since JSON serialization converts them
        user.value = {
          ...response.data,
          createdAt: new Date(response.data.createdAt),
          updatedAt: new Date(response.data.updatedAt),
          emailVerifiedAt: response.data.emailVerifiedAt ? new Date(response.data.emailVerifiedAt) : null,
        }
        return { success: true }
      } else {
        return { success: false, error: (response as unknown).error }
      }
    } catch (error: unknown) {
      return { success: false, error: (error as { data?: { error?: { code: string; message: string } } })?.data?.error || { code: 'ERROR', message: 'Login failed' } }
    } finally {
      isLoading.value = false
    }
  }
  
  /**
   * Logout
   */
  async function logout() {
    isLoading.value = true
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
      user.value = null
    } catch {
      // Ignore errors
    } finally {
      isLoading.value = false
    }
  }
  
  return {
    user: readonly(user),
    isLoading: readonly(isLoading),
    isAuthenticated,
    fetchUser,
    login,
    logout,
  }
}
