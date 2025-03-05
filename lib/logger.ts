// 日志级别
export type LogLevel = "debug" | "info" | "warn" | "error"

// 日志配置
const LOG_CONFIG = {
  // 是否在生产环境中启用日志
  enableInProduction: true,
  // 最低日志级别
  minLevel: process.env.NODE_ENV === "production" ? "info" : "debug",
  // 是否显示时间戳
  showTimestamp: true,
  // 是否显示日志级别
  showLevel: true,
}

// 日志级别映射到数字，用于比较
const LOG_LEVEL_MAP: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

// 日志级别映射到控制台方法
const LOG_METHOD_MAP: Record<LogLevel, keyof typeof console> = {
  debug: "debug",
  info: "log",
  warn: "warn",
  error: "error",
}

// 日志级别映射到颜色
const LOG_COLOR_MAP: Record<LogLevel, string> = {
  debug: "\x1b[34m", // 蓝色
  info: "\x1b[32m", // 绿色
  warn: "\x1b[33m", // 黄色
  error: "\x1b[31m", // 红色
}

// 重置颜色
const RESET_COLOR = "\x1b[0m"

// 检查是否在渲染阶段
let isInRenderPhase = false
let pendingLogs: Array<{ level: LogLevel; module: string; message: string; data?: any }> = []

// 在客户端，我们需要检测渲染阶段
if (typeof window !== "undefined") {
  // 使用 requestAnimationFrame 来检测渲染阶段
  const checkRenderPhase = () => {
    isInRenderPhase = true

    // 在下一个微任务中标记渲染阶段结束
    Promise.resolve().then(() => {
      isInRenderPhase = false

      // 处理待处理的日志
      if (pendingLogs.length > 0) {
        pendingLogs.forEach(({ level, module, message, data }) => {
          logImmediately(level, module, message, data)
        })
        pendingLogs = []
      }
    })

    requestAnimationFrame(checkRenderPhase)
  }

  requestAnimationFrame(checkRenderPhase)
}

/**
 * 创建格式化的日志消息
 */
function createLogMessage(level: LogLevel, module: string, message: string): string {
  const parts: string[] = []

  // 添加时间戳
  if (LOG_CONFIG.showTimestamp) {
    parts.push(`[${new Date().toISOString()}]`)
  }

  // 添加日志级别
  if (LOG_CONFIG.showLevel) {
    parts.push(`[${level.toUpperCase()}]`)
  }

  // 添加模块名
  parts.push(`[${module}]`)

  // 添加消息
  parts.push(message)

  return parts.join(" ")
}

/**
 * 立即记录日志，不考虑渲染阶段
 */
function logImmediately(level: LogLevel, module: string, message: string, data?: any): void {
  // 检查是否应该记录此级别的日志
  if (
    (!LOG_CONFIG.enableInProduction && process.env.NODE_ENV === "production") ||
    LOG_LEVEL_MAP[level] < LOG_LEVEL_MAP[LOG_CONFIG.minLevel as LogLevel]
  ) {
    return
  }

  const formattedMessage = createLogMessage(level, module, message)
  const consoleMethod = LOG_METHOD_MAP[level]

  // 在浏览器中使用颜色
  if (typeof window === "undefined") {
    // 服务器端
    console[consoleMethod](`${LOG_COLOR_MAP[level]}${formattedMessage}${RESET_COLOR}`)
  } else {
    // 客户端
    console[consoleMethod](`%c${formattedMessage}`, `color: ${LOG_COLOR_MAP[level].slice(2, -1)}`)
  }

  // 如果有额外数据，单独记录
  if (data !== undefined) {
    console[consoleMethod](data)
  }
}

/**
 * 记录日志，考虑渲染阶段
 */
function log(level: LogLevel, module: string, message: string, data?: any): void {
  // 如果在渲染阶段，将日志添加到待处理队列
  if (isInRenderPhase && typeof window !== "undefined") {
    pendingLogs.push({ level, module, message, data })
    return
  }

  // 否则立即记录
  logImmediately(level, module, message, data)
}

/**
 * 创建特定模块的日志记录器
 */
export function createLogger(module: string) {
  return {
    debug: (message: string, data?: any) => log("debug", module, message, data),
    info: (message: string, data?: any) => log("info", module, message, data),
    warn: (message: string, data?: any) => log("warn", module, message, data),
    error: (message: string, data?: any) => log("error", module, message, data),
  }
}

// 默认日志记录器
export const logger = createLogger("App")

