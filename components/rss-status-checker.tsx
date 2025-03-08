"use client"

import { useState, useEffect } from "react"
import RSSErrorAlert from "@/components/rss-error-alert"
import { createLogger } from "@/lib/logger"

const logger = createLogger("RSSStatusChecker")

export default function RSSStatusChecker() {
  const [rssError, setRssError] = useState(false)

  useEffect(() => {
    const checkRSSStatus = async () => {
      try {
        const response = await fetch('/api/rss-status')
        const data = await response.json()
        setRssError(data.hasErrors)
      } catch (error) {
        logger.error("Error checking RSS status:", error)
        setRssError(true)
      }
    }
    
    checkRSSStatus()
  }, [])

  if (!rssError) return null

  return (
    <RSSErrorAlert 
      onRetry={async () => {
        const response = await fetch('/api/refresh-rss', { method: 'POST' })
        const data = await response.json()
        if (!data.success) {
          throw new Error(data.message)
        }
        setRssError(data.hasErrors)
      }} 
    />
  )
} 