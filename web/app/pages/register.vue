<script setup lang="ts">
/**
 * Register - 用户注册页面
 *
 * 功能：
 * - 用户注册表单
 * - 邮箱验证码发送
 * - 密码强度指示器
 * - 实时表单验证
 */

import { z } from 'zod'

const { t } = useI18n()
const localePath = useLocalePath()

useSeoMeta({
  title: () => `${t('register.title')} - ${t('app.title')}`,
  description: () => t('register.description'),
})

// Form state
const formData = ref({
  email: '',
  username: '',
  password: '',
  confirmPassword: '',
  verificationCode: '',
})

// UI state
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const isLoading = ref(false)
const isSendingCode = ref(false)
const countdown = ref(0)
const errorMessage = ref('')
const successMessage = ref('')

// Validation errors
const errors = ref<Record<string, string>>({})

// Password strength calculation
const passwordStrength = computed(() => {
  const password = formData.value.password
  if (!password) return { score: 0, label: '', color: '' }

  let score = 0

  // Length check
  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1

  // Character variety checks
  if (/[a-z]/.test(password)) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/[0-9]/.test(password)) score += 1
  if (/[^a-zA-Z0-9]/.test(password)) score += 1

  // Determine strength level
  if (score <= 2) {
    return { score, label: t('register.passwordStrength.weak'), color: 'bg-red-500' }
  } else if (score <= 4) {
    return { score, label: t('register.passwordStrength.medium'), color: 'bg-yellow-500' }
  } else {
    return { score, label: t('register.passwordStrength.strong'), color: 'bg-green-500' }
  }
})

// Validation schema
const registerSchema = z.object({
  email: z.string().email(t('register.errors.invalidEmail')),
  username: z
    .string()
    .min(3, t('register.errors.usernameMin'))
    .max(20, t('register.errors.usernameMax'))
    .regex(/^[a-zA-Z0-9_]+$/, t('register.errors.usernameFormat')),
  password: z
    .string()
    .min(8, t('register.errors.passwordMin'))
    .regex(/[a-zA-Z]/, t('register.errors.passwordLetter'))
    .regex(/[0-9]/, t('register.errors.passwordNumber')),
  confirmPassword: z.string(),
  verificationCode: z.string().length(6, t('register.errors.codeLength')).regex(/^\d{6}$/, t('register.errors.codeFormat')),
}).refine((data) => data.password === data.confirmPassword, {
  message: t('register.errors.passwordMismatch'),
  path: ['confirmPassword'],
})

// Validate single field
const validateField = (field: string) => {
  try {
    const partialSchema = registerSchema.pick({ [field]: true } as any)
    partialSchema.parse({ [field]: formData.value[field as keyof typeof formData.value] })
    errors.value[field] = ''
  } catch (error) {
    if (error instanceof z.ZodError) {
      errors.value[field] = error.errors[0].message
    }
  }
}

// Validate all fields
const validateForm = () => {
  errors.value = {}
  try {
    registerSchema.parse(formData.value)
    return true
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.errors.forEach((err) => {
        if (err.path[0]) {
          errors.value[err.path[0] as string] = err.message
        }
      })
    }
    return false
  }
}

// Send verification code
const sendVerificationCode = async () => {
  // Validate email first
  if (!formData.value.email) {
    errors.value.email = t('register.errors.emailRequired')
    return
  }

  try {
    z.string().email().parse(formData.value.email)
  } catch {
    errors.value.email = t('register.errors.invalidEmail')
    return
  }

  isSendingCode.value = true
  errorMessage.value = ''

  try {
    const response = await $fetch('/api/auth/send-verification', {
      method: 'POST',
      body: { email: formData.value.email },
    })

    if (response.success) {
      successMessage.value = t('register.codeSent')
      // Start countdown
      countdown.value = 60
      const timer = setInterval(() => {
        countdown.value--
        if (countdown.value <= 0) {
          clearInterval(timer)
        }
      }, 1000)
    } else {
      errorMessage.value = response.message || t('register.errors.codeSendFailed')
    }
  } catch (error: any) {
    errorMessage.value = error.data?.message || t('register.errors.codeSendFailed')
  } finally {
    isSendingCode.value = false
  }
}

