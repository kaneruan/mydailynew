import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { createLogger } from "./logger"

const logger = createLogger("Utils")

// 合并 Tailwind 类名
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 格式化日期
export function formatDate(dateString: string): string {
  logger.debug(`Formatting date: ${dateString}`)
  
  try {
    const date = new Date(dateString)
    
    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      logger.warn(`Invalid date: ${dateString}`)
      return "日期无效"
    }
    
    // 获取当前日期
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    // 获取日期部分
    const dateObj = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    
    // 如果是今天
    if (dateObj.getTime() === today.getTime()) {
      return `今天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    }
    
    // 如果是昨天
    if (dateObj.getTime() === yesterday.getTime()) {
      return `昨天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    }
    
    // 如果是今年
    if (date.getFullYear() === now.getFullYear()) {
      return `${date.getMonth() + 1}月${date.getDate()}日`
    }
    
    // 其他情况
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
  } catch (error) {
    logger.error(`Error formatting date: ${dateString}`, error)
    return dateString
  }
}

// 清理 HTML 内容
export function cleanHtml(html: string): string {
  if (!html) return ""
  
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // 移除脚本标签
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "") // 移除样式标签
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "") // 移除 iframe
    .replace(/<[^>]*>/g, "") // 移除所有 HTML 标签
    .replace(/&nbsp;/g, " ") // 替换 &nbsp; 为空格
    .replace(/&lt;/g, "<") // 替换 &lt; 为 <
    .replace(/&gt;/g, ">") // 替换 &gt; 为 >
    .replace(/&amp;/g, "&") // 替换 &amp; 为 &
    .replace(/&quot;/g, '"') // 替换 &quot; 为 "
    .replace(/&#39;/g, "'") // 替换 &#39; 为 '
    .replace(/\s+/g, " ") // 将多个空白字符替换为单个空格
    .trim() // 移除首尾空白
}

// 生成唯一 ID
export function generateId(prefix = ""): string {
  return `${prefix}${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

// 截断文本
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength) + "..."
}

// 安全解析 JSON
export function safeJsonParse<T>(jsonString: string, fallback: T): T {
  try {
    return JSON.parse(jsonString) as T
  } catch (error) {
    logger.error(`Error parsing JSON: ${jsonString}`, error)
    return fallback
  }
}

