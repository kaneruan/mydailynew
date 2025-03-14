import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { getAllComments } from "@/lib/db"
import { formatDate } from "@/lib/utils"
import { createLogger } from "@/lib/logger"

const logger = createLogger("MyCommentsPage")

export default async function MyCommentsPage() {
  logger.info("Rendering MyCommentsPage")
  
  const comments = await getAllComments()
  
  logger.info(`Retrieved ${comments.length} comments`)
  
  return (
    <main>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">我的评论</h1>
          <div className="h-1 w-20 bg-cyan-500 rounded-full"></div>
        </div>
      </div>
      
      {comments.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">您还没有发表任何评论</p>
          <Link href="/" className="modern-button">
            浏览文章
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {comments.map((comment) => (
            <Link href={`/articles/${comment.articleId}`} key={comment.id}>
              <div className="fresh-card group hover:border-cyan-300 transition-all duration-300">
                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-medium group-hover:text-cyan-500 transition-colors line-clamp-1 flex-1">
                      {comment.articleTitle}
                    </h3>
                    <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg mb-3">
                    <p className="text-gray-700 dark:text-gray-300">{comment.content}</p>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="category-tag">{comment.articleSource}</span>
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

