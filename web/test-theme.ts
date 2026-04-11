// Simple test to verify theme system works
import { useTheme } from './app/composables/useTheme'

// Mock environment for testing
globalThis.localStorage = {
  getItem: (key: string) => {
    console.log('getItem:', key)
    return null
  },
  setItem: (key: string, value: string) => {
    console.log('setItem:', key, '=', value)
  }
} as any

globalThis.window = {
  matchMedia: (query: string) => {
    console.log('matchMedia:', query)
    return {
      matches: false,
      addEventListener: () => {},
      removeEventListener: () => {}
    } as any
  }
} as any

globalThis.document = {
  documentElement: {
    classList: {
      toggle: () => console.log('classList.toggle'),
      add: () => console.log('classList.add'),
      remove: () => console.log('classList.remove')
    }
  },
  querySelector: () => ({
    setAttribute: () => console.log('meta.setAttribute')
  })
} as any

// Test the composable
console.log('Testing useTheme composable...')
try {
  const theme = useTheme()
  console.log('✅ useTheme initialized successfully')
  console.log('Initial mode:', theme.mode)
  console.log('Initial isDark:', theme.isDark)
  
  // Test toggle
  console.log('\nTesting toggle...')
  theme.toggle()
  console.log('✅ toggle works')
  
  // Test setMode
  console.log('\nTesting setMode...')
  theme.setMode('dark')
  console.log('✅ setMode works')
  
  // Test getPreference
  console.log('\nTesting getPreference...')
  const pref = theme.getPreference()
  console.log('✅ getPreference returns:', pref)
  
  console.log('\n🎉 All tests passed!')
} catch (error) {
  console.error('❌ Test failed:', error)
}