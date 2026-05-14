// Mock data for E2E tests when database is not available
export const mockRecipes = [
  {
    id: '1',
    title: 'Test Recipe 1',
    description: 'A delicious test recipe',
    category: '主菜',
    cuisine: '中餐',
    servings: 4,
    prep_time_minutes: 15,
    cook_time_minutes: 30,
    difficulty: 'medium',
    image_url: null,
    source: null,
    video_url: null,
    source_url: null,
    nutrition_info: null,
    views: 100,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ingredients: [
      { id: '1', name: 'Ingredient 1', amount: 100, unit: 'g' }
    ],
    steps: [
      { id: '1', step_number: 1, instruction: 'Step 1', duration_minutes: 5 }
    ],
    tags: ['test', 'demo'],
    recipe_translations: []
  },
  {
    id: '2',
    title: 'Test Recipe 2',
    description: 'Another test recipe',
    category: '汤类',
    cuisine: '中餐',
    servings: 2,
    prep_time_minutes: 10,
    cook_time_minutes: 20,
    difficulty: 'easy',
    image_url: null,
    source: null,
    video_url: null,
    source_url: null,
    nutrition_info: null,
    views: 50,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ingredients: [
      { id: '2', name: 'Ingredient 2', amount: 200, unit: 'g' }
    ],
    steps: [
      { id: '2', step_number: 1, instruction: 'Step 1', duration_minutes: 10 }
    ],
    tags: ['soup'],
    recipe_translations: []
  }
];

export const mockCategories = [
  { id: '1', name: '主菜', displayName: '主菜' },
  { id: '2', name: '汤类', displayName: '汤类' },
  { id: '3', name: '甜点', displayName: '甜点' },
  { id: '4', name: '早餐', displayName: '早餐' }
];

export const mockCuisines = [
  { id: '1', name: '中餐', displayName: '中餐' },
  { id: '2', name: '西餐', displayName: '西餐' },
  { id: '3', name: '日料', displayName: '日料' }
];

// Check if we should use mock data
export function shouldUseMockData(): boolean {
  // Use mock data when ENABLE_MOCK_DATA=true environment variable is set
  // This allows easy switching between real database and mock data
  return process.env.ENABLE_MOCK_DATA === 'true';
}
