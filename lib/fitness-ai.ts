export interface ChatMessage {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
  }
  
  interface StreamRequest {
    history: { role: 'user' | 'assistant'; content: string }[]
  }
  
  export async function streamAIResponse(
    req: StreamRequest,
    onChunk: (text: string) => void,
    signal?: AbortSignal
  ): Promise<void> {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ history: req.history }),
      signal,
    })
  
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err?.error || `API error ${response.status}`)
    }
  
    if (!response.body) throw new Error('No response body')
  
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
  
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
  
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
  
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6).trim()
        if (data === '[DONE]') return
  
        try {
          const parsed = JSON.parse(data)
          if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
            onChunk(parsed.delta.text)
          }
        } catch {
          // skip malformed lines
        }
      }
    }
  }
  
  export function getAIResponse(_text: string): string {
    return "Please use the real AI chat."
  }