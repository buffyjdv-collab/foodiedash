import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAI } from '@/lib/ai'
import { buildCatalogContext } from '@/lib/catalog'

/**
 * POST /api/ai/search
 *
 * AI-powered natural-language food search.
 *
 * Body: { query: string }
 * Returns: { success: true, items: MenuItem[], aiExplanation: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const query =
      body?.query && typeof body.query === 'string'
        ? body.query.trim()
        : ''

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'A non-empty "query" string is required.' },
        { status: 400 }
      )
    }

    // 1. Build a compact catalog context from the DB.
    const { context, items } = await buildCatalogContext()

    if (items.length === 0) {
      return NextResponse.json(
        { success: true, items: [], aiExplanation: 'No menu items are available right now.' }
      )
    }

    // 2. Build a lookup map so we can validate LLM-returned IDs quickly.
    const itemMap = new Map(items.map((it) => [it.id, it]))

    // 3. Compose the prompt asking the LLM for a JSON response with IDs + explanation.
    const systemPrompt =
      'You are a food search assistant for a delivery app. Given the user\'s natural-language query and a catalog of available dishes, return ONLY a JSON object of the form ' +
      '{"ids": ["<menuItemId>", ...], "explanation": "<one short friendly sentence>"}. ' +
      'Pick at most 8 of the best matching menu item IDs from the catalog. Only use IDs that appear in the catalog. ' +
      'Respond with valid JSON only — no markdown, no code fences, no extra text.'

    const userPrompt =
      `Catalog (each dish has an id in [id:...] format):\n${context}\n\n` +
      `User query: "${query}"\n\n` +
      `Return a JSON object with the matching dish IDs (the values inside [id:...]) and a short friendly explanation. Example: {"ids": ["id1", "id2"], "explanation": "Here are some great options!"}`

    const zai = await getAI()
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      thinking: { type: 'disabled' },
    })

    const raw = completion?.choices?.[0]?.message?.content ?? ''
    const parsed = parseSearchResponse(raw, itemMap)

    if (parsed.ids.length === 0) {
      return NextResponse.json({
        success: true,
        items: [],
        aiExplanation:
          parsed.explanation ||
          'I couldn\'t find a good match for that — try rephrasing your craving!',
      })
    }

    // 4. Fetch the full MenuItem records for the matched IDs. MenuItem has no
    //    direct `restaurant` relation (only `restaurantId`), so we hop through
    //    `menuCategory` and hoist `restaurant` up to the top level for the API
    //    response.
    const menuItems = await db.menuItem.findMany({
      where: { id: { in: parsed.ids } },
      include: { menuCategory: { include: { restaurant: true } } },
    })

    const byId = new Map(menuItems.map((m) => [m.id, m]))
    const ordered = parsed.ids
      .map((id) => byId.get(id))
      .filter((m): m is NonNullable<typeof m> => Boolean(m))
      .map(({ menuCategory, ...item }) => ({
        ...item,
        restaurant: menuCategory?.restaurant ?? null,
      }))

    return NextResponse.json({
      success: true,
      items: ordered,
      aiExplanation:
        parsed.explanation ||
        'Here are some tasty options based on your request!',
    })
  } catch (error: any) {
    console.error('[/api/ai/search] error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Extracts the {"ids": [...], "explanation": "..."} JSON object from the LLM
 * response, tolerating surrounding markdown fences / stray text. Only IDs that
 * exist in the provided catalog lookup map are kept.
 */
function parseSearchResponse(
  raw: string,
  itemMap: Map<string, unknown>
): { ids: string[]; explanation: string } {
  const fallback = { ids: [], explanation: '' }

  if (!raw) return fallback

  // Try to locate the first JSON object in the response.
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return fallback

  let parsed: any
  try {
    parsed = JSON.parse(jsonMatch[0])
  } catch {
    return fallback
  }

  const rawIds: unknown = parsed?.ids
  const ids: string[] = Array.isArray(rawIds)
    ? rawIds
        .map((x) => (typeof x === 'string' ? x : String(x ?? '')))
        .filter((id) => id.length > 0 && itemMap.has(id))
    : []

  const explanation =
    typeof parsed?.explanation === 'string' ? parsed.explanation.trim() : ''

  return { ids, explanation }
}
