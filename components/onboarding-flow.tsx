'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from 'next-themes'
import { ChevronRight, User, Scale, Ruler, Target, Moon, Sun, Dumbbell, ChevronLeft } from 'lucide-react'
import { useApp } from '@/lib/app-context'
import { FitnessGoal, Gender } from '@/lib/types'
import { ONBOARDING_PR_GROUPS } from '@/lib/performance-rank'
import { cn } from '@/lib/utils'

const GOALS: { id: FitnessGoal; label: string; desc: string }[] = [
  { id: 'lose_fat', label: 'Lose fat', desc: 'Calorie deficit + high protein' },
  { id: 'maintain', label: 'Maintain', desc: 'Stay lean and strong' },
  { id: 'build_muscle', label: 'Build muscle', desc: 'Surplus + progressive overload' },
]

const TOTAL_STEPS = 6

export function OnboardingFlow() {
  const { completeOnboarding } = useApp()
  const { setTheme } = useTheme()
  const [step, setStep] = useState(0)
  const [themeChoice, setThemeChoice] = useState<'dark' | 'light'>('dark')
  const [name, setName] = useState('')
  const [gender, setGender] = useState<Gender>('male')
  const [age, setAge] = useState('')
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [goal, setGoal] = useState<FitnessGoal>('build_muscle')
  const [benchWeight, setBenchWeight] = useState('')
  const [benchReps, setBenchReps] = useState('')
  const [curlWeight, setCurlWeight] = useState('')
  const [curlReps, setCurlReps] = useState('')
  const [squatWeight, setSquatWeight] = useState('')
  const [squatReps, setSquatReps] = useState('')
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric')
  const [heightFeet, setHeightFeet] = useState('')
  const [heightInches, setHeightInches] = useState('')

  // Calculate estimated 1RM using Epley formula: 1RM = weight × (1 + reps/30)
  const calculate1RM = (weight: string, reps: string): number => {
    const w = parseFloat(weight)
    const r = parseInt(reps)
    if (!w || w <= 0 || !r || r <= 0) return 0
    if (r === 1) return Math.round(w)
    return Math.round(w * (1 + r / 30))
  }

  const bench1RM = calculate1RM(benchWeight, benchReps)
  const curl1RM = calculate1RM(curlWeight, curlReps)
  const squat1RM = calculate1RM(squatWeight, squatReps)

  const getHeightValue = (): number => {
    if (unitSystem === 'metric') {
      return parseFloat(height) || 0
    }
    const feet = parseInt(heightFeet) || 0
    const inches = parseInt(heightInches) || 0
    return (feet * 12 + inches) * 2.54 // Convert to cm
  }

  const canNext =
    step === 0
      ? true
      : step === 1
        ? name.trim().length >= 1
        : step === 2
          ? gender
          : step === 3
            ? true
            : step === 4
              ? parseInt(age) >= 13 &&
                parseInt(age) <= 80 &&
                parseFloat(weight) > 20 &&
                (unitSystem === 'metric' 
                  ? parseFloat(height) > 100 
                  : (parseInt(heightFeet) >= 3 && parseInt(heightFeet) <= 8))
              : step === 5
                ? bench1RM > 0 && curl1RM > 0 && squat1RM > 0
                : true

  const applyTheme = (t: 'dark' | 'light') => {
    setThemeChoice(t)
    setTheme(t)
  }

  const convertToMetric = (val: number, type: 'weight' | 'height'): number => {
    if (unitSystem === 'metric') return val
    if (type === 'weight') return val / 2.205 // lbs to kg
    if (type === 'height') return val * 2.54 // inches to cm
    return val
  }

  const finish = () => {
    const weightKg = convertToMetric(parseFloat(weight), 'weight')
    const heightCm = getHeightValue()
    
    completeOnboarding(
      {
        name: name.trim(),
        age: parseInt(age),
        weight: weightKg,
        height: heightCm,
        gender,
        fitnessGoal: goal,
      },
      {
        chest: { [ONBOARDING_PR_GROUPS.chest.id]: bench1RM },
        arms: { [ONBOARDING_PR_GROUPS.arms.id]: curl1RM },
        legs: { [ONBOARDING_PR_GROUPS.legs.id]: squat1RM },
      }
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background px-4 pb-8 pt-10">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8">
          {step === 0 ? (
            <>
              <h1 className="text-4xl font-bold text-foreground">Welcome to Rise</h1>
              <p className="mt-3 text-base text-muted-foreground">
                Get ranked on your real lifts. Track your nutrition, custom workouts, and rise up the ranks.
              </p>
            </>
          ) : (
            <>
              <p className="text-xs font-bold uppercase tracking-wider text-primary">Setup</p>
              <h1 className="mt-1 text-2xl font-bold text-foreground">Let&apos;s get started</h1>
            </>
          )}
          <div className="mt-6 flex gap-1">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className={cn('h-1 flex-1 rounded-full', i <= step ? 'bg-primary' : 'bg-secondary')}
              />
            ))}
          </div>
        </div>

        <motion.div key={step} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}>
          {step === 0 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 px-6 py-8 text-center">
                  <Dumbbell className="mx-auto h-12 w-12 text-primary" />
                  <h2 className="mt-4 text-xl font-bold text-foreground">Rise to the top</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Your rank is calculated from real lifts, not random metrics.
                  </p>
                </div>
              </div>
              <p className="text-sm font-medium text-muted-foreground">Pick your theme to start</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => applyTheme('dark')}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-2xl border py-6 transition-colors',
                    themeChoice === 'dark'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card text-foreground'
                  )}
                >
                  <Moon className="h-8 w-8" />
                  <span className="font-semibold">Dark</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyTheme('light')}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-2xl border py-6 transition-colors',
                    themeChoice === 'light'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card text-foreground'
                  )}
                >
                  <Sun className="h-8 w-8" />
                  <span className="font-semibold">Light</span>
                </button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                <span className="text-sm font-medium">What should we call you?</span>
              </div>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-2xl border border-border bg-card px-4 py-3.5 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Gender (for strength standards)</p>
              <div className="grid grid-cols-2 gap-3">
                {(['male', 'female'] as Gender[]).map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={cn(
                      'rounded-2xl border py-4 text-center font-semibold capitalize transition-colors',
                      gender === g
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-card text-foreground'
                    )}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Units</p>
                <div className="flex gap-2 rounded-full bg-secondary p-1">
                  <button
                    type="button"
                    onClick={() => setUnitSystem('metric')}
                    className={cn(
                      'px-3 py-1 rounded-full text-xs font-semibold transition-colors',
                      unitSystem === 'metric'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    kg/cm
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnitSystem('imperial')}
                    className={cn(
                      'px-3 py-1 rounded-full text-xs font-semibold transition-colors',
                      unitSystem === 'imperial'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    lbs/in
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <User className="h-4 w-4" /> Age
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={e => setAge(e.target.value)}
                  placeholder="e.g. 16"
                  className="w-full rounded-2xl border border-border bg-card px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Scale className="h-4 w-4" /> Weight ({unitSystem === 'metric' ? 'kg' : 'lbs'})
                </label>
                <input
                  type="number"
                  value={weight}
                  onChange={e => setWeight(e.target.value)}
                  placeholder={unitSystem === 'metric' ? 'e.g. 75' : 'e.g. 165'}
                  className="w-full rounded-2xl border border-border bg-card px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Ruler className="h-4 w-4" /> Height
                </label>
                {unitSystem === 'metric' ? (
                  <input
                    type="number"
                    value={height}
                    onChange={e => setHeight(e.target.value)}
                    placeholder="e.g. 180 cm"
                    className="w-full rounded-2xl border border-border bg-card px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                ) : (
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <input
                        type="number"
                        value={heightFeet}
                        onChange={e => setHeightFeet(e.target.value)}
                        placeholder="ft"
                        className="w-full rounded-2xl border border-border bg-card px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <span className="mt-1 block text-xs text-muted-foreground">feet</span>
                    </div>
                    <div className="flex-1">
                      <input
                        type="number"
                        value={heightInches}
                        onChange={e => setHeightInches(e.target.value)}
                        placeholder="in"
                        className="w-full rounded-2xl border border-border bg-card px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <span className="mt-1 block text-xs text-muted-foreground">inches</span>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-muted-foreground">Primary goal</p>
                {GOALS.map(g => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setGoal(g.id)}
                    className={cn(
                      'mb-2 w-full rounded-2xl border p-3 text-left transition-colors',
                      goal === g.id ? 'border-primary bg-primary/10' : 'border-border bg-card'
                    )}
                  >
                    <p className="font-semibold text-foreground">{g.label}</p>
                    <p className="text-xs text-muted-foreground">{g.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <Dumbbell className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium text-foreground">Log your best lifts</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter the weight and reps for your best set. We&apos;ll calculate your estimated 1RM for ranking.
              </p>
              {[
                { 
                  key: 'bench', 
                  label: ONBOARDING_PR_GROUPS.chest.name, 
                  weight: benchWeight, 
                  setWeight: setBenchWeight,
                  reps: benchReps,
                  setReps: setBenchReps,
                  estimated1RM: bench1RM
                },
                { 
                  key: 'curl', 
                  label: ONBOARDING_PR_GROUPS.arms.name, 
                  weight: curlWeight, 
                  setWeight: setCurlWeight,
                  reps: curlReps,
                  setReps: setCurlReps,
                  estimated1RM: curl1RM
                },
                { 
                  key: 'squat', 
                  label: ONBOARDING_PR_GROUPS.legs.name, 
                  weight: squatWeight, 
                  setWeight: setSquatWeight,
                  reps: squatReps,
                  setReps: setSquatReps,
                  estimated1RM: squat1RM
                },
              ].map(item => (
                <div key={item.key} className="rounded-2xl border border-border bg-card p-4">
                  <label className="mb-3 block text-sm font-semibold text-foreground">{item.label}</label>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <input
                        type="number"
                        value={item.weight}
                        onChange={e => item.setWeight(e.target.value)}
                        placeholder="Weight"
                        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-center focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <span className="mt-1 block text-center text-xs text-muted-foreground">lbs</span>
                    </div>
                    <div className="flex items-center text-muted-foreground">×</div>
                    <div className="flex-1">
                      <input
                        type="number"
                        value={item.reps}
                        onChange={e => item.setReps(e.target.value)}
                        placeholder="Reps"
                        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-center focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <span className="mt-1 block text-center text-xs text-muted-foreground">reps</span>
                    </div>
                  </div>
                  {item.estimated1RM > 0 && (
                    <p className="mt-3 text-center text-xs text-primary">
                      Est. 1RM: <span className="font-bold">{item.estimated1RM} lbs</span>
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <div className="mt-8 flex gap-3">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep(s => s - 1)}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-border bg-card py-4 font-semibold text-foreground transition-colors hover:bg-secondary"
            >
              <ChevronLeft className="h-5 w-5" />
              Back
            </button>
          )}
          <button
            type="button"
            disabled={!canNext}
            onClick={() => {
              if (step === 0) applyTheme(themeChoice)
              if (step < TOTAL_STEPS - 1) setStep(s => s + 1)
              else finish()
            }}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-2xl py-4 font-bold transition-opacity',
              step === 0 ? 'w-full' : '',
              canNext
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground disabled:opacity-40'
            )}
          >
            {step < TOTAL_STEPS - 1 ? 'Continue' : 'Enter Rise'}
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
