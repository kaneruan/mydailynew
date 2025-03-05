import type { NewsItem } from "./types"
import { getLatestArticles } from "./db"
import { createLogger } from "./logger"

// 创建 RSS 模块的日志记录器
const logger = createLogger("RSS")

// 缓存时间（5分钟）
const CACHE_TTL = 60 * 5

// 内存缓存，用于提高性能
const memoryCache: { [key: string]: { data: any; expiry: number } } = {}

// 备用数据，当所有获取方法都失败时使用
const FALLBACK_NEWS: NewsItem[] = [
  {
    id: "offline-1",
    title: "离线模式 - 无法连接到服务器",
    description: "您当前处于离线模式，无法获取最新内容。请检查网络连接并刷新页面。",
    link: "#",
    pubDate: new Date().toISOString(),
    source: "系统消息",
  },
]

export async function fetchNews(): Promise<NewsItem[]> {
  logger.info("Fetching news")
  try {
    // 检查内存缓存
    const now = Date.now()
    if (memoryCache["latest-news"] && memoryCache["latest-news"].expiry > now) {
      logger.debug("Using memory cache for news")
      return memoryCache["latest-news"].data
    }

    logger.debug("Memory cache miss, fetching from database")

    // 从数据库获取最新文章
    const articles = await getLatestArticles(20)
    logger.info(`Retrieved ${articles.length} articles from database`)

    // 更新内存缓存
    memoryCache["latest-news"] = {
      data: articles,
      expiry: Date.now() + CACHE_TTL * 1000,
    }
    logger.debug("Updated memory cache with fresh data")

    return articles
  } catch (error) {
    logger.error("Error fetching news", error)
    logger.info("Using fallback news data")
    return FALLBACK_NEWS
  }
}