// Handle registration
const handleRegister = async () => {
  if (!validateForm()) return

  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const response = await $fetch('/api/auth/register', {
      method: 'POST',
      body: {
        email: formData.value.email,
        username: formData.value.username,
        password: formData.value.password,
        verificationCode: formData.value.verificationCode,
      },
    })

    if (response.success) {
      successMessage.value = t('register.success')
      // Redirect to home or login page after successful registration
      setTimeout(() => {
        navigateTo(localePath('/'))
      }, 2000)
    } else {
      errorMessage.value = response.error?.message || t('register.errors.registerFailed')
    }
  } catch (error: any) {
    errorMessage.value = error.data?.error?.message || t('register.errors.registerFailed')
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-orange-50 via-stone-50 to-orange-50 dark:from-stone-900 dark:via-stone-800 dark:to-stone-900 transition-colors duration-300 pb-20">
    <LazyHeaderSection />

    <main class="max-w-md mx-auto px-4 py-6">
      <!-- 页面标题 -->
      <div class="text-center py-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-stone-100">
          {{ t('register.title') }}
        </h1>
        <p class="mt-2 text-sm text-gray-500 dark:text-stone-400">
          {{ t('register.subtitle') }}
        </p>
      </div>

      <!-- 注册表单 -->
      <div class="bg-white dark:bg-stone-800 rounded-2xl p-6 shadow-sm">
        <form @submit.prevent="handleRegister" class="space-y-4">
          <!-- 邮箱输入 -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 dark:text-stone-300 mb-1">
              {{ t('register.email') }}
            </label>
            <div class="flex gap-2">
              <input
                id="email"
                v-model="formData.email"
                type="email"
                :placeholder="t('register.emailPlaceholder')"
                class="flex-1 px-4 py-2 min-h-[44px] rounded-lg border border-gray-300 dark:border-stone-600 bg-white dark:bg-stone-700 text-gray-900 dark:text-stone-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-base"
                @blur="validateField('email')"
              />
              <button
                type="button"
                :disabled="countdown > 0 || isSendingCode"
                class="px-4 py-2 min-h-[44px] min-w-[100px] text-sm font-medium rounded-lg transition-colors touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                :class="countdown > 0 || isSendingCode
                  ? 'bg-gray-300 dark:bg-stone-600 text-gray-500 dark:text-stone-400'
                  : 'bg-orange-500 text-white hover:bg-orange-600'"
                @click="sendVerificationCode"
              >
                {{ countdown > 0 ? `${countdown}s` : t('register.sendCode') }}
              </button>
            </div>
            <p v-if="errors.email" class="mt-1 text-sm text-red-500">{{ errors.email }}</p>
          </div>

          <!-- 用户名输入 -->
          <div>
            <label for="username" class="block text-sm font-medium text-gray-700 dark:text-stone-300 mb-1">
              {{ t('register.username') }}
            </label>
            <input
              id="username"
              v-model="formData.username"
              type="text"
              :placeholder="t('register.usernamePlaceholder')"
              class="w-full px-4 py-2 min-h-[44px] rounded-lg border border-gray-300 dark:border-stone-600 bg-white dark:bg-stone-700 text-gray-900 dark:text-stone-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-base"
              @blur="validateField('username')"
            />
            <p v-if="errors.username" class="mt-1 text-sm text-red-500">{{ errors.username }}</p>
          </div>

          <!-- 密码输入 -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 dark:text-stone-300 mb-1">
              {{ t('register.password') }}
            </label>
            <div class="relative">
              <input
                id="password"
                v-model="formData.password"
                :type="showPassword ? 'text' : 'password'"
                :placeholder="t('register.passwordPlaceholder')"
                class="w-full px-4 py-2 pr-12 min-h-[44px] rounded-lg border border-gray-300 dark:border-stone-600 bg-white dark:bg-stone-700 text-gray-900 dark:text-stone-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-base"
                @blur="validateField('password')"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-stone-400 hover:text-gray-700 dark:hover:text-stone-200"
                @click="showPassword = !showPassword"
              >
                <svg v-if="showPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
                <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            </div>
            <p v-if="errors.password" class="mt-1 text-sm text-red-500">{{ errors.password }}</p>

            <!-- 密码强度指示器 -->
            <div v-if="formData.password" class="mt-2">
              <div class="flex items-center gap-2">
                <div class="flex-1 h-2 bg-gray-200 dark:bg-stone-700 rounded-full overflow-hidden">
                  <div
                    :class="passwordStrength.color"
                    class="h-full transition-all duration-300"
                    :style="{ width: `${(passwordStrength.score / 6) * 100}%` }"
                  />
                </div>
                <span class="text-xs font-medium text-gray-600 dark:text-stone-400 min-w-[40px]">
                  {{ passwordStrength.label }}
                </span>
              </div>
            </div>
          </div>

          <!-- 确认密码输入 -->
          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700 dark:text-stone-300 mb-1">
              {{ t('register.confirmPassword') }}
            </label>
            <div class="relative">
              <input
                id="confirmPassword"
                v-model="formData.confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                :placeholder="t('register.confirmPasswordPlaceholder')"
                class="w-full px-4 py-2 pr-12 min-h-[44px] rounded-lg border border-gray-300 dark:border-stone-600 bg-white dark:bg-stone-700 text-gray-900 dark:text-stone-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-base"
                @blur="validateField('confirmPassword')"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-stone-400 hover:text-gray-700 dark:hover:text-stone-200"
                @click="showConfirmPassword = !showConfirmPassword"
              >
                <svg v-if="showConfirmPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
                <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            </div>
            <p v-if="errors.confirmPassword" class="mt-1 text-sm text-red-500">{{ errors.confirmPassword }}</p>
          </div>

          <!-- 验证码输入 -->
          <div>
            <label for="verificationCode" class="block text-sm font-medium text-gray-700 dark:text-stone-300 mb-1">
              {{ t('register.verificationCode') }}
            </label>
            <input
              id="verificationCode"
              v-model="formData.verificationCode"
              type="text"
              maxlength="6"
              :placeholder="t('register.verificationCodePlaceholder')"
              class="w-full px-4 py-2 min-h-[44px] rounded-lg border border-gray-300 dark:border-stone-600 bg-white dark:bg-stone-700 text-gray-900 dark:text-stone-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-base text-center tracking-widest"
              @blur="validateField('verificationCode')"
            />
            <p v-if="errors.verificationCode" class="mt-1 text-sm text-red-500">{{ errors.verificationCode }}</p>
          </div>

          <!-- 错误提示 -->
          <div v-if="errorMessage" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-300">
            <p class="text-sm">{{ errorMessage }}</p>
          </div>

          <!-- 成功提示 -->
          <div v-if="successMessage" class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-green-700 dark:text-green-300">
            <p class="text-sm">{{ successMessage }}</p>
          </div>

          <!-- 注册按钮 -->
          <button
            type="submit"
            :disabled="isLoading"
            class="w-full px-4 py-3 min-h-[44px] text-base font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
          >
            {{ isLoading ? t('register.registering') : t('register.register') }}
          </button>

          <!-- 登录链接 -->
          <div class="text-center text-sm text-gray-600 dark:text-stone-400">
            {{ t('register.hasAccount') }}
            <NuxtLink :to="localePath('/login')" class="text-orange-500 hover:text-orange-600 font-medium">
              {{ t('register.login') }}
            </NuxtLink>
          </div>
        </form>
      </div>
    </main>

    <LazyBottomNav />
  </div>
</template>
