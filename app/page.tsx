import { Suspense } from "react"
import Link from "next/link"
import { getArticles } from "@/lib/db"
import ArticleCard from "@/components/article-card"
import { Button } from "@/components/ui/button"
import { createLogger } from "@/lib/logger"
import { Pagination } from "@/components/pagination"
import RSSStatusChecker from "@/components/rss-status-checker"

// 创建服务器组件的日志记录器
const logger = createLogger("HomePage")

export default async function Home({
  searchParams,
}: {
  searchParams: { page?: string; pageSize?: string; q?: string }
}) {
  const page = Number(searchParams.page) || 1
  const pageSize = Number(searchParams.pageSize) || 12
  const searchQuery = searchParams.q || ""

  logger.info(`Rendering HomePage with page=${page}, pageSize=${pageSize}, searchQuery=${searchQuery}`)

  const { items: articles, total, hasMore } = await getArticles(page, pageSize, searchQuery)

  logger.info(`Retrieved ${articles.length} articles, total: ${total}`)

  return (
    <main>
      <div className="mb-8">
        {searchQuery ? (
          <h1 className="text-2xl font-bold mb-2">搜索结果: {searchQuery}</h1>
        ) : (
          <h1 className="text-2xl font-bold mb-2">今日推荐</h1>
        )}
        <div className="h-1 w-20 bg-cyan-500 rounded-full"></div>
      </div>
      
      <RSSStatusChecker />
      
      <Suspense fallback={<div className="text-center py-12">加载中...</div>}>
        {articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">没有找到相关文章</p>
            <Link href="/" className="modern-button">
              返回首页
            </Link>
          </div>
        )}

        {articles.length > 0 && (
          <div className="mt-10 flex justify-center">
            <Pagination 
              currentPage={page} 
              pageSize={pageSize} 
              total={total} 
              hasMore={hasMore} 
              searchQuery={searchQuery}
            />
          </div>
        )}
      </Suspense>
    </main>
  )
}

