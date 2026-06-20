'use client'

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Bot,
  Sparkles,
  Send,
  Trash2,
  X,
  AlertCircle,
  RotateCcw,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface RecommendResponse {
  success: boolean
  reply?: string
  error?: string
}

/* ------------------------------------------------------------------ */
/* Constants                                                          */
/* ------------------------------------------------------------------ */

const SUGGESTED_PROMPTS = [
  "I'm craving something spicy",
  'Healthy dinner under ₹300',
  'Best biryani near me',
  'Surprise me with dessert',
]

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Hi, I'm Foodie AI! 🍽️ Tell me what you're in the mood for and I'll suggest something tasty.",
}

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function toHistory(messages: ChatMessage[]) {
  // Strip the welcome message and only send real user/assistant turns.
  return messages
    .filter((m) => m.id !== 'welcome')
    .map((m) => ({ role: m.role, content: m.content }))
}

/* ------------------------------------------------------------------ */
/* Typing indicator                                                   */
/* ------------------------------------------------------------------ */

function TypingDots() {
  return (
    <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-accent px-4 py-3">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="bg-muted-foreground h-2 w-2 rounded-full"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.15,
          }}
        />
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Chat body (shared between desktop panel & mobile sheet)            */
/* ------------------------------------------------------------------ */

interface ChatBodyProps {
  messages: ChatMessage[]
  loading: boolean
  error: string | null
  onSend: (text: string) => void
  onRetry: () => void
  onClear: () => void
}

function ChatBody({
  messages,
  loading,
  error,
  onSend,
  onRetry,
  onClear,
}: ChatBodyProps) {
  const [input, setInput] = React.useState('')
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLTextAreaElement>(null)

  // Auto-scroll on new messages / loading changes.
  React.useEffect(() => {
    const el = scrollRef.current
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  }, [messages, loading, error])

  const send = () => {
    const text = input.trim()
    if (!text || loading) return
    onSend(text)
    setInput('')
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const isEmpty = messages.length <= 1

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="bg-primary text-primary-foreground flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar className="bg-primary-foreground/20 size-10 border">
            <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground">
              <Sparkles className="size-5" />
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-1.5 font-semibold leading-tight">
              Foodie AI
              <span className="bg-primary-foreground/20 rounded-full px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide">
                Beta
              </span>
            </div>
            <div className="text-primary-foreground/80 text-xs">
              Your food buddy
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClear}
          aria-label="Clear conversation"
          className="text-primary-foreground hover:bg-primary-foreground/20 size-9 shrink-0"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto bg-muted/30 p-4"
      >
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}

        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-end gap-2"
          >
            <Avatar className="bg-primary/15 text-primary size-7 shrink-0">
              <AvatarFallback className="bg-primary/15 text-primary">
                <Bot className="size-4" />
              </AvatarFallback>
            </Avatar>
            <TypingDots />
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2"
          >
            <Avatar className="bg-destructive/15 text-destructive size-7 shrink-0">
              <AvatarFallback className="bg-destructive/15 text-destructive">
                <AlertCircle className="size-4" />
              </AvatarFallback>
            </Avatar>
            <div className="rounded-2xl rounded-bl-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
              <p className="text-destructive font-medium">Something went wrong</p>
              <p className="text-muted-foreground mt-0.5 text-xs">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="mt-2 h-7 gap-1.5 text-xs"
              >
                <RotateCcw className="size-3" />
                Retry
              </Button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Suggested prompts */}
      {isEmpty && !loading && !error && (
        <div className="bg-background px-3 pb-2">
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_PROMPTS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  onSend(p)
                  inputRef.current?.focus()
                }}
                className="border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="bg-background border-t p-3">
        <div className="border-input bg-muted/30 flex items-end gap-2 rounded-2xl border p-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder="Ask Foodie AI for a recommendation..."
            aria-label="Message Foodie AI"
            className="placeholder:text-muted-foreground max-h-32 flex-1 resize-none bg-transparent px-1 py-1 text-sm outline-none"
          />
          <Button
            type="button"
            size="icon"
            onClick={send}
            disabled={!input.trim() || loading}
            aria-label="Send message"
            className="size-9 shrink-0 rounded-xl"
          >
            <Send className="size-4" />
          </Button>
        </div>
        <p className="text-muted-foreground mt-1.5 px-1 text-center text-[10px]">
          Press Enter to send · Shift+Enter for a new line
        </p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Single message bubble                                              */
