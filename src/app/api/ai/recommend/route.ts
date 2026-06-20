import { NextRequest, NextResponse } from 'next/server'
import { getAI } from '@/lib/ai'
import { buildCatalogContext } from '@/lib/catalog'

interface ChatTurn {
  role: string
  content: string
}

/**
 * POST /api/ai/recommend
 *
 * Conversational food recommendation chatbot ("Foodie").
 *
 * Body: { message: string, history?: {role, content}[] }
 * Returns: { success: true, reply: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const message =
      body?.message && typeof body.message === 'string'
        ? body.message.trim()
        : ''

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'A non-empty "message" string is required.' },
        { status: 400 }
      )
    }

    const historyRaw: ChatTurn[] = Array.isArray(body?.history)
      ? body.history.filter(
          (h: any) =>
            h &&
            typeof h.role === 'string' &&
            typeof h.content === 'string'
        )
      : []

    // 1. Build catalog context from the DB.
    const { context } = await buildCatalogContext()

    // 2. Compose the system prompt with the catalog baked in.
    const systemPrompt =
      'You are Foodie, a friendly and concise food recommendation assistant for a Swiggy-style delivery app in Bangalore. ' +
      'Help users discover dishes and restaurants based on their mood, cravings, dietary preferences, budget, or occasion. ' +
      'Keep replies short (2-4 sentences), warm, and suggest specific dishes from the catalog when relevant. ' +
      'Use emojis sparingly. Here is the available catalog:\n' +
      context

    // 3. Assemble the messages array (system + history + new user message).
    const messages: { role: string; content: string }[] = [
      { role: 'assistant', content: systemPrompt },
    ]

    // Map incoming history roles to the ones the SDK accepts.
    // (Be lenient: treat any non-user role as 'assistant'.)
    for (const turn of historyRaw.slice(-10)) {
      const role = turn.role === 'user' ? 'user' : 'assistant'
      messages.push({ role, content: turn.content })
    }
    messages.push({ role: 'user', content: message })

    // 4. Call the LLM.
    const zai = await getAI()
    const completion = await zai.chat.completions.create({
      messages,
      thinking: { type: 'disabled' },
    })

    const reply =
      completion?.choices?.[0]?.message?.content?.trim() ||
      'Sorry, I couldn\'t come up with a recommendation right now. Could you tell me a bit more about what you\'re craving?'

    return NextResponse.json({ success: true, reply })
  } catch (error: any) {
    console.error('[/api/ai/recommend] error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
