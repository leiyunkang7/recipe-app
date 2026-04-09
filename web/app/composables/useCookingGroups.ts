import type { CookingGroup, CreateCookingGroupDTO, CookingGroupMember } from '@recipe-app/shared-types'

export function useCookingGroups() {
  const groups = useState<CookingGroup[]>('cooking-groups', () => [])
  const currentGroup = useState<CookingGroup | null>('current-cooking-group', () => null)
  const loading = useState<boolean>('cooking-groups-loading', () => false)
  const error = useState<string | null>('cooking-groups-error', () => null)
  const pagination = useState<{ page: number; limit: number; total: number; totalPages: number }>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })

  async function fetchGroups(options?: { page?: number; limit?: number; search?: string; isPublic?: boolean }) {
    loading.value = true
    error.value = null
    try {
      const params = new URLSearchParams()
      if (options?.page) params.set('page', String(options.page))
      if (options?.limit) params.set('limit', String(options.limit))
      if (options?.search) params.set('search', options.search)
      if (options?.isPublic !== undefined) params.set('isPublic', String(options.isPublic))

      const response = await $fetch('/api/groups?' + params.toString())
      if (response.success && response.data) {
        groups.value = response.data.groups
        pagination.value = response.data.pagination
      }
    } catch (e) {
      error.value = '获取小组列表失败'
      console.error('[useCookingGroups] fetchGroups error:', e)
    } finally {
      loading.value = false
    }
  }

  async function fetchGroup(id: string) {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch('/api/groups/' + id)
      if (response.success && response.data) {
        currentGroup.value = response.data
        return response.data
      }
    } catch (e) {
      error.value = '获取小组详情失败'
      console.error('[useCookingGroups] fetchGroup error:', e)
    } finally {
      loading.value = false
    }
    return null
  }

  async function createGroup(data: CreateCookingGroupDTO) {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch('/api/groups', {
        method: 'POST',
        body: data,
      })
      if (response.success && response.data) {
        return { success: true, group: response.data }
      }
      return { success: false, error: (response as { error?: { code: string; message: string } }).error }
    } catch (e) {
      const err = e as { data?: { error?: { code: string; message: string } } }
      error.value = err.data?.error?.message || '创建小组失败'
      console.error('[useCookingGroups] createGroup error:', e)
      return { success: false, error: err.data?.error || { code: 'ERROR', message: '创建小组失败' } }
    } finally {
      loading.value = false
    }
  }

  async function joinGroup(groupId: string) {
    try {
      const response = await $fetch('/api/groups/' + groupId + '/join', { method: 'POST' })
      if (response.success && response.data) {
        return { success: true }
      }
      return { success: false, error: (response as { error?: { code: string; message: string } }).error }
    } catch (e) {
      const err = e as { data?: { error?: { code: string; message: string } } }
      return { success: false, error: err.data?.error || { code: 'ERROR', message: '加入小组失败' } }
    }
  }

  async function leaveGroup(groupId: string) {
    try {
      const response = await $fetch('/api/groups/' + groupId + '/leave', { method: 'POST' })
      if (response.success) {
        return { success: true }
      }
      return { success: false, error: (response as { error?: { code: string; message: string } }).error }
    } catch (e) {
      const err = e as { data?: { error?: { code: string; message: string } } }
      return { success: false, error: err.data?.error || { code: 'ERROR', message: '退出小组失败' } }
    }
  }

  async function getGroupMembers(groupId: string): Promise<CookingGroupMember[]> {
    try {
      const response = await $fetch('/api/groups/' + groupId + '/members')
      if (response.success && response.data) {
        return response.data.members || []
      }
    } catch (e) {
      console.error('[useCookingGroups] getGroupMembers error:', e)
    }
    return []
  }

  return {
    groups: readonly(groups),
    currentGroup: readonly(currentGroup),
    loading: readonly(loading),
    error: readonly(error),
    pagination: readonly(pagination),
    fetchGroups,
    fetchGroup,
    createGroup,
    joinGroup,
    leaveGroup,
    getGroupMembers,
  }
}
