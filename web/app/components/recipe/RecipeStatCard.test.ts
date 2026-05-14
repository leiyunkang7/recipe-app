import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'

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

describe('RecipeStatCard', () => {
  it('should render with timer icon', async () => {
    const RecipeStatCard = await import('./RecipeStatCard.vue')
    const wrapper = mount(RecipeStatCard.default, {
      props: {
        icon: 'timer',
        label: 'Cook Time',
        value: '30 min',
      },
    })
    expect(wrapper.find('.timer-icon').exists()).toBe(true)
  })

  it('should render with people icon', async () => {
    const RecipeStatCard = await import('./RecipeStatCard.vue')
    const wrapper = mount(RecipeStatCard.default, {
      props: {
        icon: 'people',
        label: 'Servings',
        value: '4',
      },
    })
    expect(wrapper.find('.people-icon').exists()).toBe(true)
  })

  it('should display label and value correctly', async () => {
    const RecipeStatCard = await import('./RecipeStatCard.vue')
    const wrapper = mount(RecipeStatCard.default, {
      props: {
        icon: 'prep',
        label: 'Prep Time',
        value: '15 min',
      },
    })
    expect(wrapper.text()).toContain('Prep Time')
    expect(wrapper.text()).toContain('15 min')
  })

  it('should apply sm size class by default', async () => {
    const RecipeStatCard = await import('./RecipeStatCard.vue')
    const wrapper = mount(RecipeStatCard.default, {
      props: {
        icon: 'timer',
        label: 'Time',
        value: '30',
      },
    })
    const div = wrapper.find('div.text-center')
    expect(div.classes()).toContain('rounded-xl')
  })

  it('should apply lg size class when specified', async () => {
    const RecipeStatCard = await import('./RecipeStatCard.vue')
    const wrapper = mount(RecipeStatCard.default, {
      props: {
        icon: 'timer',
        label: 'Time',
        value: '30',
        size: 'lg',
      },
    })
    const div = wrapper.find('div.text-center')
    expect(div.classes()).toContain('p-3')
  })

  it('should apply custom bgClass when provided', async () => {
    const RecipeStatCard = await import('./RecipeStatCard.vue')
    const wrapper = mount(RecipeStatCard.default, {
      props: {
        icon: 'timer',
        label: 'Time',
        value: '30',
        bgClass: 'bg-green-50',
      },
    })
    const div = wrapper.find('div.text-center')
    expect(div.classes()).toContain('bg-green-50')
  })

  it('should use default orange bgClass when not provided', async () => {
    const RecipeStatCard = await import('./RecipeStatCard.vue')
    const wrapper = mount(RecipeStatCard.default, {
      props: {
        icon: 'timer',
        label: 'Time',
        value: '30',
      },
    })
    const div = wrapper.find('div.text-center')
    expect(div.classes()).toContain('bg-orange-50')
  })
})