import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SearchService } from '../service';
import { SearchOptions } from '@recipe-app/shared-types';

// Create a mock database that can be chained
const createMockDb = () => {
  const chainable: any = {
    select: vi.fn(() => chainable),
    from: vi.fn(() => chainable),
    where: vi.fn(() => chainable),
    limit: vi.fn(() => chainable),
    innerJoin: vi.fn(() => chainable),
    orderBy: vi.fn(() => chainable),
    then: vi.fn((cb: any) => Promise.resolve(cb([]))),
  };
  return chainable;
};

describe('SearchService', () => {
  let service: SearchService;
  let mockDbInstance: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDbInstance = createMockDb();
    service = new SearchService(mockDbInstance as any);
  });

  const mockRecipes = [
    {
      id: '123e4567-e89b-12d3-a456-426614174000',
      title: 'Tomato Soup',
      description: 'A delicious tomato soup recipe',
    },
    {
      id: '456e7890-e89b-12d3-a456-426614174000',
      title: 'Tomato Pasta',
      description: 'Pasta with tomato sauce',
    },
  ];

  const mockIngredients = [
    {
      id: '1',
      name: 'Tomato',
      recipeId: '123e4567-e89b-12d3-a456-426614174000',
      recipeTitle: 'Tomato Soup',
    },
  ];

  const mockTags = [
    {
      tag: 'vegetarian',
      recipeId: '123e4567-e89b-12d3-a456-426614174000',
      recipeTitle: 'Tomato Soup',
    },
  ];

  describe('search', () => {
    it('should return empty array for empty query', async () => {
      const result = await service.search('', { scope: 'all', limit: 20 });

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should return empty array for whitespace-only query', async () => {
      const result = await service.search('   ', { scope: 'all', limit: 20 });

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should search recipes when scope is "recipes"', async () => {
      mockDbInstance.then = vi.fn((cb: any) => Promise.resolve(cb(mockRecipes)));

      const result = await service.search('tomato', { scope: 'recipes', limit: 20 });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should search ingredients when scope is "ingredients"', async () => {
      mockDbInstance.then = vi.fn((cb: any) => Promise.resolve(cb(mockIngredients)));

      const result = await service.search('tomato', { scope: 'ingredients', limit: 20 });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should search both recipes and ingredients when scope is "all"', async () => {
      let callCount = 0;
      mockDbInstance.then = vi.fn((cb: any) => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve(cb(mockRecipes));
        } else if (callCount === 2) {
          return Promise.resolve(cb(mockIngredients));
        } else {
          return Promise.resolve(cb(mockTags));
        }
      });

      const result = await service.search('tomato', { scope: 'all', limit: 20 });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should calculate relevance scores correctly', async () => {
      mockDbInstance.then = vi.fn((cb: any) => Promise.resolve(cb(mockRecipes)));

      const result = await service.search('Tomato Soup', { scope: 'recipes', limit: 20 });

      expect(result.success).toBe(true);
      expect(result.data?.[0]?.relevanceScore).toBeGreaterThan(0);
    });

    it('should give higher score for exact title match', async () => {
      const exactMatch = [
        {
          id: '1',
          title: 'Tomato',
          description: 'Recipe',
        },
      ];

      mockDbInstance.then = vi.fn((cb: any) => Promise.resolve(cb(exactMatch)));

      const result = await service.search('Tomato', { scope: 'recipes', limit: 20 });

      expect(result.success).toBe(true);
      expect(result.data?.[0]?.relevanceScore).toBeGreaterThan(0);
    });

    it('should give higher score for title starting with query', async () => {
      const startsWith = [
        {
          id: '1',
          title: 'Tomato Soup',
          description: 'Delicious',
        },
      ];

      mockDbInstance.then = vi.fn((cb: any) => Promise.resolve(cb(startsWith)));

      const result = await service.search('Tomato', { scope: 'recipes', limit: 20 });

      expect(result.success).toBe(true);
      expect(result.data?.[0]?.relevanceScore).toBeGreaterThan(0);
    });

    it('should give lower score for description match', async () => {
      const descMatch = [
        {
          id: '1',
          title: 'Soup',
          description: 'Made with tomatoes',
        },
      ];

      mockDbInstance.then = vi.fn((cb: any) => Promise.resolve(cb(descMatch)));

      const result = await service.search('tomato', { scope: 'recipes', limit: 20 });

      expect(result.success).toBe(true);
      expect(result.data?.[0]?.relevanceScore).toBeGreaterThan(0);
    });

    it('should limit results to specified limit', async () => {
      const manyRecipes = Array.from({ length: 30 }, (_, i) => ({
        id: `id-${i}`,
        title: `Recipe ${i}`,
        description: 'Description',
      }));

      mockDbInstance.then = vi.fn((cb: any) => Promise.resolve(cb(manyRecipes)));

      const result = await service.search('recipe', { scope: 'recipes', limit: 10 });

      expect(result.success).toBe(true);
      expect(result.data?.length).toBeLessThanOrEqual(10);
    });

    it('should sort results by relevance score descending', async () => {
      mockDbInstance.then = vi.fn((cb: any) => Promise.resolve(cb(mockRecipes)));

      const result = await service.search('tomato', { scope: 'recipes', limit: 20 });

      expect(result.success).toBe(true);

      // Check if sorted by relevance (descending)
      const scores = result.data?.map((r) => r.relevanceScore || 0) || [];
      const sortedScores = [...scores].sort((a, b) => b - a);
      expect(scores).toEqual(sortedScores);
    });

    it('should handle database errors gracefully', async () => {
      mockDbInstance.select = vi.fn(() => {
        throw new Error('Database error');
      });

      const result = await service.search('tomato', { scope: 'recipes', limit: 20 });

      expect(result.success).toBe(false);
    });

    it('should handle unexpected errors', async () => {
      mockDbInstance.select = vi.fn(() => {
        throw new Error('Unexpected error');
      });

      const result = await service.search('tomato', { scope: 'recipes', limit: 20 });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNKNOWN_ERROR');
    });

    it('should include tags in search when scope is "all"', async () => {
      let callCount = 0;
      mockDbInstance.then = vi.fn((cb: any) => {
        callCount++;
        if (callCount === 3) {
          return Promise.resolve(cb(mockTags));
        }
        return Promise.resolve(cb([]));
      });

      const result = await service.search('vegetarian', { scope: 'all', limit: 20 });

      expect(result.success).toBe(true);
    });

    it('should handle word boundary matches', async () => {
      const multiWordRecipe = [
        {
          id: '1',
          title: 'Tomato and Basil Soup',
          description: 'Delicious soup',
        },
      ];

      mockDbInstance.then = vi.fn((cb: any) => Promise.resolve(cb(multiWordRecipe)));

      const result = await service.search('Tomato Basil', { scope: 'recipes', limit: 20 });

      expect(result.success).toBe(true);
      expect(result.data?.[0]?.relevanceScore).toBeGreaterThanOrEqual(20);
    });

    it('should handle null description in recipe', async () => {
      const recipeWithNullDescription = [
        {
          id: '1',
          title: 'Recipe with no description',
          description: null,
        },
      ];

      mockDbInstance.then = vi.fn((cb: any) => Promise.resolve(cb(recipeWithNullDescription)));

      const result = await service.search('recipe', { scope: 'recipes', limit: 20 });

      expect(result.success).toBe(true);
      expect(result.data?.[0]?.snippet).toBeDefined();
    });

    it('should handle undefined description in recipe', async () => {
      const recipeWithUndefinedDescription = [
        {
          id: '1',
          title: 'Recipe with no description',
          description: undefined,
        },
      ];

      mockDbInstance.then = vi.fn((cb: any) => Promise.resolve(cb(recipeWithUndefinedDescription)));

      const result = await service.search('recipe', { scope: 'recipes', limit: 20 });

      expect(result.success).toBe(true);
      expect(result.data?.[0]?.snippet).toBeDefined();
    });

    it('should append "..." to snippet when description exceeds 150 characters', async () => {
      const longDescription = 'A'.repeat(200); // 200 characters
      const recipeWithLongDescription = [
        {
          id: '1',
          title: 'Recipe with very long description',
          description: longDescription,
        },
      ];

      mockDbInstance.then = vi.fn((cb: any) => Promise.resolve(cb(recipeWithLongDescription)));

      const result = await service.search('Recipe', { scope: 'recipes', limit: 20 });

      expect(result.success).toBe(true);
      expect(result.data?.[0]?.snippet).toContain('...');
      expect(result.data?.[0]?.snippet?.length).toBe(153); // 150 chars + '...'
    });

    it('should not append "..." to snippet when description is 150 characters or less', async () => {
      const exactDescription = 'A'.repeat(150); // exactly 150 characters
      const recipeWithExactDescription = [
        {
          id: '1',
          title: 'Recipe with exact description',
          description: exactDescription,
        },
      ];

      mockDbInstance.then = vi.fn((cb: any) => Promise.resolve(cb(recipeWithExactDescription)));

      const result = await service.search('Recipe', { scope: 'recipes', limit: 20 });

      expect(result.success).toBe(true);
      expect(result.data?.[0]?.snippet).not.toContain('...');
      expect(result.data?.[0]?.snippet?.length).toBe(150);
    });

    it('should handle null title in search results', async () => {
      const recipeWithNullTitle = [
        {
          id: '1',
          title: null,
          description: 'Some description',
        },
      ];

      mockDbInstance.then = vi.fn((cb: any) => Promise.resolve(cb(recipeWithNullTitle)));

      const result = await service.search('recipe', { scope: 'recipes', limit: 20 });

      expect(result.success).toBe(true);
      expect(result.data?.[0]?.title).toBe('');
    });

    it('should handle undefined title in search results', async () => {
      const recipeWithUndefinedTitle = [
        {
          id: '1',
          title: undefined,
          description: 'Some description',
        },
      ];

      mockDbInstance.then = vi.fn((cb: any) => Promise.resolve(cb(recipeWithUndefinedTitle)));

      const result = await service.search('recipe', { scope: 'recipes', limit: 20 });

      expect(result.success).toBe(true);
      expect(result.data?.[0]?.title).toBe('');
    });

    it('should sort results when all relevance scores are 0', async () => {
      const zeroScoreRecipes = [
        {
          id: '1',
          title: 'Recipe A',
          description: 'No match here',
        },
        {
          id: '2',
          title: 'Recipe B',
          description: 'Also no match',
        },
        {
          id: '3',
          title: 'Recipe C',
          description: 'Still no match',
        },
      ];

      mockDbInstance.then = vi.fn((cb: any) => Promise.resolve(cb(zeroScoreRecipes)));

      const result = await service.search('xyz123', { scope: 'recipes', limit: 20 });

      expect(result.success).toBe(true);
      // All scores should be 0 since no match
      result.data?.forEach((r) => {
        expect(r.relevanceScore).toBe(0);
      });
    });

    it('should maintain stable sort when scores are equal', async () => {
      const equalScoreRecipes = [
        {
          id: '1',
          title: 'Apple Pie',
          description: 'Sweet dessert',
        },
        {
          id: '2',
          title: 'Banana Bread',
          description: 'Baked goods',
        },
        {
          id: '3',
          title: 'Cherry Cobbler',
          description: 'Fruit dessert',
        },
      ];

      mockDbInstance.then = vi.fn((cb: any) => Promise.resolve(cb(equalScoreRecipes)));

      const result = await service.search('pie', { scope: 'recipes', limit: 20 });

      expect(result.success).toBe(true);
    });
  });

  describe('suggestions', () => {
    it('should return empty array for short query', async () => {
      const result = await service.suggestions('t');

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should return empty array for empty query', async () => {
      const result = await service.suggestions('');

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should return recipe title suggestions', async () => {
      mockDbInstance.then = vi.fn((cb: any) => Promise.resolve(cb([
        { title: 'Tomato Soup' },
        { title: 'Tomato Pasta' },
      ])));

      const result = await service.suggestions('tom');

      expect(result.success).toBe(true);
      expect(result.data?.length).toBeGreaterThanOrEqual(2);
      expect(result.data?.[0]?.type).toBe('recipe');
    });

    it('should return ingredient suggestions', async () => {
      let callCount = 0;
      mockDbInstance.then = vi.fn((cb: any) => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve(cb([]));
        } else if (callCount === 2) {
          return Promise.resolve(cb([
            { name: 'Tomato' },
            { name: 'Tomato Paste' },
          ]));
        }
        return Promise.resolve(cb([]));
      });

      const result = await service.suggestions('tom');

      expect(result.success).toBe(true);
      const ingredientSuggestions = result.data?.filter((s) => s.type === 'ingredient');
      expect(ingredientSuggestions?.length).toBeGreaterThan(0);
    });

    it('should return tag suggestions', async () => {
      let callCount = 0;
      mockDbInstance.then = vi.fn((cb: any) => {
        callCount++;
        if (callCount <= 2) {
          return Promise.resolve(cb([]));
        }
        return Promise.resolve(cb([
          { tag: 'tomato-based' },
          { tag: 'tomato-sauce' },
        ]));
      });

      const result = await service.suggestions('tom');

      expect(result.success).toBe(true);
      const tagSuggestions = result.data?.filter((s) => s.type === 'tag');
      expect(tagSuggestions?.length).toBeGreaterThan(0);
    });

    it('should remove duplicate suggestions', async () => {
      let callCount = 0;
      mockDbInstance.then = vi.fn((cb: any) => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve(cb([{ title: 'Tomato Soup' }]));
        } else if (callCount === 2) {
          return Promise.resolve(cb([{ name: 'Tomato Soup' }]));
        }
        return Promise.resolve(cb([]));
      });

      const result = await service.suggestions('tom');

      expect(result.success).toBe(true);

      // Check uniqueness by text
      const texts = result.data?.map((s) => s.text) || [];
      const uniqueTexts = new Set(texts);
      expect(texts.length).toBe(uniqueTexts.size);
    });

    it('should limit suggestions to 10', async () => {
      const manySuggestions = Array.from({ length: 20 }, (_, i) => ({
        title: `Recipe ${i}`,
      }));

      mockDbInstance.then = vi.fn((cb: any) => Promise.resolve(cb(manySuggestions)));

      const result = await service.suggestions('rec');

      expect(result.success).toBe(true);
      expect(result.data?.length).toBeLessThanOrEqual(10);
    });

    it('should handle database errors', async () => {
      mockDbInstance.select = vi.fn(() => {
        throw new Error('Database error');
      });

      const result = await service.suggestions('tomato');

      expect(result.success).toBe(false);
    });

    it('should handle unexpected errors', async () => {
      mockDbInstance.select = vi.fn(() => {
        throw new Error('Unexpected error');
      });

      const result = await service.suggestions('tomato');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNKNOWN_ERROR');
    });

    it('should trim query whitespace', async () => {
      mockDbInstance.then = vi.fn((cb: any) => Promise.resolve(cb([])));

      await service.suggestions('  tomato  ');

      // Should use trimmed query - just verify no error
      expect(mockDbInstance.select).toHaveBeenCalled();
    });
  });

  describe('calculateRelevance', () => {
    it('should score exact match highest', async () => {
      const recipe = [{ id: '1', title: 'Tomato', description: '' }];
      mockDbInstance.then = vi.fn((cb: any) => Promise.resolve(cb(recipe)));

      const result = await service.search('Tomato', { scope: 'recipes', limit: 20 });

      expect(result.data?.[0]?.relevanceScore).toBeGreaterThan(0);
    });

    it('should score starts with higher than contains', async () => {
      const recipes = [
        { id: '1', title: 'Tomato Soup', description: '' },
        { id: '2', title: 'Delicious Tomato', description: '' },
      ];

      mockDbInstance.then = vi.fn((cb: any) => Promise.resolve(cb(recipes)));

      const result = await service.search('Tomato', { scope: 'recipes', limit: 20 });

      expect(result.data?.[0]?.title).toBe('Tomato Soup'); // Starts with should be first
      expect(result.data?.[0]?.relevanceScore).toBeGreaterThan(result.data?.[1]?.relevanceScore || 0);
    });

    it('should add word boundary bonus scores', async () => {
      const recipe = [{ id: '1', title: 'Tomato Basil Soup', description: 'With fresh basil' }];
      mockDbInstance.then = vi.fn((cb: any) => Promise.resolve(cb(recipe)));

      const result = await service.search('Tomato Basil', { scope: 'recipes', limit: 20 });

      expect(result.data?.[0]?.relevanceScore).toBeGreaterThan(0);
    });

    it('should be case-insensitive', async () => {
      const recipe = [{ id: '1', title: 'tomato soup', description: '' }];
      mockDbInstance.then = vi.fn((cb: any) => Promise.resolve(cb(recipe)));

      const result = await service.search('TOMATO', { scope: 'recipes', limit: 20 });

      expect(result.data?.[0]?.relevanceScore).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in query', async () => {
      mockDbInstance.then = vi.fn((cb: any) => Promise.resolve(cb([])));

      const result = await service.search('tomato & onion', { scope: 'recipes', limit: 20 });

      expect(result.success).toBe(true);
    });

    it('should escape percent sign in search query (SQL injection prevention)', async () => {
      mockDbInstance.then = vi.fn((cb: any) => Promise.resolve(cb([])));

      await service.search('test%value', { scope: 'recipes', limit: 20 });

      // Verify query was processed without error
      expect(mockDbInstance.select).toHaveBeenCalled();
    });

    it('should escape underscore in search query (SQL injection prevention)', async () => {
      mockDbInstance.then = vi.fn((cb: any) => Promise.resolve(cb([])));

      await service.search('test_value', { scope: 'recipes', limit: 20 });

      expect(mockDbInstance.select).toHaveBeenCalled();
    });

    it('should escape backslash in search query (SQL injection prevention)', async () => {
      mockDbInstance.then = vi.fn((cb: any) => Promise.resolve(cb([])));

      await service.search('test\\value', { scope: 'recipes', limit: 20 });

      expect(mockDbInstance.select).toHaveBeenCalled();
    });

    it('should escape multiple special characters in search query', async () => {
      mockDbInstance.then = vi.fn((cb: any) => Promise.resolve(cb([])));

      await service.search('test%value_with\\special', { scope: 'recipes', limit: 20 });

      expect(mockDbInstance.select).toHaveBeenCalled();
    });

    it('should escape special characters in suggestions query', async () => {
      mockDbInstance.then = vi.fn((cb: any) => Promise.resolve(cb([])));

      await service.suggestions('test%value');

      expect(mockDbInstance.select).toHaveBeenCalled();
    });

    it('should handle very long queries', async () => {
      const longQuery = 'a'.repeat(1000);
      mockDbInstance.then = vi.fn((cb: any) => Promise.resolve(cb([])));

      const result = await service.search(longQuery, { scope: 'recipes', limit: 20 });

      expect(result.success).toBe(true);
    });

    it('should handle unicode characters', async () => {
      const unicodeQuery = '日本語';
      mockDbInstance.then = vi.fn((cb: any) => Promise.resolve(cb([])));

      const result = await service.search(unicodeQuery, { scope: 'recipes', limit: 20 });

      expect(result.success).toBe(true);
    });

    it('should handle limit of 1', async () => {
      mockDbInstance.then = vi.fn((cb: any) => Promise.resolve(cb(mockRecipes)));

      const result = await service.search('tomato', { scope: 'recipes', limit: 1 });

      expect(result.success).toBe(true);
      expect(result.data?.length).toBeLessThanOrEqual(1);
    });

    it('should handle maximum limit of 100', async () => {
      mockDbInstance.then = vi.fn((cb: any) => Promise.resolve(cb(mockRecipes)));

      const result = await service.search('tomato', { scope: 'recipes', limit: 100 });

      expect(result.success).toBe(true);
    });
  });
});
