"use client"

import { useState, useEffect, useRef } from "react"
import { useToast } from "@/components/ui/use-toast"
import { generateId } from "@/lib/utils"
import { createLogger } from "@/lib/logger"

const logger = createLogger("HighlightableText")

interface HighlightableTextProps {
  articleId: string
  content: string
}

export default function HighlightableText({ articleId, content }: HighlightableTextProps) {
  const [selectedText, setSelectedText] = useState("")
  const [comment, setComment] = useState("")
  const [showCommentInput, setShowCommentInput] = useState(false)
  const [highlights, setHighlights] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const textRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // 获取文章的所有划线
  useEffect(() => {
    const fetchHighlights = async () => {
      try {
        const response = await fetch(`/api/highlights?articleId=${articleId}`)
        if (response.ok) {
          const data = await response.json()
          setHighlights(data)
        }
      } catch (error) {
        logger.error("Error fetching highlights:", error)
      }
    }

    fetchHighlights()
  }, [articleId])

  // 处理文本选择
  const handleTextSelection = () => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) {
      return
    }

    const text = selection.toString().trim()
    if (text) {
      setSelectedText(text)
      setShowCommentInput(true)
    }
  }

  // 保存划线和评论
  const saveHighlight = async () => {
    if (!selectedText) return

    setIsLoading(true)
    try {
      const highlightData = {
        id: generateId("hl_"),
        articleId,
        text: selectedText,
        comment: comment.trim() || null
      }

      const response = await fetch("/api/highlights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(highlightData)
      })

      if (response.ok) {
        // 添加新的划线到列表
        setHighlights([...highlights, highlightData])
        
        toast({
          title: "划线已保存",
          description: "您的划线和笔记已成功保存",
          variant: "default"
        })
      } else {
        throw new Error("Failed to save highlight")
      }
    } catch (error) {
      logger.error("Error saving highlight:", error)
      toast({
        title: "保存失败",
        description: "无法保存您的划线，请稍后再试",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
      setSelectedText("")
      setComment("")
      setShowCommentInput(false)
      window.getSelection()?.removeAllRanges()
    }
  }

  // 取消划线
  const cancelHighlight = () => {
    setSelectedText("")
    setComment("")
    setShowCommentInput(false)
    window.getSelection()?.removeAllRanges()
  }

  // 高亮显示文本
  const highlightContent = () => {
    let processedContent = content

    // 简单的HTML转义
    processedContent = processedContent
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;")
      .replace(/\n/g, "<br>")

    // 为每个划线添加高亮
    highlights.forEach(highlight => {
      const escapedText = highlight.text
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&") // 转义正则表达式特殊字符
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
      
      const regex = new RegExp(escapedText, "g")
      processedContent = processedContent.replace(
        regex,
        `<span class="bg-yellow-200 dark:bg-yellow-800/50 px-1 rounded" title="${
          highlight.comment || "点击查看划线"
        }">${highlight.text}</span>`
      )
    })

    return processedContent
  }

  return (
    <div>
      <div 
        ref={textRef}
        className="article-content"
        onMouseUp={handleTextSelection}
        dangerouslySetInnerHTML={{ __html: highlightContent() }}
      />

      {showCommentInput && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 p-4 shadow-lg border-t border-gray-200 dark:border-gray-700 z-50">
          <div className="max-w-3xl mx-auto">
            <div className="mb-2">
              <p className="font-medium mb-1">已选择文本:</p>
              <p className="bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded">{selectedText}</p>
            </div>
            
            <div className="mb-4">
              <label htmlFor="comment" className="block font-medium mb-1">添加笔记 (可选):</label>
              <textarea
                id="comment"
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                rows={2}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="添加您的想法..."
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={cancelHighlight}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                disabled={isLoading}
              >
                取消
              </button>
              <button
                onClick={saveHighlight}
                className="px-4 py-2 bg-cyan-500 text-white rounded-md hover:bg-cyan-600 disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? "保存中..." : "保存划线"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 