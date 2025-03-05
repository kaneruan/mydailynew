import { fetchNews } from "@/lib/rss"
import NewsCard from "@/components/news-card"
import { AlertCircle } from "lucide-react"
import { createLogger } from "@/lib/logger"

// 创建服务器组件的日志记录器
const logger = createLogger("NewsFeed")

export default async function NewsFeed() {
  logger.info("Rendering NewsFeed component")
  let news = []
  let error = null

  try {
    logger.debug("Fetching news data")
    news = await fetchNews()
    logger.info(`Fetched ${news.length} news items`)
  } catch (e) {
    logger.error("Error in NewsFeed component:", e)
    error = e instanceof Error ? e.message : "未知错误"
  }

  if (error) {
    logger.warn(`Rendering error state: ${error}`)
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <div className="flex justify-center mb-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-red-800 mb-2">获取新闻失败</h3>
        <p className="text-red-600">{error}</p>
        <p className="mt-4 text-sm text-red-600">请稍后刷新页面重试</p>
      </div>
    )
  }

  logger.debug("Rendering news list")
  return (
    <div className="space-y-6">
      {news.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-muted-foreground">无法获取新闻，请稍后再试</p>
        </div>
      ) : (
        news.map((item) => {
          logger.debug(`Rendering news item: ${item.id}`, { title: item.title })
          return <NewsCard key={item.id} item={item} />
        })
      )}
    </div>
  )
}

