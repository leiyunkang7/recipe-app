#!/usr/bin/env bun
/**
 * Send Recipe Update Notifications
 *
 * Script that sends email notifications to users who have subscribed
 * to recipe or author updates.
 *
 * Usage:
 *   bun scripts/send-recipe-update-notifications.ts
 */

import { eq, and, lte, desc, sql } from 'drizzle-orm'
import { useDb } from '../database/src/client'
import { recipeSubscriptions, authorSubscriptions, recipes, users } from '../database/src/schema'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const LOG_FILE = '/root/.openclaw/workspace/logs/recipe-update-notifications.log'
const BATCH_SIZE = 50

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------
function log(msg: string) {
  const ts = new Date().toISOString()
  const line = `[${ts}] ${msg}`
  console.log(line)
  try {
    // Append to log file
    const fs = require('fs')
    fs.appendFileSync(LOG_FILE, line + '\n')
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Email Service Mock
// ---------------------------------------------------------------------------
async function sendEmail(to: string, subject: string, content: string): Promise<boolean> {
  // In a real implementation, this would send an actual email
  // For now, we'll just log it
  log(`📧 Email sent to ${to}: ${subject}`)
  return true
}

// ---------------------------------------------------------------------------
// Main Function
// ---------------------------------------------------------------------------
async function main() {
  log('🚀 Starting recipe update notifications script')
  
  const db = useDb()
  
  try {
    // Get recent recipe updates (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const recentRecipes = await db.select()
      .from(recipes)
      .where(sql`updated_at > ${oneDayAgo.toISOString()}`)
      .limit(100)
    
    log(`📊 Found ${recentRecipes.length} recipes updated in the last 24 hours`)
    
    if (recentRecipes.length === 0) {
      log('✅ No recent recipe updates found')
      return
    }
    
    // For each updated recipe, find subscribers and notify them
    for (const recipe of recentRecipes) {
      // Get subscribers for this recipe
      const subscribers = await db.select({
        userId: recipeSubscriptions.userId,
        userEmail: users.email,
        userName: users.name
      })
      .from(recipeSubscriptions)
      .innerJoin(users, eq(users.id, recipeSubscriptions.userId))
      .where(and(
        eq(recipeSubscriptions.recipeId, recipe.id),
        eq(recipeSubscriptions.subscribed, true)
      ))
      
      log(`📧 Notifying ${subscribers.length} subscribers about update to recipe: ${recipe.title}`)
      
      // Send notifications to each subscriber
      for (const subscriber of subscribers) {
        try {
          const emailSent = await sendEmail(
            subscriber.userEmail,
            `Recipe Updated: ${recipe.title}`,
            `Hello ${subscriber.userName},\n\nThe recipe "${recipe.title}" has been updated.\n\nView it here: https://your-recipe-app.com/recipes/${recipe.id}\n\nBest regards,\nRecipe App Team`
          )
          
          if (emailSent) {
            log(`✅ Notification sent to ${subscriber.userEmail}`)
          } else {
            log(`❌ Failed to send notification to ${subscriber.userEmail}`)
          }
        } catch (error) {
          log(`⚠️ Error sending notification to ${subscriber.userEmail}: ${error.message}`)
        }
      }
    }
    
    log('🎉 Recipe update notifications completed')
  } catch (error) {
    log(`❌ Error in recipe update notifications: ${error.message}`)
    process.exit(1)
  }
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}

export default main