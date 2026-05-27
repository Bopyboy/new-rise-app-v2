'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useApp } from '@/lib/app-context'
import { WorkoutDay, Exercise } from '@/lib/types'
import {
  Play,
  Pause,
  Check,
  X,
  ChevronLeft,
  Timer,
  Zap,
  Trophy,
  Plus,
  Minus,
  RotateCcw,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SetLog {
  setNumber: number
  targetReps: string
  actualReps: number
  weight: number // kg
  completed: boolean
}

interface ExerciseLog {
  exerciseId: string
  name: string
  sets: SetLog[]
}

type SessionPhase = 'ready' | 'active' | 'rest' | 'done'

const DEFAULT_REST = 90 // seconds

// ─── Rest Timer ───────────────────────────────────────────────────────────────

function RestTimer({ seconds, onSkip }: { seconds: number; onSkip: () => void }) {
  const [remaining, setRemaining] = useState(seconds)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    setRemaining(seconds)
  }, [seconds])

  useEffect(() => {
    if (paused || remaining <= 0) return
    const id = setTimeout(() => setRemaining(r => r - 1), 1000)
    return () => clearTimeout(id)
  }, [remaining, paused])

  const pct = Math.max(0, (remaining / seconds) * 100)
  const color = remaining <= 10 ? '#ef4444' : remaining <= 30 ? '#f97316' : '#22c55e'

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-6">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Rest</p>

      {/* Circle timer */}
      <div className="relative h-28 w-28">
        <svg className="h-28 w-28 -rotate-90" viewBox="0 0 112 112">
          <circle cx="56" cy="56" r="48" fill="none" stroke="currentColor" strokeWidth="6" className="text-secondary" />
          <circle
            cx="56"
            cy="56"
            r="48"
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 48}`}
            strokeDashoffset={`${2 * Math.PI * 48 * (1 - pct / 100)}`}
            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold tabular-nums" style={{ color }}>
            {remaining}
          </span>
          <span className="text-xs text-muted-foreground">sec</span>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setPaused(p => !p)}
          className="flex items-center gap-2 rounded-xl border border-border bg-secondary px-4 py-2 text-sm font-medium"
        >
          {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          {paused ? 'Resume' : 'Pause'}
        </button>
        <button
          onClick={onSkip}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          <Check className="h-4 w-4" />
          Skip
        </button>
      </div>

      {remaining <= 0 && (
        <p className="animate-pulse text-sm font-semibold text-green-500">Ready! Start your next set</p>
      )}
    </div>
  )
}

// ─── Set Row ──────────────────────────────────────────────────────────────────

function SetRow({
  set,
  onComplete,
  onWeightChange,
  onRepsChange,
}: {
  set: SetLog
  onComplete: () => void
  onWeightChange: (v: number) => void
  onRepsChange: (v: number) => void
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors',
        set.completed
          ? 'border-green-500/30 bg-green-500/5'
          : 'border-border bg-secondary/30'
      )}
    >
      <span
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold',
          set.completed ? 'bg-green-500 text-white' : 'bg-secondary text-muted-foreground'
        )}
      >
        {set.completed ? <Check className="h-3.5 w-3.5" /> : set.setNumber}
      </span>

      {/* Weight */}
      <div className="flex flex-1 items-center gap-1">
        <button
          onClick={() => onWeightChange(Math.max(0, set.weight - 2.5))}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary text-muted-foreground hover:text-foreground"
        >
          <Minus className="h-3 w-3" />
        </button>
        <span className="min-w-[52px] text-center text-sm font-semibold tabular-nums">
          {set.weight}kg
        </span>
        <button
          onClick={() => onWeightChange(set.weight + 2.5)}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary text-muted-foreground hover:text-foreground"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      {/* Reps */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onRepsChange(Math.max(0, set.actualReps - 1))}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary text-muted-foreground hover:text-foreground"
        >
          <Minus className="h-3 w-3" />
        </button>
        <span className="min-w-[36px] text-center text-sm font-semibold tabular-nums">
          {set.actualReps}
        </span>
        <button
          onClick={() => onRepsChange(set.actualReps + 1)}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary text-muted-foreground hover:text-foreground"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      {/* Complete */}
      <button
        onClick={onComplete}
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
          set.completed
            ? 'bg-green-500 text-white'
            : 'border border-border bg-card text-muted-foreground hover:border-green-500 hover:text-green-500'
        )}
      >
        <Check className="h-4 w-4" />
      </button>
    </div>
  )
}

// ─── Summary Screen ───────────────────────────────────────────────────────────

function WorkoutSummary({
  log,
  duration,
  xpEarned,
  onClose,
}: {
  log: ExerciseLog[]
  duration: number
  xpEarned: number
  onClose: () => void
}) {
  const totalSets = log.reduce((s, e) => s + e.sets.filter(x => x.completed).length, 0)
  const totalVolume = log.reduce(
    (s, e) => s + e.sets.filter(x => x.completed).reduce((sv, set) => sv + set.weight * set.actualReps, 0),
    0
  )
  const mins = Math.floor(duration / 60)
  const secs = duration % 60

  return (
    <div className="flex flex-col items-center gap-6 py-8 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/15">
        <Trophy className="h-10 w-10 text-primary" />
      </div>

      <div>
        <h2 className="text-2xl font-bold text-foreground">Workout Done!</h2>
        <p className="text-sm text-muted-foreground">Great session — keep the streak going 🔥</p>
      </div>

      <div className="grid w-full grid-cols-3 gap-3">
        {[
          { label: 'Duration', value: `${mins}:${String(secs).padStart(2, '0')}` },
          { label: 'Sets', value: totalSets },
          { label: 'Volume', value: `${Math.round(totalVolume)}kg` },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-3">
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="text-lg font-bold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 py-3">
        <Zap className="h-5 w-5 text-primary" />
        <span className="font-bold text-primary">+{xpEarned} XP earned</span>
      </div>

      <div className="w-full space-y-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Logged exercises</p>
        {log.map(ex => {
          const done = ex.sets.filter(s => s.completed)
          if (!done.length) return null
          return (
            <div key={ex.exerciseId} className="flex items-center justify-between rounded-lg bg-secondary/40 px-3 py-2 text-sm">
              <span className="font-medium text-foreground">{ex.name}</span>
              <span className="text-muted-foreground">
                {done.length} sets · {Math.round(done.reduce((s, x) => s + x.weight * x.actualReps, 0))}kg
              </span>
            </div>
          )
        })}
      </div>

      <button
        onClick={onClose}
        className="w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground"
      >
        Back to Train
      </button>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface WorkoutSessionProps {
  day: WorkoutDay
  onClose: () => void
}

export function WorkoutSession({ day, onClose }: WorkoutSessionProps) {
  const { addRiseScore } = useApp()

  const [phase, setPhase] = useState<SessionPhase>('ready')
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>(() =>
    day.exercises.map(ex => ({
      exerciseId: ex.id,
      name: ex.name,
      sets: Array.from({ length: ex.sets }, (_, i) => ({
        setNumber: i + 1,
        targetReps: ex.reps,
        actualReps: parseInt(ex.reps) || 10,
        weight: 0,
        completed: false,
      })),
    }))
  )

  const [currentExIndex, setCurrentExIndex] = useState(0)
  const [restSeconds, setRestSeconds] = useState(DEFAULT_REST)
  const [elapsed, setElapsed] = useState(0)
  const [xpEarned, setXpEarned] = useState(0)
  const startTimeRef = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Elapsed timer
  useEffect(() => {
    if (phase === 'active') {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase])

  const startWorkout = () => {
    startTimeRef.current = Date.now()
    setPhase('active')
  }

  const completeSet = (exIdx: number, setIdx: number) => {
    setExerciseLogs(prev => {
      const updated = prev.map((ex, ei) =>
        ei !== exIdx
          ? ex
          : {
              ...ex,
              sets: ex.sets.map((s, si) =>
                si !== setIdx ? s : { ...s, completed: !s.completed }
              ),
            }
      )
      return updated
    })
    setPhase('rest')
    setRestSeconds(DEFAULT_REST)
  }

  const updateWeight = (exIdx: number, setIdx: number, v: number) => {
    setExerciseLogs(prev =>
      prev.map((ex, ei) =>
        ei !== exIdx
          ? ex
          : { ...ex, sets: ex.sets.map((s, si) => (si !== setIdx ? s : { ...s, weight: v })) }
      )
    )
  }

  const updateReps = (exIdx: number, setIdx: number, v: number) => {
    setExerciseLogs(prev =>
      prev.map((ex, ei) =>
        ei !== exIdx
          ? ex
          : { ...ex, sets: ex.sets.map((s, si) => (si !== setIdx ? s : { ...s, actualReps: v })) }
      )
    )
  }

  const finishWorkout = () => {
    const completedSets = exerciseLogs.reduce(
      (s, e) => s + e.sets.filter(x => x.completed).length,
      0
    )
    const xp = Math.max(50, completedSets * 15)
    setXpEarned(xp)
    addRiseScore(xp)
    setPhase('done')
  }

  const allDone = exerciseLogs.every(ex => ex.sets.every(s => s.completed))
  const completedSets = exerciseLogs.reduce((s, e) => s + e.sets.filter(x => x.completed).length, 0)
  const totalSets = exerciseLogs.reduce((s, e) => s + e.sets.length, 0)
  const progress = totalSets > 0 ? (completedSets / totalSets) * 100 : 0
  const mins = Math.floor(elapsed / 60)
  const secs = elapsed % 60

  if (phase === 'done') {
    return (
      <WorkoutSummary
        log={exerciseLogs}
        duration={elapsed}
        xpEarned={xpEarned}
        onClose={onClose}
      />
    )
  }

  return (
    <div className="space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl border border-border">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h2 className="font-bold text-foreground">{day.name}</h2>
          <p className="text-xs text-muted-foreground">{day.day}</p>
        </div>
        {phase === 'active' || phase === 'rest' ? (
          <div className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5">
            <Timer className="h-3.5 w-3.5 text-primary" />
            <span className="tabular-nums text-sm font-semibold">
              {mins}:{String(secs).padStart(2, '0')}
            </span>
          </div>
        ) : null}
      </div>

      {/* Progress bar */}
      {phase !== 'ready' && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{completedSets} / {totalSets} sets</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Ready state */}
      {phase === 'ready' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-sm font-medium text-foreground">Today's workout</p>
            <ul className="mt-2 space-y-1">
              {day.exercises.map(ex => (
                <li key={ex.id} className="text-sm text-muted-foreground">
                  {ex.name} · {ex.sets}×{ex.reps}
                </li>
              ))}
            </ul>
          </div>
          <button
            onClick={startWorkout}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 font-bold text-primary-foreground text-lg"
          >
            <Play className="h-5 w-5 fill-primary-foreground" />
            Start Workout
          </button>
        </div>
      )}

      {/* Rest timer */}
      {phase === 'rest' && (
        <RestTimer seconds={restSeconds} onSkip={() => setPhase('active')} />
      )}

      {/* Exercise logs */}
      {(phase === 'active' || phase === 'rest') && (
        <div className="space-y-4">
          {exerciseLogs.map((ex, exIdx) => (
            <div key={ex.exerciseId} className="rounded-2xl border border-border bg-card overflow-hidden">
              {/* Exercise header */}
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div>
                  <p className="font-semibold text-foreground">{ex.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {ex.sets.filter(s => s.completed).length}/{ex.sets.length} sets done
                  </p>
                </div>
                {ex.sets.every(s => s.completed) && (
                  <span className="flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-1 text-xs font-semibold text-green-500">
                    <Check className="h-3 w-3" /> Done
                  </span>
                )}
              </div>

              {/* Set headers */}
              <div className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-muted-foreground">
                <span className="w-7 text-center">Set</span>
                <span className="flex-1 text-center">Weight</span>
                <span className="w-28 text-center">Reps</span>
                <span className="w-8" />
              </div>

              {/* Sets */}
              <div className="space-y-2 px-3 pb-3">
                {ex.sets.map((set, setIdx) => (
                  <SetRow
                    key={setIdx}
                    set={set}
                    onComplete={() => completeSet(exIdx, setIdx)}
                    onWeightChange={v => updateWeight(exIdx, setIdx, v)}
                    onRepsChange={v => updateReps(exIdx, setIdx, v)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Finish button */}
      {(phase === 'active' || phase === 'rest') && (
        <button
          onClick={finishWorkout}
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-bold text-lg transition-colors',
            allDone
              ? 'bg-green-500 text-white'
              : 'border border-border bg-card text-muted-foreground'
          )}
        >
          <Trophy className="h-5 w-5" />
          {allDone ? 'Finish Workout' : `Finish Early (${completedSets}/${totalSets} sets)`}
        </button>
      )}
    </div>
  )
}