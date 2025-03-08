import { NextRequest, NextResponse } from "next/server"
import { saveHighlight, getHighlightsByArticleId } from "@/lib/db"
import { createLogger } from "@/lib/logger"

const logger = createLogger("HighlightsAPI")

// 获取划线
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const articleId = searchParams.get("articleId")

  if (!articleId) {
    return NextResponse.json({ error: "Article ID is required" }, { status: 400 })
  }

  try {
    logger.info(`Getting highlights for article: ${articleId}`)
    const highlights = await getHighlightsByArticleId(articleId)
    return NextResponse.json(highlights)
  } catch (error) {
    logger.error(`Error getting highlights: ${error}`)
    return NextResponse.json({ error: "Failed to get highlights" }, { status: 500 })
  }
}

// 保存划线
export async function POST(request: NextRequest) {
  try {
    const highlight = await request.json()
    
    if (!highlight.articleId || !highlight.text) {
      return NextResponse.json({ error: "Article ID and text are required" }, { status: 400 })
    }
    
    logger.info(`Saving highlight for article: ${highlight.articleId}`)
    await saveHighlight(highlight)
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error(`Error saving highlight: ${error}`)
    return NextResponse.json({ error: "Failed to save highlight" }, { status: 500 })
  }
} 