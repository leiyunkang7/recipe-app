import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'

// Mock Wake Lock API
const mockWakeLock = {
  release: vi.fn().mockResolvedValue(undefined),
  released: false,
  type: 'screen',
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
}

vi.stubGlobal('navigator', {
  wakeLock: {
    request: vi.fn().mockResolvedValue(mockWakeLock),
  },
  vibrate: vi.fn(),
})

// Mock useI18n
vi.mock('~/composables/useI18n', () => ({
  useI18n: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      if (key === 'cookingMode.stepOf') {
        return `Step ${params?.current} of ${params?.total}`
      }
      if (key === 'cookingMode.exit') return 'Exit'
      if (key === 'cookingMode.title') return 'Cooking Mode'
      if (key === 'cookingMode.timerDone') return 'Timer Done'
      if (key === 'cookingMode.timerReset') return 'Reset'
      if (key === 'cookingMode.pause') return 'Pause'
      if (key === 'cookingMode.stop') return 'Stop'
      if (key === 'cookingMode.resume') return 'Resume'
      if (key === 'cookingMode.startTimer') return 'Start Timer'
      if (key === 'cookingMode.prev') return 'Previous'
      if (key === 'cookingMode.next') return 'Next'
      if (key === 'cookingMode.finish') return 'Finish'
      if (key === 'cookingMode.prevStep') return 'Previous Step'
      if (key === 'cookingMode.nextStep') return 'Next Step'
      if (key === 'cookingMode.estimatedTime') return `${params?.mins} min`
      if (key === 'cookingMode.goToStep') return 'Go to Step'
      if (key === 'cookingMode.screenOn') return 'Screen On'
      return key
    },
    locale: ref('zh'),
  }),
}))

// Mock RecipeStatCard
vi.mock('~/components/recipe/RecipeStatCard.vue', () => ({
  default: {
    name: 'RecipeStatCard',
    props: ['icon', 'label', 'value', 'iconClass', 'bgClass', 'size'],
    template: '<div class="stat-card">{{ label }}: {{ value }}</div>',
  },
}))

// Mock icons
vi.mock('~/components/icons/TimerIcon.vue', () => ({
  default: { name: 'TimerIcon', template: '<span class="timer-icon">⏱️</span>' },
}))
vi.mock('~/components/icons/PeopleIcon.vue', () => ({
  default: { name: 'PeopleIcon', template: '<span class="people-icon">👥</span>' },
}))
vi.mock('~/components/icons/PrepIcon.vue', () => ({
  default: { name: 'PrepIcon', template: '<span class="prep-icon">🔪</span>' },
}))
vi.mock('~/components/icons/CookIcon.vue', () => ({
  default: { name: 'CookIcon', template: '<span class="cook-icon">🍳</span>' },
}))

