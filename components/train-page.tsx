'use client'

import { useMemo, useState } from 'react'
import { useApp } from '@/lib/app-context'
import { generateFitnessPlan } from '@/lib/fitness-plans'
import { WorkoutPage } from '@/components/workout-page'
import { BodyChartPage } from '@/components/body-chart-page'
import { Dumbbell, Activity, Sparkles, CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'

type TrainSection = 'plan' | 'workouts' | 'body'

export function TrainPage({ onTabChange }: { onTabChange?: (tab: string) => void }) {
  const { settings, bodyPRs, workoutSplit } = useApp()
  const [section, setSection] = useState<TrainSection>('plan')

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

  const tabs: { id: TrainSection; label: string; icon: typeof Sparkles }[] = [
    { id: 'plan', label: 'My Plan', icon: Sparkles },
    { id: 'workouts', label: 'Workouts', icon: Dumbbell },
    { id: 'body', label: 'Body', icon: Activity },
  ]

  return (
    <div className="space-y-4 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Train</h1>
        <p className="text-sm text-muted-foreground">Workouts & strength built around your PRs</p>
      </div>

      <div className="flex gap-2 rounded-2xl bg-secondary/60 p-1">
        {tabs.map(t => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setSection(t.id)}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition-colors',
                section === t.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          )
        })}
      </div>

      {section === 'plan' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase text-primary">Your level</p>
                <p className="text-lg font-bold text-foreground">{plan.trainingLevel}</p>
                <p className="text-sm text-muted-foreground">{plan.splitType}</p>
              </div>
              <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold capitalize text-primary">
                {settings.fitnessGoal.replace('_', ' ')}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onTabChange?.('food')}
            className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/40"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15">
              <CalendarDays className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">Weekly meal plan</p>
              <p className="text-sm text-muted-foreground">
                {plan.macros.calorieGoal} kcal · {plan.macros.proteinGoal}g protein — now on Food tab
              </p>
            </div>
            <span className="text-sm font-medium text-primary">Open →</span>
          </button>

          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <Dumbbell className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-foreground">Custom workout split</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{plan.workoutNote}</p>
            <div className="mt-3 space-y-3">
              {plan.workoutDays.map(day => (
                <div key={day.day} className="rounded-xl bg-secondary/40 p-3">
                  <p className="font-semibold text-foreground">
                    {day.day} — {day.name}
                  </p>
                  <ul className="mt-2 space-y-1">
                    {day.exercises.map((ex, i) => (
                      <li key={i} className="text-sm text-muted-foreground">
                        {ex.name} · {ex.sets}×{ex.reps}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setSection('workouts')}
              className="mt-3 w-full rounded-xl border border-border py-2.5 text-sm font-medium"
            >
              Edit weekly workouts
            </button>
          </div>
        </div>
      )}

      {section === 'workouts' && <WorkoutPage embedded />}
      {section === 'body' && <BodyChartPage />}
    </div>
  )
}
