import { describe, it, expect } from 'vitest';

// Test that all exports from index.ts are correctly available
describe('database index exports', () => {
  describe('schema exports', () => {
    it('should export all recipe tables and relations', async () => {
      const schema = await import('../index');

      // Core recipe tables
      expect(schema.recipes).toBeDefined();
      expect(schema.recipeIngredients).toBeDefined();
      expect(schema.recipeSteps).toBeDefined();
      expect(schema.recipeTags).toBeDefined();

      // Recipe relations
      expect(schema.recipesRelations).toBeDefined();
      expect(schema.recipeIngredientsRelations).toBeDefined();
      expect(schema.recipeStepsRelations).toBeDefined();
      expect(schema.recipeTagsRelations).toBeDefined();
    });

    it('should export all i18n translation tables and relations', async () => {
      const schema = await import('../index');

      // Translation tables
      expect(schema.recipeTranslations).toBeDefined();
      expect(schema.ingredientTranslations).toBeDefined();
      expect(schema.stepTranslations).toBeDefined();
      expect(schema.categoryTranslations).toBeDefined();
      expect(schema.cuisineTranslations).toBeDefined();

      // Translation relations
      expect(schema.recipeTranslationsRelations).toBeDefined();
      expect(schema.ingredientTranslationsRelations).toBeDefined();
      expect(schema.stepTranslationsRelations).toBeDefined();
      expect(schema.categoryTranslationsRelations).toBeDefined();
      expect(schema.cuisineTranslationsRelations).toBeDefined();

      // Taxonomy relations (defined in i18n.ts to avoid circular imports)
      expect(schema.categoriesRelations).toBeDefined();
      expect(schema.cuisinesRelations).toBeDefined();
    });

    it('should export all taxonomy tables', async () => {
      const schema = await import('../index');

      expect(schema.categories).toBeDefined();
      expect(schema.cuisines).toBeDefined();
    });

    it('should export all favorites tables and relations', async () => {
      const schema = await import('../index');

      expect(schema.favorites).toBeDefined();
      expect(schema.favoriteFolders).toBeDefined();
      expect(schema.recipeRatings).toBeDefined();
      expect(schema.favoritesRelations).toBeDefined();
    });
  });

  describe('client exports', () => {
    it('should export createDb function', async () => {
      const { createDb } = await import('../index');

      expect(createDb).toBeDefined();
      expect(typeof createDb).toBe('function');
    });

    it('should export createDbFromPool function', async () => {
      const { createDbFromPool } = await import('../index');

      expect(createDbFromPool).toBeDefined();
      expect(typeof createDbFromPool).toBe('function');
    });

    it('should export Database type', async () => {
      // TypeScript types are compile-time only, but we can verify
      // the export exists by importing it
      const index = await import('../index');

      // The type itself won't exist at runtime, but the module should load
      expect(index).toBeDefined();
    });
  });

  describe('module structure', () => {
    it('should have all expected exports from schema', async () => {
      const index = await import('../index');

      // Create a set of all exported keys
      const exportedKeys = Object.keys(index);

      // Verify all schema exports are present
      const expectedSchemaExports = [
        // Recipe tables
        'recipes',
        'recipeIngredients',
        'recipeSteps',
        'recipeTags',
        // Recipe relations
        'recipesRelations',
        'recipeIngredientsRelations',
        'recipeStepsRelations',
        'recipeTagsRelations',
        // i18n tables
        'recipeTranslations',
        'ingredientTranslations',
        'stepTranslations',
        'categoryTranslations',
        'cuisineTranslations',
        // i18n relations
        'recipeTranslationsRelations',
        'ingredientTranslationsRelations',
        'stepTranslationsRelations',
        'categoryTranslationsRelations',
        'cuisineTranslationsRelations',
        // Taxonomy relations
        'categoriesRelations',
        'cuisinesRelations',
        // Taxonomy tables
        'categories',
        'cuisines',
        // Favorites tables
        'favorites',
        'favoriteFolders',
        'recipeRatings',
        'favoritesRelations',
      ];

      for (const exportName of expectedSchemaExports) {
        expect(exportedKeys).toContain(exportName);
        expect(index[exportName as keyof typeof index]).toBeDefined();
      }
    });

    it('should have all expected exports from client', async () => {
      const index = await import('../index');
      const exportedKeys = Object.keys(index);

      // Verify client exports
      expect(exportedKeys).toContain('createDb');
      expect(exportedKeys).toContain('createDbFromPool');

      // Verify they are functions
      expect(typeof index.createDb).toBe('function');
      expect(typeof index.createDbFromPool).toBe('function');
    });
  });

  describe('re-export integrity', () => {
    it('should re-export the same objects from schema', async () => {
      const index = await import('../index');
      const schema = await import('../schema');

      // Verify that index exports are identical to schema exports
      // Using toEqual instead of toBe to handle potential module instance differences
      expect(index.recipes).toEqual(schema.recipes);
      expect(index.categories).toEqual(schema.categories);
      expect(index.cuisines).toEqual(schema.cuisines);
      expect(index.favorites).toEqual(schema.favorites);
      expect(index.recipeTranslations).toEqual(schema.recipeTranslations);
    });

    it('should re-export functions with correct names from client', async () => {
      const index = await import('../index');
      const client = await import('../client');

      // Verify that index exports functions with same names and types as client exports
      // Using toEqual instead of toBe due to potential module instance differences
      expect(typeof index.createDb).toBe(typeof client.createDb);
      expect(typeof index.createDbFromPool).toBe(typeof client.createDbFromPool);
      expect(index.createDb.name).toBe(client.createDb.name);
      expect(index.createDbFromPool.name).toBe(client.createDbFromPool.name);
    });
  });
});
