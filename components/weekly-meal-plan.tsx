'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import { useApp } from '@/lib/app-context'
import { generateFitnessPlan } from '@/lib/fitness-plans'
import { DayMealPlan, MealPlanSlot } from '@/lib/fitness-plans'
import { MealEntry } from '@/lib/types'
import {
  Calendar, ChevronDown, ChevronUp, Copy, Sparkles,
  Utensils, X, Loader2, ChefHat, ShoppingBag, Clock,
  Play, Pause, ArrowRight, Check, Timer, ChevronLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type MealKey = 'breakfast' | 'lunch' | 'dinner' | 'snacks'

interface CookStep {
  instruction: string   // plain-english what to do
  detail: string        // extra detail / tip for beginners
  timerSeconds: number  // 0 = no timer
  timerLabel: string    // e.g. "Grill chicken" – shown on the timer ring
}

interface RecipeData {
  ingredients: string[]
  steps: CookStep[]
  prepTime: string
  cookTime: string
}

function slotToEntry(slot: MealPlanSlot, meal: MealKey): MealEntry {
  return {
    id: crypto.randomUUID(),
    foodId: `plan-${meal}-${Date.now()}`,
    name: slot.name,
    servingSize: 1,
    calories: slot.calories,
    protein: slot.protein,
    carbs: slot.carbs,
    fats: slot.fats,
  }
}

// ─── Countdown Timer Ring ─────────────────────────────────────────────────────

function TimerRing({
  totalSeconds,
  secondsLeft,
  running,
  onToggle,
}: {
  totalSeconds: number
  secondsLeft: number
  running: boolean
  onToggle: () => void
}) {
  const radius = 54
  const circ = 2 * Math.PI * radius
  const progress = totalSeconds > 0 ? secondsLeft / totalSeconds : 0
  const offset = circ - progress * circ
  const mins = Math.floor(secondsLeft / 60)
  const secs = secondsLeft % 60

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative h-40 w-40">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 128 128">
          {/* Track */}
          <circle cx="64" cy="64" r={radius} fill="none" stroke="currentColor"
            strokeWidth="8" className="text-secondary" />
          {/* Progress */}
          <circle cx="64" cy="64" r={radius} fill="none"
            stroke={secondsLeft <= 10 ? '#ef4444' : 'oklch(0.78 0.2 132)'}
            strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
          <span className={cn(
            'text-4xl font-black tabular-nums',
            secondsLeft <= 10 ? 'text-red-400' : 'text-foreground'
          )}>
            {mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : secs}
          </span>
          <span className="text-xs text-muted-foreground">{mins > 0 ? 'min' : 'sec'}</span>
        </div>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'flex items-center gap-2 rounded-2xl px-8 py-3 text-sm font-bold transition-all active:scale-[0.97]',
          running
            ? 'bg-secondary text-foreground'
            : 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
        )}
      >
        {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        {running ? 'Pause' : secondsLeft < totalSeconds ? 'Resume' : 'Start Timer'}
      </button>
    </div>
  )
}

// ─── Guided Cook Mode ─────────────────────────────────────────────────────────

