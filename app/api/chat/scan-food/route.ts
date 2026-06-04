import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { imageBase64, mediaType } = body

    if (!imageBase64) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    console.log('API key exists:', !!apiKey)
    console.log('API key prefix:', apiKey?.substring(0, 10))

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
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
                text: `You are a precision nutrition analysis AI. Analyze this food image and return ONLY valid JSON, no extra text:
{
  "foods": [
    {
      "name": "Specific food name",
      "servingSize": 185,
      "servingLabel": "1 breast (~185g)",
      "calories": 305,
      "protein": 57.4,
      "carbs": 0,
      "fats": 6.7,
      "confidence": "high"
    }
  ],
  "description": "Brief description of what you see"
}

Rules:
- Estimate portion size from visual cues like plate size, utensils, packaging
- servingSize in grams
- All macros in grams rounded to 1 decimal
- confidence is "high", "medium", or "low"
- List each food item separately
- If no food return {"foods": [], "description": "No food detected"}
- Sanity check: calories should roughly equal (protein x 4) + (carbs x 4) + (fats x 9)`,
              },
            ],
          },
        ],
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Claude error:', JSON.stringify(data))
      return NextResponse.json({ error: data?.error?.message || 'API error' }, { status: 500 })
    }

    const text = data.content?.[0]?.text || ''
    console.log('Claude response text:', text)
    const cleaned = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(cleaned)

    return NextResponse.json(parsed)
  } catch (err) {
    console.error('Route error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}