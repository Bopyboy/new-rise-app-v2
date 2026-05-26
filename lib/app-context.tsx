'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { UserSettings, DailyNutrition, MealEntry, DEFAULT_SETTINGS, WorkoutDay, DailyQuest, DAILY_QUESTS, BodyChartPRs, Friend, VIRTUAL_FRIENDS } from './types'
import { DEFAULT_WORKOUT_SPLIT } from './exercise-data'
import { calculateMacroTargets } from './nutrition-calc'
import { calculatePerformanceScore } from './performance-rank'

// --- Safety Helper ---
const safeJsonParse = (val: string | null, fallback: any) => {
  if (!val || val === "undefined" || val === "null" || val.trim() === "") return fallback;
  try {
    return JSON.parse(val);
  } catch (e) {
    return fallback;
  }
}

interface QuestState {
  quest: DailyQuest
  progress: number
  completed: boolean
  assignedDate: string
}

type AddFriendResult = 'success' | 'already_added' | 'not_found' | 'self'

interface AppState {
  settings: UserSettings
  isLoaded: boolean
  riseScore: number
  streak: number
  nutrition: DailyNutrition
  workoutSplit: WorkoutDay[]
  questState: QuestState | null
  bodyPRs: BodyChartPRs
  friends: Friend[]
  friendCode: string
  coins: number
  ownedItems: string[]
  equippedItems: Record<string, string>
  addCoins: (amount: number) => void
  buyItem: (itemId: string, cost: number) => void
  equipItem: (itemId: string, type: string) => void
  updateSettings: (settings: Partial<UserSettings>) => void
  getPerformanceScore: () => number
  completeOnboarding: (
    profile: {
      name: string
      age: number
      weight: number
      height: number
      gender: UserSettings['gender']
      fitnessGoal: UserSettings['fitnessGoal']
    },
    initialPRs?: {
      chest?: Record<string, number>
      arms?: Record<string, number>
      legs?: Record<string, number>
    }
  ) => void
  recalculateGoals: () => void
  addRiseScore: (points: number) => void
  addMealEntry: (meal: 'breakfast' | 'lunch' | 'dinner' | 'snacks', entry: MealEntry) => void
  removeMealEntry: (meal: 'breakfast' | 'lunch' | 'dinner' | 'snacks', entryId: string) => void
  getTodayTotals: () => { calories: number; protein: number; carbs: number; fats: number }
  addExerciseToDay: (dayIndex: number, exercise: import('./types').Exercise) => void
  removeExerciseFromDay: (dayIndex: number, exerciseId: string) => void
  updateExercise: (dayIndex: number, exerciseId: string, updates: Partial<import('./types').Exercise>) => void
  updateQuestProgress: (progress: number) => void
  completeQuest: () => void
  updateBodyPR: (group: keyof BodyChartPRs, exerciseId: string, value: number) => void
  resetAllPRs: () => void
  addFriend: (code: string) => AddFriendResult
  removeFriend: (id: string) => void
}

const AppContext = createContext<AppState | undefined>(undefined)
const getTodayString = () => new Date().toISOString().split('T')[0]
const getEmptyNutrition = (): DailyNutrition => ({
  date: getTodayString(),
  meals: { breakfast: [], lunch: [], dinner: [], snacks: [] },
})
const getEmptyPRs = (): BodyChartPRs => ({
  chest: {}, back: {}, shoulders: {}, arms: {}, legs: {}, core: {},
})

function getDailyQuest(dateString: string): DailyQuest {
  const seed = dateString.split('-').reduce((acc, val) => acc + parseInt(val), 0)
  const index = seed % DAILY_QUESTS.length
  return DAILY_QUESTS[index]
}

function generateFriendCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS)
  const [riseScore, setRiseScore] = useState(5250)
  const [streak, setStreak] = useState(7)
  const [nutrition, setNutrition] = useState<DailyNutrition>(getEmptyNutrition())
  const [workoutSplit, setWorkoutSplit] = useState<WorkoutDay[]>(DEFAULT_WORKOUT_SPLIT)
  const [questState, setQuestState] = useState<QuestState | null>(null)
  const [bodyPRs, setBodyPRs] = useState<BodyChartPRs>(getEmptyPRs())
  const [friends, setFriends] = useState<Friend[]>([])
  const [friendCode, setFriendCode] = useState<string>('')
  const [isLoaded, setIsLoaded] = useState(false)
  const [coins, setCoins] = useState(0)
  const [ownedItems, setOwnedItems] = useState<string[]>([])
  const [equippedItems, setEquippedItems] = useState<Record<string, string>>({})

  useEffect(() => {
    const storedSettings = localStorage.getItem('rise-settings')
    const raw = safeJsonParse(storedSettings, DEFAULT_SETTINGS) as UserSettings
    setSettings({
      ...DEFAULT_SETTINGS,
      ...raw,
      gender: raw.gender ?? 'male',
      fitnessGoal: raw.fitnessGoal ?? 'build_muscle',
      onboardingComplete: raw.onboardingComplete ?? storedSettings !== null,
    })
    setRiseScore(safeJsonParse(localStorage.getItem('rise-score'), 5250))
    setStreak(safeJsonParse(localStorage.getItem('rise-streak'), 7))
    setWorkoutSplit(safeJsonParse(localStorage.getItem('rise-workout'), DEFAULT_WORKOUT_SPLIT))
    setBodyPRs(safeJsonParse(localStorage.getItem('rise-body-prs'), getEmptyPRs()))
    setFriends(safeJsonParse(localStorage.getItem('rise-friends'), []))
    setCoins(safeJsonParse(localStorage.getItem('rise-coins'), 0))
    setOwnedItems(safeJsonParse(localStorage.getItem('rise-owned-items'), []))
    setEquippedItems(safeJsonParse(localStorage.getItem('rise-equipped-items'), {}))

    // 2. Specialized Nutrition Loading
    const savedNutrition = localStorage.getItem('rise-nutrition')
    if (savedNutrition) {
      const parsed = safeJsonParse(savedNutrition, null)
      if (parsed && parsed.date === getTodayString()) {
        setNutrition(parsed)
      }
    }

    // 3. Specialized Quest Loading
    const savedQuest = safeJsonParse(localStorage.getItem('rise-quest'), null)
    if (savedQuest && savedQuest.assignedDate === getTodayString()) {
      setQuestState(savedQuest)
    } else {
      setQuestState({ quest: getDailyQuest(getTodayString()), progress: 0, completed: false, assignedDate: getTodayString() })
    }

    // 4. Friend Code
    let savedCode = localStorage.getItem('rise-friend-code')
    if (!savedCode) {
      savedCode = generateFriendCode()
      localStorage.setItem('rise-friend-code', savedCode)
    }
    setFriendCode(savedCode)

    setIsLoaded(true)
  }, [])

  // Sync back to local storage
  useEffect(() => { if (isLoaded) localStorage.setItem('rise-settings', JSON.stringify(settings)) }, [settings, isLoaded])
  useEffect(() => { if (isLoaded) localStorage.setItem('rise-score', JSON.stringify(riseScore)) }, [riseScore, isLoaded])
  useEffect(() => { if (isLoaded) localStorage.setItem('rise-streak', JSON.stringify(streak)) }, [streak, isLoaded])
  useEffect(() => { if (isLoaded) localStorage.setItem('rise-nutrition', JSON.stringify(nutrition)) }, [nutrition, isLoaded])
  useEffect(() => { if (isLoaded) localStorage.setItem('rise-workout', JSON.stringify(workoutSplit)) }, [workoutSplit, isLoaded])
  useEffect(() => { if (isLoaded && questState) localStorage.setItem('rise-quest', JSON.stringify(questState)) }, [questState, isLoaded])
  useEffect(() => { if (isLoaded) localStorage.setItem('rise-body-prs', JSON.stringify(bodyPRs)) }, [bodyPRs, isLoaded])
  useEffect(() => { if (isLoaded) localStorage.setItem('rise-friends', JSON.stringify(friends)) }, [friends, isLoaded])
  useEffect(() => { if (isLoaded) localStorage.setItem('rise-coins', JSON.stringify(coins)) }, [coins, isLoaded])
  useEffect(() => { if (isLoaded) localStorage.setItem('rise-owned-items', JSON.stringify(ownedItems)) }, [ownedItems, isLoaded])
  useEffect(() => { if (isLoaded) localStorage.setItem('rise-equipped-items', JSON.stringify(equippedItems)) }, [equippedItems, isLoaded])

  const recalculateGoals = () => {
    setSettings(prev => {
      const macros = calculateMacroTargets(
        prev.weight,
        prev.height,
        prev.age,
        prev.gender,
        prev.fitnessGoal,
        bodyPRs
      )
      return { ...prev, ...macros }
    })
  }

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...newSettings }
      const profileChanged =
        newSettings.weight !== undefined ||
        newSettings.height !== undefined ||
        newSettings.age !== undefined ||
        newSettings.gender !== undefined ||
        newSettings.fitnessGoal !== undefined
      if (profileChanged && next.onboardingComplete) {
        const macros = calculateMacroTargets(
          next.weight,
          next.height,
          next.age,
          next.gender,
          next.fitnessGoal,
          bodyPRs
        )
        return { ...next, ...macros }
      }
      return next
    })
  }

  const getPerformanceScore = () =>
    calculatePerformanceScore(bodyPRs, {
      age: settings.age,
      weightKg: settings.weight,
      gender: settings.gender,
    })

  const completeOnboarding = (
    profile: {
      name: string
      age: number
      weight: number
      height: number
      gender: UserSettings['gender']
      fitnessGoal: UserSettings['fitnessGoal']
    },
    initialPRs?: {
      chest?: Record<string, number>
      arms?: Record<string, number>
      legs?: Record<string, number>
    }
  ) => {
    const mergedPRs: BodyChartPRs = {
      ...getEmptyPRs(),
      chest: { ...getEmptyPRs().chest, ...initialPRs?.chest },
      arms: { ...getEmptyPRs().arms, ...initialPRs?.arms },
      legs: { ...getEmptyPRs().legs, ...initialPRs?.legs },
    }
    setBodyPRs(mergedPRs)
    const macros = calculateMacroTargets(
      profile.weight,
      profile.height,
      profile.age,
      profile.gender,
      profile.fitnessGoal,
      mergedPRs
    )
    setSettings(prev => ({ ...prev, ...profile, ...macros, onboardingComplete: true }))
  }
  const addRiseScore = (points: number) => setRiseScore(prev => prev + points)
  const addCoins = (amount: number) => setCoins(prev => prev + amount)
  const buyItem = (itemId: string, cost: number) => {
    if (coins < cost) return
    setCoins(prev => prev - cost)
    setOwnedItems(prev => prev.includes(itemId) ? prev : [...prev, itemId])
  }
  const equipItem = (itemId: string, type: string) => setEquippedItems(prev => ({ ...prev, [type]: itemId }))
  const addMealEntry = (meal: 'breakfast' | 'lunch' | 'dinner' | 'snacks', entry: MealEntry) => {
    setNutrition(prev => ({ ...prev, meals: { ...prev.meals, [meal]: [...prev.meals[meal], entry] } }))
  }
  const removeMealEntry = (meal: 'breakfast' | 'lunch' | 'dinner' | 'snacks', entryId: string) => {
    setNutrition(prev => ({ ...prev, meals: { ...prev.meals, [meal]: prev.meals[meal].filter(e => e.id !== entryId) } }))
  }
  const getTodayTotals = () => {
    const allMeals = [...nutrition.meals.breakfast, ...nutrition.meals.lunch, ...nutrition.meals.dinner, ...nutrition.meals.snacks]
    return {
      calories: allMeals.reduce((sum, e) => sum + e.calories, 0),
      protein: allMeals.reduce((sum, e) => sum + e.protein, 0),
      carbs: allMeals.reduce((sum, e) => sum + e.carbs, 0),
      fats: allMeals.reduce((sum, e) => sum + e.fats, 0),
    }
  }
  const addExerciseToDay = (dayIndex: number, exercise: any) => {
    setWorkoutSplit(prev => {
      const updated = [...prev]; updated[dayIndex] = { ...updated[dayIndex], exercises: [...updated[dayIndex].exercises, exercise] }
      return updated
    })
  }
  const removeExerciseFromDay = (dayIndex: number, exerciseId: string) => {
    setWorkoutSplit(prev => {
      const updated = [...prev]; updated[dayIndex] = { ...updated[dayIndex], exercises: updated[dayIndex].exercises.filter(e => e.id !== exerciseId) }
      return updated
    })
  }
  const updateExercise = (dayIndex: number, exerciseId: string, updates: any) => {
    setWorkoutSplit(prev => {
      const updated = [...prev]; updated[dayIndex] = { ...updated[dayIndex], exercises: updated[dayIndex].exercises.map(e => e.id === exerciseId ? { ...e, ...updates } : e) }
      return updated
    })
  }
  const updateQuestProgress = (progress: number) => {
    if (questState && !questState.completed) setQuestState(prev => prev ? { ...prev, progress: Math.min(progress, prev.quest.target) } : null)
  }
  const completeQuest = () => {
    if (questState && !questState.completed) {
      setQuestState(prev => prev ? { ...prev, completed: true, progress: prev.quest.target } : null)
      addRiseScore(questState.quest.xpReward); addCoins(50)
    }
  }
  const updateBodyPR = (group: keyof BodyChartPRs, exerciseId: string, value: number) => {
    setBodyPRs(prev => {
      const next = { ...prev, [group]: { ...prev[group], [exerciseId]: value } }
      setSettings(s => {
        if (!s.onboardingComplete) return s
        const macros = calculateMacroTargets(
          s.weight,
          s.height,
          s.age,
          s.gender,
          s.fitnessGoal,
          next
        )
        return { ...s, ...macros }
      })
      return next
    })
  }
  const resetAllPRs = () => setBodyPRs(getEmptyPRs())
  const addFriend = (code: string): AddFriendResult => {
    const upper = code.toUpperCase().trim()
    if (upper === friendCode) return 'self'
    if (friends.some(f => f.friendCode === upper)) return 'already_added'
    const virtualFriend = VIRTUAL_FRIENDS[upper]
    if (!virtualFriend) return 'not_found'
    setFriends(prev => [...prev, { ...virtualFriend, id: Date.now().toString(), status: 'accepted', addedAt: new Date().toISOString() }])
    return 'success'
  }
  const removeFriend = (id: string) => setFriends(prev => prev.filter(f => f.id !== id))

  return (
    <AppContext.Provider value={{
      settings, isLoaded, riseScore, streak, nutrition, workoutSplit, questState, bodyPRs, friends, friendCode, coins, ownedItems, equippedItems,
      addCoins, buyItem, equipItem, updateSettings, getPerformanceScore, completeOnboarding, recalculateGoals, addRiseScore, addMealEntry, removeMealEntry, getTodayTotals, addExerciseToDay,
      removeExerciseFromDay, updateExercise, updateQuestProgress, completeQuest, updateBodyPR, resetAllPRs, addFriend, removeFriend,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) throw new Error('useApp must be used within an AppProvider')
  return context
}