import { NextRequest, NextResponse } from "next/server"
import { saveComment, getCommentsByArticleId } from "@/lib/db"
import { createLogger } from "@/lib/logger"

const logger = createLogger("CommentsAPI")

// 获取评论
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const articleId = searchParams.get("articleId")

  if (!articleId) {
    return NextResponse.json({ error: "Article ID is required" }, { status: 400 })
  }

  try {
    logger.info(`Getting comments for article: ${articleId}`)
    const comments = await getCommentsByArticleId(articleId)
    return NextResponse.json(comments)
  } catch (error) {
    logger.error(`Error getting comments: ${error}`)
    return NextResponse.json({ error: "Failed to get comments" }, { status: 500 })
  }
}

// 保存评论
export async function POST(request: NextRequest) {
  try {
    const comment = await request.json()
    
    if (!comment.articleId || !comment.content) {
      return NextResponse.json({ error: "Article ID and content are required" }, { status: 400 })
    }
    
    logger.info(`Saving comment for article: ${comment.articleId}`)
    await saveComment(comment)
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error(`Error saving comment: ${error}`)
    return NextResponse.json({ error: "Failed to save comment" }, { status: 500 })
  }
} 