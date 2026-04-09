import type { CookingChallenge, CreateCookingChallengeDTO, CookingChallengeParticipant } from '@recipe-app/shared-types'

export function useCookingChallenges() {
  const challenges = useState<CookingChallenge[]>('cooking-challenges', () => [])
  const currentChallenge = useState<CookingChallenge | null>('current-cooking-challenge', () => null)
  const loading = useState<boolean>('cooking-challenges-loading', () => false)
  const error = useState<string | null>('cooking-challenges-error', () => null)
  const pagination = useState<{ page: number; limit: number; total: number; totalPages: number }>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })

  async function fetchChallenges(options?: { page?: number; limit?: number; groupId?: string; status?: string; search?: string }) {
    loading.value = true
    error.value = null
    try {
      const params = new URLSearchParams()
      if (options?.page) params.set('page', String(options.page))
      if (options?.limit) params.set('limit', String(options.limit))
      if (options?.groupId) params.set('groupId', options.groupId)
      if (options?.status) params.set('status', options.status)
      if (options?.search) params.set('search', options.search)

      const response = await $fetch('/api/challenges?' + params.toString())
      if (response.success && response.data) {
        challenges.value = response.data.challenges
        pagination.value = response.data.pagination
      }
    } catch (e) {
      error.value = '获取挑战赛列表失败'
      console.error('[useCookingChallenges] fetchChallenges error:', e)
    } finally {
      loading.value = false
    }
  }

  async function fetchChallenge(id: string) {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch('/api/challenges/' + id)
      if (response.success && response.data) {
        currentChallenge.value = response.data
        return response.data
      }
    } catch (e) {
      error.value = '获取挑战赛详情失败'
      console.error('[useCookingChallenges] fetchChallenge error:', e)
    } finally {
      loading.value = false
    }
    return null
  }

  async function createChallenge(data: CreateCookingChallengeDTO) {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch('/api/challenges', {
        method: 'POST',
        body: data,
      })
      if (response.success && response.data) {
        return { success: true, challenge: response.data }
      }
      return { success: false, error: (response as { error?: { code: string; message: string } }).error }
    } catch (e) {
      const err = e as { data?: { error?: { code: string; message: string } } }
      error.value = err.data?.error?.message || '创建挑战赛失败'
      console.error('[useCookingChallenges] createChallenge error:', e)
      return { success: false, error: err.data?.error || { code: 'ERROR', message: '创建挑战赛失败' } }
    } finally {
      loading.value = false
    }
  }

  async function joinChallenge(challengeId: string) {
    try {
      const response = await $fetch('/api/challenges/' + challengeId + '/join', { method: 'POST' })
      if (response.success && response.data) {
        return { success: true }
      }
      return { success: false, error: (response as { error?: { code: string; message: string } }).error }
    } catch (e) {
      const err = e as { data?: { error?: { code: string; message: string } } }
      return { success: false, error: err.data?.error || { code: 'ERROR', message: '参加挑战赛失败' } }
    }
  }

  async function submitToChallenge(challengeId: string, recipeId: string) {
    try {
      const response = await $fetch('/api/challenges/' + challengeId + '/submit', {
        method: 'POST',
        body: { recipeId },
      })
      if (response.success && response.data) {
        return { success: true, participation: response.data }
      }
      return { success: false, error: (response as { error?: { code: string; message: string } }).error }
    } catch (e) {
      const err = e as { data?: { error?: { code: string; message: string } } }
      return { success: false, error: err.data?.error || { code: 'ERROR', message: '提交作品失败' } }
    }
  }

  return {
    challenges: readonly(challenges),
    currentChallenge: readonly(currentChallenge),
    loading: readonly(loading),
    error: readonly(error),
    pagination: readonly(pagination),
    fetchChallenges,
    fetchChallenge,
    createChallenge,
    joinChallenge,
    submitToChallenge,
  }
}
