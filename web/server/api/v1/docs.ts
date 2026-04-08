import { defineEventHandler } from 'h3';

/**
 * API v1 Documentation Endpoint
 *
 * Returns OpenAPI-style documentation for API v1
 */
export default defineEventHandler(async () => {
  return {
    openapi: '3.0.0',
    info: {
      title: 'Recipe App API v1',
      version: '1.0.0',
      description: 'REST API for the Recipe App application',
    },
    servers: [
      { url: '/api/v1', description: 'Current version' },
    ],
    endpoints: {
      recipes: {
        'GET /api/v1/recipes': {
          summary: 'List recipes',
          description: 'Returns a paginated list of recipes with optional filtering',
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
            { name: 'category', in: 'query', schema: { type: 'string' } },
            { name: 'cuisine', in: 'query', schema: { type: 'string' } },
            { name: 'search', in: 'query', schema: { type: 'string' } },
            { name: 'max_time', in: 'query', schema: { type: 'integer' } },
            { name: 'min_time', in: 'query', schema: { type: 'integer' } },
          ],
          response: {
            data: { type: 'array', items: { $ref: '#/components/schemas/Recipe' } },
            count: { type: 'integer' },
          },
        },
        'POST /api/v1/recipes': {
          summary: 'Create recipe',
          description: 'Creates a new recipe',
          body: { $ref: '#/components/schemas/RecipeInput' },
          response: { data: { $ref: '#/components/schemas/Recipe' } },
        },
      },
      recipeStats: {
        'GET /api/v1/recipes/:id/stats': {
          summary: 'Get recipe statistics',
          description: 'Returns view count, favorites count, and cooking count for a recipe',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          response: {
            api_version: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                views: { type: 'integer' },
                favoritesCount: { type: 'integer' },
                cookingCount: { type: 'integer' },
              },
            },
          },
        },
      },
      changelog: {
        'GET /api/v1/changelog': {
          summary: 'API Changelog',
          description: 'Returns the changelog and migration history for v1',
          response: {
            version: { type: 'string' },
            last_updated: { type: 'string', format: 'date-time' },
            changes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  date: { type: 'string' },
                  type: { type: 'string', enum: ['feature', 'fix', 'breaking'] },
                  description: { type: 'string' },
                },
              },
            },
            migrations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  applied_at: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
      },
    },
    components: {
      schemas: {
        Recipe: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            description: { type: 'string' },
            category: { type: 'string' },
            cuisine: { type: 'string' },
            servings: { type: 'integer' },
            prep_time_minutes: { type: 'integer' },
            cook_time_minutes: { type: 'integer' },
            difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
            image_url: { type: 'string', nullable: true },
            source: { type: 'string', nullable: true },
            video_url: { type: 'string', nullable: true },
            nutrition_info: { type: 'object', nullable: true },
            views: { type: 'integer' },
            author_id: { type: 'string', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
            ingredients: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  amount: { type: 'number' },
                  unit: { type: 'string' },
                },
              },
            },
            steps: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  step_number: { type: 'integer' },
                  instruction: { type: 'string' },
                  duration_minutes: { type: 'integer', nullable: true },
                },
              },
            },
            tags: { type: 'array', items: { type: 'string' } },
            average_rating: { type: 'number' },
            rating_count: { type: 'integer' },
          },
        },
        RecipeInput: {
          type: 'object',
          required: ['title'],
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            category: { type: 'string' },
            cuisine: { type: 'string' },
            servings: { type: 'integer' },
            prep_time_minutes: { type: 'integer' },
            cook_time_minutes: { type: 'integer' },
            difficulty: { type: 'string' },
            image_url: { type: 'string' },
            source: { type: 'string' },
            nutrition_info: { type: 'object' },
            ingredients: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  amount: { type: 'number' },
                  unit: { type: 'string' },
                },
              },
            },
            steps: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  step_number: { type: 'integer' },
                  instruction: { type: 'string' },
                  duration_minutes: { type: 'integer' },
                },
              },
            },
            tags: { type: 'array', items: { type: 'string' } },
            translations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  locale: { type: 'string' },
                  title: { type: 'string' },
                  description: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  };
});
