import { formatDistanceToNow } from "date-fns"
import { zhCN } from "date-fns/locale"
import type { Comment } from "@/lib/types"

interface CommentListProps {
  comments: Comment[]
  showArticleTitle?: boolean
}

export default function CommentList({ comments, showArticleTitle = false }: CommentListProps) {
  if (comments.length === 0) {
    return <div className="text-center py-6 text-muted-foreground">暂无评论</div>
  }

  return (
    <div className="space-y-6">
      {comments.map((comment) => (
        <div key={comment.id} className="border-b pb-4">
          <div className="flex justify-between items-start mb-2">
            <div className="font-medium">{comment.userName}</div>
            <div className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: zhCN })}
            </div>
          </div>

          {showArticleTitle && "articleTitle" in comment && (
            <div className="text-sm text-muted-foreground mb-2">评论文章: {comment.articleTitle}</div>
          )}

          <p className="text-foreground">{comment.content}</p>
        </div>
      ))}
    </div>
  )
}

