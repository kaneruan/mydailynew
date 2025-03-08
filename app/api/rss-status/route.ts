import { NextResponse } from "next/server"
import { checkRSSStatus } from "@/lib/db"
import { createLogger } from "@/lib/logger"

const logger = createLogger("RSSStatusAPI")

export async function GET() {
  try {
    logger.info("Checking RSS status")
    const status = await checkRSSStatus()
    return NextResponse.json(status)
  } catch (error) {
    logger.error("Error checking RSS status:", error)
    return NextResponse.json({ hasErrors: true, error: "Failed to check RSS status" }, { status: 500 })
  }
} 