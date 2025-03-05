import { Suspense } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import ArticleViewer from "@/components/article-viewer"
import { getArticleById } from "@/lib/db"
import { createLogger } from "@/lib/logger"

// 创建服务器组件的日志记录器
const logger = createLogger("ArticlePage")

interface ArticlePageProps {
  params: {
    id: string
  }
}

export default function ArticlePage({ params }: ArticlePageProps) {
  logger.info(`Rendering ArticlePage for article ID: ${params.id}`)

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/">
            <ChevronLeft className="mr-2 h-4 w-4" />
            返回列表
          </Link>
        </Button>
      </div>

      <Suspense fallback={<ArticleSkeleton />}>
        <ArticleContent id={params.id} />
      </Suspense>
    </div>
  )
}

async function ArticleContent({ id }: { id: string }) {
  logger.debug(`Fetching article content for ID: ${id}`)

  try {
    // 验证 ID 是否有效
    if (!id || id.length > 255 || !/^[a-zA-Z0-9_-]+$/.test(id)) {
      logger.warn(`Invalid article ID format: ${id}`)
      notFound()
    }

    const article = await getArticleById(id)

    if (!article) {
      logger.warn(`Article not found: ${id}`)
      notFound()
    }

    logger.info(`Article found: ${id}`, { title: article.title })
    return <ArticleViewer article={article} />
  } catch (error) {
    logger.error(`Error fetching article: ${id}`, error)
    throw new Error(`无法获取文章内容: ${error instanceof Error ? error.message : String(error)}`)
  }
}

function ArticleSkeleton() {
  logger.debug("Rendering ArticleSkeleton")
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-3/4" />
      <div className="flex items-center gap-4 mb-8">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
    </div>
  )
}

