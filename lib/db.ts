import { sql } from "@vercel/postgres"
import type { NewsItem, Article, Highlight, Comment } from "./types"
import { createLogger } from "./logger"

// 创建数据库模块的日志记录器
const logger = createLogger("Database")

// 跟踪数据库是否已初始化
let isDbInitialized = false

// 初始化数据库（如果表不存在则创建）
export async function initDatabase() {
  if (isDbInitialized) {
    logger.debug("Database already initialized, skipping")
    return
  }

  logger.info("Starting database initialization")

  try {
    // 检查表是否已存在
    const tablesExist = await checkTablesExist()

    if (tablesExist) {
      logger.info("Tables already exist, skipping initialization")
      isDbInitialized = true
      return
    }

    logger.info("Creating database tables")

    // 使用事务来确保原子性 - 修复 begin 方法调用
    const transaction = await sql.query('BEGIN')
    try {
      logger.debug("Starting transaction for table creation")

      // 创建文章表
      logger.debug("Creating articles table")
      await sql`
       CREATE TABLE IF NOT EXISTS articles (
         id VARCHAR(255) PRIMARY KEY,
         title TEXT NOT NULL,
         description TEXT,
         content TEXT,
         link VARCHAR(2048) NOT NULL,
         pub_date TIMESTAMP WITH TIME ZONE NOT NULL,
         source VARCHAR(100) NOT NULL,
         created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
       )
     `

      // 创建划线表
      logger.debug("Creating highlights table")
      await sql`
       CREATE TABLE IF NOT EXISTS highlights (
         id VARCHAR(255) PRIMARY KEY,
         article_id VARCHAR(255) NOT NULL,
         text TEXT NOT NULL,
         comment TEXT,
         created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
         FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
       )
     `

      // 创建评论表
      logger.debug("Creating comments table")
      await sql`
       CREATE TABLE IF NOT EXISTS comments (
         id VARCHAR(255) PRIMARY KEY,
         article_id VARCHAR(255) NOT NULL,
         content TEXT NOT NULL,
         user_id VARCHAR(255),
         user_name VARCHAR(255) NOT NULL,
         created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
         FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
       )
     `

      // 创建缓存表
      logger.debug("Creating cache table")
      await sql`
       CREATE TABLE IF NOT EXISTS cache (
         key VARCHAR(255) PRIMARY KEY,
         value JSONB NOT NULL,
         expires_at TIMESTAMP WITH TIME ZONE
       )
     `

      await sql.query('COMMIT')
      logger.debug("Transaction completed successfully")
    } catch (error) {
      await sql.query('ROLLBACK')
      throw error
    }

    isDbInitialized = true
    logger.info("Database initialized successfully")
  } catch (error) {
    logger.error("Failed to initialize database", error)

    // 如果错误是关于表已存在，我们可以安全地忽略它
    if (
      error instanceof Error &&
      (error.message.includes("already exists") || error.message.includes("duplicate key value"))
    ) {
      logger.info("Tables already exist, continuing...")
      isDbInitialized = true
      return
    }

    throw error
  }
}

// 添加一个函数来检查表是否已存在
async function checkTablesExist() {
  logger.debug("Checking if tables exist")
  try {
    const result = await sql`
     SELECT EXISTS (
       SELECT FROM information_schema.tables 
       WHERE table_schema = 'public' 
       AND table_name = 'articles'
     );
   `

    const exists = result.rows[0].exists
    logger.debug(`Tables exist: ${exists}`)
    return exists
  } catch (error) {
    logger.error("Error checking if tables exist", error)
    return false
  }
}

// 确保数据库在任何操作前已初始化
async function ensureDbInitialized() {
  if (!isDbInitialized) {
    logger.debug("Database not initialized, initializing now")
    await initDatabase()
  }
}

// 缓存操作
export async function getCache<T>(key: string): Promise<T | null> {
  logger.debug(`Getting cache for key: ${key}`)
  try {
    await ensureDbInitialized()

    const result = await sql`
     SELECT value FROM cache 
     WHERE key = ${key} AND (expires_at IS NULL OR expires_at > NOW())
   `

    if (result.rows.length === 0) {
      logger.debug(`Cache miss for key: ${key}`)
      return null
    }

    logger.debug(`Cache hit for key: ${key}`)
    return result.rows[0].value as T
  } catch (error) {
    logger.error(`Error getting cache for key: ${key}`, error)
    return null
  }
}

