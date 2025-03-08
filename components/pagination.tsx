import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { createLogger } from "@/lib/logger"

const logger = createLogger("Pagination")

interface PaginationProps {
  currentPage: number
  pageSize: number
  total: number
  hasMore: boolean
  searchQuery?: string
}

export function Pagination({ currentPage, pageSize, total, hasMore, searchQuery }: PaginationProps) {
  logger.debug(`Rendering Pagination: page=${currentPage}, pageSize=${pageSize}, total=${total}, searchQuery=${searchQuery || 'none'}`)
  
  const totalPages = Math.ceil(total / pageSize)
  
  // 计算要显示的页码范围
  const range = 2 // 当前页前后显示的页数
  let startPage = Math.max(1, currentPage - range)
  let endPage = Math.min(totalPages, currentPage + range)
  
  // 确保总是显示至少 5 个页码（如果有那么多页的话）
  if (endPage - startPage + 1 < 5) {
    if (startPage === 1) {
      endPage = Math.min(5, totalPages)
    } else if (endPage === totalPages) {
      startPage = Math.max(1, totalPages - 4)
    }
  }
  
  const pages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i)
  
  // 构建基础 URL 参数
  const getPageUrl = (pageNum: number) => {
    const params = new URLSearchParams()
    params.set("page", pageNum.toString())
    params.set("pageSize", pageSize.toString())
    if (searchQuery) {
      params.set("q", searchQuery)
    }
    return `/?${params.toString()}`
  }
  
  return (
    <div className="modern-pagination">
      <Link 
        href={getPageUrl(currentPage - 1)} 
        aria-label="上一页"
        className={`modern-pagination-item ${currentPage <= 1 ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <ChevronLeft className="h-4 w-4" />
      </Link>
      
      {startPage > 1 && (
        <>
          <Link 
            href={getPageUrl(1)}
            className="modern-pagination-item"
          >
            1
          </Link>
          {startPage > 2 && (
            <span className="modern-pagination-item">...</span>
          )}
        </>
      )}
      
      {pages.map(page => (
        <Link
          key={page}
          href={getPageUrl(page)}
          className={`modern-pagination-item ${page === currentPage ? 'active' : ''}`}
        >
          {page}
        </Link>
      ))}
      
      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && (
            <span className="modern-pagination-item">...</span>
          )}
          <Link 
            href={getPageUrl(totalPages)}
            className="modern-pagination-item"
          >
            {totalPages}
          </Link>
        </>
      )}
      
      <Link 
        href={getPageUrl(currentPage + 1)} 
        aria-label="下一页"
        className={`modern-pagination-item ${!hasMore ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  )
} 