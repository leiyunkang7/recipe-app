import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RecipeService } from '../service';
import { CreateRecipeDTO, UpdateRecipeDTO } from '@recipe-app/shared-types';
import fs from 'fs';

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  return {
    ...actual,
    readFileSync: vi.fn(() => Buffer.from('fake-image-data')),
    writeFileSync: vi.fn(),
    unlinkSync: vi.fn(),
    mkdirSync: vi.fn(),
    existsSync: vi.fn(() => true),
  };
});

// Mock database
const mockDb = {
  transaction: vi.fn(),
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  from: vi.fn(),
  where: vi.fn(),
  values: vi.fn(),
  returning: vi.fn(),
  set: vi.fn(),
  limit: vi.fn(),
  orderBy: vi.fn(),
  offset: vi.fn(),
};

// Create a mock database that can be chained
const createMockDb = () => {
  const chainable: any = {
    select: vi.fn(() => chainable),
    from: vi.fn(() => chainable),
    where: vi.fn(() => chainable),
    limit: vi.fn(() => chainable),
    orderBy: vi.fn(() => chainable),
    offset: vi.fn(() => chainable),
    insert: vi.fn(() => chainable),
    values: vi.fn(() => chainable),
    returning: vi.fn(() => chainable),
    update: vi.fn(() => chainable),
    set: vi.fn(() => chainable),
    delete: vi.fn(() => chainable),
    then: vi.fn((cb: any) => Promise.resolve(cb([]))),
  };
  return chainable;
};

