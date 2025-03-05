"use server"

import { saveHighlight as dbSaveHighlight, saveComment as dbSaveComment, getUserComments } from "./db"
import type { Highlight, Comment } from "./types"
import { createLogger } from "./logger"

// 创建服务器操作的日志记录器
const logger = createLogger("ServerActions")

export async function saveHighlight(highlight: Highlight): Promise<void> {
  logger.info(`Saving highlight for article: ${highlight.articleId}`, { highlightId: highlight.id })
  try {
    await dbSaveHighlight(highlight)
    logger.info(`Highlight saved successfully: ${highlight.id}`)
  } catch (error) {
    logger.error(`Error saving highlight: ${highlight.id}`, error)
    throw error // 重新抛出错误，让客户端处理
  }
}

export async function saveComment(comment: Comment): Promise<void> {
  logger.info(`Saving comment for article: ${comment.articleId}`, { commentId: comment.id })
  try {
    await dbSaveComment(comment)
    logger.info(`Comment saved successfully: ${comment.id}`)
  } catch (error) {
    logger.error(`Error saving comment: ${comment.id}`, error)
    throw error // 重新抛出错误，让客户端处理
  }
}

export async function getMyComments(): Promise<Comment[]> {
  logger.info("Fetching user comments")
  try {
    const comments = await getUserComments(20)
    logger.info(`Retrieved ${comments.length} user comments`)
    return comments.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  } catch (error) {
    logger.error("Error fetching user comments", error)
    return [] // 返回空数组，避免客户端错误
  }
}

