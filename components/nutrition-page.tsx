'use client'

import { useState } from 'react'
import { useApp } from '@/lib/app-context'
import { FOOD_DATABASE, FOOD_CATEGORIES, searchFoods, getFoodCount } from '@/lib/food-data'
import { FoodItem, MealEntry } from '@/lib/types'
import { WeeklyMealPlan } from '@/components/weekly-meal-plan'
import { Plus, Search, X, ArrowLeft, Minus, BookOpen, CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snacks'
type FoodView = 'diary' | 'plan'

interface NutritionPageProps {
  initialView?: FoodView
}

export function NutritionPage({ initialView = 'diary' }: NutritionPageProps) {
  const { settings, nutrition, getTodayTotals, addMealEntry, removeMealEntry } = useApp()
  const totals = getTodayTotals()
  const [view, setView] = useState<FoodView>(initialView)
  const [addFoodModal, setAddFoodModal] = useState<{ open: boolean; meal: MealType | null }>({
    open: false,
    meal: null,
  })
  const foodCount = getFoodCount()

  const caloriePercent = Math.min(100, (totals.calories / settings.calorieGoal) * 100)
  const proteinPercent = Math.min(100, (totals.protein / settings.proteinGoal) * 100)
  const carbPercent = Math.min(100, (totals.carbs / settings.carbGoal) * 100)
  const fatPercent = Math.min(100, (totals.fats / settings.fatGoal) * 100)

  const openAddFood = (meal: MealType) => {
    setAddFoodModal({ open: true, meal })
  }

  const closeAddFood = () => {
    setAddFoodModal({ open: false, meal: null })
  }

  const handleAddFood = (entry: MealEntry) => {
    if (addFoodModal.meal) {
      addMealEntry(addFoodModal.meal, entry)
    }
  }

  const getMealTotals = (entries: MealEntry[]) => ({
    calories: entries.reduce((sum, e) => sum + e.calories, 0),
    protein: entries.reduce((sum, e) => sum + e.protein, 0),
  })

  return (
    <>
      <div className="space-y-4 pb-20">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            <span className="rise-shimmer-text">Food</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            {foodCount}+ foods · AI meal plans · macro tracking
          </p>
        </div>

        <div className="flex gap-2 rounded-2xl bg-secondary/60 p-1">
          <button
            type="button"
            onClick={() => setView('diary')}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition-colors',
              view === 'diary' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
            )}
          >
            <BookOpen className="h-3.5 w-3.5" />
            Diary
          </button>
          <button
            type="button"
            onClick={() => setView('plan')}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition-colors',
              view === 'plan' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
            )}
          >
            <CalendarDays className="h-3.5 w-3.5" />
            Meal plan
          </button>
        </div>

        {view === 'plan' ? (
          <WeeklyMealPlan />
        ) : (
          <>
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5">
          <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/15 blur-2xl" />
          <div className="relative">
            <p className="text-sm font-medium text-muted-foreground">Daily calories</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-4xl font-bold text-foreground">{totals.calories}</span>
              <span className="text-lg text-muted-foreground">/ {settings.calorieGoal}</span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${caloriePercent}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {settings.calorieGoal - totals.calories > 0
                ? `${settings.calorieGoal - totals.calories} kcal remaining`
                : 'Goal reached'}
            </p>
          </div>
        </div>

        {/* Macro Rings */}
        <div className="grid grid-cols-3 gap-3">
          <MacroRing
            label="Protein"
            current={Math.round(totals.protein)}
            goal={settings.proteinGoal}
            percent={proteinPercent}
            color="green"
          />
          <MacroRing
            label="Carbs"
            current={Math.round(totals.carbs)}
            goal={settings.carbGoal}
            percent={carbPercent}
            color="amber"
          />
          <MacroRing
            label="Fats"
            current={Math.round(totals.fats)}
            goal={settings.fatGoal}
            percent={fatPercent}
            color="rose"
          />
        </div>

        {/* Meals */}
        {(['breakfast', 'lunch', 'dinner', 'snacks'] as MealType[]).map(mealType => {
          const entries = nutrition.meals[mealType]
          const mealTotals = getMealTotals(entries)
          const icons: Record<MealType, string> = {
            breakfast: '🌅',
            lunch: '☀️',
            dinner: '🌙',
            snacks: '🍿',
          }
          const labels: Record<MealType, string> = {
            breakfast: 'Breakfast',
            lunch: 'Lunch',
            dinner: 'Dinner',
            snacks: 'Snacks',
          }

          return (
            <div key={mealType} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{icons[mealType]}</span>
                  <div>
                    <h3 className="font-semibold text-foreground">{labels[mealType]}</h3>
                    {entries.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {mealTotals.calories} cal | {Math.round(mealTotals.protein)}g protein
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-9 gap-1.5 text-primary"
                  onClick={() => openAddFood(mealType)}
                >
                  <Plus className="h-4 w-4" />
                  Add Food
                </Button>
              </div>

              {entries.length > 0 && (
                <div className="mt-3 space-y-2">
                  {entries.map(entry => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{entry.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {entry.servingSize}g | {entry.calories} cal | {Math.round(entry.protein)}g P
                        </p>
                      </div>
                      <button
                        onClick={() => removeMealEntry(mealType, entry.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
          </>
        )}
      </div>

      {/* Add Food Modal */}
      {addFoodModal.open && addFoodModal.meal && (
        <AddFoodModal
          meal={addFoodModal.meal}
          onClose={closeAddFood}
          onAdd={handleAddFood}
        />
      )}
    </>
  )
}

function MacroRing({
  label,
  current,
  goal,
  percent,
  color,
}: {
  label: string
  current: number
  goal: number
  percent: number
  color: 'green' | 'amber' | 'rose'
}) {
  const colorClasses = {
    green: 'text-green-500',
    amber: 'text-amber-500',
    rose: 'text-rose-500',
  }
  const strokeColors = {
    green: '#22c55e',
    amber: '#f59e0b',
    rose: '#f43f5e',
  }

  const radius = 32
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percent / 100) * circumference

  return (
    <div className="flex flex-col items-center rounded-xl border border-border bg-card p-3">
      <div className="relative h-20 w-20">
        <svg className="h-full w-full -rotate-90">
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-secondary"
          />
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            stroke={strokeColors[color]}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('text-lg font-bold', colorClasses[color])}>{current}g</span>
        </div>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
      <p className="text-[10px] text-muted-foreground/70">of {goal}g</p>
    </div>
  )
}

function AddFoodModal({
  meal,
  onClose,
  onAdd,
}: {
  meal: MealType
  onClose: () => void
  onAdd: (entry: MealEntry) => void
}) {
  const [view, setView] = useState<'categories' | 'list' | 'detail' | 'manual'>('categories')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [servingSize, setServingSize] = useState(100)
  const [manualFood, setManualFood] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fats: '',
    serving: '',
  })

  const mealLabels: Record<MealType, string> = {
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner',
    snacks: 'Snacks',
  }

  const searchResults = searchQuery.length >= 2 ? searchFoods(searchQuery) : []

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId)
    setView('list')
  }

  const handleFoodClick = (food: FoodItem) => {
    setSelectedFood(food)
    setServingSize(food.servingGrams)
    setView('detail')
  }

  const handleAddToMeal = () => {
    if (selectedFood) {
      const multiplier = servingSize / selectedFood.servingGrams
      const entry: MealEntry = {
        id: crypto.randomUUID(),
        foodId: selectedFood.id,
        name: selectedFood.name,
        servingSize,
        calories: Math.round(selectedFood.calories * multiplier),
        protein: Math.round(selectedFood.protein * multiplier * 10) / 10,
        carbs: Math.round(selectedFood.carbs * multiplier * 10) / 10,
        fats: Math.round(selectedFood.fats * multiplier * 10) / 10,
      }
      onAdd(entry)
      onClose()
    }
  }

  const handleManualAdd = () => {
    if (manualFood.name && manualFood.calories) {
      const entry: MealEntry = {
        id: crypto.randomUUID(),
        foodId: 'manual-' + crypto.randomUUID(),
        name: manualFood.name,
        servingSize: parseInt(manualFood.serving) || 100,
        calories: parseInt(manualFood.calories) || 0,
        protein: parseFloat(manualFood.protein) || 0,
        carbs: parseFloat(manualFood.carbs) || 0,
        fats: parseFloat(manualFood.fats) || 0,
      }
      onAdd(entry)
      onClose()
    }
  }

  const goBack = () => {
    if (view === 'detail') {
      setView(selectedCategory ? 'list' : 'categories')
      setSelectedFood(null)
    } else if (view === 'list') {
      setView('categories')
      setSelectedCategory(null)
    } else if (view === 'manual') {
      setView('categories')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <button
          onClick={view === 'categories' ? onClose : goBack}
          className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-secondary"
        >
          {view === 'categories' ? <X className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
        </button>
        <h2 className="text-lg font-semibold">Add to {mealLabels[meal]}</h2>
      </div>

      {/* Search */}
      {view !== 'detail' && view !== 'manual' && (
        <div className="border-b border-border p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search foods..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Search Results */}
        {searchQuery.length >= 2 && view !== 'detail' && view !== 'manual' && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {searchResults.length} results for &quot;{searchQuery}&quot;
            </p>
            {searchResults.map(food => (
              <FoodListItem key={food.id} food={food} onClick={() => handleFoodClick(food)} />
            ))}
          </div>
        )}

        {/* Categories View */}
        {view === 'categories' && searchQuery.length < 2 && (
          <>
            <p className="mb-2 text-xs text-muted-foreground">{getFoodCount()} foods in database</p>
            <h3 className="mb-3 text-sm font-medium text-muted-foreground">Browse by category</h3>
            <div className="grid grid-cols-2 gap-3">
              {FOOD_CATEGORIES.map(category => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-secondary"
                >
                  <span className="text-2xl">{category.icon}</span>
                  <span className="font-medium text-foreground">{category.name}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setView('manual')}
              className="mt-4 w-full rounded-xl border border-dashed border-border p-4 text-center text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              Enter Manually
            </button>
          </>
        )}

        {/* Food List View */}
        {view === 'list' && selectedCategory && (
          <div className="space-y-2">
            {FOOD_DATABASE[selectedCategory]?.map(food => (
              <FoodListItem key={food.id} food={food} onClick={() => handleFoodClick(food)} />
            ))}
          </div>
        )}

        {/* Food Detail View */}
        {view === 'detail' && selectedFood && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-foreground">{selectedFood.name}</h3>
              <p className="text-sm text-muted-foreground">{selectedFood.servingSize}</p>
            </div>

            {/* Serving Size Adjuster */}
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="mb-3 text-sm font-medium text-muted-foreground">Serving Size (grams)</p>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setServingSize(Math.max(10, servingSize - 10))}
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-border hover:bg-secondary"
                >
                  <Minus className="h-5 w-5" />
                </button>
                <Input
                  type="number"
                  value={servingSize}
                  onChange={e => setServingSize(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-24 text-center text-lg font-semibold"
                />
                <button
                  onClick={() => setServingSize(servingSize + 10)}
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-border hover:bg-secondary"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Calculated Macros */}
            <div className="grid grid-cols-2 gap-3">
              {(() => {
                const multiplier = servingSize / selectedFood.servingGrams
                return (
                  <>
                    <MacroDisplayCard
                      label="Calories"
                      value={Math.round(selectedFood.calories * multiplier)}
                      unit="cal"
                      color="blue"
                    />
                    <MacroDisplayCard
                      label="Protein"
                      value={Math.round(selectedFood.protein * multiplier * 10) / 10}
                      unit="g"
                      color="green"
                    />
                    <MacroDisplayCard
                      label="Carbs"
                      value={Math.round(selectedFood.carbs * multiplier * 10) / 10}
                      unit="g"
                      color="amber"
                    />
                    <MacroDisplayCard
                      label="Fats"
                      value={Math.round(selectedFood.fats * multiplier * 10) / 10}
                      unit="g"
                      color="rose"
                    />
                  </>
                )
              })()}
            </div>

            <Button onClick={handleAddToMeal} className="w-full" size="lg">
              Add to {mealLabels[meal]}
            </Button>
          </div>
        )}

        {/* Manual Entry View */}
        {view === 'manual' && (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Food Name</label>
              <Input
                value={manualFood.name}
                onChange={e => setManualFood(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Homemade Smoothie"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Serving Size (g)</label>
              <Input
                type="number"
                value={manualFood.serving}
                onChange={e => setManualFood(prev => ({ ...prev, serving: e.target.value }))}
                placeholder="100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Calories</label>
              <Input
                type="number"
                value={manualFood.calories}
                onChange={e => setManualFood(prev => ({ ...prev, calories: e.target.value }))}
                placeholder="0"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Protein (g)</label>
                <Input
                  type="number"
                  value={manualFood.protein}
                  onChange={e => setManualFood(prev => ({ ...prev, protein: e.target.value }))}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Carbs (g)</label>
                <Input
                  type="number"
                  value={manualFood.carbs}
                  onChange={e => setManualFood(prev => ({ ...prev, carbs: e.target.value }))}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Fats (g)</label>
                <Input
                  type="number"
                  value={manualFood.fats}
                  onChange={e => setManualFood(prev => ({ ...prev, fats: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>

            <Button
              onClick={handleManualAdd}
              disabled={!manualFood.name || !manualFood.calories}
              className="w-full"
              size="lg"
            >
              Add to {mealLabels[meal]}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

function FoodListItem({ food, onClick }: { food: FoodItem; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-secondary"
    >
      <div>
        <p className="font-medium text-foreground">{food.name}</p>
        <p className="text-sm text-muted-foreground">{food.servingSize}</p>
      </div>
      <div className="text-right">
        <p className="font-semibold text-foreground">{food.calories} cal</p>
        <p className="text-xs text-muted-foreground">
          P: {food.protein}g | C: {food.carbs}g | F: {food.fats}g
        </p>
      </div>
    </button>
  )
}

function MacroDisplayCard({
  label,
  value,
  unit,
  color,
}: {
  label: string
  value: number
  unit: string
  color: 'blue' | 'green' | 'amber' | 'rose'
}) {
  const colorClasses = {
    blue: 'text-blue-500',
    green: 'text-green-500',
    amber: 'text-amber-500',
    rose: 'text-rose-500',
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 text-center">
      <p className={cn('text-2xl font-bold', colorClasses[color])}>
        {value}
        <span className="text-sm font-normal text-muted-foreground">{unit}</span>
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}
