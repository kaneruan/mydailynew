import { Suspense } from "react"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import CommentList from "@/components/comment-list"
import { getMyComments } from "@/lib/actions"
import { createLogger } from "@/lib/logger"

// 创建服务器组件的日志记录器
const logger = createLogger("MyCommentsPage")

// 设置页面不缓存
export const revalidate = 0

export default async function MyCommentsPage() {
  logger.info("Rendering MyCommentsPage")

  logger.debug("Fetching user comments")
  const comments = await getMyComments()
  logger.info(`Retrieved ${comments.length} user comments`)

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/">
            <ChevronLeft className="mr-2 h-4 w-4" />
            返回首页
          </Link>
        </Button>
      </div>

      <h1 className="text-3xl font-bold mb-8">我的评论</h1>

      <Suspense fallback={<div>加载中...</div>}>
        <CommentList comments={comments} showArticleTitle={true} />
      </Suspense>
    </div>
  )
}

