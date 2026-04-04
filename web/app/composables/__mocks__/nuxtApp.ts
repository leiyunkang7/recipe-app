// Mock for #app/nuxt (Nuxt virtual module)
// This is used by vitest when running component tests

// Mock Supabase client
const mockSupabase = {
  auth: {
    getUser: async () => ({ data: { user: null }, error: null }),
  },
  from: () => ({
    select: () => ({ eq: () => ({ then: (cb: (arg: unknown) => void) => cb({ data: [], error: null }) }) }),
    insert: async () => ({ data: null, error: null }),
    delete: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
  }),
}

export const useNuxtApp = () => ({
  $supabase: mockSupabase,
})

export const tryUseNuxtApp = useNuxtApp
