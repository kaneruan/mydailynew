import type { NewsItem } from "./types"
import { saveArticle } from "./db"
import { createLogger } from "./logger"

// 创建 RSS 获取器模块的日志记录器
const logger = createLogger("RSSFetcher")

// 定义 RSS 源的接口
interface RSSSource {
  url: string;
  fallbackUrl: string;
  name: string;
  alternateUrls?: string[];
}

// RSS 源配置
const RSS_SOURCES = [
  {
    url: "https://www.huxiu.com/rss/",
    fallbackUrl: "https://rsshub.app/huxiu/article",
    name: "虎嗅",
    // 添加更多备用 URL
    alternateUrls: [
      "https://feedx.net/rss/huxiu.xml", 
      "https://rsshub.app/huxiu/article",
      "https://rsshub.app/huxiu/tag/103",  // 虎嗅-科技标签
      "https://rsshub.app/huxiu/collection/38" // 虎嗅-24小时热文
    ],
  },
  {
    url: "https://36kr.com/feed",
    fallbackUrl: "https://rsshub.app/36kr/news/latest",
    name: "36氪",
    // 添加更多备用 URL
    alternateUrls: ["https://feedx.net/rss/36kr.xml", "https://rsshub.app/36kr/news/latest"],
  },
]

// 为虎嗅添加静态备用内容
const HUXIU_FALLBACK = [
  {
    id: "huxiu_fallback_1",
    title: "科技创新如何改变我们的生活",
    description: "探讨最新科技趋势对日常生活的影响",
    content: "随着人工智能、区块链和物联网等技术的发展，我们的生活方式正在发生翻天覆地的变化...",
    link: "https://www.huxiu.com",
    pubDate: new Date().toISOString(),
    source: "虎嗅"
  },
  {
    id: "huxiu_fallback_2",
    title: "数字经济时代的商业变革",
    description: "分析数字化转型对企业发展的重要性",
    content: "在数字经济时代，企业必须适应新的商业模式和运营方式...",
    link: "https://www.huxiu.com",
    pubDate: new Date().toISOString(),
    source: "虎嗅"
  }
];

// 修改 fetchWithTimeout 函数，增加更多的错误处理和重试机制
async function fetchWithTimeout(url: string, timeout = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml, text/html',
        'Cache-Control': 'no-cache'
      }
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

// 获取 RSS 内容的函数
export async function fetchRSS(source: RSSSource) {
  logger.info(`Fetching RSS from ${source.name}`)
  
  // 尝试所有可能的 URL
  const urlsToTry = [source.url, source.fallbackUrl, ...(source.alternateUrls || [])];
  
  for (const url of urlsToTry) {
    try {
      logger.debug(`Trying URL for ${source.name}: ${url}`)
      const response = await fetchWithTimeout(url, 8000);
      
      if (!response.ok) {
        logger.warn(`Non-OK response from ${url}: ${response.status}`)
        continue;
      }
      
      const text = await response.text();
      logger.info(`Successfully fetched RSS from ${url} for ${source.name}`)
      return { text, source: source.name };
    } catch (error) {
      logger.error(`Error fetching from URL ${url} for ${source.name}: ${error instanceof Error ? error.message : String(error)}`)
      // 继续尝试下一个 URL
    }
  }
  
  // 所有 URL 都失败了
  logger.error(`All URLs failed for ${source.name}`)
  return null;
}

// 使用模拟数据，当所有 RSS 源都无法访问时使用
const FALLBACK_NEWS = [
  {
    id: "fallback-1",
    title: "无法获取最新内容 - 请稍后再试",
    description: "当前无法连接到 RSS 源，这是一条占位内容。我们正在尝试恢复连接，请稍后刷新页面。",
    link: "#",
    pubDate: new Date().toISOString(),
    source: "系统消息",
    content: "当前无法连接到 RSS 源，这是一条占位内容。我们正在尝试恢复连接，请稍后刷新页面。"
  },
  {
    id: "fallback-2",
    title: "网络连接问题",
    description: "可能是由于网络连接问题导致无法获取最新内容。您可以检查网络连接或稍后再试。",
    link: "#",
    pubDate: new Date().toISOString(),
    source: "系统消息",
    content: "可能是由于网络连接问题导致无法获取最新内容。您可以检查网络连接或稍后再试。"
  },
]

