import { type NextRequest, NextResponse } from "next/server"
import { getPaginatedArticles } from "@/lib/db"
import { createLogger } from "@/lib/logger"

const logger = createLogger("API:Articles")

export async function GET(request: NextRequest) {
  try {
    logger.info("Articles API called")

    // 获取查询参数
    const searchParams = request.nextUrl.searchParams
    const page = Number.parseInt(searchParams.get("page") || "1")
    const pageSize = Number.parseInt(searchParams.get("pageSize") || "10")

    logger.debug(`Fetching articles: page=${page}, pageSize=${pageSize}`)

    // 获取分页数据
    const result = await getPaginatedArticles(page, pageSize)

    logger.info(`Returning ${result.items.length} articles, total: ${result.total}`)

    return NextResponse.json(result)
  } catch (error) {
    logger.error("Error in articles API:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"

