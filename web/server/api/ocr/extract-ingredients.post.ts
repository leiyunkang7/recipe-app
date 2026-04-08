import { defineEventHandler, readBody } from 'h3'
import { rateLimiters } from '../../utils/rateLimit'

interface ExtractedIngredient {
  name: string
  amount: number | string
  unit: string
}

interface ExtractResponse {
  success: boolean
  ingredients?: ExtractedIngredient[]
  error?: string
  message?: string
}

export default defineEventHandler(async (event): Promise<ExtractResponse> => {
  await rateLimiters.upload(event)

  const body = await readBody(event)
  const { imageUrl, imageBase64 } = body

  if (!imageUrl && !imageBase64) {
    return {
      success: false,
      error: 'Either imageUrl or imageBase64 is required',
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
    let imageData: string
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
        return {
          success: false,
          error: 'Failed to fetch image from URL',
        }
      }
      const imageBuffer = await imageResponse.arrayBuffer()
      const base64 = Buffer.from(imageBuffer).toString('base64')
      imageData = base64
      const contentType = imageResponse.headers.get('content-type')
      if (contentType) {
        mediaType = contentType
      }
    } else {
      return {
        success: false,
        error: 'Invalid image data',
      }
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
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'You are an expert at extracting ingredient lists from recipe screenshots. Analyze the provided image and extract all ingredients listed. For each ingredient, provide: name, amount, unit. Return ONLY a JSON array. If no ingredients found, return empty array.',
              },
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: imageData,
                },
              },
            ],
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[ocr] Claude API error:', response.status, errorText)
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

    let ingredients: ExtractedIngredient[] = []
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        ingredients = JSON.parse(jsonMatch[0])
      } else {
        ingredients = JSON.parse(content)
      }
    } catch (parseError) {
      console.error('[ocr] Failed to parse ingredients:', parseError, 'Content:', content)
      return {
        success: false,
        error: 'Failed to parse extracted ingredients',
      }
    }

    const validIngredients = ingredients
      .filter((ing) => ing.name && ing.name.trim().length > 0)
      .map((ing) => ({
        name: ing.name.trim(),
        amount: ing.amount ?? '',
        unit: ing.unit ?? '',
      }))

    return {
      success: true,
      ingredients: validIngredients,
      message: 'Extracted ' + validIngredients.length + ' ingredients',
    }
  } catch (error) {
    console.error('[ocr] Error extracting ingredients:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
})
