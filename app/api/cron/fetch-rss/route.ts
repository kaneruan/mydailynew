import { type NextRequest, NextResponse } from "next/server"
import { fetchAndStoreRSS } from "@/lib/rss-fetcher"
import { createLogger } from "@/lib/logger"
import { initDatabase } from "@/lib/db"

// 创建 API 路由的日志记录器
const logger = createLogger("API:FetchRSS")

// 这个 API 路由将被定时任务调用
export async function GET(request: NextRequest) {
  logger.info("RSS fetch API called")

  try {
    // 确保数据库已初始化
    logger.debug("Ensuring database is initialized")
    await initDatabase()

    // 使用环境变量验证，而不是从 URL 获取
    const validApiKey = process.env.CRON_API_KEY || "your-secret-key"

    // 从请求头中获取 API 密钥
    const apiKey = request.headers.get("x-api-key") || ""

    logger.debug("Validating API key")

    // 允许客户端调用，但记录来源
    const isClientSide = apiKey === "client-side-fetch" || apiKey === process.env.NEXT_PUBLIC_CRON_API_KEY
    if (apiKey !== validApiKey && !isClientSide) {
      logger.warn("Unauthorized access attempt with invalid API key")
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Invalid API key",
        },
        { status: 401 },
      )
    }

    if (isClientSide) {
      logger.info("Client-side fetch triggered")
    } else {
      logger.info("Server-side fetch triggered with valid API key")
    }

    // 执行 RSS 获取和存储
    logger.debug("Starting RSS fetch and store process")
    const result = await fetchAndStoreRSS()

    logger.info(
      `RSS fetch completed successfully. Stored ${result.count} new articles out of ${result.processed} processed`,
    )

    return NextResponse.json({
      success: true,
      message: `Successfully fetched and stored ${result.count} articles`,
      timestamp: new Date().toISOString(),
      details: {
        newArticles: result.count,
        processedArticles: result.processed,
        errors: result.errors,
      },
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined

    logger.error(`Error in RSS fetch API: ${errorMessage}`, { error, stack: errorStack })

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
        stack: process.env.NODE_ENV === "development" ? errorStack : undefined,
      },
      { status: 500 },
    )
  }
}

export const dynamic = "force-dynamic"

