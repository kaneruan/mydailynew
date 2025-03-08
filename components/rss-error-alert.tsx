"use client"

import { AlertCircle, RefreshCw, X } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { createLogger } from "@/lib/logger"
import { motion, AnimatePresence } from "framer-motion"

const logger = createLogger("RSSErrorAlert")

interface RSSErrorAlertProps {
  onRetry: () => Promise<void>
}

export default function RSSErrorAlert({ onRetry }: RSSErrorAlertProps) {
  const [isRetrying, setIsRetrying] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const { toast } = useToast()
  
  const handleRetry = async () => {
    setIsRetrying(true)
    try {
      await onRetry()
      toast({
        title: "刷新成功",
        description: "已尝试重新获取最新内容",
        variant: "default"
      })
    } catch (error) {
      logger.error("Error retrying RSS fetch:", error)
      toast({
        title: "刷新失败",
        description: "无法连接到 RSS 源，请稍后再试",
        variant: "destructive"
      })
    } finally {
      setIsRetrying(false)
    }
  }
  
  return (
    <div className="relative z-10">
      <AnimatePresence>
        {!isExpanded ? (
          <motion.button
            key="collapsed"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsExpanded(true)}
            className="fixed bottom-6 right-6 bg-yellow-500 text-white rounded-full p-3 shadow-lg hover:bg-yellow-600 transition-colors"
            aria-label="显示 RSS 状态"
          >
            <AlertCircle className="h-6 w-6" />
          </motion.button>
        ) : (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-6 right-6 left-6 md:left-auto md:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-yellow-200 dark:border-yellow-800 overflow-hidden"
          >
            <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
                  <h3 className="font-medium text-yellow-800 dark:text-yellow-200">无法获取最新内容</h3>
                </div>
                <button 
                  onClick={() => setIsExpanded(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  aria-label="关闭"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="p-4">
              <p className="text-gray-700 dark:text-gray-300 text-sm mb-4">
                当前无法连接到 RSS 源，这可能是由于网络连接问题或者 RSS 源暂时不可用。我们正在尝试恢复连接，您可以查看已缓存的内容或稍后再试。
              </p>
              
              <button
                onClick={handleRetry}
                disabled={isRetrying}
                className="w-full flex justify-center items-center px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
                {isRetrying ? '刷新中...' : '刷新内容'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 