"use client"

import { useState, useRef, useEffect } from "react"
import { formatDistanceToNow } from "date-fns"
import { zhCN } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { saveHighlight } from "@/lib/actions"
import CommentForm from "@/components/comment-form"
import CommentList from "@/components/comment-list"
import type { Article, Highlight, Comment } from "@/lib/types"

interface ArticleViewerProps {
  article: Article
}

export default function ArticleViewer({ article }: ArticleViewerProps) {
  const [highlights, setHighlights] = useState<Highlight[]>(article.highlights || [])
  const [comments, setComments] = useState<Comment[]>(article.comments || [])
  const [selectedText, setSelectedText] = useState("")
  const [comment, setComment] = useState("")
  const [showCommentBox, setShowCommentBox] = useState(false)
  const [selectedRange, setSelectedRange] = useState<Range | null>(null)
  const articleRef = useRef<HTMLDivElement>(null)

  const timeAgo = article.pubDate
    ? formatDistanceToNow(new Date(article.pubDate), { addSuffix: true, locale: zhCN })
    : "未知时间"

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection()
      if (!selection || selection.isCollapsed) {
        setSelectedText("")
        setShowCommentBox(false)
        return
      }

      const range = selection.getRangeAt(0)
      const content = range.toString().trim()

      if (content && articleRef.current?.contains(range.commonAncestorContainer)) {
        setSelectedText(content)
        setSelectedRange(range.cloneRange())
        setShowCommentBox(true)
      }
    }

    document.addEventListener("mouseup", handleSelection)
    return () => document.removeEventListener("mouseup", handleSelection)
  }, [])

  const handleSaveHighlight = async () => {
    if (!selectedText || !selectedRange) return

    try {
      const newHighlight: Highlight = {
        id: Date.now().toString(),
        articleId: article.id,
        text: selectedText,
        comment: comment,
        createdAt: new Date().toISOString(),
      }

      await saveHighlight(newHighlight)
      setHighlights([...highlights, newHighlight])
      setSelectedText("")
      setComment("")
      setShowCommentBox(false)

      toast({
        title: "保存成功",
        description: "已保存您的划线和评论",
      })
    } catch (error) {
      toast({
        title: "保存失败",
        description: "无法保存您的划线和评论",
        variant: "destructive",
      })
    }
  }

  const handleCommentAdded = (newComment: Comment) => {
    setComments([newComment, ...comments])
  }

  const renderHighlightedContent = () => {
    let content = article.content || ""

    // 简单的高亮实现
    // 在实际应用中，你可能需要一个更健壮的解决方案
    highlights.forEach((highlight) => {
      content = content.replace(
        highlight.text,
        `<mark class="bg-yellow-100 dark:bg-yellow-800/40 relative group">
          ${highlight.text}
          <span class="absolute bottom-full left-0 hidden group-hover:block bg-background border p-2 rounded shadow-lg text-sm w-64 z-10">
            ${highlight.comment || "无评论"}
          </span>
        </mark>`,
      )
    })

    return content
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">{article.title}</h1>

      <div className="flex items-center gap-4 mb-8">
        <Badge variant="outline">{article.source}</Badge>
        <span className="text-sm text-muted-foreground">{timeAgo}</span>
      </div>

      <div
        ref={articleRef}
        className="prose dark:prose-invert max-w-none mb-8"
        dangerouslySetInnerHTML={{ __html: renderHighlightedContent() }}
      />

      {showCommentBox && selectedText && (
        <div className="fixed bottom-4 right-4 bg-background border rounded-lg shadow-lg p-4 w-80 z-50">
          <div className="mb-2">
            <p className="text-sm font-medium">已选择文本:</p>
            <p className="text-sm bg-muted p-2 rounded my-2 line-clamp-3">{selectedText}</p>
          </div>

          <Textarea
            placeholder="添加评论（可选）"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="mb-3 text-sm"
            rows={3}
          />

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowCommentBox(false)}>
              取消
            </Button>
            <Button size="sm" onClick={handleSaveHighlight}>
              保存划线
            </Button>
          </div>
        </div>
      )}

      <Tabs defaultValue="comments" className="mt-8">
        <TabsList>
          <TabsTrigger value="comments">评论 ({comments.length})</TabsTrigger>
          <TabsTrigger value="highlights">我的划线 ({highlights.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="comments" className="mt-4">
          <CommentForm articleId={article.id} onCommentAdded={handleCommentAdded} />
          <div className="mt-6">
            <CommentList comments={comments} />
          </div>
        </TabsContent>

        <TabsContent value="highlights" className="mt-4">
          {highlights.length > 0 ? (
            <div className="space-y-4">
              {highlights.map((highlight) => (
                <div key={highlight.id} className="border-l-4 border-primary pl-4 py-2">
                  <p className="italic mb-2">"{highlight.text}"</p>
                  {highlight.comment && <p className="text-sm text-muted-foreground">{highlight.comment}</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">暂无划线，选择文本并添加划线</div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

