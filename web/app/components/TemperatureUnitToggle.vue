<script setup lang="ts">
/**
 * TemperatureUnitToggle - 温度单位切换组件
 *
 * 功能：
 * - 两种温度单位: 摄氏度(°C) / 华氏度(°F)
 * - 点击切换温度单位
 * - 本地存储持久化
 * - 响应式显示 (移动端仅显示图标)
 * - 键盘可访问
 *
 * 使用方式：
 * <TemperatureUnitToggle />
 */

import type { TemperatureUnit } from '~/composables/useTemperatureUnit'

const { unit, setUnit } = useTemperatureUnit()

const { t } = useI18n()

// Temperature unit options
const options: readonly { value: TemperatureUnit; label: string; symbol: string }[] = [
  { value: 'celsius', label: t('temperature.celsius'), symbol: '°C' },
  { value: 'fahrenheit', label: t('temperature.fahrenheit'), symbol: '°F' }
] as const

// Get current option
const currentOption = computed(() =>
  options.find(opt => opt.value === unit.value) || options[0]
)

// Get next option for toggle
const nextOption = computed(() =>
  options[(options.findIndex(o => o.value === unit.value) + 1) % options.length]
)

const toggle = () => {
  setUnit(nextOption.value.value)
}
</script>

<template>
  <button
    type="button"
    class="temp-toggle"
    :aria-label="`${t('temperature.current')}: ${currentOption.label}，${t('temperature.switchTo')}`"
    @click="toggle"
  >
    <span class="temp-symbol">{{ currentOption.symbol }}</span>
    <span class="temp-label">{{ currentOption.label }}</span>
  </button>
</template>

<style scoped>
.temp-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 1px solid var(--color-border, #e7e5e4);
  border-radius: 20px;
  background: var(--color-bg-paper, #fff);
  color: var(--color-text-primary, #1c1917);
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.temp-toggle:hover {
  background: var(--color-bg, #fafaf9);
  border-color: var(--color-text-muted, #a8a29e);
}

.temp-symbol {
  font-size: 16px;
  font-weight: 600;
}

.temp-label {
  font-weight: 500;
}

@media (max-width: 640px) {
  .temp-label {
    display: none;
  }

  .temp-toggle {
    padding: 10px;
    border-radius: 50%;
    min-width: 44px;
    min-height: 44px;
    justify-content: center;
  }
}
</style>
