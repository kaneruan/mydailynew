"use client"

import { useState, useEffect, useRef } from "react"
import { createLogger } from "@/lib/logger"

// 创建客户端组件的日志记录器
const logger = createLogger("LogViewer")

// 日志条目类型
interface LogEntry {
  timestamp: string
  level: string
  module: string
  message: string
  data?: any
}

// 日志级别颜色
const LOG_LEVEL_COLORS: Record<string, string> = {
  DEBUG: "text-blue-600",
  INFO: "text-green-600",
  WARN: "text-yellow-600",
  ERROR: "text-red-600",
}

export default function LogViewer() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isVisible, setIsVisible] = useState(false)
  const [filter, setFilter] = useState("")
  const pendingLogsRef = useRef<LogEntry[]>([])
  const isDevMode = process.env.NODE_ENV === "development"

  useEffect(() => {
    if (!isDevMode) return

    logger.info("LogViewer component mounted")

    // 拦截控制台日志
    const originalConsole = { ...console }

    // 解析日志消息
    const parseLogMessage = (message: string): LogEntry | null => {
      // 尝试匹配格式化的日志消息
      const regex = /\[([^\]]+)\]\s*\[([^\]]+)\]\s*\[([^\]]+)\]\s*(.*)/
      const match = typeof message === "string" ? message.match(regex) : null

      if (match) {
        return {
          timestamp: match[1],
          level: match[2],
          module: match[3],
          message: match[4],
        }
      }

      return null
    }

    // 使用 requestAnimationFrame 批量更新日志
    const flushLogs = () => {
      if (pendingLogsRef.current.length > 0) {
        setLogs((prev) => {
          const newLogs = [...pendingLogsRef.current, ...prev].slice(0, 100)
          pendingLogsRef.current = []
          return newLogs
        })
      }
    }

    // 设置定期刷新日志的间隔
    const intervalId = setInterval(flushLogs, 500)

    // 拦截日志方法
    console.log = (...args) => {
      originalConsole.log(...args)
      const entry = parseLogMessage(args[0])
      if (entry) {
        pendingLogsRef.current.push(entry)
      }
    }

    console.debug = (...args) => {
      originalConsole.debug(...args)
      const entry = parseLogMessage(args[0])
      if (entry) {
        entry.level = "DEBUG"
        pendingLogsRef.current.push(entry)
      }
    }

    console.warn = (...args) => {
      originalConsole.warn(...args)
      const entry = parseLogMessage(args[0])
      if (entry) {
        entry.level = "WARN"
        pendingLogsRef.current.push(entry)
      }
    }

    console.error = (...args) => {
      originalConsole.error(...args)
      const entry = parseLogMessage(args[0])
      if (entry) {
        entry.level = "ERROR"
        pendingLogsRef.current.push(entry)
      }
    }

    // 添加键盘快捷键
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt+L 切换日志查看器
      if (e.altKey && e.key === "l") {
        setIsVisible((prev) => !prev)
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      // 恢复原始控制台方法
      console.log = originalConsole.log
      console.debug = originalConsole.debug
      console.warn = originalConsole.warn
      console.error = originalConsole.error

      clearInterval(intervalId)
      window.removeEventListener("keydown", handleKeyDown)
      logger.debug("LogViewer component unmounted")
    }
  }, [isDevMode])

  // 如果不是开发模式，不渲染任何内容
  if (!isDevMode) {
    return null
  }

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 left-4 bg-gray-800 text-white p-2 rounded-full z-50 opacity-50 hover:opacity-100"
        title="显示日志 (Alt+L)"
      >
        📋
      </button>
    )
  }

  const filteredLogs = filter
    ? logs.filter(
        (log) =>
          log.message.toLowerCase().includes(filter.toLowerCase()) ||
          log.module.toLowerCase().includes(filter.toLowerCase()) ||
          log.level.toLowerCase().includes(filter.toLowerCase()),
      )
    : logs

  return (
    <div className="fixed inset-0 bg-white bg-opacity-95 z-50 overflow-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">应用日志</h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="过滤日志..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-2 py-1 border rounded"
          />
          <button onClick={() => setLogs([])} className="bg-red-500 text-white px-3 py-1 rounded">
            清除
          </button>
          <button onClick={() => setIsVisible(false)} className="bg-gray-500 text-white px-3 py-1 rounded">
            关闭
          </button>
        </div>
      </div>

      <div className="border rounded overflow-auto max-h-[calc(100vh-100px)]">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">时间</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">级别</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">模块</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">消息</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                  {filter ? "没有匹配的日志" : "暂无日志"}
                </td>
              </tr>
            ) : (
              filteredLogs.map((log, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">{log.timestamp}</td>
                  <td
                    className={`px-6 py-2 whitespace-nowrap text-sm font-medium ${LOG_LEVEL_COLORS[log.level] || "text-gray-900"}`}
                  >
                    {log.level}
                  </td>
                  <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">{log.module}</td>
                  <td className="px-6 py-2 text-sm text-gray-900 break-words">{log.message}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-2 text-xs text-gray-500">提示: 按 Alt+L 切换日志查看器</div>
    </div>
  )
}

