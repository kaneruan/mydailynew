"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { saveComment } from "@/lib/actions"
import type { Comment } from "@/lib/types"
import { createLogger } from "@/lib/logger"

// 创建客户端组件的日志记录器
const logger = createLogger("CommentForm")

interface CommentFormProps {
  articleId: string
  onCommentAdded?: (comment: Comment) => void
}

export default function CommentForm({ articleId, onCommentAdded }: CommentFormProps) {
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  logger.debug(`CommentForm rendered for article: ${articleId}`)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    logger.debug("Comment form submitted")

    if (!content.trim()) {
      logger.warn("Empty comment submission attempt")
      toast({
        title: "评论不能为空",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    logger.debug("Starting comment submission process")

    try {
      const newComment: Comment = {
        id: Date.now().toString(),
        articleId,
        content: content.trim(),
        userName: "匿名用户", // 在实际应用中，这应该是当前登录用户的名称
        createdAt: new Date().toISOString(),
      }

      logger.debug("Saving comment to database", { commentId: newComment.id })
      await saveComment(newComment)

      logger.info("Comment saved successfully", { commentId: newComment.id })

      toast({
        title: "评论已发布",
        description: "您的评论已成功发布",
      })

      setContent("")

      if (onCommentAdded) {
        logger.debug("Calling onCommentAdded callback")
        onCommentAdded(newComment)
      }
    } catch (error) {
      logger.error("Error saving comment", error)
      toast({
        title: "评论发布失败",
        description: "无法发布您的评论，请稍后再试",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      logger.debug("Comment submission process completed")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Textarea
          placeholder="写下您的评论..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[100px]"
        />
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "发布中..." : "发布评论"}
      </Button>
    </form>
  )
}

