"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { createLogger } from "@/lib/logger"
import NewsCard from "@/components/news-card"
import { AlertCircle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import type { NewsItem } from "@/lib/types"

const logger = createLogger("InfiniteNewsFeed")
const PAGE_SIZE = 10

export default function InfiniteNewsFeed({ initialItems = [] }: { initialItems?: NewsItem[] }) {
  const [items, setItems] = useState<NewsItem[]>(initialItems)
  const [page, setPage] = useState(initialItems.length > 0 ? 2 : 1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const observer = useRef<IntersectionObserver | null>(null)
  const lastItemRef = useRef<HTMLDivElement | null>(null)

  // 加载更多文章
  const loadMoreItems = useCallback(async () => {
    if (loading || !hasMore) return

    try {
      setLoading(true)
      logger.debug(`Loading more items: page=${page}`)

      const response = await fetch(`/api/articles?page=${page}&pageSize=${PAGE_SIZE}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      logger.debug(`Loaded ${data.items.length} more items`)

      if (data.items.length === 0) {
        setHasMore(false)
        return
      }

      setItems((prev) => [...prev, ...data.items])
      setPage((prev) => prev + 1)
      setHasMore(data.hasMore)
    } catch (err) {
      logger.error("Error loading more items:", err)
      setError(err instanceof Error ? err.message : "加载更多内容时出错")
      toast({
        title: "加载失败",
        description: "无法加载更多内容，请稍后再试",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [page, loading, hasMore])

  // 设置 Intersection Observer 来检测滚动到底部
  useEffect(() => {
    if (loading) return

    if (observer.current) {
      observer.current.disconnect()
    }

    observer.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMoreItems()
        }
      },
      { threshold: 0.5 },
    )

    if (lastItemRef.current) {
      observer.current.observe(lastItemRef.current)
    }

    return () => {
      if (observer.current) {
        observer.current.disconnect()
      }
    }
  }, [loadMoreItems, hasMore, loading])

  // 初始加载（如果没有初始数据）
  useEffect(() => {
    if (initialItems.length === 0) {
      loadMoreItems()
    }
  }, [initialItems.length, loadMoreItems])

  // 如果出现错误并且没有任何项目，显示错误信息
  if (error && items.length === 0) {
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

  return (
    <div className="space-y-6">
      {items.length === 0 && loading ? (
        // 初始加载骨架屏
        <NewsFeedSkeleton />
      ) : (
        // 渲染新闻列表
        <>
          {items.map((item, index) => {
            if (index === items.length - 1) {
              // 最后一个项目，添加 ref 用于无限滚动
              return (
                <div key={item.id} ref={lastItemRef}>
                  <NewsCard item={item} />
                </div>
              )
            } else {
              return <NewsCard key={item.id} item={item} />
            }
          })}

          {/* 加载更多指示器 */}
          {loading && (
            <div className="py-4 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
              <p className="mt-2 text-sm text-muted-foreground">加载更多...</p>
            </div>
          )}

          {/* 没有更多内容 */}
          {!hasMore && items.length > 0 && (
            <div className="py-6 text-center">
              <p className="text-muted-foreground">已经到底了，没有更多内容</p>
            </div>
          )}

          {/* 手动加载更多按钮 */}
          {hasMore && !loading && items.length > 0 && (
            <div className="py-4 text-center">
              <Button variant="outline" onClick={() => loadMoreItems()} disabled={loading}>
                加载更多
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
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