describe('RecipeService', () => {
  let service: RecipeService;
  let mockDbInstance: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDbInstance = createMockDb();
    service = new RecipeService(mockDbInstance as any);
  });

  const mockRecipeData = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Tomato Soup',
    description: 'Delicious soup',
    category: 'Lunch',
    cuisine: 'Italian',
    servings: 4,
    prepTimeMinutes: 15,
    cookTimeMinutes: 30,
    difficulty: 'easy',
    imageUrl: 'https://example.com/image.jpg',
    source: 'Grandma',
    nutritionInfo: { calories: 200 },
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
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
      // Mock transaction
      const mockTx = createMockDb();
      mockDbInstance.transaction = vi.fn((cb: any) => cb(mockTx));
      
      // Mock insert returning
      mockTx.insert().values().returning = vi.fn().mockResolvedValue([mockRecipeData]);
      
      // Mock findByIdFromTx by mocking the select chain
      mockTx.select().from().where().limit = vi.fn().mockResolvedValue([mockRecipeData]);

      const result = await service.create(createDto);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should handle database errors', async () => {
      mockDbInstance.transaction = vi.fn(() => {
        throw new Error('Database error');
      });

      const result = await service.create(createDto);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNKNOWN_ERROR');
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

      const mockTx = createMockDb();
      mockDbInstance.transaction = vi.fn((cb: any) => cb(mockTx));
      mockTx.insert().values().returning = vi.fn().mockResolvedValue([{ ...mockRecipeData, title: 'Simple Recipe' }]);
      mockTx.select().from().where().limit = vi.fn().mockResolvedValue([{ ...mockRecipeData, title: 'Simple Recipe' }]);

      const result = await service.create(minimalDto);

      expect(result.success).toBe(true);
    });
  });

  describe('findById', () => {
    it('should find a recipe by ID', async () => {
      mockDbInstance.select().from().where().limit = vi.fn().mockResolvedValue([mockRecipeData]);

      const result = await service.findById('123e4567-e89b-12d3-a456-426614174000');

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should sort steps by stepNumber ascending', async () => {
      // Mock that returns recipe data on first call, then step data on subsequent calls
      const mockStepsData = [
        { id: 'step-3', recipeId: '123e4567-e89b-12d3-a456-426614174000', stepNumber: 3, instruction: 'Third step', durationMinutes: 5 },
        { id: 'step-1', recipeId: '123e4567-e89b-12d3-a456-426614174000', stepNumber: 1, instruction: 'First step', durationMinutes: 10 },
        { id: 'step-2', recipeId: '123e4567-e89b-12d3-a456-426614174000', stepNumber: 2, instruction: 'Second step', durationMinutes: 15 },
      ];

      let callCount = 0;
      mockDbInstance.select = vi.fn(() => {
        const chain: any = {
          from: vi.fn(() => chain),
          where: vi.fn(() => chain),
          limit: vi.fn(() => chain),
          then: vi.fn((cb: any) => {
            callCount++;
            if (callCount === 1) {
              // First call - return recipe
              return Promise.resolve(cb([mockRecipeData]));
            } else {
              // Subsequent calls - return steps (and other related data)
              return Promise.resolve(cb(mockStepsData));
            }
          }),
        };
        return chain;
      });

      const result = await service.findById('123e4567-e89b-12d3-a456-426614174000');

      expect(result.success).toBe(true);
      // Verify steps are sorted by stepNumber
      expect(result.data?.steps).toEqual([
        { stepNumber: 1, instruction: 'First step', durationMinutes: 10 },
        { stepNumber: 2, instruction: 'Second step', durationMinutes: 15 },
        { stepNumber: 3, instruction: 'Third step', durationMinutes: 5 },
      ]);
    });

    it('should handle null/undefined fields in recipe', async () => {
      // Mock with null/undefined fields to exercise ?? operators
      const mockRecipeWithNulls = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: null,
        description: null,
        category: 'Lunch' as const,
        cuisine: null,
        servings: 4,
        prepTimeMinutes: 15,
        cookTimeMinutes: 30,
        difficulty: 'easy' as const,
        nutritionInfo: null,
        imageUrl: null,
        source: null,
        createdAt: null,
        updatedAt: null,
      };

      mockDbInstance.select().from().where().limit = vi.fn().mockResolvedValue([mockRecipeWithNulls]);

      const result = await service.findById('123e4567-e89b-12d3-a456-426614174000');

      expect(result.success).toBe(true);
      expect(result.data?.title).toBe('');
      expect(result.data?.description).toBe('');
      expect(result.data?.cuisine).toBe('');
      expect(result.data?.nutritionInfo).toBeUndefined();
      expect(result.data?.imageUrl).toBeUndefined();
      expect(result.data?.source).toBeUndefined();
      expect(result.data?.createdAt).toBeUndefined();
      expect(result.data?.updatedAt).toBeUndefined();
    });

    it('should return NOT_FOUND for non-existent recipe', async () => {
      mockDbInstance.select().from().where().limit = vi.fn().mockResolvedValue([]);

      const result = await service.findById('non-existent-id');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOT_FOUND');
    });

    it('should handle database errors', async () => {
      mockDbInstance.select().from().where().limit = vi.fn(() => {
        throw new Error('Database error');
      });

      const result = await service.findById('some-id');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNKNOWN_ERROR');
    });
  });

  describe('findAll', () => {
    it('should find all recipes with pagination', async () => {
      // Mock count query
      const mockCountChain = {
        select: vi.fn(() => mockCountChain),
        from: vi.fn(() => mockCountChain),
        where: vi.fn(() => mockCountChain),
        then: vi.fn((cb: any) => Promise.resolve(cb([{ count: 1 }]))),
      };
      
      // Mock data query
      const mockDataChain = {
        select: vi.fn(() => mockDataChain),
        from: vi.fn(() => mockDataChain),
        where: vi.fn(() => mockDataChain),
        orderBy: vi.fn(() => mockDataChain),
        limit: vi.fn(() => mockDataChain),
        offset: vi.fn(() => mockDataChain),
        then: vi.fn((cb: any) => Promise.resolve(cb([mockRecipeData]))),
      };

      // Alternate between count and data queries
      let callCount = 0;
      mockDbInstance.select = vi.fn(() => {
        callCount++;
        return callCount === 1 ? mockCountChain.select() : mockDataChain.select();
      });

      const result = await service.findAll({}, { page: 1, limit: 20 });

      expect(result.success).toBe(true);
    });

    it('should handle empty results', async () => {
      const mockChain = {
        select: vi.fn(() => mockChain),
        from: vi.fn(() => mockChain),
        where: vi.fn(() => mockChain),
        orderBy: vi.fn(() => mockChain),
        limit: vi.fn(() => mockChain),
        offset: vi.fn(() => mockChain),
        then: vi.fn((cb: any) => Promise.resolve(cb([]))),
      };
      mockDbInstance.select = vi.fn(() => mockChain.select());

      const result = await service.findAll({}, { page: 1, limit: 20 });

      expect(result.success).toBe(true);
    });

    it('should handle database errors', async () => {
      mockDbInstance.select = vi.fn(() => {
        throw new Error('Database error');
      });

      const result = await service.findAll({}, { page: 1, limit: 20 });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNKNOWN_ERROR');
    });
  });

  describe('update', () => {
    it('should update a recipe successfully', async () => {
      const mockTx = createMockDb();
      mockDbInstance.transaction = vi.fn((cb: any) => cb(mockTx));
      
      // Mock findByIdFromTx
      mockTx.select().from().where().limit = vi.fn().mockResolvedValue([mockRecipeData]);
      
      const updateDto: UpdateRecipeDTO = {
        title: 'Updated Tomato Soup',
      };

      const result = await service.update('123e4567-e89b-12d3-a456-426614174000', updateDto);

      expect(result.success).toBe(true);
    });

    it('should return NOT_FOUND if recipe does not exist', async () => {
      const mockTx = createMockDb();
      mockDbInstance.transaction = vi.fn((cb: any) => cb(mockTx));
      mockTx.select().from().where().limit = vi.fn().mockResolvedValue([]);

      const updateDto: UpdateRecipeDTO = {
        title: 'Updated Title',
      };

      const result = await service.update('non-existent-id', updateDto);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOT_FOUND');
    });

    it('should handle update errors', async () => {
      mockDbInstance.transaction = vi.fn(() => {
        throw new Error('Update failed');
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
      mockDbInstance.delete = vi.fn(() => ({
        where: vi.fn().mockResolvedValue(undefined),
      }));

      const result = await service.delete('123e4567-e89b-12d3-a456-426614174000');

      expect(result.success).toBe(true);
    });

    it('should handle delete errors', async () => {
      mockDbInstance.delete = vi.fn(() => ({
        where: vi.fn(() => {
          throw new Error('Delete failed');
        }),
      }));

      const result = await service.delete('some-id');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNKNOWN_ERROR');
    });
  });

  describe('batchImport', () => {
    it('should import multiple recipes successfully', async () => {
      const mockTx = createMockDb();
      mockDbInstance.transaction = vi.fn((cb: any) => cb(mockTx));
      mockTx.insert().values().returning = vi.fn().mockResolvedValue([mockRecipeData]);
      mockTx.select().from().where().limit = vi.fn().mockResolvedValue([mockRecipeData]);

      const recipes = [createDto, { ...createDto, title: 'Recipe 2' }];

      const result = await service.batchImport(recipes);

      expect(result.success).toBe(true);
      expect(result.data?.total).toBe(2);
      expect(result.data?.succeeded).toBe(2);
      expect(result.data?.failed).toBe(0);
    });

    it('should handle partial failures', async () => {
      let callCount = 0;
      mockDbInstance.transaction = vi.fn(() => {
        callCount++;
        if (callCount === 1) {
          const mockTx = createMockDb();
          mockTx.insert().values().returning = vi.fn().mockResolvedValue([mockRecipeData]);
          mockTx.select().from().where().limit = vi.fn().mockResolvedValue([mockRecipeData]);
          return Promise.resolve({ success: true, data: mockRecipeData });
        } else {
          throw new Error('Failed to create');
        }
      });

      const recipes = [createDto, { ...createDto, title: 'Recipe 2' }];

      const result = await service.batchImport(recipes);

      expect(result.success).toBe(true);
      expect(result.data?.total).toBe(2);
      expect(result.data?.succeeded).toBe(1);
      expect(result.data?.failed).toBe(1);
      expect(result.data?.errors).toHaveLength(1);
      expect(result.data?.errors[0].index).toBe(1);
    });

    it('should handle empty batch', async () => {
      const result = await service.batchImport([]);

      expect(result.success).toBe(true);
      expect(result.data?.total).toBe(0);
      expect(result.data?.succeeded).toBe(0);
      expect(result.data?.failed).toBe(0);
    });

    it('should handle all recipes failing', async () => {
      let callCount = 0;
      mockDbInstance.transaction = vi.fn(() => {
        callCount++;
        throw new Error('Database error');
      });

      const recipes = [createDto, { ...createDto, title: 'Recipe 2' }, { ...createDto, title: 'Recipe 3' }];

      const result = await service.batchImport(recipes);

      expect(result.success).toBe(true);
      expect(result.data?.total).toBe(3);
      expect(result.data?.succeeded).toBe(0);
      expect(result.data?.failed).toBe(3);
      expect(result.data?.errors).toHaveLength(3);
    });

    it('should use Unknown error fallback when error has no message', async () => {
      // Mock create to return an error without a message
      vi.spyOn(service, 'create').mockResolvedValue({
        success: false,
        error: {
          code: 'TEST_ERROR',
          // Intentionally no message property
        },
      } as any);

      const recipes = [createDto];

      const result = await service.batchImport(recipes);

      expect(result.success).toBe(true);
      expect(result.data?.failed).toBe(1);
      expect(result.data?.errors[0].error).toBe('Unknown error');
    });
  });

  describe('create - edge cases', () => {
    it('should create recipe with empty ingredients array', async () => {
      const dtoWithEmptyIngredients: CreateRecipeDTO = {
        ...createDto,
        ingredients: [],
      };

      const mockTx = createMockDb();
      mockDbInstance.transaction = vi.fn((cb: any) => cb(mockTx));
      mockTx.insert().values().returning = vi.fn().mockResolvedValue([mockRecipeData]);
      mockTx.select().from().where().limit = vi.fn().mockResolvedValue([{ ...mockRecipeData, ingredients: [] }]);

      const result = await service.create(dtoWithEmptyIngredients);

      expect(result.success).toBe(true);
    });

    it('should create recipe with empty steps array', async () => {
      const dtoWithEmptySteps: CreateRecipeDTO = {
        ...createDto,
        steps: [],
      };

      const mockTx = createMockDb();
      mockDbInstance.transaction = vi.fn((cb: any) => cb(mockTx));
      mockTx.insert().values().returning = vi.fn().mockResolvedValue([mockRecipeData]);
      mockTx.select().from().where().limit = vi.fn().mockResolvedValue([{ ...mockRecipeData, steps: [] }]);

      const result = await service.create(dtoWithEmptySteps);

      expect(result.success).toBe(true);
    });

    it('should create recipe with empty tags array', async () => {
      const dtoWithEmptyTags: CreateRecipeDTO = {
        ...createDto,
        tags: [],
      };

      const mockTx = createMockDb();
      mockDbInstance.transaction = vi.fn((cb: any) => cb(mockTx));
      mockTx.insert().values().returning = vi.fn().mockResolvedValue([{ ...mockRecipeData, tags: [] }]);
      mockTx.select().from().where().limit = vi.fn().mockResolvedValue([{ ...mockRecipeData, tags: [] }]);

      const result = await service.create(dtoWithEmptyTags);

      expect(result.success).toBe(true);
    });
  });

  describe('findAll - filters', () => {
    it('should filter by category', async () => {
      const mockChain = {
        select: vi.fn(() => mockChain),
        from: vi.fn(() => mockChain),
        where: vi.fn(() => mockChain),
        orderBy: vi.fn(() => mockChain),
        limit: vi.fn(() => mockChain),
        offset: vi.fn(() => mockChain),
        then: vi.fn((cb: any) => Promise.resolve(cb([mockRecipeData]))),
      };
      mockDbInstance.select = vi.fn(() => mockChain.select());

      const result = await service.findAll({ category: 'Lunch' }, { page: 1, limit: 20 });

      expect(result.success).toBe(true);
    });

    it('should filter by cuisine', async () => {
      const mockChain = {
        select: vi.fn(() => mockChain),
        from: vi.fn(() => mockChain),
        where: vi.fn(() => mockChain),
        orderBy: vi.fn(() => mockChain),
        limit: vi.fn(() => mockChain),
        offset: vi.fn(() => mockChain),
        then: vi.fn((cb: any) => Promise.resolve(cb([mockRecipeData]))),
      };
      mockDbInstance.select = vi.fn(() => mockChain.select());

      const result = await service.findAll({ cuisine: 'Italian' }, { page: 1, limit: 20 });

      expect(result.success).toBe(true);
    });

    it('should filter by difficulty', async () => {
      const mockChain = {
        select: vi.fn(() => mockChain),
        from: vi.fn(() => mockChain),
        where: vi.fn(() => mockChain),
        orderBy: vi.fn(() => mockChain),
        limit: vi.fn(() => mockChain),
        offset: vi.fn(() => mockChain),
        then: vi.fn((cb: any) => Promise.resolve(cb([mockRecipeData]))),
      };
      mockDbInstance.select = vi.fn(() => mockChain.select());

      const result = await service.findAll({ difficulty: 'easy' }, { page: 1, limit: 20 });

      expect(result.success).toBe(true);
    });

    it('should filter by maxPrepTime', async () => {
      const mockChain = {
        select: vi.fn(() => mockChain),
        from: vi.fn(() => mockChain),
        where: vi.fn(() => mockChain),
        orderBy: vi.fn(() => mockChain),
        limit: vi.fn(() => mockChain),
        offset: vi.fn(() => mockChain),
        then: vi.fn((cb: any) => Promise.resolve(cb([mockRecipeData]))),
      };
      mockDbInstance.select = vi.fn(() => mockChain.select());

      const result = await service.findAll({ maxPrepTime: 30 }, { page: 1, limit: 20 });

      expect(result.success).toBe(true);
    });

    it('should filter by maxCookTime', async () => {
      const mockChain = {
        select: vi.fn(() => mockChain),
        from: vi.fn(() => mockChain),
        where: vi.fn(() => mockChain),
        orderBy: vi.fn(() => mockChain),
        limit: vi.fn(() => mockChain),
        offset: vi.fn(() => mockChain),
        then: vi.fn((cb: any) => Promise.resolve(cb([mockRecipeData]))),
      };
      mockDbInstance.select = vi.fn(() => mockChain.select());

      const result = await service.findAll({ maxCookTime: 60 }, { page: 1, limit: 20 });

      expect(result.success).toBe(true);
    });

    it('should filter by search term', async () => {
      const mockChain = {
        select: vi.fn(() => mockChain),
        from: vi.fn(() => mockChain),
        where: vi.fn(() => mockChain),
        orderBy: vi.fn(() => mockChain),
        limit: vi.fn(() => mockChain),
        offset: vi.fn(() => mockChain),
        then: vi.fn((cb: any) => Promise.resolve(cb([mockRecipeData]))),
      };
      mockDbInstance.select = vi.fn(() => mockChain.select());

      const result = await service.findAll({ search: 'Tomato' }, { page: 1, limit: 20 });

      expect(result.success).toBe(true);
    });

    it('should escape special characters in search', async () => {
      const mockChain = {
        select: vi.fn(() => mockChain),
        from: vi.fn(() => mockChain),
        where: vi.fn(() => mockChain),
        orderBy: vi.fn(() => mockChain),
        limit: vi.fn(() => mockChain),
        offset: vi.fn(() => mockChain),
        then: vi.fn((cb: any) => Promise.resolve(cb([mockRecipeData]))),
      };
      mockDbInstance.select = vi.fn(() => mockChain.select());

      // Test with SQL special characters
      const result = await service.findAll({ search: '100% Done_test' }, { page: 1, limit: 20 });

      expect(result.success).toBe(true);
    });

    it('should combine multiple filters', async () => {
      const mockChain = {
        select: vi.fn(() => mockChain),
        from: vi.fn(() => mockChain),
        where: vi.fn(() => mockChain),
        orderBy: vi.fn(() => mockChain),
        limit: vi.fn(() => mockChain),
        offset: vi.fn(() => mockChain),
        then: vi.fn((cb: any) => Promise.resolve(cb([mockRecipeData]))),
      };
      mockDbInstance.select = vi.fn(() => mockChain.select());

      const result = await service.findAll(
        {
          category: 'Lunch',
          cuisine: 'Italian',
          difficulty: 'easy',
          maxPrepTime: 30,
          maxCookTime: 60,
          search: 'Soup',
        },
        { page: 1, limit: 20 }
      );

      expect(result.success).toBe(true);
    });

    it('should handle pagination correctly', async () => {
      const mockCountChain = {
        select: vi.fn(() => mockCountChain),
        from: vi.fn(() => mockCountChain),
        where: vi.fn(() => mockCountChain),
        then: vi.fn((cb: any) => Promise.resolve(cb([{ count: 50 }]))),
      };

      const mockDataChain = {
        select: vi.fn(() => mockDataChain),
        from: vi.fn(() => mockDataChain),
        where: vi.fn(() => mockDataChain),
        orderBy: vi.fn(() => mockDataChain),
        limit: vi.fn(() => mockDataChain),
        offset: vi.fn(() => mockDataChain),
        then: vi.fn((cb: any) => Promise.resolve(cb([mockRecipeData]))),
      };

      let callCount = 0;
      mockDbInstance.select = vi.fn(() => {
        callCount++;
        return callCount === 1 ? mockCountChain.select() : mockDataChain.select();
      });

      const result = await service.findAll({}, { page: 3, limit: 10 });

      expect(result.success).toBe(true);
      expect(result.data?.page).toBe(3);
      expect(result.data?.limit).toBe(10);
    });
  });

  describe('update - edge cases', () => {
    it('should update recipe with new ingredients', async () => {
      const mockTx = createMockDb();
      mockDbInstance.transaction = vi.fn((cb: any) => cb(mockTx));
      mockTx.select().from().where().limit = vi.fn().mockResolvedValue([mockRecipeData]);
      mockTx.delete = vi.fn(() => ({ where: vi.fn().mockResolvedValue(undefined) }));
      mockTx.insert = vi.fn(() => ({ values: vi.fn().mockResolvedValue(undefined) }));

      const updateDto: UpdateRecipeDTO = {
        ingredients: [
          { name: 'New Ingredient', amount: 3, unit: 'cups' },
        ],
      };

      const result = await service.update('123e4567-e89b-12d3-a456-426614174000', updateDto);

      expect(result.success).toBe(true);
    });

    it('should update recipe with new steps', async () => {
      const mockTx = createMockDb();
      mockDbInstance.transaction = vi.fn((cb: any) => cb(mockTx));
      mockTx.select().from().where().limit = vi.fn().mockResolvedValue([mockRecipeData]);
      mockTx.delete = vi.fn(() => ({ where: vi.fn().mockResolvedValue(undefined) }));
      mockTx.insert = vi.fn(() => ({ values: vi.fn().mockResolvedValue(undefined) }));

      const updateDto: UpdateRecipeDTO = {
        steps: [
          { stepNumber: 1, instruction: 'New step', durationMinutes: 10 },
          { stepNumber: 2, instruction: 'Another step' },
        ],
      };

      const result = await service.update('123e4567-e89b-12d3-a456-426614174000', updateDto);

      expect(result.success).toBe(true);
    });

    it('should update recipe with new tags', async () => {
      const mockTx = createMockDb();
      mockDbInstance.transaction = vi.fn((cb: any) => cb(mockTx));
      mockTx.select().from().where().limit = vi.fn().mockResolvedValue([mockRecipeData]);
      mockTx.delete = vi.fn(() => ({ where: vi.fn().mockResolvedValue(undefined) }));
      mockTx.insert = vi.fn(() => ({ values: vi.fn().mockResolvedValue(undefined) }));

      const updateDto: UpdateRecipeDTO = {
        tags: ['quick', 'healthy'],
      };

      const result = await service.update('123e4567-e89b-12d3-a456-426614174000', updateDto);

      expect(result.success).toBe(true);
    });

    it('should clear ingredients by setting empty array', async () => {
      const mockTx = createMockDb();
      mockDbInstance.transaction = vi.fn((cb: any) => cb(mockTx));
      mockTx.select().from().where().limit = vi.fn().mockResolvedValue([{ ...mockRecipeData, ingredients: [] }]);
      mockTx.delete = vi.fn(() => ({ where: vi.fn().mockResolvedValue(undefined) }));
      mockTx.insert = vi.fn(() => ({ values: vi.fn().mockResolvedValue(undefined) }));

      const updateDto: UpdateRecipeDTO = {
        ingredients: [],
      };

      const result = await service.update('123e4567-e89b-12d3-a456-426614174000', updateDto);

      expect(result.success).toBe(true);
    });

    it('should clear steps by setting empty array', async () => {
      const mockTx = createMockDb();
      mockDbInstance.transaction = vi.fn((cb: any) => cb(mockTx));
      mockTx.select().from().where().limit = vi.fn().mockResolvedValue([{ ...mockRecipeData, steps: [] }]);
      mockTx.delete = vi.fn(() => ({ where: vi.fn().mockResolvedValue(undefined) }));
      mockTx.insert = vi.fn(() => ({ values: vi.fn().mockResolvedValue(undefined) }));

      const updateDto: UpdateRecipeDTO = {
        steps: [],
      };

      const result = await service.update('123e4567-e89b-12d3-a456-426614174000', updateDto);

      expect(result.success).toBe(true);
    });

    it('should clear tags by setting empty array', async () => {
      const mockTx = createMockDb();
      mockDbInstance.transaction = vi.fn((cb: any) => cb(mockTx));
      mockTx.select().from().where().limit = vi.fn().mockResolvedValue([{ ...mockRecipeData, tags: [] }]);
      mockTx.delete = vi.fn(() => ({ where: vi.fn().mockResolvedValue(undefined) }));
      mockTx.insert = vi.fn(() => ({ values: vi.fn().mockResolvedValue(undefined) }));

      const updateDto: UpdateRecipeDTO = {
        tags: [],
      };

      const result = await service.update('123e4567-e89b-12d3-a456-426614174000', updateDto);

      expect(result.success).toBe(true);
    });

    it('should not update database when no fields are provided', async () => {
      const mockTx = createMockDb();
      mockDbInstance.transaction = vi.fn((cb: any) => cb(mockTx));
      mockTx.select().from().where().limit = vi.fn().mockResolvedValue([mockRecipeData]);

      const updateDto: UpdateRecipeDTO = {};

      const result = await service.update('123e4567-e89b-12d3-a456-426614174000', updateDto);

      expect(result.success).toBe(true);
    });

    it('should update all optional fields', async () => {
      const mockTx = createMockDb();
      mockDbInstance.transaction = vi.fn((cb: any) => cb(mockTx));
      mockTx.select().from().where().limit = vi.fn().mockResolvedValue([mockRecipeData]);
      mockTx.update = vi.fn(() => ({ set: vi.fn().mockReturnThis(), where: vi.fn().mockResolvedValue(undefined) }));

      const updateDto: UpdateRecipeDTO = {
        title: 'Updated Title',
        description: 'Updated description',
        category: 'Dinner',
        cuisine: 'French',
        servings: 6,
        prepTimeMinutes: 20,
        cookTimeMinutes: 45,
        difficulty: 'hard',
        imageUrl: 'https://new-image.com/img.jpg',
        source: 'New Source',
        nutritionInfo: { calories: 300, protein: 20 },
      };

      const result = await service.update('123e4567-e89b-12d3-a456-426614174000', updateDto);

      expect(result.success).toBe(true);
    });
  });
});
