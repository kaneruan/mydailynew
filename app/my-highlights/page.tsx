import Link from "next/link"
import { getAllHighlights } from "@/lib/db"
import { formatDate } from "@/lib/utils"
import { createLogger } from "@/lib/logger"

const logger = createLogger("MyHighlightsPage")

export default async function MyHighlightsPage() {
  logger.info("Rendering MyHighlightsPage")
  
  const highlights = await getAllHighlights()
  
  logger.info(`Retrieved ${highlights.length} highlights`)
  
  return (
    <main>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">我的划线</h1>
          <div className="h-1 w-20 bg-cyan-500 rounded-full"></div>
        </div>
      </div>
      
      {highlights.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">您还没有添加任何划线</p>
          <Link href="/" className="modern-button">
            浏览文章
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {highlights.map((highlight) => (
            <Link href={`/articles/${highlight.articleId}`} key={highlight.id}>
              <div className="fresh-card group hover:border-cyan-300 transition-all duration-300">
                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-medium group-hover:text-cyan-500 transition-colors line-clamp-1 flex-1">
                      {highlight.articleTitle}
                    </h3>
                    <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                      {formatDate(highlight.createdAt)}
                    </span>
                  </div>
                  
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg mb-3 border-l-2 border-yellow-400">
                    <p className="text-gray-700 dark:text-gray-300">"{highlight.text}"</p>
                    {highlight.comment && (
                      <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 italic">
                        笔记: {highlight.comment}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="category-tag">{highlight.articleSource}</span>
                    <span className="text-xs text-cyan-500 font-medium">点击查看文章</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
} 