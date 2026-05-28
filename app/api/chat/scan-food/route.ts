import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { imageBase64, mediaType } = body

    if (!imageBase64) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inline_data: {
                    mime_type: mediaType || 'image/jpeg',
                    data: imageBase64,
                  },
                },
                {
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
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1500,
          },
        }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      console.error('Gemini error:', data)
      return NextResponse.json({ error: data?.error?.message || 'API error' }, { status: 500 })
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    const cleaned = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(cleaned)

    return NextResponse.json(parsed)
  } catch (err) {
    console.error('Route error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}