import { getUserComments } from "@/lib/db"
import { createLogger } from "@/lib/logger"

const logger = createLogger("DebugCommentsPage")

export default async function DebugCommentsPage() {
  logger.info("Debug comments page rendered")
  
  const comments = await getUserComments(50)
  logger.info(`Retrieved ${comments.length} comments for debugging`)
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-4">调试评论数据</h1>
      
      <div className="bg-gray-100 p-4 rounded mb-4">
        <p>找到 {comments.length} 条评论</p>
      </div>
      
      <pre className="bg-gray-800 text-white p-4 rounded overflow-auto max-h-[500px]">
        {JSON.stringify(comments, null, 2)}
      </pre>
    </div>
  )
} 