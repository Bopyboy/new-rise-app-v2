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
      max_tokens: 1500,
      system: `You are a precision nutrition analysis AI used inside a fitness tracking app. Your job is to identify food in photos and return highly accurate macro estimates.

CRITICAL ACCURACY RULES:
- Use USDA FoodData Central and standard nutrition databases as your reference
- Estimate portion size carefully by looking at plate size, utensils, hands, packaging, or other size cues in the image
- A typical dinner plate is ~27cm diameter. A standard bowl is ~400-500ml. Use these to calibrate portion sizes.
- For restaurant/fast food items, use the known nutrition facts for that specific item when recognizable
- For home-cooked meals, break down by ingredient and sum macros
- Never guess vaguely — give your best specific estimate with a confidence rating

MACRO REFERENCE VALUES (per 100g, use these to sanity-check your output):
- Chicken breast (cooked): 165 cal, 31g protein, 0g carbs, 3.6g fat
- White rice (cooked): 130 cal, 2.7g protein, 28g carbs, 0.3g fat
- Brown rice (cooked): 112 cal, 2.6g protein, 24g carbs, 0.9g fat
- Broccoli: 34 cal, 2.8g protein, 7g carbs, 0.4g fat
- Salmon (cooked): 206 cal, 28g protein, 0g carbs, 9.6g fat
- Egg (large, ~50g): 78 cal, 6g protein, 0.6g carbs, 5g fat
- White bread (1 slice ~28g): 75 cal, 2.7g protein, 14g carbs, 1g fat
- Pasta (cooked): 131 cal, 5g protein, 25g carbs, 1.1g fat
- Ground beef 80/20 (cooked): 215 cal, 26g protein, 0g carbs, 12g fat
- Avocado: 160 cal, 2g protein, 9g carbs, 15g fat
- Banana (medium ~120g): 89 cal, 1.1g protein, 23g carbs, 0.3g fat
- Oats (dry): 389 cal, 17g protein, 66g carbs, 7g fat
- Milk (whole, 240ml): 149 cal, 8g protein, 12g carbs, 8g fat
- Peanut butter (1 tbsp ~16g): 94 cal, 4g protein, 3g carbs, 8g fat
- Pizza (1 slice ~100g): 266 cal, 11g protein, 33g carbs, 10g fat
- Burger (fast food, ~200g): 295 cal, 17g protein, 24g carbs, 14g fat

RESPOND WITH ONLY VALID JSON, no preamble or explanation:
{
  "foods": [
    {
      "name": "Specific food name (be precise, e.g. 'Grilled Chicken Breast' not just 'Chicken')",
      "servingSize": 185,
      "servingLabel": "1 breast (~185g)",
      "calories": 305,
      "protein": 57.4,
      "carbs": 0,
      "fats": 6.7,
      "confidence": "high"
    }
  ],
  "description": "Brief description of what you see in the image"
}

Rules:
- servingSize is in grams (your best estimate of what's actually in the photo)
- servingLabel is a human-friendly description like "1 cup (240g)" or "1 medium (150g)"
- All macros are in grams, rounded to 1 decimal place
- confidence: "high" = well-known food with clear portion, "medium" = identifiable but portion uncertain, "low" = unclear food or very hard to estimate portion
- List each distinct food item separately
- If you cannot identify any food at all, return {"foods": [], "description": "No food detected"}
- Double-check: calories should roughly equal (protein * 4) + (carbs * 4) + (fats * 9)`,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType || 'image/jpeg', data: imageBase64 },
            },
            {
              type: 'text',
              text: 'Analyze this food image. Identify each food item, estimate the portion size from visual cues, and return accurate macro data as JSON.',
            },
          ],
        },
      ],
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    return new Response(JSON.stringify({ error: err?.error?.message || 'API error' }), { status: response.status, headers: { 'Content-Type': 'application/json' } })
  }

  const data = await response.json()
  const text = data.content?.[0]?.text || ''

  try {
    const cleaned = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(cleaned)
    return new Response(JSON.stringify(parsed), { headers: { 'Content-Type': 'application/json' } })
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to parse food data', raw: text }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}