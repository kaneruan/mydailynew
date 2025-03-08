"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { formatDate, generateId } from "@/lib/utils"
import { createLogger } from "@/lib/logger"

const logger = createLogger("CommentSection")

interface Comment {
  id: string
  articleId: string
  content: string
  userName: string
  createdAt: string
}

interface CommentSectionProps {
  articleId: string
}

export default function CommentSection({ articleId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [userName, setUserName] = useState("匿名用户")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // 获取文章的所有评论
  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await fetch(`/api/comments?articleId=${articleId}`)
        if (response.ok) {
          const data = await response.json()
          setComments(data)
        }
      } catch (error) {
        logger.error("Error fetching comments:", error)
      }
    }

    fetchComments()
  }, [articleId])

  // 提交评论
  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newComment.trim()) {
      toast({
        title: "评论不能为空",
        description: "请输入评论内容",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      const commentData = {
        id: generateId("cm_"),
        articleId,
        content: newComment.trim(),
        userName: userName.trim() || "匿名用户",
        createdAt: new Date().toISOString()
      }

      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(commentData)
      })

      if (response.ok) {
        // 添加新评论到列表
        setComments([commentData, ...comments])
        setNewComment("")
        
        toast({
          title: "评论已发布",
          description: "您的评论已成功发布",
          variant: "default"
        })
      } else {
        throw new Error("Failed to post comment")
      }
    } catch (error) {
      logger.error("Error posting comment:", error)
      toast({
        title: "发布失败",
        description: "无法发布您的评论，请稍后再试",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <form onSubmit={submitComment} className="mb-6">
        <div className="mb-4">
          <label htmlFor="userName" className="block text-sm font-medium mb-1">
            您的昵称
          </label>
          <input
            type="text"
            id="userName"
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="匿名用户"
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="comment" className="block text-sm font-medium mb-1">
            评论内容
          </label>
          <textarea
            id="comment"
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            rows={4}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="分享您的想法..."
            required
          />
        </div>
        
        <button
          type="submit"
          className="px-4 py-2 bg-cyan-500 text-white rounded-md hover:bg-cyan-600 disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? "发布中..." : "发表评论"}
        </button>
      </form>

      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-center text-gray-500 py-4">暂无评论，来发表第一条评论吧！</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">{comment.userName}</span>
                <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
              </div>
              <p className="text-gray-700 dark:text-gray-300">{comment.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
} 