/* ------------------------------------------------------------------ */

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={cn(
        'flex items-end gap-2',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && (
        <Avatar className="bg-primary/15 text-primary size-7 shrink-0">
          <AvatarFallback className="bg-primary/15 text-primary">
            <Bot className="size-4" />
          </AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          'max-w-[78%] whitespace-pre-wrap break-words px-4 py-2.5 text-sm shadow-sm',
          isUser
            ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-md'
            : 'bg-card text-card-foreground rounded-2xl rounded-bl-md border'
        )}
      >
        {message.content}
      </div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/* Main component                                                     */
/* ------------------------------------------------------------------ */

export function AIAssistant() {
  const isMobile = useIsMobile()
  const [open, setOpen] = React.useState(false)
  const [messages, setMessages] = React.useState<ChatMessage[]>([WELCOME_MESSAGE])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const lastUserTextRef = React.useRef<string>('')

  const send = React.useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || loading) return

      lastUserTextRef.current = trimmed
      setError(null)

      const userMsg: ChatMessage = {
        id: uid(),
        role: 'user',
        content: trimmed,
      }
      const history = toHistory(messages)
      setMessages((prev) => [...prev, userMsg])
      setLoading(true)

      try {
        const res = await fetch('/api/ai/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: trimmed, history }),
        })
        const data: RecommendResponse = await res.json()
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to get a response.')
        }
        const aiMsg: ChatMessage = {
          id: uid(),
          role: 'assistant',
          content: data.reply || "I'm not sure what to suggest — try telling me more!",
        }
        setMessages((prev) => [...prev, aiMsg])
      } catch (err: any) {
        setError(err?.message || 'Network error. Please try again.')
      } finally {
        setLoading(false)
      }
    },
    [loading, messages]
  )

  const retry = React.useCallback(() => {
    if (lastUserTextRef.current) {
      send(lastUserTextRef.current)
    }
  }, [send])

  const clearConversation = React.useCallback(() => {
    setMessages([WELCOME_MESSAGE])
    setError(null)
    lastUserTextRef.current = ''
  }, [])

  /* ---------------- Mobile (bottom Sheet) ------------------------ */
  if (isMobile) {
    return (
      <>
        <FloatingButton open={open} onToggle={() => setOpen(true)} />
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            side="bottom"
            className="flex h-[88dvh] flex-col gap-0 p-0"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Foodie AI Assistant</SheetTitle>
              <SheetDescription>
                Chat with Foodie AI for food recommendations.
              </SheetDescription>
            </SheetHeader>
            <ChatBody
              messages={messages}
              loading={loading}
              error={error}
              onSend={send}
              onRetry={retry}
              onClear={clearConversation}
            />
          </SheetContent>
        </Sheet>
      </>
    )
  }

  /* ---------------- Desktop (floating panel) --------------------- */
  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-50 flex flex-col items-end gap-3 sm:right-6 sm:bottom-6">
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="bg-card pointer-events-auto flex h-[520px] w-[360px] flex-col overflow-hidden rounded-2xl border shadow-2xl"
          >
            <ChatBody
              messages={messages}
              loading={loading}
              error={error}
              onSend={send}
              onRetry={retry}
              onClear={clearConversation}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <FloatingButton
        open={open}
        onToggle={() => setOpen((o) => !o)}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Floating toggle button                                             */
/* ------------------------------------------------------------------ */

function FloatingButton({
  open,
  onToggle,
}: {
  open: boolean
  onToggle: () => void
}) {
  return (
    <motion.button
      type="button"
      onClick={onToggle}
      aria-label={open ? 'Close Foodie AI chat' : 'Open Foodie AI chat'}
      aria-expanded={open}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="bg-primary text-primary-foreground pointer-events-auto flex size-14 items-center justify-center rounded-full shadow-xl ring-4 ring-white/40 transition-colors hover:bg-primary/90 focus-visible:ring-ring focus-visible:outline-none"
    >
      <AnimatePresence mode="wait" initial={false}>
        {open ? (
          <motion.span
            key="close"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <X className="size-6" />
          </motion.span>
        ) : (
          <motion.span
            key="open"
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Sparkles className="size-6" />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}

export default AIAssistant