export async function fetchAndStoreRSS() {
  logger.info("Starting RSS fetch and store process")
  let fetchedCount = 0
  let processedCount = 0
  let anySourceSucceeded = false
  const errors: string[] = []

  try {
    for (const source of RSS_SOURCES) {
      logger.info(`Processing RSS source: ${source.name}`)
      try {
        // 尝试所有可能的 URL
        const allUrls = [source.url, source.fallbackUrl, ...(source.alternateUrls || [])]
        let xml = null
        let successUrl = ""
        const urlErrors: string[] = []

        // 尝试每个 URL，直到成功
        for (const url of allUrls) {
          if (!url) continue

          try {
            logger.debug(`Trying URL for ${source.name}: ${url}`)
            const response = await fetchWithTimeout(url, 15000) // 增加超时时间

            if (response.ok) {
              xml = await response.text()
              successUrl = url
              logger.info(`Successfully fetched RSS from ${source.name} using URL: ${url}`)
              break
            } else {
              const errorMsg = `Failed to fetch from URL ${url} for ${source.name}: ${response.status} ${response.statusText}`
              logger.warn(errorMsg)
              urlErrors.push(errorMsg)
            }
          } catch (urlError) {
            const errorMsg = `Error fetching from URL ${url} for ${source.name}: ${urlError instanceof Error ? urlError.message : String(urlError)}`
            logger.error(errorMsg)
            urlErrors.push(errorMsg)
          }
        }

        // 如果所有 URL 都失败，尝试第三方解析器
        if (!xml) {
          logger.warn(`All direct URLs failed for ${source.name}, trying third-party parser`)
          const thirdPartyItems = await tryThirdPartyParser(source)
          
          if (thirdPartyItems && thirdPartyItems.length > 0) {
            logger.info(`Successfully got ${thirdPartyItems.length} items from third-party parser for ${source.name}`)
            
            // 保存从第三方解析器获取的文章
            for (const item of thirdPartyItems) {
              try {
                await saveArticle(item)
                fetchedCount++
              } catch (itemError) {
                logger.error(`Error saving third-party item: ${itemError instanceof Error ? itemError.message : String(itemError)}`)
              }
            }
            
            anySourceSucceeded = true
            continue // 继续处理下一个源
          }
          
          // 如果是虎嗅，使用静态备用内容
          if (source.name === "虎嗅") {
            logger.warn(`Using static fallback content for ${source.name}`)
            for (const item of HUXIU_FALLBACK) {
              try {
                await saveArticle(item)
                fetchedCount++
              } catch (fallbackError) {
                logger.error(`Error saving fallback item for ${source.name}: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`)
              }
            }
            anySourceSucceeded = true
            continue // 继续处理下一个源
          }
          
          const errorMsg = `All URLs failed for ${source.name}: ${urlErrors.join("; ")}`
          throw new Error(errorMsg)
        }

        // 解析 RSS 内容
        logger.debug(`Parsing XML content for ${source.name} from ${successUrl}`)
        const items = parseRSSItems(xml, source.name)

        logger.info(`Parsed ${items.length} items from ${source.name}`)
        processedCount += items.length
        anySourceSucceeded = true

        // 存储文章到数据库
        let savedCount = 0
        for (const item of items) {
          try {
            logger.debug(`Processing item: ${item.id}`, { title: item.title })
            await saveArticle(item)
            savedCount++
            fetchedCount++
            logger.debug(`Article processed: ${item.id}`)
          } catch (itemError) {
            logger.error(`Error processing item: ${itemError instanceof Error ? itemError.message : String(itemError)}`)
            continue
          }
        }

        logger.info(`Completed processing ${source.name}, saved ${savedCount} new articles`)
      } catch (sourceError) {
        const errorMsg = `Error fetching RSS from ${source.name}: ${sourceError instanceof Error ? sourceError.message : String(sourceError)}`
        logger.error(errorMsg)
        errors.push(errorMsg)
        continue
      }
    }

    // 如果所有源都失败，保存一些备用数据
    if (!anySourceSucceeded) {
      logger.warn("All RSS sources failed, saving fallback data")
      logger.error(`RSS fetch errors: ${errors.join("; ")}`)

      for (const item of FALLBACK_NEWS) {
        try {
          await saveArticle(item)
          fetchedCount++
        } catch (fallbackError) {
          logger.error("Error saving fallback data:", fallbackError)
        }
      }
    }

    logger.info(
      `RSS fetch and store process completed. Processed ${processedCount} items, saved ${fetchedCount} new articles.`,
    )
    return { count: fetchedCount, processed: processedCount, errors: errors.length > 0 ? errors : undefined }
  } catch (error) {
    const errorMsg = `Fatal error in RSS fetch and store process: ${error instanceof Error ? error.message : String(error)}`
    logger.error(errorMsg)
    return { count: fetchedCount, processed: processedCount, errors: [errorMsg, ...errors] }
  }
}

