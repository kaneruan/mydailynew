import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import DbInitializer from "@/components/db-initializer"
import LogViewer from "@/components/log-viewer"
import { createLogger } from "@/lib/logger"

// 创建布局组件的日志记录器
const logger = createLogger("RootLayout")

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "个人RSS新闻阅读器",
  description: "从虎嗅和36氪获取每日新闻，支持划线评论",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  logger.info("Rendering RootLayout")

  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <DbInitializer />
        {children}
        <Toaster />
        <LogViewer />
      </body>
    </html>
  )
}



import './globals.css'