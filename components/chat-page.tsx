'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Sparkles, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useApp } from '@/lib/app-context'
import { buildSystemPrompt, getSuggestedQuestions, streamAIResponse } from '@/lib/fitness-ai'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export function ChatPage() {
  const app = useApp()
  const { settings, riseScore, streak, getTodayTotals, bodyPRs, questState } = app

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hey ${settings.name || 'there'}! 👋 I'm your personal Rise coach — powered by real AI, not scripts.\n\nI know your stats: you're ${streak} days into your streak, sitting at ${riseScore} Rise XP, and your goal is to **${settings.fitnessGoal.replace('_', ' ')}**.\n\nAsk me anything — programming, nutrition, form, supplements, how to break through a plateau. I've got full context on your profile. What's on your mind?`,
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const suggested = getSuggestedQuestions(settings.fitnessGoal)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isStreaming])

  // Build conversation history for the API (exclude the first greeting)
  const getApiHistory = (msgs: ChatMessage[]) =>
    msgs.slice(1).map(m => ({ role: m.role, content: m.content }))

  const sendMessage = async (text: string) => {
    if (!text.trim() || isStreaming) return
    setError(null)

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    }

    const history = getApiHistory(messages)
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsStreaming(true)

    // Placeholder assistant message we'll stream into
    const assistantId = (Date.now() + 1).toString()
    setMessages(prev => [
      ...prev,
      { id: assistantId, role: 'assistant', content: '', timestamp: new Date() },
    ])

    abortRef.current = new AbortController()

    try {
      const todayTotals = getTodayTotals()
      const systemPrompt = buildSystemPrompt({
        settings,
        riseScore,
        streak,
        todayTotals,
        bodyPRs,
        questState,
      })

      await streamAIResponse(
        {
          systemPrompt,
          history: [...history, { role: 'user', content: text.trim() }],
        },
        (chunk) => {
          setMessages(prev =>
            prev.map(m =>
              m.id === assistantId ? { ...m, content: m.content + chunk } : m
            )
          )
        },
        abortRef.current.signal
      )
    } catch (err: any) {
      if (err.name === 'AbortError') return
      console.error('AI error:', err)
      setError('Something went wrong. Check your API key in the environment and try again.')
      setMessages(prev => prev.filter(m => m.id !== assistantId))
    } finally {
      setIsStreaming(false)
      abortRef.current = null
    }
  }

  const handleSend = () => sendMessage(input)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatMessage = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>
      }
      return <span key={i}>{part}</span>
    })
  }

  const renderContent = (content: string) => {
    if (!content) {
      return (
        <span className="inline-flex items-center gap-1">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
        </span>
      )
    }
    return content.split('\n').map((line, i) => {
      if (line === '') return <br key={i} />
      const isBullet = line.startsWith('•') || line.startsWith('-')
      return (
        <p key={i} className={cn('leading-relaxed', isBullet && 'pl-2')}>
          {formatMessage(line)}
        </p>
      )
    })
  }

  const showSuggestions = messages.length <= 2

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col pb-16">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3 pt-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
          <Bot className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-bold text-foreground">Rise Coach</h1>
          <p className="flex items-center gap-1 text-xs text-green-500">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
            Online · Knows your full profile
          </p>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mx-4 mt-3 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={cn(
              'flex gap-2.5',
              msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
            )}
          >
            {/* Avatar */}
            <div
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                msg.role === 'assistant' ? 'bg-primary' : 'bg-secondary'
              )}
            >
              {msg.role === 'assistant' ? (
                <Bot className="h-4 w-4 text-primary-foreground" />
              ) : (
                <User className="h-4 w-4 text-foreground" />
              )}
            </div>

            {/* Bubble */}
            <div
              className={cn(
                'max-w-[82%] rounded-2xl px-4 py-3 text-sm',
                msg.role === 'assistant'
                  ? 'rounded-tl-sm bg-card border border-border text-foreground'
                  : 'rounded-tr-sm bg-primary text-primary-foreground'
              )}
            >
              <div className="space-y-1">{renderContent(msg.content)}</div>
              {msg.content && (
                <p
                  className={cn(
                    'mt-1.5 text-[10px]',
                    msg.role === 'assistant'
                      ? 'text-muted-foreground'
                      : 'text-primary-foreground/70'
                  )}
                >
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              )}
            </div>
          </div>
        ))}

        {/* Suggested questions */}
        {showSuggestions && !isStreaming && (
          <div className="mt-2">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3 w-3" />
              Suggested questions
            </p>
            <div className="flex flex-wrap gap-2">
              {suggested.map(q => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border bg-card/80 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-end gap-2 rounded-2xl border border-border bg-secondary px-4 py-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your fitness coach..."
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            style={{ maxHeight: 120 }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all',
              input.trim() && !isStreaming
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-muted text-muted-foreground'
            )}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
          Real AI coach · Powered by Claude
        </p>
      </div>
    </div>
  )
}