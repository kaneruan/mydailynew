"use client"

import { useEffect, useState } from "react"
import { createLogger } from "@/lib/logger"

// 创建客户端组件的日志记录器
const logger = createLogger("DbInitializer")

export default function DbInitializer() {
  const [initialized, setInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    logger.info("DbInitializer component mounted")

    async function initDb() {
      logger.debug("Starting database initialization")
      try {
        // 添加重试逻辑
        let retries = 3
        let success = false

        while (retries > 0 && !success) {
          try {
            logger.debug(`Attempting to initialize database (attempts left: ${retries})`)
            const response = await fetch("/api/init-db")

            if (response.ok) {
              success = true
              setInitialized(true)
              logger.info("Database initialized successfully")
            } else {
              const data = await response.json()
              throw new Error(data.error || "Failed to initialize database")
            }
          } catch (err) {
            retries--
            if (retries === 0) throw err

            // 等待一段时间后重试
            logger.warn(`Database initialization failed, retrying... (${retries} attempts left)`)
            await new Promise((resolve) => setTimeout(resolve, 1000))
          }
        }
      } catch (error) {
        logger.error("Failed to initialize database:", error)

        // 如果错误包含"已存在"或"重复键"，我们可以认为数据库已经初始化
        if (
          error instanceof Error &&
          (error.message.includes("already exists") || error.message.includes("duplicate key"))
        ) {
          logger.info("Tables already exist, continuing...")
          setInitialized(true)
          return
        }

        setError(error instanceof Error ? error.message : "Failed to initialize database")
      }
    }

    initDb()

    return () => {
      logger.debug("DbInitializer component unmounted")
    }
  }, [])

  // 只在开发环境中显示错误
  if (error && process.env.NODE_ENV === "development") {
    logger.debug("Rendering error message in development mode")
    return (
      <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
        <p className="font-bold">Database Error</p>
        <p>{error}</p>
      </div>
    )
  }

  logger.debug(`DbInitializer render (initialized: ${initialized})`)
  return null // 此组件在生产环境中不渲染任何内容
}

