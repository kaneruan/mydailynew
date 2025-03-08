import Link from "next/link"
import { formatDate } from "@/lib/utils"
import type { Article } from "@/lib/types"

interface ArticleCardProps {
  article: Article
}

export default function ArticleCard({ article }: ArticleCardProps) {
  return (
    <Link href={`/articles/${article.id}`}>
      <div className="fresh-card h-full group">
        <div className="p-5">
          <h3 className="text-lg font-semibold mb-2 group-hover:text-cyan-500 transition-colors">
            {article.title}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-3 mb-4">
            {article.description}
          </p>
          <div className="flex justify-between items-center">
            <span className="category-tag">{article.source}</span>
            <span className="text-xs text-gray-500">{formatDate(article.pubDate)}</span>
          </div>
        </div>
      </div>
    </Link>
  )
} 