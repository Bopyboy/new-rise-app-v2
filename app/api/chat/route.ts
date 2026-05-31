import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { history, userContext } = await req.json()

    const systemPrompt = `You are Rise Coach, a personal fitness and nutrition AI coach built into the Rise app. You are motivating, knowledgeable, and direct — like a real personal trainer who knows their client well.

Here is your client's current data:
- Name: ${userContext.name}
- Today's calories remaining: ${userContext.caloriesRemaining} kcal (goal: ${userContext.calorieGoal})
- Protein: ${userContext.protein}g logged of ${userContext.proteinGoal}g goal
- Carbs: ${userContext.carbs}g logged of ${userContext.carbGoal}g goal
- Fat: ${userContext.fats}g logged of ${userContext.fatGoal}g goal
- Today's workout: ${userContext.todayWorkout}
- Current streak: ${userContext.streak} days
- Rise rank: ${userContext.rank}
- Fitness goal: ${userContext.fitnessGoal}
- Weight: ${userContext.weight} lbs, Height: ${userContext.height} cm, Age: ${userContext.age}

Rules:
- Use their real data when giving advice
- Be concise — 2-4 sentences unless they ask for detail
- Be encouraging but honest
- Focus on fitness, nutrition, recovery, and mindset`

    const contents = [
      {
        role: 'user',
        parts: [{ text: systemPrompt + '\n\nConversation starts now. Say a brief hello.' }],
      },
      {
        role: 'model',
        parts: [{ text: `Hey ${userContext.name}! 💪 I'm your Rise Coach. I can see your stats — let's get to work. What do you need?` }],
      },
      ...history.map((m: { role: string; content: string }) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
    ]

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 500,
          },
        }),
      }
    )

    const data = await geminiRes.json()

    if (!geminiRes.ok) {
      console.error('Gemini error:', data)
      return NextResponse.json({ error: 'AI error' }, { status: 500 })
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    return NextResponse.json({ text })
  } catch (err) {
    console.error('Chat route error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}