describe('CookingMode', () => {
  const createMockRecipe = (steps: Array<{ instruction: string; durationMinutes?: number }>) => ({
    id: 'test-recipe',
    title: 'Test Recipe',
    description: 'A test recipe',
    category: '主菜',
    servings: 4,
    prepTimeMinutes: 10,
    cookTimeMinutes: 20,
    difficulty: 'easy' as const,
    ingredients: [
      { id: '1', name: 'Flour', amount: 2, unit: 'cups' },
      { id: '2', name: 'Sugar', amount: 1, unit: 'cup' },
    ],
    steps: steps.map((s, i) => ({
      id: `step-${i}`,
      stepNumber: i + 1,
      instruction: s.instruction,
      durationMinutes: s.durationMinutes,
    })),
  })

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    document.addEventListener = vi.fn()
    document.removeEventListener = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('rendering', () => {
    it('should not render when show is false', async () => {
      const CookingMode = await import('./CookingMode.vue')
      const recipe = createMockRecipe([{ instruction: 'Step 1' }])
      const wrapper = mount(CookingMode.default, {
        props: { show: false, recipe, initialStep: 0 },
      })
      expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    })

    it('should render when show is true', async () => {
      const CookingMode = await import('./CookingMode.vue')
      const recipe = createMockRecipe([{ instruction: 'Step 1' }])
      const wrapper = mount(CookingMode.default, {
        props: { show: true, recipe, initialStep: 0 },
      })
      await flushPromises()
      expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
    })

    it('should display current step instruction', async () => {
      const CookingMode = await import('./CookingMode.vue')
      const recipe = createMockRecipe([{ instruction: 'Mix ingredients thoroughly' }])
      const wrapper = mount(CookingMode.default, {
        props: { show: true, recipe, initialStep: 0 },
      })
      await flushPromises()
      expect(wrapper.text()).toContain('Mix ingredients thoroughly')
    })

    it('should display step number badge', async () => {
      const CookingMode = await import('./CookingMode.vue')
      const recipe = createMockRecipe([{ instruction: 'Step 1' }, { instruction: 'Step 2' }])
      const wrapper = mount(CookingMode.default, {
        props: { show: true, recipe, initialStep: 0 },
      })
      await flushPromises()
      expect(wrapper.find('.rounded-full').text()).toBe('1')
    })
  })

  describe('navigation', () => {
    it('should disable prev button on first step', async () => {
      const CookingMode = await import('./CookingMode.vue')
      const recipe = createMockRecipe([{ instruction: 'Step 1' }, { instruction: 'Step 2' }])
      const wrapper = mount(CookingMode.default, {
        props: { show: true, recipe, initialStep: 0 },
      })
      await flushPromises()
      const prevButton = wrapper.findAll('button').find(b => b.text().includes('Previous'))
      expect(prevButton?.classes()).toContain('cursor-not-allowed')
    })

    it('should enable next button when not on last step', async () => {
      const CookingMode = await import('./CookingMode.vue')
      const recipe = createMockRecipe([{ instruction: 'Step 1' }, { instruction: 'Step 2' }])
      const wrapper = mount(CookingMode.default, {
        props: { show: true, recipe, initialStep: 0 },
      })
      await flushPromises()
      const nextButton = wrapper.findAll('button').find(b => b.text().includes('Next'))
      expect(nextButton?.classes()).toContain('bg-orange-500')
    })

    it('should emit update:step when navigating to next', async () => {
      const CookingMode = await import('./CookingMode.vue')
      const recipe = createMockRecipe([{ instruction: 'Step 1' }, { instruction: 'Step 2' }])
      const wrapper = mount(CookingMode.default, {
        props: { show: true, recipe, initialStep: 0 },
      })
      await flushPromises()

      const nextButton = wrapper.findAll('button').find(b => b.text().includes('Next'))
      await nextButton?.trigger('click')
      await flushPromises()

      expect(wrapper.emitted('update:step')).toBeTruthy()
    })

    it('should show finish button on last step instead of next', async () => {
      const CookingMode = await import('./CookingMode.vue')
      const recipe = createMockRecipe([{ instruction: 'Step 1' }])
      const wrapper = mount(CookingMode.default, {
        props: { show: true, recipe, initialStep: 0 },
      })
      await flushPromises()
      expect(wrapper.text()).toContain('Finish')
    })
  })

  describe('keyboard navigation', () => {
    it('should listen for keyboard events when mounted', async () => {
      const CookingMode = await import('./CookingMode.vue')
      const recipe = createMockRecipe([{ instruction: 'Step 1' }])
      mount(CookingMode.default, {
        props: { show: true, recipe, initialStep: 0 },
      })
      await flushPromises()
      expect(document.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function))
    })

    it('should close on Escape key', async () => {
      const CookingMode = await import('./CookingMode.vue')
      const recipe = createMockRecipe([{ instruction: 'Step 1' }])
      const wrapper = mount(CookingMode.default, {
        props: { show: true, recipe, initialStep: 0 },
      })
      await flushPromises()

      const keydownHandler = (document.addEventListener as ReturnType<typeof vi.fn>).mock.calls.find(
        call => call[0] === 'keydown'
      )?.[1]

      if (keydownHandler) {
        keydownHandler({ key: 'Escape' } as KeyboardEvent)
      }

      expect(wrapper.emitted('update:show')).toBeTruthy()
    })
  })

  describe('progress', () => {
    it('should calculate progress correctly', async () => {
      const CookingMode = await import('./CookingMode.vue')
      const recipe = createMockRecipe([
        { instruction: 'Step 1' },
        { instruction: 'Step 2' },
        { instruction: 'Step 3' },
        { instruction: 'Step 4' },
      ])
      const wrapper = mount(CookingMode.default, {
        props: { show: true, recipe, initialStep: 0 },
      })
      await flushPromises()

      // On step 1 of 4, progress should be 50% ((1+1)/4 = 50%)
      expect(wrapper.find('.bg-gradient-to-r').attributes('style')).toContain('50')
    })

    it('should show 100% progress on last step', async () => {
      const CookingMode = await import('./CookingMode.vue')
      const recipe = createMockRecipe([
        { instruction: 'Step 1' },
        { instruction: 'Step 2' },
      ])
      const wrapper = mount(CookingMode.default, {
        props: { show: true, recipe, initialStep: 1 },
      })
      await flushPromises()

      expect(wrapper.find('.bg-gradient-to-r').attributes('style')).toContain('100')
    })
  })

  describe('wake lock', () => {
    it('should request wake lock when shown', async () => {
      const CookingMode = await import('./CookingMode.vue')
      const recipe = createMockRecipe([{ instruction: 'Step 1' }])
      mount(CookingMode.default, {
        props: { show: true, recipe, initialStep: 0 },
      })
      await flushPromises()
      await flushPromises()

      expect(navigator.wakeLock.request).toHaveBeenCalledWith('screen')
    })
  })
})