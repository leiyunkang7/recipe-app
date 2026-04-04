import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RecipeService } from '../service';
import { CreateRecipeDTO, UpdateRecipeDTO } from '@recipe-app/shared-types';

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
  const chainable = {
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
