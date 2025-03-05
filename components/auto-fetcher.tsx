"use client"

import { useState, useEffect, useRef } from "react"
import { createLogger } from "@/lib/logger"
import { toast } from "@/components/ui/use-toast"

const logger = createLogger("AutoFetcher")
const FETCH_INTERVAL = 30 * 60 * 1000 // 30分钟
const TOAST_INTERVAL = 2 * 60 * 60 * 1000 // 2小时显示一次提示
const RETRY_DELAY = 60 * 1000 // 失败后1分钟重试
const MAX_RETRIES = 3 // 最大重试次数

export default function AutoFetcher() {
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null)
  const [lastToastTime, setLastToastTime] = useState<Date | null>(null)
  const retryCountRef = useRef(0)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    logger.info("AutoFetcher mounted, setting up interval")

    // 初始加载时获取一次，但延迟5秒，避免与页面加载冲突
    const initialTimeout = setTimeout(() => {
      fetchRSS()
    }, 5000)

    // 设置定时器
    const intervalId = setInterval(fetchRSS, FETCH_INTERVAL)

    return () => {
      clearTimeout(initialTimeout)
      clearInterval(intervalId)
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
      logger.info("AutoFetcher unmounted, cleared interval")
    }
  }, [])

  async function fetchRSS() {
    try {
      const now = new Date()
      logger.info("Triggering RSS fetch")

      // 获取 API 密钥
      const apiKey = process.env.NEXT_PUBLIC_CRON_API_KEY || "client-side-fetch"
      logger.debug(`Using API key: ${apiKey === "client-side-fetch" ? "client-side-fetch" : "***"}`)

      // 发送请求
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30秒超时

      const response = await fetch("/api/cron/fetch-rss", {
        method: "GET",
        headers: {
          "x-api-key": apiKey,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // 检查响应状态
      if (!response.ok) {
        let errorText = ""
        try {
          const errorData = await response.json()
          errorText = errorData.error || errorData.message || (await response.text()) || `HTTP error ${response.status}`
        } catch (e) {
          errorText = (await response.text()) || `HTTP error ${response.status}`
        }
        throw new Error(`HTTP error ${response.status}: ${errorText}`)
      }

      // 解析响应
      const data = await response.json()
      logger.info("RSS fetch completed", data)
      setLastFetchTime(now)
      retryCountRef.current = 0 // 重置重试计数

      // 如果有新文章并且距离上次提示已经过了足够时间，显示提示
      if (
        data.details?.newArticles > 0 &&
        (!lastToastTime || now.getTime() - lastToastTime.getTime() > TOAST_INTERVAL)
      ) {
        toast({
          title: "内容已更新",
          description: `已获取 ${data.details.newArticles} 篇新文章`,
          duration: 5000,
        })
        setLastToastTime(now)
      }

      // 如果有错误但仍然成功，记录错误
      if (data.details?.errors && data.details.errors.length > 0) {
        logger.warn("RSS fetch completed with some errors:", data.details.errors)
      }
    } catch (error) {
      // 详细记录错误
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error(`RSS fetch failed: ${errorMessage}`, error)

      // 检查是否是超时错误
      const isTimeoutError = error instanceof Error && error.name === "AbortError"

      // 显示错误提示（仅在开发环境或严重错误时）
      if (process.env.NODE_ENV === "development" || retryCountRef.current >= MAX_RETRIES) {
        toast({
          title: "更新内容失败",
          description: isTimeoutError
            ? "获取内容超时，将稍后重试"
            : `无法获取最新内容: ${errorMessage.substring(0, 100)}${errorMessage.length > 100 ? "..." : ""}`,
          variant: "destructive",
          duration: 5000,
        })
      }

      // 实现重试逻辑
      if (retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current++
        const delay = RETRY_DELAY * retryCountRef.current // 逐渐增加重试间隔
        logger.info(`Scheduling retry ${retryCountRef.current}/${MAX_RETRIES} in ${delay / 1000}s`)

        // 清除之前的重试计时器
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current)
        }

        // 设置新的重试计时器
        retryTimeoutRef.current = setTimeout(() => {
          logger.info(`Executing retry ${retryCountRef.current}/${MAX_RETRIES}`)
          fetchRSS()
        }, delay)
      } else {
        logger.warn(`Maximum retries (${MAX_RETRIES}) reached, giving up until next scheduled fetch`)
        retryCountRef.current = 0 // 重置重试计数，为下一次定时获取做准备
      }
    }
  }

  // 不渲染任何内容
  return null
}

