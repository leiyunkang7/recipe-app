<script setup lang="ts">
const route = useRoute()
const { t } = useI18n()
const { isAuthenticated } = useAuth()
const { fetchGroup, currentGroup, loading, error, joinGroup, leaveGroup, getGroupMembers } = useCookingGroups()
const { fetchChallenges, createChallenge } = useCookingChallenges()
const { trackPageView } = useAnalytics()
const groupId = route.params.id as string
const members = ref<unknown[]>([])
const challenges = ref<unknown[]>([])
const joinLoading = ref(false)
const joinError = ref<string | null>(null)
const showCreateChallengeModal = ref(false)
const challengeForm = reactive({
  title: '',
  description: '',
  rules: '',
  startDate: '',
  endDate: '',
})
const challengeLoading = ref(false)
const challengeError = ref<string | null>(null)
async function handleJoin() {
  joinLoading.value = true
  joinError.value = null
  const result = await joinGroup(groupId)
  joinLoading.value = false
  if (!result.success) {
    joinError.value = result.error?.message || '加入失败'
  } else {
    await loadGroupData()
  }
}
async function handleLeave() {
  joinLoading.value = true
  const result = await leaveGroup(groupId)
  joinLoading.value = false
  if (result.success) {
    await loadGroupData()
  }
}
async function handleCreateChallenge() {
  if (!challengeForm.title.trim() || !challengeForm.startDate || !challengeForm.endDate) return
  challengeLoading.value = true
  challengeError.value = null
  const result = await createChallenge({
    groupId,
    title: challengeForm.title,
    description: challengeForm.description || undefined,
    rules: challengeForm.rules || undefined,
    startDate: challengeForm.startDate,
    endDate: challengeForm.endDate,
  })
  challengeLoading.value = false
  if (result.success) {
    showCreateChallengeModal.value = false
    challengeForm.title = ''
    challengeForm.description = ''
    challengeForm.rules = ''
    challengeForm.startDate = ''
    challengeForm.endDate = ''
    await fetchChallenges({ groupId })
  } else {
    challengeError.value = result.error?.message || '创建失败'
  }
}
async function loadGroupData() {
  const group = await fetchGroup(groupId)
  if (group) {
    members.value = await getGroupMembers(groupId)
    challenges.value = await fetchChallenges({ groupId })
  }
}
onMounted(() => {
  loadGroupData()
  trackPageView('group-detail')
})
</script>
