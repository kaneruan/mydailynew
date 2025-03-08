import { Suspense } from "react"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { getArticleById } from "@/lib/db"
import { formatDate } from "@/lib/utils"
import HighlightableText from "@/components/highlightable-text"
import CommentSection from "@/components/comment-section"
import { createLogger } from "@/lib/logger"

// 创建服务器组件的日志记录器
const logger = createLogger("ArticlePage")

export default async function ArticlePage({ params }: { params: { id: string } }) {
  const { id } = params
  logger.info(`Rendering ArticlePage for article: ${id}`)

  const article = await getArticleById(id)

  if (!article) {
    logger.error(`Article not found: ${id}`)
    return (
      <div className="max-w-3xl mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-500">文章未找到</h1>
          <p className="mb-8">无法找到请求的文章</p>
          <Link href="/" className="modern-button">
            <ChevronLeft className="mr-2 h-4 w-4 inline" />
            返回首页
          </Link>
        </div>
      </div>
    )
  }

  logger.info(`Article found: ${article.title}`)

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/" className="modern-button-outline inline-flex items-center">
          <ChevronLeft className="mr-1 h-4 w-4" />
          返回首页
        </Link>
      </div>

      <article className="fresh-card p-6">
        <h1 className="text-2xl font-bold mb-3">{article.title}</h1>
        
        <div className="flex justify-between items-center mb-6 text-sm text-gray-500">
          <span className="category-tag">
            {article.source}
          </span>
          <span>{formatDate(article.pubDate)}</span>
        </div>

        <div className="h-px w-full bg-gray-100 dark:bg-gray-800 my-6"></div>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <Suspense fallback={<div>加载中...</div>}>
            <HighlightableText articleId={article.id} content={article.content || article.description} />
          </Suspense>
        </div>

        <div className="h-px w-full bg-gray-100 dark:bg-gray-800 my-6"></div>

        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">评论区</h2>
          <Suspense fallback={<div>加载评论中...</div>}>
            <CommentSection articleId={article.id} />
          </Suspense>
        </div>
      </article>
    </div>
  )
} 