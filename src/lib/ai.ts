import ZAI from 'z-ai-web-dev-sdk'

/**
 * Cached ZAI instance — created once and reused across requests to avoid
 * paying the SDK initialization cost on every API call.
 */
let zaiInstance: any = null

/**
 * Returns a shared, lazily-initialized ZAI client.
 * The z-ai-web-dev-sdk MUST only be used on the server side.
 */
export async function getAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create()
  }
  return zaiInstance
}
