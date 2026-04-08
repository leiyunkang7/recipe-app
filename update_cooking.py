import re

# Read the file
with open('/home/k/code/recipe-app/web/app/components/recipe/CookingMode.vue', 'r') as f:
    content = f.read()

# Find and replace the swipe section
old_swipe = """// Swipe gesture for mobile step navigation
const swipeContainer = ref<HTMLElement | null>(null)
const swipeOffset = ref(0)
const isSwiping = ref(false)

// Calculate visual feedback threshold
const swipeThreshold = 50

useSwipeGesture(
  swipeContainer,
  {
    horizontal: true,
    threshold: swipeThreshold,
    preventScroll: true,
    onSwipeStart: () => {
      isSwiping.value = true
    },
    onSwipeMove: (state) => {
      // Provide visual feedback during swipe
      if (state.absX > swipeThreshold) {
        swipeOffset.value = state.distanceX > 0 ? 30 : -30
      } else {
        swipeOffset.value = (state.distanceX / swipeThreshold) * 30
      }
    },
    onSwipeEnd: (state, direction) => {
      isSwiping.value = false
      swipeOffset.value = 0
      if (direction.primary === 'left' && canGoNext.value) {
        goNext()
      } else if (direction.primary === 'right' && canGoPrev.value) {
        goPrev()
      }
    },
    onSwipeCancel: () => {
      isSwiping.value = false
      swipeOffset.value = 0
    }
  },
  { horizontal: true, vertical: false, threshold: swipeThreshold }
)

// Computed for swipe transform
const swipeTransform = computed(() => {
  if (!isSwiping.value) return ''
  return `translateX(${swipeOffset.value}px)`
})"""

new_swipe = """// Swipe gesture for mobile step navigation with spring animation
const swipeContainer = ref<HTMLElement | null>(null)
const swipeOffset = ref(0)
const isSwiping = ref(false)

// Spring animation parameters
const SPRING_STIFFNESS = 400
const SPRING_DAMPING = 30
let animationFrameId: number | null = null
let springVelocity = 0
const SWIPE_VISUAL_MULTIPLIER = 0.4 // Visual feedback is 40% of actual swipe distance
const SWIPE_MAX_VISUAL_OFFSET = 60 // Max visual offset in pixels

// Calculate visual feedback threshold
const swipeThreshold = 50

/**
 * Spring animation for smooth swipe feedback
 */
const animateSpring = (targetOffset: number) => {
  const stiffness = SPRING_STIFFNESS
  const damping = SPRING_DAMPING

  const animate = () => {
    const currentOffset = swipeOffset.value
    const displacement = currentOffset - targetOffset
    const springForce = -stiffness * displacement
    const dampingForce = -damping * springVelocity
    const acceleration = springForce / 1000 // mass = 1000 for smoother animation

    springVelocity += acceleration * (16 / 1000)
    const newOffset = currentOffset + springVelocity * (16 / 1000)

    // Check if animation should end
    if (Math.abs(displacement) < 0.5 && Math.abs(springVelocity) < 0.5) {
      swipeOffset.value = targetOffset
      springVelocity = 0
      animationFrameId = null
      return
    }

    swipeOffset.value = newOffset
    animationFrameId = requestAnimationFrame(animate)
  }

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
  animationFrameId = requestAnimationFrame(animate)
}

useSwipeGesture(
  swipeContainer,
  {
    horizontal: true,
    threshold: swipeThreshold,
    preventScroll: true,
    hapticFeedback: true,
    onSwipeStart: () => {
      isSwiping.value = true
      springVelocity = 0
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
        animationFrameId = null
      }
    },
    onSwipeMove: (state) => {
      // Provide smooth visual feedback with spring-like easing
      // The offset is proportional to the swipe distance but capped
      const rawOffset = state.distanceX * SWIPE_VISUAL_MULTIPLIER
      // Apply damping curve for natural feel - exponential decay as it approaches max
      const dampedOffset = Math.sign(rawOffset) * SWIPE_MAX_VISUAL_OFFSET * (1 - Math.exp(-Math.abs(rawOffset) / SWIPE_MAX_VISUAL_OFFSET))
      swipeOffset.value = Math.max(-SWIPE_MAX_VISUAL_OFFSET, Math.min(SWIPE_MAX_VISUAL_OFFSET, dampedOffset))
    },
    onSwipeEnd: (state, direction) => {
      isSwiping.value = false
      // Animate back to center with spring physics
      animateSpring(0)
      if (direction.primary === 'left' && canGoNext.value) {
        goNext()
      } else if (direction.primary === 'right' && canGoPrev.value) {
        goPrev()
      }
    },
    onSwipeCancel: () => {
      isSwiping.value = false
      springVelocity = 0
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
        animationFrameId = null
      }
      swipeOffset.value = 0
    }
  },
  { horizontal: true, vertical: false, threshold: swipeThreshold }
)

// Computed for swipe transform
const swipeTransform = computed(() => {
  if (!isSwiping.value && Math.abs(swipeOffset.value) < 0.1) return ''
  return `translateX(${swipeOffset.value}px)`
})"""

if old_swipe in content:
    content = content.replace(old_swipe, new_swipe)
    with open('/home/k/code/recipe-app/web/app/components/recipe/CookingMode.vue', 'w') as f:
        f.write(content)
    print('Done')
else:
    print('Old swipe section not found')
    # Try to find where it is
    if 'useSwipeGesture' in content:
        print('Found useSwipeGesture in file')
    if 'swipeContainer' in content:
        print('Found swipeContainer in file')
