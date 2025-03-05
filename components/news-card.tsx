"use client"

import { useState } from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { zhCN } from "date-fns/locale"
import { BookOpen, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import type { NewsItem } from "@/lib/types"

interface NewsCardProps {
  item: NewsItem
}

export default function NewsCard({ item }: NewsCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const timeAgo = item.pubDate
    ? formatDistanceToNow(new Date(item.pubDate), { addSuffix: true, locale: zhCN })
    : "未知时间"

  return (
    <Card
      className="transition-all duration-200 hover:shadow-md"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl font-bold line-clamp-2">{item.title}</CardTitle>
          <Badge variant="outline">{item.source}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground line-clamp-3">{item.description}</p>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <div className="text-sm text-muted-foreground">{timeAgo}</div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/article/${item.id}`}>
              <BookOpen className="mr-2 h-4 w-4" />
              阅读
            </Link>
          </Button>
          {isHovered && (
            <Button variant="ghost" size="sm" asChild>
              <a href={item.link} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                原文
              </a>
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}

