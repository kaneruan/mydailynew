import Link from 'next/link'
import { createLogger } from '@/lib/logger'
import { Suspense } from 'react'

const logger = createLogger("NotFound")

function Custom404Content() {
  logger.info("渲染 404 页面内容")
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-200 mb-4">404 - 页面未找到</h1>
      <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
        抱歉，您访问的页面不存在或已被移除。
      </p>
      <Link 
        href="/" 
        className="modern-button"
      >
        返回首页
      </Link>
    </div>
  )
}

export default function Custom404() {
  logger.info("渲染 404 页面")
  
  return (
    <Suspense fallback={<div>加载中...</div>}>
      <Custom404Content />
    </Suspense>
  )
} 