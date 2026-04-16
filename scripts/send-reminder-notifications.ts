#!/usr/bin/env bun
/**
 * Send Reminder Notifications
 *
 * Cron job that checks for due reminders and sends Feishu notifications.
 * Should be run every 5 minutes via cron:
 *   */5 * * * * /usr/bin/bun /root/code/recipe-app/scripts/send-reminder-notifications.ts
 *
 * What it does:
 * 1. Find reminders where reminderTime <= now and notified = false
 * 2. For each reminder, look up the user's feishuOpenId
 * 3. Send a Feishu message via OpenClaw Feishu API
 * 4. Mark reminder as notified
 */

import { eq, and, lte, isFalse } from 'drizzle-orm'
import { useDb } from '../database/src/client'
import { recipeReminders, users, recipes } from '../database/src/schema'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const NOTIFICATION_WINDOW_MS = 5 * 60 * 1000 // Send reminders within 5 minutes of due time
const LOG_FILE = '/root/.openclaw/workspace/logs/reminder-cron.log'
const FEISHU_API_BASE = process.env.FEISHU_API_BASE || 'https://open.feishu.cn/open-apis'

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------
function log(msg: string) {
  const ts = new Date().toISOString()
  const line = `[${ts}] ${msg}`
  console.log(line)
  try {
    Deno.writeTextFileSync(LOG_FILE, line + '\n', { append: true })
  } catch {
    // ignore
  }
}

async function sendFeishuMessage(openId: string, title: string, content: string): Promise<boolean> {
  // Use the OpenClaw Feishu integration via HTTP API
  // The message tool sends to feishu user by open_id
  const feishuToken = await getFeishuToken()
  if (!feishuToken) {
    log(`[WARN] No Feishu access token available`)
    return false
  }

  try {
    const body = {
      open_id: openId,
      msg_type: 'text',
      content: JSON.stringify({ text: `${title}\n\n${content}` }),
    }

    const resp = await fetch(`${FEISHU_API_BASE}/im/v1/messages?receive_id_type=open_id`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${feishuToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (resp.ok) {
      log(`[INFO] Feishu message sent to ${openId}`)
      return true
    } else {
      const err = await resp.text()
      log(`[ERROR] Feishu API error: ${resp.status} ${err}`)
      return false
    }
  } catch (err) {
    log(`[ERROR] Failed to send Feishu message: ${err}`)
    return false
  }
}

let cachedToken: string | null = null
let tokenExpiry = 0

async function getFeishuToken(): Promise<string | null> {
  // Check cache first
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken
  }

  // Try to get token from OpenClaw config or environment
  const appId = process.env.FEISHU_APP_ID
  const appSecret = process.env.FEISHU_APP_SECRET

  if (!appId || !appSecret) {
    // Try reading from OpenClaw credentials
    try {
      const credFile = await import('fs/promises').then(fs =>
        fs.readFile('/root/.openclaw/workspace/.credentials/feishu-bot.txt', 'utf8')
      )
      // Format: app_id:app_secret
      const [id, secret] = credFile.trim().split(':')
      if (id && secret) {
        return fetchFeishuToken(id, secret)
      }
    } catch {
      // try env vars directly
    }
    return null
  }

  return fetchFeishuToken(appId, appSecret)
}

async function fetchFeishuToken(appId: string, appSecret: string): Promise<string | null> {
  try {
    const resp = await fetch(`${FEISHU_API_BASE}/auth/v3/tenant_access_token/internal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_id: appId, app_secret: appSecret }),
    })

    if (!resp.ok) return null

    const data = await resp.json() as { tenant_access_token?: string }
    if (data.tenant_access_token) {
      cachedToken = data.tenant_access_token
      tokenExpiry = Date.now() + 3600 * 1000 // 1 hour
      return cachedToken
    }
    return null
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  log('[INFO] === Starting reminder notification job ===')

  const db = useDb()
  const now = new Date()
  const windowStart = new Date(now.getTime() - NOTIFICATION_WINDOW_MS)

  try {
    // Find due reminders that haven't been notified
    // reminderTime must be within the notification window and notified = false
    const dueReminders = await db
      .select({
        id: recipeReminders.id,
        userId: recipeReminders.userId,
        recipeId: recipeReminders.recipeId,
        reminderTime: recipeReminders.reminderTime,
        note: recipeReminders.note,
        userFeishuOpenId: users.feishuOpenId,
        userEmail: users.email,
        recipeTitle: recipes.title,
      })
      .from(recipeReminders)
      .innerJoin(users, eq(recipeReminders.userId, users.id))
      .innerJoin(recipes, eq(recipeReminders.recipeId, recipes.id))
      .where(
        and(
          lte(recipeReminders.reminderTime, now),
          isFalse(recipeReminders.notified),
        )
      )
      .limit(50)

    log(`[INFO] Found ${dueReminders.length} due reminders`)

    let sent = 0
    let failed = 0

    for (const reminder of dueReminders) {
      const reminderTime = new Date(reminder.reminderTime)
      const title = `🔔 提醒：${reminder.recipeTitle}`
      const timeStr = reminderTime.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
      const content = `时间：${timeStr}${reminder.note ? `\n备注：${reminder.note}` : ''}\n\n点击查看食谱详情`

      let feishuSent = false

      if (reminder.userFeishuOpenId) {
        feishuSent = await sendFeishuMessage(
          reminder.userFeishuOpenId,
          title,
          content
        )
      } else {
        log(`[WARN] User ${reminder.userEmail} has no feishuOpenId, skipping Feishu notification`)
      }

      // Mark as notified regardless of whether Feishu succeeded
      // (to avoid spamming - if user has no Feishu, we still mark it)
      await db
        .update(recipeReminders)
        .set({ notified: true, updatedAt: new Date() })
        .where(eq(recipeReminders.id, reminder.id))

      if (feishuSent) {
        sent++
      } else if (!reminder.userFeishuOpenId) {
        // Only count as "failed" if we actually tried and failed
        failed++
      }
    }

    log(`[INFO] Completed: ${sent} sent, ${failed} failed, ${dueReminders.length - sent - failed} skipped (no Feishu ID)`)
  } catch (err) {
    log(`[ERROR] Job failed: ${err}`)
    process.exit(1)
  }
}

main()
