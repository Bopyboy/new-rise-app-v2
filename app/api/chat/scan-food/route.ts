import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { imageBase64, mediaType } = body

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY ?? '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: `You are a nutrition analysis AI. When given a food image, identify all foods visible and estimate their nutritional content.
      
      ALWAYS respond with ONLY valid JSON in this exact format, no other text:
      {
        "foods": [
          {
            "name": "Food name",
            "servingSize": 100,
            "calories": 250,
            "protein": 12.5,
            "carbs": 30.0,
            "fats": 8.0,
            "confidence": "high"
          }
        ],
        "description": "Brief description of what you see"
      }
      
      Rules:
      - servingSize is in grams (estimate the portion size you see)
      - All macros are in grams
      - confidence is "high", "medium", or "low"
      - If multiple foods are visible, list each separately
      - If you cannot identify any food, return {"foods": [], "description": "No food detected"}
      - Be realistic with portion estimates based on what's visible`,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType || 'image/jpeg',
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: 'Analyze this food image and return the nutrition data as JSON.',
            },
          ],
        },
      ],
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    return new Response(
      JSON.stringify({ error: err?.error?.message || 'API error' }),
      { status: response.status, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const data = await response.json()
  const text = data.content?.[0]?.text || ''

  try {
    const cleaned = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(cleaned)
    return new Response(JSON.stringify(parsed), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch {
    return new Response(
      JSON.stringify({ error: 'Failed to parse food data', raw: text }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}