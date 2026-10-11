import React, { useRef, useCallback } from 'react'
import Wuphfs from './Wuphfs'
import { WuphfProps } from './Wuphf'

export interface WuphfsFeedProps {
  wuphfs: WuphfProps[]
  loading: boolean
  hasMore: boolean
  getWuphfs: () => void
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
      if (observer.current) observer.current.disconnect()

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          if (hasMore) getWuphfs()
        }
      })

      if (node) observer.current.observe(node)
    },
    [loading, hasMore, getWuphfs],
  )

  return (
    <Wuphfs
      wuphfs={wuphfs}
      lastWuphfElementRef={lastWuphfElementRef}
      wuphfsLoading={loading}
    />
  )
}
