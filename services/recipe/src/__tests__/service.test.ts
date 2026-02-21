import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RecipeService } from '../service';
import { CreateRecipeDTO, UpdateRecipeDTO } from '@recipe-app/shared-types';

// Mock Supabase client
const createMockSupabaseClient = () => {
  const mockClient: any = {
    from: vi.fn(() => mockClient),
    select: vi.fn(() => mockClient),
    insert: vi.fn(() => mockClient),
    update: vi.fn(() => mockClient),
    delete: vi.fn(() => mockClient),
    eq: vi.fn(() => mockClient),
    or: vi.fn(() => mockClient),
    ilike: vi.fn(() => mockClient),
    lte: vi.fn(() => mockClient),
    range: vi.fn(() => mockClient),
    order: vi.fn(() => mockClient),
    single: vi.fn(),
  };
  return mockClient;
};

let mockSupabaseClient = createMockSupabaseClient();

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

describe('RecipeService', () => {
  let service: RecipeService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabaseClient = createMockSupabaseClient();
    service = new RecipeService('https://test.supabase.co', 'test-key');
  });

  const mockRecipeData = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Tomato Soup',
    description: 'Delicious soup',
    category: 'Lunch',
    cuisine: 'Italian',
    servings: 4,
    prep_time_minutes: 15,
    cook_time_minutes: 30,
    difficulty: 'easy',
    image_url: 'https://example.com/image.jpg',
    source: 'Grandma',
    nutrition_info: { calories: 200 },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    recipe_ingredients: [
      { id: '1', recipe_id: '123e4567-e89b-12d3-a456-426614174000', name: 'Tomato', amount: 5, unit: 'pieces' },
    ],
    recipe_steps: [
      { id: '1', recipe_id: '123e4567-e89b-12d3-a456-426614174000', step_number: 1, instruction: 'Chop', duration_minutes: 5 },
    ],
    recipe_tags: [
      { id: '1', recipe_id: '123e4567-e89b-12d3-a456-426614174000', tag: 'vegetarian' },
    ],
  };

  const createDto: CreateRecipeDTO = {
    title: 'Tomato Soup',
    description: 'Delicious soup',
    category: 'Lunch',
    cuisine: 'Italian',
    servings: 4,
    prepTimeMinutes: 15,
    cookTimeMinutes: 30,
    difficulty: 'easy',
    ingredients: [
      { name: 'Tomato', amount: 5, unit: 'pieces' },
    ],
    steps: [
      { stepNumber: 1, instruction: 'Chop', durationMinutes: 5 },
    ],
    tags: ['vegetarian'],
    nutritionInfo: { calories: 200 },
    imageUrl: 'https://example.com/image.jpg',
    source: 'Grandma',
  };

  describe('create', () => {
    it('should create a recipe successfully', async () => {
      mockSupabaseClient.single = vi.fn().mockResolvedValue({
        data: mockRecipeData,
        error: null,
      });

      const result = await service.create(createDto);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.title).toBe('Tomato Soup');
    });

    it('should handle database errors', async () => {
      mockSupabaseClient.single = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error', code: 'DB_ERROR' },
      });

      const result = await service.create(createDto);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('DB_ERROR');
    });

    it('should handle ingredient insertion failure', async () => {
      // First call succeeds (recipe creation)
      mockSupabaseClient.single = vi.fn()
        .mockResolvedValueOnce({
          data: mockRecipeData,
          error: null,
        })
        // Second call (findById) also succeeds
        .mockResolvedValueOnce({
          data: mockRecipeData,
          error: null,
        });
      
      // Make ingredients insert fail
      mockSupabaseClient.insert = vi.fn()
        .mockReturnValueOnce(mockSupabaseClient)
        .mockReturnValueOnce({ error: { message: 'Failed to insert ingredients' } });

      const result = await service.create(createDto);

      expect(result.success).toBe(false);
    });

    it('should handle steps insertion failure', async () => {
      // First call succeeds (recipe creation)
      mockSupabaseClient.single = vi.fn()
        .mockResolvedValueOnce({
          data: mockRecipeData,
          error: null,
        })
        .mockResolvedValueOnce({
          data: mockRecipeData,
          error: null,
        });
      
      // Make ingredients insert succeed, steps insert fail
      let insertCallCount = 0;
      mockSupabaseClient.insert = vi.fn()
        .mockImplementation(() => {
          insertCallCount++;
          if (insertCallCount === 1) {
            return mockSupabaseClient; // ingredients insert (doesn't return error)
          } else if (insertCallCount === 2) {
            return { error: { message: 'Failed to insert steps' } };
          }
          return mockSupabaseClient;
        });

      const result = await service.create(createDto);

      expect(result.success).toBe(false);
    });

    it('should handle tags insertion failure', async () => {
      // First call succeeds (recipe creation)
      mockSupabaseClient.single = vi.fn()
        .mockResolvedValueOnce({
          data: mockRecipeData,
          error: null,
        })
        .mockResolvedValueOnce({
          data: mockRecipeData,
          error: null,
        });
      
      // Make ingredients and steps insert succeed, tags insert fail
      let insertCallCount = 0;
      mockSupabaseClient.insert = vi.fn()
        .mockImplementation(() => {
          insertCallCount++;
          if (insertCallCount <= 2) {
            return mockSupabaseClient;
          } else {
            return { error: { message: 'Failed to insert tags' } };
          }
        });

      const result = await service.create(createDto);

      expect(result.success).toBe(false);
    });

    it('should create recipe without optional fields', async () => {
      const minimalDto: CreateRecipeDTO = {
        title: 'Simple Recipe',
        category: 'Lunch',
        servings: 2,
        prepTimeMinutes: 10,
        cookTimeMinutes: 20,
        difficulty: 'medium',
        ingredients: [{ name: 'Egg', amount: 2, unit: 'pieces' }],
        steps: [{ stepNumber: 1, instruction: 'Cook' }],
      };

      mockSupabaseClient.single = vi.fn().mockResolvedValue({
        data: { ...mockRecipeData, title: 'Simple Recipe' },
        error: null,
      });

      const result = await service.create(minimalDto);

      expect(result.success).toBe(true);
      expect(result.data?.title).toBe('Simple Recipe');
    });
  });

  describe('findById', () => {
    it('should find a recipe by ID', async () => {
      mockSupabaseClient.single = vi.fn().mockResolvedValue({
        data: mockRecipeData,
        error: null,
      });

      const result = await service.findById('123e4567-e89b-12d3-a456-426614174000');

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(result.data?.title).toBe('Tomato Soup');
    });

    it('should return NOT_FOUND for non-existent recipe', async () => {
      mockSupabaseClient.single = vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      });

      const result = await service.findById('non-existent-id');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOT_FOUND');
    });

    it('should handle database errors', async () => {
      mockSupabaseClient.single = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const result = await service.findById('some-id');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('DB_ERROR');
    });

    it('should map database record to Recipe type correctly', async () => {
      mockSupabaseClient.single = vi.fn().mockResolvedValue({
        data: mockRecipeData,
        error: null,
      });

      const result = await service.findById('123e4567-e89b-12d3-a456-426614174000');

      expect(result.success).toBe(true);
      expect(result.data?.prepTimeMinutes).toBe(15);
      expect(result.data?.cookTimeMinutes).toBe(30);
      expect(result.data?.ingredients).toHaveLength(1);
      expect(result.data?.steps).toHaveLength(1);
      expect(result.data?.tags).toHaveLength(1);
    });
  });

  describe('findAll', () => {
    it('should find all recipes with pagination', async () => {
      mockSupabaseClient.range = vi.fn().mockReturnThis();
      mockSupabaseClient.order = vi.fn().mockResolvedValue({
        data: [mockRecipeData],
        error: null,
        count: 1,
      });

      const result = await service.findAll({}, { page: 1, limit: 20 });

      expect(result.success).toBe(true);
      expect(result.data?.recipes).toHaveLength(1);
      expect(result.data?.total).toBe(1);
      expect(result.data?.page).toBe(1);
      expect(result.data?.limit).toBe(20);
    });

    it('should apply category filter', async () => {
      mockSupabaseClient.range = vi.fn().mockReturnThis();
      mockSupabaseClient.order = vi.fn().mockResolvedValue({
        data: [mockRecipeData],
        error: null,
        count: 1,
      });

      await service.findAll({ category: 'Lunch' }, { page: 1, limit: 20 });

      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('category', 'Lunch');
    });

    it('should apply cuisine filter', async () => {
      mockSupabaseClient.range = vi.fn().mockReturnThis();
      mockSupabaseClient.order = vi.fn().mockResolvedValue({
        data: [mockRecipeData],
        error: null,
        count: 1,
      });

      await service.findAll({ cuisine: 'Italian' }, { page: 1, limit: 20 });

      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('cuisine', 'Italian');
    });

    it('should apply difficulty filter', async () => {
      mockSupabaseClient.range = vi.fn().mockReturnThis();
      mockSupabaseClient.order = vi.fn().mockResolvedValue({
        data: [mockRecipeData],
        error: null,
        count: 1,
      });

      await service.findAll({ difficulty: 'easy' }, { page: 1, limit: 20 });

      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('difficulty', 'easy');
    });

    it('should apply maxPrepTime filter', async () => {
      mockSupabaseClient.range = vi.fn().mockReturnThis();
      mockSupabaseClient.order = vi.fn().mockResolvedValue({
        data: [mockRecipeData],
        error: null,
        count: 1,
      });

      await service.findAll({ maxPrepTime: 30 }, { page: 1, limit: 20 });

      expect(mockSupabaseClient.lte).toHaveBeenCalledWith('prep_time_minutes', 30);
    });

    it('should apply maxCookTime filter', async () => {
      mockSupabaseClient.range = vi.fn().mockReturnThis();
      mockSupabaseClient.order = vi.fn().mockResolvedValue({
        data: [mockRecipeData],
        error: null,
        count: 1,
      });

      await service.findAll({ maxCookTime: 60 }, { page: 1, limit: 20 });

      expect(mockSupabaseClient.lte).toHaveBeenCalledWith('cook_time_minutes', 60);
    });

    it('should apply search filter', async () => {
      mockSupabaseClient.range = vi.fn().mockReturnThis();
      mockSupabaseClient.order = vi.fn().mockResolvedValue({
        data: [mockRecipeData],
        error: null,
        count: 1,
      });

      await service.findAll({ search: 'tomato' }, { page: 1, limit: 20 });

      expect(mockSupabaseClient.or).toHaveBeenCalledWith(
        expect.stringContaining('tomato')
      );
    });

    it('should handle empty results', async () => {
      mockSupabaseClient.range = vi.fn().mockReturnThis();
      mockSupabaseClient.order = vi.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      const result = await service.findAll({}, { page: 1, limit: 20 });

      expect(result.success).toBe(true);
      expect(result.data?.recipes).toHaveLength(0);
      expect(result.data?.total).toBe(0);
    });

    it('should handle database errors', async () => {
      mockSupabaseClient.range = vi.fn().mockReturnThis();
      mockSupabaseClient.order = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
        count: null,
      });

      const result = await service.findAll({}, { page: 1, limit: 20 });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('DB_ERROR');
    });

    it('should calculate correct range for pagination', async () => {
      mockSupabaseClient.range = vi.fn().mockReturnThis();
      mockSupabaseClient.order = vi.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      await service.findAll({}, { page: 2, limit: 10 });

      expect(mockSupabaseClient.range).toHaveBeenCalledWith(10, 19);
    });
  });

  describe('update', () => {
    it('should update a recipe successfully', async () => {
      // findById mock
      mockSupabaseClient.single = vi.fn()
        .mockResolvedValueOnce({
          data: mockRecipeData,
          error: null,
        })
        .mockResolvedValueOnce({
          data: { ...mockRecipeData, title: 'Updated Tomato Soup' },
          error: null,
        });

      const updateDto: UpdateRecipeDTO = {
        title: 'Updated Tomato Soup',
      };

      const result = await service.update('123e4567-e89b-12d3-a456-426614174000', updateDto);

      expect(result.success).toBe(true);
      expect(result.data?.title).toBe('Updated Tomato Soup');
    });

    it('should return NOT_FOUND if recipe does not exist', async () => {
      mockSupabaseClient.single = vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      });

      const updateDto: UpdateRecipeDTO = {
        title: 'Updated Title',
      };

      const result = await service.update('non-existent-id', updateDto);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOT_FOUND');
    });

    it('should update ingredients', async () => {
      mockSupabaseClient.single = vi.fn()
        .mockResolvedValueOnce({
          data: mockRecipeData,
          error: null,
        })
        .mockResolvedValueOnce({
          data: { ...mockRecipeData, title: 'Updated' },
          error: null,
        });

      const updateDto: UpdateRecipeDTO = {
        ingredients: [
          { name: 'Onion', amount: 2, unit: 'pieces' },
        ],
      };

      const result = await service.update('123e4567-e89b-12d3-a456-426614174000', updateDto);

      expect(result.success).toBe(true);
      expect(mockSupabaseClient.delete).toHaveBeenCalled();
    });

    it('should update steps', async () => {
      mockSupabaseClient.single = vi.fn()
        .mockResolvedValueOnce({
          data: mockRecipeData,
          error: null,
        })
        .mockResolvedValueOnce({
          data: { ...mockRecipeData, title: 'Updated' },
          error: null,
        });

      const updateDto: UpdateRecipeDTO = {
        steps: [
          { stepNumber: 1, instruction: 'New step' },
        ],
      };

      const result = await service.update('123e4567-e89b-12d3-a456-426614174000', updateDto);

      expect(result.success).toBe(true);
      expect(mockSupabaseClient.delete).toHaveBeenCalled();
    });

    it('should update tags', async () => {
      mockSupabaseClient.single = vi.fn()
        .mockResolvedValueOnce({
          data: mockRecipeData,
          error: null,
        })
        .mockResolvedValueOnce({
          data: { ...mockRecipeData, title: 'Updated' },
          error: null,
        });

      const updateDto: UpdateRecipeDTO = {
        tags: ['new-tag'],
      };

      const result = await service.update('123e4567-e89b-12d3-a456-426614174000', updateDto);

      expect(result.success).toBe(true);
      expect(mockSupabaseClient.delete).toHaveBeenCalled();
    });

    it('should handle update errors', async () => {
      mockSupabaseClient.single = vi.fn()
        .mockResolvedValueOnce({
          data: mockRecipeData,
          error: null,
        });

      mockSupabaseClient.update = vi.fn().mockResolvedValue({
        error: { message: 'Update failed' },
      });

      const updateDto: UpdateRecipeDTO = {
        title: 'Updated',
      };

      const result = await service.update('123e4567-e89b-12d3-a456-426614174000', updateDto);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNKNOWN_ERROR');
    });
  });

  describe('delete', () => {
    it('should delete a recipe successfully', async () => {
      mockSupabaseClient.delete = vi.fn().mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq = vi.fn().mockReturnValue({
        error: null,
      });

      const result = await service.delete('123e4567-e89b-12d3-a456-426614174000');

      expect(result.success).toBe(true);
    });

    it('should handle delete errors', async () => {
      mockSupabaseClient.delete = vi.fn().mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq = vi.fn().mockReturnValue({
        error: { message: 'Delete failed' },
      });

      const result = await service.delete('some-id');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('DB_ERROR');
    });
  });

  describe('batchImport', () => {
    it('should import multiple recipes successfully', async () => {
      mockSupabaseClient.single = vi.fn().mockResolvedValue({
        data: mockRecipeData,
        error: null,
      });

      const recipes = [createDto, { ...createDto, title: 'Recipe 2' }];

      const result = await service.batchImport(recipes);

      expect(result.success).toBe(true);
      expect(result.data?.total).toBe(2);
      expect(result.data?.succeeded).toBe(2);
      expect(result.data?.failed).toBe(0);
    });

    it('should handle partial failures', async () => {
      // First recipe succeeds, second fails
      let callCount = 0;
      mockSupabaseClient.single = vi.fn()
        .mockImplementation(() => {
          callCount++;
          if (callCount <= 2) { // First recipe creation and findById
            return Promise.resolve({ data: mockRecipeData, error: null });
          } else if (callCount === 3) { // Second recipe creation fails
            return Promise.resolve({ data: null, error: { message: 'Failed to create' } });
          }
          return Promise.resolve({ data: mockRecipeData, error: null });
        });

      const recipes = [createDto, { ...createDto, title: 'Recipe 2' }];

      const result = await service.batchImport(recipes);

      expect(result.success).toBe(true);
      expect(result.data?.total).toBe(2);
      expect(result.data?.succeeded).toBe(1);
      expect(result.data?.failed).toBe(1);
    });

    it('should handle all failures', async () => {
      mockSupabaseClient.single = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Failed to create' },
      });

      const recipes = [createDto, { ...createDto, title: 'Recipe 2' }];

      const result = await service.batchImport(recipes);

      expect(result.success).toBe(true);
      expect(result.data?.total).toBe(2);
      expect(result.data?.succeeded).toBe(0);
      expect(result.data?.failed).toBe(2);
      expect(result.data?.errors).toHaveLength(2);
    });

    it('should handle empty batch', async () => {
      const result = await service.batchImport([]);

      expect(result.success).toBe(true);
      expect(result.data?.total).toBe(0);
      expect(result.data?.succeeded).toBe(0);
      expect(result.data?.failed).toBe(0);
    });
  });
});
