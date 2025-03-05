import { NextResponse } from "next/server"
import type { NewsItem } from "@/lib/types"

// RSS sources with fallback URLs
const RSS_SOURCES = [
  {
    url: "https://www.huxiu.com/rss/",
    fallbackUrl: "https://rsshub.app/huxiu/article", // 使用 RSSHub 作为备用
    name: "虎嗅",
  },
  {
    url: "https://36kr.com/feed",
    fallbackUrl: "https://rsshub.app/36kr/news/latest", // 使用 RSSHub 作为备用
    name: "36氪",
  },
]

// 模拟数据，当所有 RSS 源都无法访问时使用
const FALLBACK_DATA: NewsItem[] = [
  {
    id: "fallback-1",
    title: "无法获取最新内容 - 请稍后再试",
    description: "当前无法连接到 RSS 源，这是一条占位内容。我们正在尝试恢复连接，请稍后刷新页面。",
    link: "#",
    pubDate: new Date().toISOString(),
    source: "系统消息",
  },
  {
    id: "fallback-2",
    title: "网络连接问题",
    description: "可能是由于网络连接问题导致无法获取最新内容。您可以检查网络连接或稍后再试。",
    link: "#",
    pubDate: new Date().toISOString(),
    source: "系统消息",
  },
]

export async function GET() {
  try {
    const allNews: NewsItem[] = []
    const fetchPromises = RSS_SOURCES.map(async (source) => {
      try {
        // 尝试主要 URL
        console.log(`Trying to fetch from ${source.name} primary URL: ${source.url}`)
        const response = await fetch(source.url, {
          next: { revalidate: 3600 },
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          },
        })

        if (!response.ok) {
          throw new Error(`Primary URL failed with status: ${response.status}`)
        }

        const xml = await response.text()
        const items = parseRSSItems(xml, source.name)
        allNews.push(...items)
        console.log(`Successfully fetched ${items.length} items from ${source.name}`)
      } catch (primaryError) {
        console.error(`Error fetching from ${source.name} primary URL:`, primaryError)

        // 尝试备用 URL
        if (source.fallbackUrl) {
          try {
            console.log(`Trying fallback URL for ${source.name}: ${source.fallbackUrl}`)
            const fallbackResponse = await fetch(source.fallbackUrl, {
              next: { revalidate: 3600 },
              headers: {
                "User-Agent":
                  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
              },
            })

            if (!fallbackResponse.ok) {
              throw new Error(`Fallback URL failed with status: ${fallbackResponse.status}`)
            }

            const fallbackXml = await fallbackResponse.text()
            const fallbackItems = parseRSSItems(fallbackXml, source.name)
            allNews.push(...fallbackItems)
            console.log(`Successfully fetched ${fallbackItems.length} items from ${source.name} fallback`)
          } catch (fallbackError) {
            console.error(`Error fetching from ${source.name} fallback URL:`, fallbackError)
          }
        }
      }
    })

    // 等待所有 fetch 操作完成
    await Promise.all(fetchPromises)

    // 如果没有获取到任何新闻，使用备用数据
    if (allNews.length === 0) {
      console.log("No news fetched from any source, using fallback data")
      allNews.push(...FALLBACK_DATA)
    }

    // 按发布日期排序（最新的在前）
    const sortedNews = allNews.sort((a, b) => {
      return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
    })

    return NextResponse.json(sortedNews)
  } catch (error) {
    console.error("Error in RSS API route:", error)
    // 返回备用数据而不是错误响应
    return NextResponse.json(FALLBACK_DATA)
  }
}

// 简单的 RSS XML 解析器
function parseRSSItems(xml: string, sourceName: string): NewsItem[] {
  const items: NewsItem[] = []

  try {
    // 提取 items
    const itemRegex = /<item>([\s\S]*?)<\/item>/g
    let match

    while ((match = itemRegex.exec(xml)) !== null) {
      const itemContent = match[1]

      // 提取字段
      const title = extractTag(itemContent, "title") || "无标题"
      const link = extractTag(itemContent, "link") || ""
      const description = extractTag(itemContent, "description") || extractTag(itemContent, "summary") || "无描述"
      const content = extractTag(itemContent, "content:encoded") || extractTag(itemContent, "content") || ""
      const pubDate =
        extractTag(itemContent, "pubDate") || extractTag(itemContent, "dc:date") || new Date().toISOString()
      const guid = extractTag(itemContent, "guid") || link

      // 生成唯一 ID
      const id = Buffer.from(`${sourceName}:${guid}`).toString("base64")

      items.push({
        id,
        title,
        description: cleanHtml(description),
        content,
        link,
        pubDate,
        source: sourceName,
      })
    }

    // 如果没有找到 <item> 标签，尝试查找 <entry> 标签（Atom 格式）
    if (items.length === 0) {
      const entryRegex = /<entry>([\s\S]*?)<\/entry>/g

      while ((match = entryRegex.exec(xml)) !== null) {
        const entryContent = match[1]

        const title = extractTag(entryContent, "title") || "无标题"
        const link = extractLinkFromAtom(entryContent) || ""
        const description = extractTag(entryContent, "summary") || extractTag(entryContent, "content") || "无描述"
        const content = extractTag(entryContent, "content") || ""
        const pubDate =
          extractTag(entryContent, "published") || extractTag(entryContent, "updated") || new Date().toISOString()
        const id = extractTag(entryContent, "id") || link

        items.push({
          id: Buffer.from(`${sourceName}:${id}`).toString("base64"),
          title,
          description: cleanHtml(description),
          content,
          link,
          pubDate,
          source: sourceName,
        })
      }
    }

    return items
  } catch (error) {
    console.error(`Error parsing RSS for ${sourceName}:`, error)
    return []
  }
}

// 从 Atom 格式中提取链接
function extractLinkFromAtom(xml: string): string | null {
  const regex = /<link[^>]*href=["']([^"']*)["'][^>]*>/
  const match = xml.match(regex)
  return match ? match[1] : null
}

// 辅助函数：提取标签内容
function extractTag(xml: string, tagName: string): string | null {
  const regex = new RegExp(`<${tagName}[^>]*>(.*?)<\/${tagName}>`, "s")
  const match = xml.match(regex)
  return match ? match[1].trim() : null
}

// 清理 HTML
function cleanHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "") // 移除 HTML 标签
    .replace(/&nbsp;/g, " ") // 替换 &nbsp; 为空格
    .replace(/&lt;/g, "<") // 替换 &lt; 为 <
    .replace(/&gt;/g, ">") // 替换 &gt; 为 >
    .replace(/&amp;/g, "&") // 替换 &amp; 为 &
    .replace(/&quot;/g, '"') // 替换 &quot; 为 "
    .replace(/&#39;/g, "'") // 替换 &#39; 为 '
    .trim()
}

