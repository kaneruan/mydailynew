import { Suspense } from "react"
import Link from "next/link"
import { getLatestArticles } from "@/lib/db"
import InfiniteNewsFeed from "@/components/infinite-news-feed"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { MessageSquare } from "lucide-react"
import AutoFetcher from "@/components/auto-fetcher"
import { createLogger } from "@/lib/logger"

const logger = createLogger("HomePage")

export default function Home() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">每日新闻</h1>
        <Button variant="outline" size="sm" asChild>
          <Link href="/my-comments">
            <MessageSquare className="mr-2 h-4 w-4" />
            我的评论
          </Link>
        </Button>
      </div>

      <Suspense fallback={<NewsFeedSkeleton />}>
        <NewsFeedContent />
      </Suspense>

      {/* 添加自动获取组件 */}
      <AutoFetcher />
    </div>
  )
}

async function NewsFeedContent() {
  logger.debug("Fetching initial news items for homepage")
  const initialItems = await getLatestArticles(10)
  logger.info(`Fetched ${initialItems.length} initial news items`)

  return <InfiniteNewsFeed initialItems={initialItems} />
}

function NewsFeedSkeleton() {
  return (
    <div className="space-y-6">
      {Array(5)
        .fill(0)
        .map((_, i) => (
          <div key={i} className="border rounded-lg p-4 space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <div className="flex justify-between items-center pt-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        ))}
    </div>
  )
}

