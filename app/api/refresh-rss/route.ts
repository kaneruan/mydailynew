import { NextResponse } from "next/server"
import { fetchAndSaveArticles } from "@/lib/db"
import { createLogger } from "@/lib/logger"

const logger = createLogger("RefreshRSSAPI")

export async function POST() {
  try {
    logger.info("Manually refreshing RSS feeds")
    const result = await fetchAndSaveArticles()
    return NextResponse.json(result)
  } catch (error) {
    logger.error("Error refreshing RSS feeds:", error)
    return NextResponse.json({ 
      success: false, 
      message: "Failed to refresh RSS feeds",
      hasErrors: true
    }, { status: 500 })
  }
} 