// 从 Atom 格式中提取链接
function extractLinkFromAtom(xml: string): string | null {
  logger.debug("Extracting link from Atom format")
  const regex = /<link[^>]*href=["']([^"']*)["'][^>]*>/
  const match = xml.match(regex)
  const result = match ? match[1] : null
  logger.debug(`Extracted link: ${result}`)
  return result
}

// 辅助函数：提取标签内容
function extractTag(xml: string, tagName: string): string | null {
  const regex = new RegExp(`<${tagName}[^>]*>(.*?)<\/${tagName}>`, "s")
  const match = xml.match(regex)
  const result = match ? match[1].trim() : null
  return result
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

// 简单的 RSS XML 解析器
function parseRSSItems(xml: string, sourceName: string): NewsItem[] {
  logger.debug(`Parsing RSS XML for ${sourceName}`)
  const items: NewsItem[] = []

  try {
    // 提取 items
    const itemRegex = /<item>([\s\S]*?)<\/item>/g
    let match
    let itemCount = 0

    while ((match = itemRegex.exec(xml)) !== null) {
      itemCount++
      logger.debug(`Parsing item ${itemCount} for ${sourceName}`)
      const itemContent = match[1]

      // 提取字段
      const title = extractTag(itemContent, "title") || "无标题"
      const link = extractTag(itemContent, "link") || ""
      const description = extractTag(itemContent, "description") || extractTag(itemContent, "summary") || "无描述"
      const content = extractTag(itemContent, "content:encoded") || extractTag(itemContent, "content") || ""
      const pubDate =
        extractTag(itemContent, "pubDate") || extractTag(itemContent, "dc:date") || new Date().toISOString()
      const guid = extractTag(itemContent, "guid") || link

      // 生成唯一 ID - 使用更安全的方法
      const id = generateSafeId(sourceName, guid || link, title)

      logger.debug(`Parsed item: ${id}`, { title, link })

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
      logger.debug(`No <item> tags found for ${sourceName}, trying Atom format with <entry> tags`)
      const entryRegex = /<entry>([\s\S]*?)<\/entry>/g
      let entryCount = 0

      while ((match = entryRegex.exec(xml)) !== null) {
        entryCount++
        logger.debug(`Parsing entry ${entryCount} for ${sourceName}`)
        const entryContent = match[1]

        const title = extractTag(entryContent, "title") || "无标题"
        const link = extractLinkFromAtom(entryContent) || ""
        const description = extractTag(entryContent, "summary") || extractTag(entryContent, "content") || "无描述"
        const content = extractTag(entryContent, "content") || ""
        const pubDate =
          extractTag(entryContent, "published") || extractTag(entryContent, "updated") || new Date().toISOString()
        const id = extractTag(entryContent, "id") || link

        // 使用更安全的 ID 生成方法
        const safeId = generateSafeId(sourceName, id || link, title)

        logger.debug(`Parsed entry: ${safeId}`, { title, link })

        items.push({
          id: safeId,
          title,
          description: cleanHtml(description),
          content,
          link,
          pubDate,
          source: sourceName,
        })
      }
    }

    logger.info(`Successfully parsed ${items.length} items for ${sourceName}`)
    return items
  } catch (error) {
    logger.error(`Error parsing RSS for ${sourceName}:`, error)
    return []
  }
}

// 生成安全的 ID
function generateSafeId(source: string, link: string, title: string): string {
  // 使用简单的哈希算法
  let hash = 0
  const str = `${source}:${link}:${title}`
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // 转换为32位整数
  }

  // 转换为16进制字符串并确保为正数
  const hexHash = Math.abs(hash).toString(16)

  // 添加前缀以确保唯一性
  return `article_${source.substring(0, 5).replace(/\W/g, "")}_${hexHash}`.substring(0, 250)
}

// 在 fetchAndStoreRSS 函数中添加备选方案
async function tryThirdPartyParser(source: RSSSource) {
  try {
    logger.info(`Trying third-party RSS parser for ${source.name}`);
    // 使用 rss2json API 作为备选
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(source.url)}`;
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RSS Reader/1.0)'
      }
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    if (data.status !== 'ok') {
      return null;
    }
    
    // 转换为我们的格式
    return data.items.map((item: any) => ({
      id: generateSafeId(source.name, item.link, item.title),
      title: item.title,
      description: cleanHtml(item.description),
      content: item.content,
      link: item.link,
      pubDate: item.pubDate,
      source: source.name
    }));
  } catch (error) {
    logger.error(`Error using third-party parser for ${source.name}: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

