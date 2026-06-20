import { db } from '@/lib/db'

/**
 * Flattened menu item used for AI search context.
 * Keeps only the fields the LLM needs to match against a query.
 */
export interface CatalogItemSummary {
  id: string
  name: string
  price: number
  isVeg: boolean
  spiceLevel: number
  isBestSeller: boolean
  restaurantId: string
  restaurantName: string
  cuisine: string
}

export interface CatalogContext {
  /** Compact string representation of the catalog for LLM prompts. */
  context: string
  /** Raw flattened item summaries for downstream lookups. */
  items: CatalogItemSummary[]
  /** Number of restaurants included in the context. */
  restaurantCount: number
}

/**
 * Fetches all restaurants with their menu categories + items and builds a
 * compact catalog string (kept under ~3000 chars) suitable for LLM prompts.
 *
 * The context summarises each restaurant as:
 *   "<restaurantName> (<cuisine>, rating <r>): <dish1> ₹<p1>, <dish2> ₹<p2>, ..."
 *
 * Top dishes per restaurant are prioritised by:
 *   best seller > recommended > highest ratingCount, then price asc.
 */
export async function buildCatalogContext(
  maxRestaurants = 20,
  dishesPerRestaurant = 4
): Promise<CatalogContext> {
  const restaurants = await db.restaurant.findMany({
    where: { isActive: true },
    include: {
      menuCategories: {
        include: { items: true },
      },
    },
    orderBy: [{ isPromoted: 'desc' }, { rating: 'desc' }],
    take: maxRestaurants,
  })

  const items: CatalogItemSummary[] = []
  const lines: string[] = []

  for (const r of restaurants) {
    const allItems =
      r.menuCategories?.flatMap((cat) => cat.items ?? []) ?? []

    // Push every item into the flat list (used by the search route to verify IDs).
    for (const it of allItems) {
      items.push({
        id: it.id,
        name: it.name,
        price: it.price,
        isVeg: it.isVeg,
        spiceLevel: it.spiceLevel,
        isBestSeller: it.isBestSeller,
        restaurantId: r.id,
        restaurantName: r.name,
        cuisine: r.cuisine,
      })
    }

    // Pick a few representative dishes to keep context compact.
    const topDishes = allItems
      .slice()
      .sort((a, b) => {
        const score = (it: typeof a) =>
          (it.isBestSeller ? 1000 : 0) +
          (it.isRecommended ? 500 : 0) +
          it.ratingCount
        return score(b) - score(a)
      })
      .slice(0, dishesPerRestaurant)

    if (topDishes.length === 0) continue

    const dishStr = topDishes
      .map((d) => `${d.name} [id:${d.id}] ₹${d.price}${d.isVeg ? '(V)' : '(NV)'}${d.spiceLevel ? ' spicy' : ''}`)
      .join(', ')

    lines.push(
      `${r.name} | ${r.cuisine} | rating ${r.rating.toFixed(1)} | ₹${r.costForTwo} for two | dishes: ${dishStr}`
    )
  }

  let context = lines.join('\n')
  // Hard cap to avoid token bloat.
  if (context.length > 3000) {
    context = context.slice(0, 2997) + '...'
  }

  return {
    context,
    items,
    restaurantCount: restaurants.length,
  }
}
