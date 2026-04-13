import { ref, computed, readonly } from 'vue'
import type { ServiceResponse } from '@recipe-app/shared-types'
import { useAuth } from './useAuth'
import { useOptimisticBoolean } from './useOptimisticUpdate'

export interface FollowInfo {
  userId: string
  followedAt: string
}

/**
 * useFollows - User following management composable with optimistic updates
 *
 * Provides reactive following state and actions for following/unfollowing users.
 * Uses optimistic updates for immediate UI feedback with automatic rollback on failure.
 */
export const useFollows = () => {
  const { isAuthenticated, user } = useAuth()
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Cache of following states for optimistic updates
  const followingCache = useState<Record<string, boolean>>('following-cache', () => ({}))

  /**
   * Get optimistic following state for a target user
   * Returns a reactive boolean that updates immediately on follow/unfollow
   */
  const useFollowingState = (targetUserId: string) => {
    // Initialize from cache or default to false
    if (!(targetUserId in followingCache.value)) {
      followingCache.value[targetUserId] = false
    }

    const optimisticFollow = useOptimisticBoolean({
      initialValue: followingCache.value[targetUserId],
      rollbackMessage: 'Failed to update follow status. Please try again.',
    })

    return {
      isFollowing: optimisticFollow.value,
      isPending: optimisticFollow.isPending,
      toggle: async () => {
        if (followingCache.value[targetUserId]) {
          await unfollowUser(targetUserId, optimisticFollow)
        } else {
          await followUser(targetUserId, optimisticFollow)
        }
      },
    }
  }

  /**
   * Check if current user is following a target user
   */
  const isFollowing = async (targetUserId: string): Promise<boolean> => {
    if (!isAuthenticated.value || !user.value) {
      return false
    }

    try {
      const response = await $fetch<ServiceResponse<FollowInfo[]>>('/api/follows', {
        method: 'GET',
        query: {
          userId: user.value.id,
          list: 'following'
        }
      })

      if (response.success && response.data) {
        const isFav = response.data.some((follow: FollowInfo) => follow.userId === targetUserId)
        followingCache.value[targetUserId] = isFav
        return isFav
      }
      return false
    } catch (err) {
      console.error('[useFollows] Error checking follow status:', err)
      return followingCache.value[targetUserId] ?? false
    }
  }

  /**
   * Follow a user with optimistic update
   */
  const followUser = async (
    targetUserId: string,
    optimisticState?: ReturnType<typeof useOptimisticBoolean>
  ): Promise<ServiceResponse<void>> => {
    if (!isAuthenticated.value) {
      return {
        success: false,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'Must be logged in to follow users'
        }
      }
    }

    const mutation = async () => {
      const response = await $fetch<ServiceResponse<void>>('/api/follows', {
        method: 'POST',
        body: { userId: targetUserId }
      })

      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to follow user')
      }
    }

    if (optimisticState) {
      loading.value = true
      error.value = null

      try {
        await optimisticState.toggle(mutation)
        followingCache.value[targetUserId] = true
        return { success: true }
      } catch (err) {
        console.error('[useFollows] Error following user:', err)
        const message = err instanceof Error ? err.message : 'Failed to follow user'
        error.value = message
        return {
          success: false,
          error: {
            code: 'NETWORK_ERROR',
            message
          }
        }
      } finally {
        loading.value = false
      }
    } else {
      // Non-optimistic fallback
      loading.value = true
      error.value = null

      try {
        await mutation()
        followingCache.value[targetUserId] = true
        return { success: true }
      } catch (err) {
        console.error('[useFollows] Error following user:', err)
        const message = err instanceof Error ? err.message : 'Failed to follow user'
        error.value = message
        return {
          success: false,
          error: {
            code: 'NETWORK_ERROR',
            message
          }
        }
      } finally {
        loading.value = false
      }
    }
  }

  /**
   * Unfollow a user with optimistic update
   */
  const unfollowUser = async (
    targetUserId: string,
    optimisticState?: ReturnType<typeof useOptimisticBoolean>
  ): Promise<ServiceResponse<void>> => {
    if (!isAuthenticated.value) {
      return {
        success: false,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'Must be logged in to unfollow users'
        }
      }
    }

    const mutation = async () => {
      const response = await $fetch('/api/follows', {
        method: 'DELETE',
        query: { userId: targetUserId }
      })

      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to unfollow user')
      }
    }

    if (optimisticState) {
      loading.value = true
      error.value = null

      try {
        await optimisticState.toggle(mutation)
        followingCache.value[targetUserId] = false
        return { success: true }
      } catch (err) {
        console.error('[useFollows] Error unfollowing user:', err)
        const message = err instanceof Error ? err.message : 'Failed to unfollow user'
        error.value = message
        return {
          success: false,
          error: {
            code: 'NETWORK_ERROR',
            message
          }
        }
      } finally {
        loading.value = false
      }
    } else {
      // Non-optimistic fallback
      loading.value = true
      error.value = null

      try {
        await mutation()
        followingCache.value[targetUserId] = false
        return { success: true }
      } catch (err) {
        console.error('[useFollows] Error unfollowing user:', err)
        const message = err instanceof Error ? err.message : 'Failed to unfollow user'
        error.value = message
        return {
          success: false,
          error: {
            code: 'NETWORK_ERROR',
            message
          }
        }
      } finally {
        loading.value = false
      }
    }
  }

  /**
   * Get followers for a user
   */
  const getFollowers = async (userId: string): Promise<ServiceResponse<FollowInfo[]>> => {
    try {
      const response = await $fetch('/api/follows', {
        method: 'GET',
        query: {
          userId,
          list: 'followers'
        }
      })

      if (response.success) {
        return {
          success: true,
          data: response.data
        }
      } else {
        return {
          success: false,
          error: {
            code: response.error?.code || 'FETCH_ERROR',
            message: response.error?.message || 'Failed to fetch followers'
          }
        }
      }
    } catch (err) {
      console.error('[useFollows] Error fetching followers:', err)
      const message = err instanceof Error ? err.message : 'Failed to fetch followers'
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message
        }
      }
    }
  }

  /**
   * Get following list for a user
   */
  const getFollowing = async (userId: string): Promise<ServiceResponse<FollowInfo[]>> => {
    try {
      const response = await $fetch('/api/follows', {
        method: 'GET',
        query: {
          userId,
          list: 'following'
        }
      })

      if (response.success) {
        return {
          success: true,
          data: response.data
        }
      } else {
        return {
          success: false,
          error: {
            code: response.error?.code || 'FETCH_ERROR',
            message: response.error?.message || 'Failed to fetch following'
          }
        }
      }
    } catch (err) {
      console.error('[useFollows] Error fetching following:', err)
      const message = err instanceof Error ? err.message : 'Failed to fetch following'
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message
        }
      }
    }
  }

  return {
    // State
    loading: readonly(loading),
    error: readonly(error),
    followingCache: readonly(followingCache),

    // Methods
    useFollowingState,
    isFollowing,
    followUser,
    unfollowUser,
    getFollowers,
    getFollowing
  }
}
