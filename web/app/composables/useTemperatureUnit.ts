/**
 * useTemperatureUnit - 温度单位管理 Composable
 *
 * 功能：
 * - 双态温度单位管理: celsius / fahrenheit
 * - localStorage 持久化
 * - 温度转换函数
 *
 * 使用方式：
 * const { unit, isCelsius, toggle, formatTemp } = useTemperatureUnit()
 */

export type TemperatureUnit = 'celsius' | 'fahrenheit'

const STORAGE_KEY = 'temperature-unit'

// Conversion constants
const CELSIUS_TO_FAHRENHEIT = (c: number) => Math.round((c * 9) / 5 + 32)
const FAHRENHEIT_TO_CELSIUS = (f: number) => Math.round(((f - 32) * 5) / 9)

export function useTemperatureUnit() {
  // Shared state across components using useState
  const unit = useState<TemperatureUnit>('temperature-unit', () => 'celsius')

  /**
   * Initialize unit state from localStorage
   * Call this once on app mount
   */
  const init = () => {
    if (!import.meta.client) return

    const stored = localStorage.getItem(STORAGE_KEY) as TemperatureUnit | null
    if (stored === 'celsius' || stored === 'fahrenheit') {
      unit.value = stored
    }
  }

  /**
   * Set explicit temperature unit
   */
  const setUnit = (newUnit: TemperatureUnit) => {
    if (!import.meta.client) return

    unit.value = newUnit
    localStorage.setItem(STORAGE_KEY, newUnit)
  }

  /**
   * Toggle between celsius and fahrenheit
   */
  const toggle = () => {
    setUnit(unit.value === 'celsius' ? 'fahrenheit' : 'celsius')
  }

  /**
   * Check if current unit is celsius
   */
  const isCelsius = computed(() => unit.value === 'celsius')

  /**
   * Format temperature value based on current unit
   * @param celsiusTemp - temperature in celsius (stored value)
   * @returns formatted string with unit symbol
   */
  const formatTemp = (celsiusTemp: number): string => {
    if (unit.value === 'celsius') {
      return `${celsiusTemp}°C`
    }
    return `${CELSIUS_TO_FAHRENHEIT(celsiusTemp)}°F`
  }

  /**
   * Convert celsius to current unit
   */
  const convertFromCelsius = (celsiusTemp: number): number => {
    if (unit.value === 'celsius') {
      return celsiusTemp
    }
    return CELSIUS_TO_FAHRENHEIT(celsiusTemp)
  }

  /**
   * Convert current unit to celsius (for storage)
   */
  const convertToCelsius = (temp: number): number => {
    if (unit.value === 'celsius') {
      return temp
    }
    return FAHRENHEIT_TO_CELSIUS(temp)
  }

  return {
    // State
    unit: readonly(unit),
    isCelsius,
    // Methods
    init,
    setUnit,
    toggle,
    // Utilities
    formatTemp,
    convertFromCelsius,
    convertToCelsius,
  }
}
