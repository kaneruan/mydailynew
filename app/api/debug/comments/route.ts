import { NextResponse } from "next/server"
import { getUserComments } from "@/lib/db"
import { createLogger } from "@/lib/logger"

const logger = createLogger("API:DebugComments")

export async function GET() {
  logger.info("Debug comments API called")
  try {
    const comments = await getUserComments(50)
    logger.info(`Retrieved ${comments.length} comments for debugging`)
    
    return NextResponse.json({ 
      success: true, 
      count: comments.length,
      comments 
    })
  } catch (error) {
    logger.error("Error retrieving comments for debugging:", error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    )
  }
} 