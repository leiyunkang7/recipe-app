import { defineEventHandler, readBody } from 'h3'
import { rateLimiters } from '../../utils/rateLimit'

interface IdentifyResponse {
  success: boolean
  dishName?: string
  cuisine?: string
  confidence?: number
  error?: string
}

export default defineEventHandler(async (event): Promise<IdentifyResponse> => {
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
                text: `You are an expert at identifying dishes from food photographs. Analyze the provided image and identify:
1. The name of the dish (in English and Chinese if applicable)
2. The cuisine type (e.g., Italian, Chinese, Japanese, Mexican, etc.)
3. Your confidence level (0-100%)

Return ONLY a JSON object with this structure:
{
  "dishName": "name of the dish",
  "cuisine": "cuisine type",
  "confidence": 85
}

If you cannot identify the dish with reasonable confidence, return:
{
  "dishName": "Unknown",
  "cuisine": "Unknown",
  "confidence": 0
}`,
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
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          success: true,
          dishName: parsed.dishName || 'Unknown',
          cuisine: parsed.cuisine || 'Unknown',
          confidence: parsed.confidence || 0,
        }
      }
    } catch (parseError) {
      console.error('[ai] Failed to parse dish identification:', parseError, 'Content:', content)
    }

    return {
      success: true,
      dishName: 'Unknown',
      cuisine: 'Unknown',
      confidence: 0,
    }
  } catch (error) {
    console.error('[ai] Error identifying dish:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
})
