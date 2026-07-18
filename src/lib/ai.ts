import ZAI from 'z-ai-web-dev-sdk'
import { writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import os from 'os'

/**
 * Cached ZAI instance — created once and reused across requests to avoid
 * paying the SDK initialization cost on every API call.
 *
 * The z-ai-web-dev-sdk reads a `.z-ai-config` JSON file from disk. On Vercel
 * (serverless), files written during the build aren't available at runtime.
 * So we construct the ZAI instance directly from env vars, bypassing the
 * file-based config loading entirely.
 */
let zaiInstance: any = null

interface ZAIConfig {
  baseUrl: string
  apiKey: string
  chatId?: string
  token?: string
  userId?: string
}

/**
 * Returns a shared, lazily-initialized ZAI client.
 * The z-ai-web-dev-sdk MUST only be used on the server side.
 *
 * On Vercel: constructs directly from ZAI_* env vars (no file needed).
 * In sandbox: uses ZAI.create() which reads /etc/.z-ai-config.
 */
export async function getAI() {
  if (!zaiInstance) {
    // Try env vars first (Vercel production)
    if (process.env.ZAI_API_KEY && process.env.ZAI_BASE_URL) {
      const config: ZAIConfig = {
        baseUrl: process.env.ZAI_BASE_URL,
        apiKey: process.env.ZAI_API_KEY,
        chatId: process.env.ZAI_CHAT_ID || undefined,
        token: process.env.ZAI_TOKEN || undefined,
        userId: process.env.ZAI_USER_ID || undefined,
      }
      // Construct directly — bypasses file-based loadConfig()
      zaiInstance = new (ZAI as any)(config)
    } else {
      // Sandbox fallback: use file-based config (/etc/.z-ai-config)
      zaiInstance = await ZAI.create()
    }
  }
  return zaiInstance
}