export async function setCache<T>(key: string, value: T, expirationSeconds?: number): Promise<void> {
  logger.debug(`Setting cache for key: ${key}`, { expirationSeconds })
  try {
    await ensureDbInitialized()

    // 将 Date 对象转换为 ISO 字符串
    const expiresAtStr = expirationSeconds ? new Date(Date.now() + expirationSeconds * 1000).toISOString() : null

    await sql`
     INSERT INTO cache (key, value, expires_at)
     VALUES (${key}, ${JSON.stringify(value)}, ${expiresAtStr})
     ON CONFLICT (key) 
     DO UPDATE SET value = ${JSON.stringify(value)}, expires_at = ${expiresAtStr}
   `

    logger.debug(`Cache set successfully for key: ${key}`)
  } catch (error) {
    logger.error(`Error setting cache for key: ${key}`, error)
  }
}

// 文章操作
export async function saveArticle(article: NewsItem): Promise<void> {
  logger.debug(`Saving article: ${article.id}`, { title: article.title, source: article.source })
  try {
    await ensureDbInitialized()

    // 验证和清理数据
    const safeArticle = sanitizeArticle(article)
    
    // 将 Date 对象转换为 ISO 字符串
    const pubDateStr = new Date(safeArticle.pubDate).toISOString()

    await sql`
     INSERT INTO articles (id, title, description, content, link, pub_date, source)
     VALUES (
       ${safeArticle.id}, 
       ${safeArticle.title}, 
       ${safeArticle.description}, 
       ${safeArticle.content || ""}, 
       ${safeArticle.link}, 
       ${pubDateStr}, 
       ${safeArticle.source}
     )
     ON CONFLICT (id) 
     DO UPDATE SET 
       title = ${safeArticle.title},
       description = ${safeArticle.description},
       content = ${safeArticle.content || ""},
       link = ${safeArticle.link},
       pub_date = ${pubDateStr},
       source = ${safeArticle.source}
   `

    logger.debug(`Article saved successfully: ${safeArticle.id}`)
  } catch (error) {
    logger.error(`Error saving article: ${article.id}`, error)
  }
}

// 验证和清理文章数据
function sanitizeArticle(article: NewsItem): NewsItem {
  // 创建一个新对象，避免修改原始对象
  const safeArticle: NewsItem = {
    id: article.id,
    title: truncateString(article.title || "无标题", 500),
    description: truncateString(article.description || "", 5000),
    content: article.content ? truncateString(article.content, 100000) : "",
    link: truncateString(article.link || "#", 2000),
    pubDate: article.pubDate || new Date().toISOString(),
    source: truncateString(article.source || "未知来源", 100),
  }

  // 确保 pubDate 是有效的日期
  try {
    new Date(safeArticle.pubDate)
  } catch (e) {
    safeArticle.pubDate = new Date().toISOString()
  }

  // 确保 ID 是有效的
  if (!safeArticle.id || safeArticle.id.length > 250 || !isValidId(safeArticle.id)) {
    // 如果 ID 无效或太长，生成一个新的 ID
    safeArticle.id = generateSafeId(safeArticle.source, safeArticle.link, safeArticle.title)
  }

  return safeArticle
}

