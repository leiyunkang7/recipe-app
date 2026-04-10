import { defineEventHandler, readBody } from 'h3'
import { rateLimiters } from '../../utils/rateLimit'
import type { CreateRecipeDTO } from '@recipe-app/shared-types'

interface GenerateRecipeResponse {
  success: boolean
  recipe?: CreateRecipeDTO
  error?: string
}

interface ParsedIngredient {
  name: string
  amount: number
  unit: string
}

export default defineEventHandler(async (event): Promise<GenerateRecipeResponse> => {
  await rateLimiters.upload(event)

  const body = await readBody(event)
  const { dishName, cuisine, imageUrl, imageBase64, locale } = body

  if (!dishName) {
    return {
      success: false,
      error: 'Dish name is required',
    }
  }

  const claudeApiKey = process.env.ANTHROPIC_API_KEY
  if (!claudeApiKey) {
    return {
      success: false,
      error: 'Claude API key not configured',
    }
  }

  try {
    let imageData: string | undefined
    let mediaType = 'image/jpeg'

    if (imageBase64) {
      imageData = imageBase64
      if (imageBase64.startsWith('data:image/png')) {
        mediaType = 'image/png'
      } else if (imageBase64.startsWith('data:image/webp')) {
        mediaType = 'image/webp'
      }
    } else if (imageUrl) {
      const imageResponse = await fetch(imageUrl)
      if (!imageResponse.ok) {
        console.error('[ai] Failed to fetch image from URL')
      } else {
        const imageBuffer = await imageResponse.arrayBuffer()
        const base64 = Buffer.from(imageBuffer).toString('base64')
        imageData = base64
        const contentType = imageResponse.headers.get('content-type')
        if (contentType) {
          mediaType = contentType
        }
      }
    }

    const language = locale === 'en' ? 'English' : locale === 'ja' ? 'Japanese' : 'Chinese'

    const prompt = `You are an expert recipe creator. Create a detailed recipe for "${dishName}"${cuisine ? ` (${cuisine} cuisine)` : ''}.

Language: ${language}

Return ONLY a valid JSON object with this exact structure (no markdown, no explanation):
{
  "title": "Recipe name in ${language}",
  "description": "Brief description of the dish",
  "category": "main course|soup|salad|dessert|snack|breakfast|drink",
  "cuisine": "${cuisine || 'International'}",
  "servings": 2,
  "prepTimeMinutes": 15,
  "cookTimeMinutes": 30,
  "difficulty": "easy|medium|hard",
  "ingredients": [
    { "name": "ingredient name", "amount": 1, "unit": "unit" }
  ],
  "steps": [
    { "stepNumber": 1, "instruction": "Step instruction" }
  ],
  "tags": ["tag1", "tag2"]
}

Rules:
- Title should be appetizing and accurate
- Category must be one of the valid options
- Prep time and cook time should be realistic (in minutes)
- Include 3-15 ingredients with realistic amounts
- Include 4-12 clear cooking steps
- Difficulty should match the complexity of the dish
- Tags should be helpful for searching (euisine, cooking method, key ingredients)`

    const messages: unknown[] = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: prompt,
          },
        ],
      },
    ]

    // Add image if available
    if (imageData) {
      messages[0].content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: mediaType,
          data: imageData,
        },
      })
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[ai] Claude API error:', response.status, errorText)
      return {
        success: false,
        error: 'Claude API error: ' + response.status,
      }
    }

    const result = await response.json()
    const content = result.content?.[0]?.text

    if (!content) {
      return {
        success: false,
        error: 'No content in Claude response',
      }
    }

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        return {
          success: false,
          error: 'Failed to parse recipe JSON',
        }
      }

      const parsed = JSON.parse(jsonMatch[0])

      // Validate and normalize the recipe
      const recipe: CreateRecipeDTO = {
        title: parsed.title || dishName,
        description: parsed.description || '',
        category: parsed.category || 'main course',
        cuisine: parsed.cuisine || cuisine || 'International',
        servings: Math.max(1, parseInt(parsed.servings) || 2),
        prepTimeMinutes: Math.max(0, parseInt(parsed.prepTimeMinutes) || 0),
        cookTimeMinutes: Math.max(0, parseInt(parsed.cookTimeMinutes) || 0),
        difficulty: ['easy', 'medium', 'hard'].includes(parsed.difficulty) ? parsed.difficulty : 'medium',
        ingredients: (parsed.ingredients || []).map((ing: ParsedIngredient) => ({
          name: ing.name || '',
          amount: parseFloat(ing.amount) || 1,
          unit: ing.unit || 'unit',
        })),
        steps: (parsed.steps || []).map((step: any, index: number) => ({
          stepNumber: step.stepNumber || index + 1,
          instruction: step.instruction || '',
          durationMinutes: step.durationMinutes ? parseInt(step.durationMinutes) : undefined,
          temperature: step.temperature ? parseInt(step.temperature) : undefined,
        })),
        tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      }

      // Validate required fields
      if (!recipe.title || recipe.ingredients.length === 0 || recipe.steps.length === 0) {
        return {
          success: false,
          error: 'Generated recipe is missing required fields',
        }
      }

      return {
        success: true,
        recipe,
      }
    } catch (parseError) {
      console.error('[ai] Failed to parse recipe:', parseError, 'Content:', content)
      return {
        success: false,
        error: 'Failed to parse generated recipe',
      }
    }
  } catch (error) {
    console.error('[ai] Error generating recipe:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
})
