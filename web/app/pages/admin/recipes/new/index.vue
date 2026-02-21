<script setup lang="ts">
const { locale } = useI18n()
const localePath = useLocalePath()
navigateTo(localePath('/admin/recipes/new/edit', locale.value), { redirectCode: 301 })
</script>
