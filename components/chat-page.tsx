'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ChatMessage, getAIResponse, getSuggestedQuestions } from '@/lib/fitness-ai'

export function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hey! 👋 I'm your AI fitness coach. Ask me anything about workouts, nutrition, supplements, or your Rise progress. What's on your mind?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const suggested = getSuggestedQuestions()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 600))

    const responseText = getAIResponse(text.trim())

    const aiMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: responseText,
      timestamp: new Date(),
    }

    setIsTyping(false)
    setMessages(prev => [...prev, aiMsg])
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
            Online — Ask me anything
          </p>
        </div>
      </div>

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
            <div className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
              msg.role === 'assistant'
                ? 'bg-primary'
                : 'bg-secondary'
            )}>
              {msg.role === 'assistant'
                ? <Bot className="h-4 w-4 text-primary-foreground" />
                : <User className="h-4 w-4 text-foreground" />
              }
            </div>

            {/* Bubble */}
            <div className={cn(
              'max-w-[82%] rounded-2xl px-4 py-3 text-sm',
              msg.role === 'assistant'
                ? 'rounded-tl-sm bg-card border border-border text-foreground'
                : 'rounded-tr-sm bg-primary text-primary-foreground'
            )}>
              <div className="space-y-1">
                {renderContent(msg.content)}
              </div>
              <p className={cn(
                'mt-1.5 text-[10px]',
                msg.role === 'assistant' ? 'text-muted-foreground' : 'text-primary-foreground/70'
              )}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
              <Bot className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-3">
              <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
            </div>
          </div>
        )}

        {/* Suggested questions */}
        {showSuggestions && !isTyping && (
          <div className="mt-2">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3 w-3" />
              Suggested questions
            </p>
            <div className="flex flex-wrap gap-2">
              {suggested.slice(0, 5).map(q => (
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
            disabled={!input.trim() || isTyping}
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all',
              input.trim() && !isTyping
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-muted text-muted-foreground'
            )}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
          AI coach · Fitness & nutrition advice
        </p>
      </div>
    </div>
  )
}
