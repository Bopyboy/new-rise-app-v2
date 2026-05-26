'use client'

import { useMemo, useState } from 'react'
import { useApp } from '@/lib/app-context'
import { generateFitnessPlan } from '@/lib/fitness-plans'
import { DayMealPlan, MealPlanSlot } from '@/lib/fitness-plans'
import { MealEntry } from '@/lib/types'
import { Calendar, ChevronDown, ChevronUp, Copy, Sparkles, Utensils } from 'lucide-react'
import { cn } from '@/lib/utils'

type MealKey = 'breakfast' | 'lunch' | 'dinner' | 'snacks'

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

export function WeeklyMealPlan() {
  const { settings, bodyPRs, workoutSplit, addMealEntry, getTodayTotals } = useApp()
  const [expandedDay, setExpandedDay] = useState<string | null>(null)
  const [appliedToast, setAppliedToast] = useState<string | null>(null)

  const plan = useMemo(
    () =>
      generateFitnessPlan(
        settings.weight,
        settings.height,
        settings.age,
        settings.gender,
        settings.fitnessGoal,
        bodyPRs,
        workoutSplit
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
    meals.forEach(meal => {
      const slot = day[meal]
      addMealEntry(meal, slotToEntry(slot, meal))
    })
    showToast(onlyToday ? "Today's plan added to your diary" : `${day.day} plan added to diary`)
  }

  return (
    <div className="space-y-4">
      {appliedToast && (
        <div className="rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm font-medium text-primary">
          {appliedToast}
        </div>
      )}

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
            <div key={m.label} className="rounded-lg bg-background/50 py-2 text-center">
              <p className="text-sm font-bold text-foreground">{m.value}</p>
              <p className="text-[10px] text-muted-foreground">{m.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border-2 border-primary/40 bg-card p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-medium text-primary">Today · {todayName}</p>
            <p className="font-semibold text-foreground">{todayPlan.totals.calories} kcal planned</p>
          </div>
          <button
            type="button"
            onClick={() => applyDay(todayPlan, true)}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 active:scale-[0.98]"
          >
            <Copy className="h-4 w-4" />
            Log today
          </button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          {(['breakfast', 'lunch', 'dinner', 'snacks'] as MealKey[]).map(meal => (
            <div key={meal} className="rounded-lg bg-secondary/50 p-2.5">
              <p className="font-medium capitalize text-foreground">{meal}</p>
              <p className="mt-0.5 line-clamp-2 text-muted-foreground">{todayPlan[meal].name}</p>
              <p className="mt-1 text-primary">{todayPlan[meal].calories} kcal</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-semibold text-foreground">Full week</h3>
      </div>

      <div className="space-y-2">
        {plan.weeklyMeals.map(day => {
          const isToday = day.day === todayName
          const isOpen = expandedDay === day.day

          return (
            <div
              key={day.day}
              className={cn(
                'overflow-hidden rounded-2xl border bg-card transition-colors',
                isToday ? 'border-primary/50' : 'border-border'
              )}
            >
              <button
                type="button"
                className="flex w-full items-center justify-between p-4 text-left"
                onClick={() => setExpandedDay(isOpen ? null : day.day)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold',
                      isToday ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'
                    )}
                  >
                    {day.day.slice(0, 3)}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {day.day}
                      {isToday && (
                        <span className="ml-2 text-xs font-medium text-primary">Today</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {day.totals.calories} kcal · {day.totals.protein}g protein
                    </p>
                  </div>
                </div>
                {isOpen ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </button>

              {isOpen && (
                <div className="space-y-2 border-t border-border px-4 pb-4 pt-2">
                  {(['breakfast', 'lunch', 'dinner', 'snacks'] as MealKey[]).map(meal => (
                    <MealPlanRow key={meal} label={meal} slot={day[meal]} />
                  ))}
                  <button
                    type="button"
                    onClick={() => applyDay(day)}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-medium text-foreground hover:bg-secondary"
                  >
                    <Utensils className="h-4 w-4" />
                    Add {day.day}&apos;s meals to diary
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function MealPlanRow({ label, slot }: { label: string; slot: MealPlanSlot }) {
  return (
    <div className="rounded-xl bg-secondary/40 px-3 py-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
          <p className="text-sm font-medium text-foreground">{slot.name}</p>
        </div>
        <div className="shrink-0 text-right text-xs">
          <p className="font-semibold text-foreground">{slot.calories} kcal</p>
          <p className="text-muted-foreground">
            {slot.protein}g P · {slot.carbs}g C · {slot.fats}g F
          </p>
        </div>
      </div>
    </div>
  )
}