function GuidedCookMode({ steps, onDone }: { steps: CookStep[]; onDone: () => void }) {
  const [stepIndex, setStepIndex] = useState(0)
  const [timerSeconds, setTimerSeconds] = useState(steps[0]?.timerSeconds ?? 0)
  const [running, setRunning] = useState(false)
  const [finished, setFinished] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const step = steps[stepIndex]
  const isLast = stepIndex === steps.length - 1
  const hasTimer = step.timerSeconds > 0

  // Reset timer when step changes
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setTimerSeconds(step.timerSeconds)
    setRunning(false)
    setFinished(false)
  }, [stepIndex, step.timerSeconds])

  // Countdown
  useEffect(() => {
    if (running && timerSeconds > 0) {
      intervalRef.current = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!)
            setRunning(false)
            setFinished(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else if (!running && intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running])

  const goNext = () => {
    if (isLast) { onDone(); return }
    setStepIndex(i => i + 1)
  }

  const canGoNext = !hasTimer || finished || timerSeconds === 0

  return (
    <div className="flex flex-col min-h-0 flex-1">
      {/* Step progress dots */}
      <div className="flex items-center justify-center gap-1.5 py-4">
        {steps.map((_, i) => (
          <div key={i} className={cn(
            'rounded-full transition-all',
            i === stepIndex ? 'h-2 w-6 bg-primary' : i < stepIndex ? 'h-2 w-2 bg-primary/40' : 'h-2 w-2 bg-secondary'
          )} />
        ))}
      </div>

      {/* Step number badge */}
      <div className="px-5">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-black text-primary-foreground">
            {stepIndex + 1}
          </span>
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Step {stepIndex + 1} of {steps.length}
          </span>
        </div>
      </div>

      {/* Main instruction */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        <h2 className="text-2xl font-black leading-snug text-foreground">
          {step.instruction}
        </h2>

        {/* Beginner tip */}
        {step.detail && (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-primary mb-1">💡 How to do it</p>
            <p className="text-sm leading-relaxed text-foreground">{step.detail}</p>
          </div>
        )}

        {/* Timer */}
        {hasTimer && (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-1.5 mb-2">
              <Timer className="h-4 w-4 text-primary" />
              <p className="text-xs font-bold uppercase tracking-wider text-primary">{step.timerLabel}</p>
            </div>
            <TimerRing
              totalSeconds={step.timerSeconds}
              secondsLeft={timerSeconds}
              running={running}
              onToggle={() => setRunning(r => !r)}
            />
            {finished && (
              <div className="mt-2 flex items-center gap-2 rounded-xl bg-green-500/10 px-4 py-2.5">
                <Check className="h-4 w-4 text-green-500" />
                <p className="text-sm font-bold text-green-500">Time's up! Ready for next step.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Next button */}
      <div className="border-t border-border p-5 pb-8 shrink-0">
        {hasTimer && !canGoNext ? (
          <div className="rounded-2xl bg-secondary py-4 text-center">
            <p className="text-sm font-semibold text-muted-foreground">
              ⏳ Start the timer above, then tap Next when it finishes
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={goNext}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-base font-black text-primary-foreground shadow-lg shadow-primary/30 transition-all active:scale-[0.98]"
          >
            {isLast ? (
              <><Check className="h-5 w-5" /> Done! Meal Complete 🎉</>
            ) : (
              <>Next Step <ArrowRight className="h-5 w-5" /></>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Recipe Modal ─────────────────────────────────────────────────────────────

function RecipeModal({ slot, onClose, onLog }: {
  slot: MealPlanSlot
  onClose: () => void
  onLog: () => void
}) {
  const [recipe, setRecipe] = useState<RecipeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<'overview' | 'cook'>('overview')
  const [logged, setLogged] = useState(false)

  useMemo(() => {
    const fetchRecipe = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            history: [{
              role: 'user',
              content: `Create a beginner-friendly step-by-step recipe for: "${slot.name}" (${slot.calories} cal, ${slot.protein}g protein, ${slot.carbs}g carbs, ${slot.fats}g fat).

Respond ONLY with a JSON object, no markdown, no extra text. Use this exact format:
{
  "ingredients": ["250g chicken breast", "2 cups white rice", "..."],
  "prepTime": "10 min",
  "cookTime": "20 min",
  "steps": [
    {
      "instruction": "Season the chicken",
      "detail": "Pat your chicken dry with paper towels. Sprinkle both sides with salt, pepper, and garlic powder. Press the seasoning in with your hands so it sticks.",
      "timerSeconds": 0,
      "timerLabel": ""
    },
    {
      "instruction": "Grill the chicken for 6 minutes",
      "detail": "Place chicken on the hot grill or pan. Don't move it — let it sit so it gets a good sear. You'll know it's ready to flip when it lifts off easily.",
      "timerSeconds": 360,
      "timerLabel": "Grill first side"
    },
    {
      "instruction": "Flip and cook other side for 5 minutes",
      "detail": "Flip the chicken once using tongs. Cook until the internal temp reaches 165°F or the juices run clear when you cut into it.",
      "timerSeconds": 300,
      "timerLabel": "Grill second side"
    }
  ]
}

Rules:
- 6-10 ingredients with exact quantities
- 5-8 steps
- timerSeconds = 0 for steps with no waiting (chopping, seasoning, plating)
- For any step that involves waiting (boiling, grilling, baking, simmering, resting) set a realistic timerSeconds
- Each "detail" should be very beginner-friendly — assume they have never cooked before
CRITICAL RULES — read carefully before writing a single step:\n- Think hard about what this food actually is before writing any steps.\n- NO-COOK foods (yogurt, cottage cheese, fresh fruit, berries, smoothies, protein shakes, overnight oats, salads, deli meats, hummus, nut butters, granola bowls, cereal) must NEVER have steps like "heat a pan", "add oil", "turn on stove", or any cooking step. These are assemble-and-eat foods — steps should only be measuring, layering, mixing, or topping.\n- COLD-PREP foods (overnight oats, chia pudding, smoothies) use fridge time or blending — no heat at all.\n- Only add heat/cooking steps when the food genuinely requires it (eggs, meat, fish, cooked grains, cooked vegetables, oatmeal on stove).\n- Match the method to the food: yogurt parfait = layer in a bowl. Smoothie = blend. Oatmeal = microwave or stovetop. Grilled chicken = grill or pan. Never add a pan or oil to a no-cook food.\n- 6-10 ingredients with exact quantities\n- 4-8 steps total\n- timerSeconds = 0 for steps with no waiting (chopping, seasoning, assembling, plating)\n- For steps that genuinely involve waiting (boiling, grilling, baking, simmering, microwaving) set a realistic timerSeconds\n- Each "detail" should be very beginner-friendly — assume they have never made this before\n- Keep instructions short (5-8 words), put all detail in "detail" field`,
            }],
            userContext: {
              name: 'User', caloriesRemaining: 500, calorieGoal: 2000, protein: 0, proteinGoal: 150,
              carbs: 0, carbGoal: 200, fats: 0, fatGoal: 65, todayWorkout: '', streak: 0,
              rank: '', fitnessGoal: 'build_muscle', weight: 75, height: 175, age: 25,
            },
          }),
        })
        const data = await res.json()
        const text: string = data.text ?? ''
        const clean = text.replace(/```json|```/g, '').trim()
        const parsed: RecipeData = JSON.parse(clean)
        setRecipe(parsed)
      } catch {
        // Smart fallback — detect no-cook foods and avoid suggesting heat/pan
        const nameLower = slot.name.toLowerCase()
        const isNoCook = /shake|smoothie|yogurt|parfait|berry|berries|fruit|banana|oats|overnight|chia|pudding|cereal|granola|bar |protein bar|salad|sandwich|wrap|hummus|cottage cheese|deli|cold brew|juice|bowl/.test(nameLower)

        if (isNoCook) {
          setRecipe({
            ingredients: [
              `1 scoop protein powder (if using)`,
              `1 cup base liquid (milk, almond milk, or water)`,
              `1 banana or fruit of choice`,
              `½ cup yogurt or oats (optional)`,
              `Ice cubes (optional)`,
            ],
            prepTime: '5 min',
            cookTime: '0 min',
            steps: [
              { instruction: 'Gather all ingredients', detail: 'Get everything out and measured before you start. No cooking needed for this one — just assembling.', timerSeconds: 0, timerLabel: '' },
              { instruction: 'Add ingredients to blender or bowl', detail: 'For a shake or smoothie: add liquid first, then fruit, then protein powder. For a bowl or parfait: layer ingredients in a bowl or glass.', timerSeconds: 0, timerLabel: '' },
              { instruction: 'Blend or mix', detail: 'For shakes/smoothies: blend on high for 30–60 seconds until smooth. For bowls: stir or layer — no blending needed.', timerSeconds: 45, timerLabel: 'Blend' },
              { instruction: 'Serve immediately', detail: 'Pour into a glass or bowl. Add any toppings like granola, nuts, or extra fruit. Best enjoyed fresh.', timerSeconds: 0, timerLabel: '' },
            ],
          })
        } else {
          setRecipe({
            ingredients: [
              `Main ingredient for ${slot.name}`,
              '1 tbsp olive oil',
              'Salt and pepper to taste',
              'Garlic powder or seasoning of choice',
              'Fresh herbs for garnish',
            ],
            prepTime: '10 min',
            cookTime: '20 min',
            steps: [
              { instruction: 'Gather and prep ingredients', detail: 'Read through everything first. Wash and chop any vegetables, measure your ingredients, and have everything ready before you start.', timerSeconds: 0, timerLabel: '' },
              { instruction: 'Season the main ingredient', detail: 'Pat any protein dry with paper towels. Season all sides with salt, pepper, and any spices. Press in so it sticks.', timerSeconds: 0, timerLabel: '' },
              { instruction: 'Heat pan to medium-high', detail: 'Add oil to the pan and set to medium-high heat. Wait until the oil shimmers before adding food — about 1–2 minutes.', timerSeconds: 90, timerLabel: 'Heat pan' },
              { instruction: 'Cook until done', detail: 'Add your main ingredient to the pan. Don\'t move it — let it sit to get a good sear. Flip halfway through and cook until done.', timerSeconds: 480, timerLabel: 'Cook' },
              { instruction: 'Plate and serve', detail: 'Transfer to a plate. Add any garnishes. Let it rest for 1–2 minutes before eating so the juices settle.', timerSeconds: 0, timerLabel: '' },
            ],
          })
        }
      }
      setLoading(false)
    }
    fetchRecipe()
  }, [slot.name])

  const handleLog = () => {
    onLog()
    setLogged(true)
    setTimeout(onClose, 1400)
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3 shrink-0">
        <div className="flex items-center gap-2">
          {mode === 'cook' ? (
            <button
              type="button"
              onClick={() => setMode('overview')}
              className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-secondary"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
              <ChefHat className="h-4 w-4 text-primary" />
            </div>
          )}
          <div>
            <h2 className="font-bold text-foreground leading-none">
              {mode === 'cook' ? 'Cooking Mode' : 'Recipe'}
            </h2>
            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{slot.name}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-secondary"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Building your recipe…</p>
        </div>
      )}

      {/* Cook mode */}
      {!loading && recipe && mode === 'cook' && (
        <GuidedCookMode
          steps={recipe.steps}
          onDone={() => { handleLog(); setMode('overview') }}
        />
      )}

      {/* Overview mode */}
      {!loading && recipe && mode === 'overview' && (
        <>
          <div className="flex-1 overflow-y-auto">
            {/* Hero */}
            <div className="border-b border-border bg-gradient-to-br from-primary/10 via-card to-card p-5">
              <h1 className="text-xl font-black text-foreground">{slot.name}</h1>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-secondary px-2.5 py-1 font-semibold">{slot.calories} kcal</span>
                <span className="rounded-full bg-green-500/10 px-2.5 py-1 font-semibold text-green-500">{slot.protein}g protein</span>
                <span className="rounded-full bg-amber-500/10 px-2.5 py-1 font-semibold text-amber-500">{slot.carbs}g carbs</span>
                <span className="rounded-full bg-rose-500/10 px-2.5 py-1 font-semibold text-rose-500">{slot.fats}g fat</span>
              </div>
              <div className="mt-3 flex gap-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />Prep: {recipe.prepTime}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Timer className="h-3.5 w-3.5" />Cook: {recipe.cookTime}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ChefHat className="h-3.5 w-3.5" />{recipe.steps.length} steps
                </div>
              </div>
            </div>

            <div className="space-y-6 p-5">
              {/* Ingredients */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <ShoppingBag className="h-4 w-4 text-primary" />
                  <h3 className="font-bold text-foreground">Ingredients</h3>
                </div>
                <div className="space-y-2">
                  {recipe.ingredients.map((ing, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-xl bg-secondary/40 px-3 py-2.5">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                        {i + 1}
                      </span>
                      <p className="text-sm text-foreground">{ing}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Steps overview */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <ChefHat className="h-4 w-4 text-primary" />
                  <h3 className="font-bold text-foreground">Steps overview</h3>
                  <span className="ml-auto text-xs text-muted-foreground">{recipe.steps.length} steps</span>
                </div>
                <div className="space-y-2">
                  {recipe.steps.map((step, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-xl bg-secondary/40 px-3 py-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground mt-0.5">
                        {i + 1}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">{step.instruction}</p>
                        {step.timerSeconds > 0 && (
                          <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium text-primary">
                            <Timer className="h-3 w-3" />
                            {step.timerSeconds >= 60
                              ? `${Math.floor(step.timerSeconds / 60)}:${(step.timerSeconds % 60).toString().padStart(2, '0')} min timer`
                              : `${step.timerSeconds}s timer`}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom buttons */}
          <div className="shrink-0 space-y-2 border-t border-border p-4">
            <button
              type="button"
              onClick={() => setMode('cook')}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-base font-black text-primary-foreground shadow-lg shadow-primary/30 active:scale-[0.98]"
            >
              <Play className="h-5 w-5" />
              Start Cooking — Step by Step
            </button>
            <button
              type="button"
              onClick={handleLog}
              className={cn(
                'flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold transition-all',
                logged
                  ? 'bg-green-500/20 text-green-500'
                  : 'bg-secondary text-foreground active:scale-[0.98]'
              )}
            >
              <Copy className="h-4 w-4" />
              {logged ? '✓ Logged to diary' : 'Just log it to diary'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ─── WeeklyMealPlan (unchanged structure) ────────────────────────────────────

export function WeeklyMealPlan() {
  const { settings, bodyPRs, workoutSplit, addMealEntry, getTodayTotals } = useApp()
  const [expandedDay, setExpandedDay] = useState<string | null>(null)
  const [appliedToast, setAppliedToast] = useState<string | null>(null)
  const [recipeModal, setRecipeModal] = useState<{ slot: MealPlanSlot; meal: MealKey } | null>(null)

  const plan = useMemo(
    () => generateFitnessPlan(
      settings.weight, settings.height, settings.age, settings.gender,
      settings.fitnessGoal, bodyPRs, workoutSplit
    ),
    [settings, bodyPRs, workoutSplit]
  )

  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' })
  const todayPlan = plan.weeklyMeals.find(d => d.day === todayName) ?? plan.weeklyMeals[0]
  const totals = getTodayTotals()

  const showToast = (msg: string) => {
    setAppliedToast(msg)
    setTimeout(() => setAppliedToast(null), 2800)
  }

  const applyDay = (day: DayMealPlan, onlyToday = false) => {
    const meals: MealKey[] = ['breakfast', 'lunch', 'dinner', 'snacks']
    meals.forEach(meal => addMealEntry(meal, slotToEntry(day[meal], meal)))
    showToast(onlyToday ? "Today's plan added to your diary" : `${day.day} plan added to diary`)
  }

  return (
    <div className="space-y-4">
      {appliedToast && (
        <div className="rounded-2xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm font-medium text-primary">
          {appliedToast}
        </div>
      )}

      {/* AI header */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/15 via-card to-card p-5">
        <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-primary/20 blur-2xl" />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="text-xs font-bold uppercase tracking-wider text-primary">AI meal plan</p>
            </div>
            <h2 className="mt-1 text-lg font-bold text-foreground">Your weekly nutrition</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Built for {settings.fitnessGoal.replace('_', ' ')} · {plan.macros.calorieGoal} kcal ·{' '}
              {plan.macros.proteinGoal}g protein / day
            </p>
          </div>
          <div className="rounded-xl bg-card/80 px-3 py-2 text-center backdrop-blur">
            <p className="text-lg font-bold text-foreground">{totals.calories}</p>
            <p className="text-[10px] text-muted-foreground">logged today</p>
          </div>
        </div>
        <div className="relative mt-4 grid grid-cols-4 gap-2">
          {[
            { label: 'Cal', value: plan.macros.calorieGoal },
            { label: 'Protein', value: `${plan.macros.proteinGoal}g` },
            { label: 'Carbs', value: `${plan.macros.carbGoal}g` },
            { label: 'Fat', value: `${plan.macros.fatGoal}g` },
          ].map(m => (
            <div key={m.label} className="rounded-xl bg-background/50 py-2 text-center">
              <p className="text-sm font-bold text-foreground">{m.value}</p>
              <p className="text-[10px] text-muted-foreground">{m.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Today */}
      <div className="rounded-2xl border-2 border-primary/40 bg-card p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-medium text-primary">Today · {todayName}</p>
            <p className="font-semibold text-foreground">{todayPlan.totals.calories} kcal planned</p>
          </div>
          <button type="button" onClick={() => applyDay(todayPlan, true)}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 active:scale-[0.98]">
            <Copy className="h-4 w-4" />Log today
          </button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {(['breakfast', 'lunch', 'dinner', 'snacks'] as MealKey[]).map(meal => (
            <button key={meal} type="button"
              onClick={() => setRecipeModal({ slot: todayPlan[meal], meal })}
              className="rounded-xl bg-secondary/50 p-2.5 text-left transition-colors hover:bg-secondary active:scale-[0.98]">
              <p className="text-xs font-semibold capitalize text-muted-foreground">{meal}</p>
              <p className="mt-0.5 line-clamp-2 text-xs font-medium text-foreground">{todayPlan[meal].name}</p>
              <div className="mt-1.5 flex items-center justify-between">
                <p className="text-xs font-bold text-primary">{todayPlan[meal].calories} kcal</p>
                <p className="text-[10px] text-muted-foreground">Tap for recipe →</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Full week */}
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-semibold text-foreground">Full week</h3>
      </div>

      <div className="space-y-2">
        {plan.weeklyMeals.map(day => {
          const isToday = day.day === todayName
          const isOpen = expandedDay === day.day
          return (
            <div key={day.day} className={cn(
              'overflow-hidden rounded-2xl border bg-card',
              isToday ? 'border-primary/50' : 'border-border'
            )}>
              <button type="button" className="flex w-full items-center justify-between p-4 text-left"
                onClick={() => setExpandedDay(isOpen ? null : day.day)}>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold',
                    isToday ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'
                  )}>
                    {day.day.slice(0, 3)}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {day.day}{isToday && <span className="ml-2 text-xs font-medium text-primary">Today</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">{day.totals.calories} kcal · {day.totals.protein}g protein</p>
                  </div>
                </div>
                {isOpen ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
              </button>
              {isOpen && (
                <div className="space-y-2 border-t border-border px-4 pb-4 pt-2">
                  {(['breakfast', 'lunch', 'dinner', 'snacks'] as MealKey[]).map(meal => (
                    <MealPlanRow key={meal} label={meal} slot={day[meal]}
                      onTapRecipe={() => setRecipeModal({ slot: day[meal], meal })} />
                  ))}
                  <button type="button" onClick={() => applyDay(day)}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-medium text-foreground hover:bg-secondary">
                    <Utensils className="h-4 w-4" />Add {day.day}&apos;s meals to diary
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {recipeModal && (
        <RecipeModal
          slot={recipeModal.slot}
          onClose={() => setRecipeModal(null)}
          onLog={() => {
            addMealEntry(recipeModal.meal, slotToEntry(recipeModal.slot, recipeModal.meal))
            showToast(`${recipeModal.slot.name} logged to diary`)
          }}
        />
      )}
    </div>
  )
}

function MealPlanRow({ label, slot, onTapRecipe }: {
  label: string; slot: MealPlanSlot; onTapRecipe: () => void
}) {
  return (
    <button type="button" onClick={onTapRecipe}
      className="w-full rounded-xl bg-secondary/40 px-3 py-2.5 text-left transition-colors hover:bg-secondary active:scale-[0.98]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
          <p className="text-sm font-medium text-foreground">{slot.name}</p>
        </div>
        <div className="shrink-0 text-right text-xs">
          <p className="font-semibold text-foreground">{slot.calories} kcal</p>
          <p className="text-muted-foreground">{slot.protein}g P · {slot.carbs}g C · {slot.fats}g F</p>
        </div>
      </div>
      <p className="mt-1 text-[10px] text-primary">Tap for recipe & cook mode →</p>
    </button>
  )
}