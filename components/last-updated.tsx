'use client'

import { useState, useEffect } from 'react'

interface LastUpdatedProps {
  data: any
}

export function LastUpdated({ data }: LastUpdatedProps) {
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  useEffect(() => {
    if (data && mounted) {
      setLastUpdated(new Date().toLocaleTimeString())
    }
  }, [data, mounted])
  
  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return <span className="text-sm text-muted-foreground">Loading...</span>
  }
  
  return lastUpdated ? (
    <span className="text-sm text-muted-foreground">
      Last updated: {lastUpdated}
    </span>
  ) : null
}