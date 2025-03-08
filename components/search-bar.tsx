"use client"

import { useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import { createLogger } from "@/lib/logger"

const logger = createLogger("SearchBar")

export default function SearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  
  // 获取当前搜索关键词
  const currentQuery = searchParams.get("q") || ""
  const [query, setQuery] = useState(currentQuery)
  
  // 处理搜索提交
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!query.trim()) {
      // 如果搜索框为空，则清除搜索参数
      startTransition(() => {
        router.push("/")
      })
      return
    }
    
    logger.info(`Searching for: ${query}`)
    
    // 构建新的 URL 参数
    const params = new URLSearchParams(searchParams)
    params.set("q", query)
    params.set("page", "1") // 重置到第一页
    
    startTransition(() => {
      router.push(`/?${params.toString()}`)
    })
  }
  
  return (
    <form onSubmit={handleSearch} className="relative w-64">
      <input 
        type="text" 
        placeholder="搜索文章..." 
        className="search-input"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button 
        type="submit" 
        className="absolute right-3 top-2.5 text-gray-400 hover:text-cyan-500 transition-colors"
        disabled={isPending}
      >
        <Search className="h-4 w-4" />
      </button>
    </form>
  )
} 