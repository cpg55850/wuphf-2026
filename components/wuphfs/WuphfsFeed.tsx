import React, { useRef, useCallback, useEffect } from 'react'

import Wuphfs from './Wuphfs'

export interface WuphfsFeedProps {
  wuphfs: UserWuphfsResponse | null
  loading: boolean
  hasMore: boolean
  getWuphfs: () => Promise<void>
}

export default function WuphfsFeed({
  wuphfs,
  loading,
  hasMore,
  getWuphfs,
}: WuphfsFeedProps) {
  const observer = useRef<IntersectionObserver | null>(null)

  const lastWuphfElementRef = useCallback(
    (node: HTMLElement | null) => {
      if (loading) return

      observer.current?.disconnect()

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0]?.isIntersecting && hasMore) {
          void getWuphfs()
        }
      })

      if (node) observer.current.observe(node)
    },
    [loading, hasMore, getWuphfs],
  )

  useEffect(() => {
    return () => observer.current?.disconnect()
  }, [])

  return (
    <Wuphfs
      wuphfs={wuphfs ?? []}
      lastWuphfElementRef={lastWuphfElementRef}
      wuphfsLoading={loading}
    />
  )
}
