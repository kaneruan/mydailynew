import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import DbInitializer from "@/components/db-initializer"
import LogViewer from "@/components/log-viewer"
import { createLogger } from "@/lib/logger"
import Link from "next/link"
import { Search } from "lucide-react"
import SearchBar from "@/components/search-bar"

// 创建布局组件的日志记录器
const logger = createLogger("RootLayout")

// 使用更现代的字体
const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "科技新闻阅读器",
  description: "一个现代化的科技新闻阅读应用",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  logger.info("Rendering RootLayout")

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={`${inter.className} gradient-bg min-h-screen`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={true}
          disableTransitionOnChange
        >
          <header className="modern-nav">
            <div className="flex items-center space-x-6">
              <Link href="/" className="text-xl font-bold text-cyan-500">科技资讯</Link>
              <nav className="hidden md:flex space-x-6">
                <Link href="/" className="font-medium">推荐</Link>
                <Link href="/my-highlights" className="font-medium">我的划线</Link>
                <Link href="/my-comments" className="font-medium">我的评论</Link>
              </nav>
            </div>
            <SearchBar />
          </header>
          
          <div className="container mx-auto px-4 py-6">
            <DbInitializer />
            {children}
          </div>
          
          <Toaster />
          <LogViewer />
        </ThemeProvider>
      </body>
    </html>
  )
}

import './globals.css'