// 检查 ID 是否有效
function isValidId(id: string): boolean {
  // 只允许字母、数字和一些安全的特殊字符
  return /^[a-zA-Z0-9_-]+$/.test(id)
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

// 截断字符串到指定长度
function truncateString(str: string, maxLength: number): string {
  if (!str) return ""
  return str.length > maxLength ? str.substring(0, maxLength) : str
}

export async function getArticleById(id: string): Promise<Article | null> {
  // 验证 ID 是否有效
  if (!id || id.length > 255) {
    logger.warn(`Invalid article ID: ${id}`)
    return null
  }

  // 清理 ID 以防止 SQL 注入
  const safeId = id.replace(/[^\w-]/g, "")
  if (safeId !== id) {
    logger.warn(`Article ID was sanitized: ${id} -> ${safeId}`)
    // 如果 ID 被清理后变得不同，可能是不安全的 ID
    if (!safeId) {
      return null
    }
  }

  logger.debug(`Getting article by ID: ${safeId}`)
  try {
    await ensureDbInitialized()

    const result = await sql`
     SELECT * FROM articles WHERE id = ${safeId}
   `

    if (result.rows.length === 0) {
      logger.debug(`Article not found: ${safeId}`)
      return null
    }

    const article = result.rows[0]
    logger.debug(`Article found: ${safeId}`, { title: article.title })

    // 获取相关数据
    logger.debug(`Fetching highlights for article: ${safeId}`)
    const highlights = await getHighlightsByArticleId(safeId)

    logger.debug(`Fetching comments for article: ${safeId}`)
    const comments = await getCommentsByArticleId(safeId)

    // 转换从 snake_case 到 camelCase
    const formattedArticle: Article = {
      id: article.id,
      title: article.title,
      description: article.description,
      content: article.content,
      link: article.link,
      pubDate: article.pub_date.toISOString(),
      source: article.source,
      highlights,
      comments,
    }

    logger.debug(`Returning formatted article: ${safeId}`, {
      highlightsCount: highlights.length,
      commentsCount: comments.length,
    })

    return formattedArticle
  } catch (error) {
    logger.error(`Error getting article by ID: ${safeId}`, error)
    return null
  }
}

export async function getLatestArticles(limit = 20): Promise<NewsItem[]> {
  logger.debug(`Getting latest articles with limit: ${limit}`)
  try {
    await ensureDbInitialized()

    const result = await sql`
     SELECT * FROM articles 
     ORDER BY pub_date DESC 
     LIMIT ${limit}
   `

    logger.debug(`Retrieved ${result.rows.length} latest articles`)

    return result.rows.map((article) => {
      logger.debug(`Processing article: ${article.id}`, { title: article.title })
      return {
        id: article.id,
        title: article.title,
        description: article.description,
        content: article.content,
        link: article.link,
        pubDate: article.pub_date.toISOString(),
        source: article.source,
      }
    })
  } catch (error) {
    logger.error(`Error getting latest articles`, error)
    return []
  }
}

// 划线操作
export async function saveHighlight(highlight: Highlight): Promise<void> {
  logger.debug(`Saving highlight: ${highlight.id}`, {
    articleId: highlight.articleId,
    textLength: highlight.text.length,
  })

  try {
    await ensureDbInitialized()

    // 验证 articleId
    const safeArticleId = highlight.articleId.replace(/[^\w-]/g, "")
    if (!safeArticleId) {
      logger.error(`Invalid article ID for highlight: ${highlight.id}`)
      return
    }

    await sql`
     INSERT INTO highlights (id, article_id, text, comment)
     VALUES (
       ${highlight.id}, 
       ${safeArticleId}, 
       ${highlight.text}, 
       ${highlight.comment || null}
     )
   `

    logger.debug(`Highlight saved successfully: ${highlight.id}`)
  } catch (error) {
    logger.error(`Error saving highlight: ${highlight.id}`, error)
  }
}

export async function getHighlightsByArticleId(articleId: string): Promise<Highlight[]> {
  logger.debug(`Getting highlights for article: ${articleId}`)
  try {
    await ensureDbInitialized()

    // 验证 articleId
    const safeArticleId = articleId.replace(/[^\w-]/g, "")
    if (!safeArticleId) {
      logger.error(`Invalid article ID for getting highlights: ${articleId}`)
      return []
    }

    const result = await sql`
     SELECT * FROM highlights 
     WHERE article_id = ${safeArticleId}
     ORDER BY created_at DESC
   `

    logger.debug(`Retrieved ${result.rows.length} highlights for article: ${safeArticleId}`)

    return result.rows.map((row) => {
      logger.debug(`Processing highlight: ${row.id}`)
      return {
        id: row.id,
        articleId: row.article_id,
        text: row.text,
        comment: row.comment,
        createdAt: row.created_at.toISOString(),
      }
    })
  } catch (error) {
    logger.error(`Error getting highlights for article: ${articleId}`, error)
    return []
  }
}

// 评论操作
export async function saveComment(comment: Comment): Promise<void> {
  logger.debug(`Saving comment: ${comment.id}`, {
    articleId: comment.articleId,
    userName: comment.userName,
    contentLength: comment.content.length,
  })

  try {
    await ensureDbInitialized()

    // 验证 articleId
    const safeArticleId = comment.articleId.replace(/[^\w-]/g, "")
    if (!safeArticleId) {
      logger.error(`Invalid article ID for comment: ${comment.id}`)
      return
    }

    logger.debug(`Executing SQL insert for comment: ${comment.id}`)
    
    const result = await sql`
     INSERT INTO comments (id, article_id, content, user_id, user_name)
     VALUES (
       ${comment.id}, 
       ${safeArticleId}, 
       ${comment.content}, 
       ${comment.userId || null}, 
       ${comment.userName}
     )
     RETURNING id
   `
    
    logger.debug(`SQL insert result: ${JSON.stringify(result)}`)
    logger.info(`Comment saved successfully: ${comment.id}`)
  } catch (error) {
    logger.error(`Error saving comment: ${comment.id}`, error)
    throw error; // 重新抛出错误，让调用者知道保存失败
  }
}

export async function getCommentsByArticleId(articleId: string): Promise<Comment[]> {
  logger.debug(`Getting comments for article: ${articleId}`)
  try {
    await ensureDbInitialized()

    // 验证 articleId
    const safeArticleId = articleId.replace(/[^\w-]/g, "")
    if (!safeArticleId) {
      logger.error(`Invalid article ID for getting comments: ${articleId}`)
      return []
    }

    const result = await sql`
     SELECT * FROM comments 
     WHERE article_id = ${safeArticleId}
     ORDER BY created_at DESC
   `

    logger.debug(`Retrieved ${result.rows.length} comments for article: ${safeArticleId}`)

    return result.rows.map((row) => {
      logger.debug(`Processing comment: ${row.id}`)
      return {
        id: row.id,
        articleId: row.article_id,
        content: row.content,
        userId: row.user_id,
        userName: row.user_name,
        createdAt: row.created_at.toISOString(),
      }
    })
  } catch (error) {
    logger.error(`Error getting comments for article: ${articleId}`, error)
    return []
  }
}

export async function getUserComments(limit = 20): Promise<Comment[]> {
  logger.debug(`Getting user comments with limit: ${limit}`)
  try {
    await ensureDbInitialized()

    const result = await sql`
      SELECT 
        c.*,
        a.title as article_title
      FROM comments c
      LEFT JOIN articles a ON c.article_id = a.id
      ORDER BY c.created_at DESC
      LIMIT ${limit}
    `
    logger.debug(`Retrieved ${result.rows.length} user comments`)
    logger.debug(`User comments: ${JSON.stringify(result.rows)}`)

    return result.rows.map(row => ({
      id: row.id,
      articleId: row.article_id,
      content: row.content,
      userName: row.user_name,
      createdAt: row.created_at.toISOString(),
      articleTitle: row.article_title || '未知文章'
    }))
  } catch (error) {
    logger.error("Error getting user comments", error)
    return []
  }
}

// 添加这个函数，支持分页获取文章
export async function getPaginatedArticles(
  page = 1,
  pageSize = 10,
): Promise<{
  items: NewsItem[]
  total: number
  hasMore: boolean
}> {
  logger.debug(`Getting paginated articles: page=${page}, pageSize=${pageSize}`)
  try {
    await ensureDbInitialized()

    // 获取总数
    const countResult = await sql`
     SELECT COUNT(*) as total FROM articles
   `
    const total = Number.parseInt(countResult.rows[0].total)

    // 计算偏移量
    const offset = (page - 1) * pageSize

    // 获取分页数据
    const result = await sql`
     SELECT * FROM articles 
     ORDER BY pub_date DESC 
     LIMIT ${pageSize} OFFSET ${offset}
   `

    logger.debug(`Retrieved ${result.rows.length} articles for page ${page}`)

    const items = result.rows.map((article) => ({
      id: article.id,
      title: article.title,
      description: article.description,
      content: article.content,
      link: article.link,
      pubDate: article.pub_date.toISOString(),
      source: article.source,
    }))

    return {
      items,
      total,
      hasMore: offset + items.length < total,
    }
  } catch (error) {
    logger.error(`Error getting paginated articles`, error)
    return {
      items: [],
      total: 0,
      hasMore: false,
    }
  }
}

