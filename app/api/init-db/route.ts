import { NextResponse } from "next/server"
import { initDatabase } from "@/lib/db"
import { createLogger } from "@/lib/logger"

// 创建 API 路由的日志记录器
const logger = createLogger("API:InitDB")

export async function GET() {
  logger.info("Database initialization API called")
  try {
    await initDatabase()
    logger.info("Database initialization completed successfully")
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error("Database initialization failed:", error)

    // 如果错误是关于表已存在，我们可以返回成功
    if (
      error instanceof Error &&
      (error.message.includes("already exists") || error.message.includes("duplicate key"))
    ) {
      logger.info("Tables already exist, returning success")
      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to initialize database" },
      { status: 500 },
    )
  }
}

