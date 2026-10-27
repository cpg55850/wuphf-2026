import React, { useState, useEffect } from 'react'

import Wuphf from './Wuphf'
import Loading from '../layout/Loading'

export interface WuphfsProps {
  wuphfs: UserWuphfsResponse
  wuphfsLoading?: boolean
  lastWuphfElementRef?: (node: HTMLElement | null) => void
}

export default function Wuphfs(props: WuphfsProps) {
  const { lastWuphfElementRef, wuphfsLoading } = props
  const [wuphfs, setWuphfs] = useState<UserWuphfsResponse>(props.wuphfs)

  useEffect(() => {
    setWuphfs(props.wuphfs)
  }, [props.wuphfs])

  if (wuphfsLoading && wuphfs.length === 0) {
    return <Loading />
  }

  if (wuphfs.length === 0) {
    return (
      <div className="rounded-[20px] border-[1.5px] border-border p-6 text-center text-gray-500">
        <p>No Wuphfs found... 😢</p>
      </div>
    )
  }

  function deleteWuphf(wuphfId: number) {
    setWuphfs((prevWuphfs) =>
      prevWuphfs.filter((wuphf) => wuphf.id !== wuphfId),
    )
  }

  return (
    <div className="overflow-hidden rounded-[20px] border-[.5px] border-solid border-border shadow-lg">
      {wuphfs.map((wuphf, index) => {
        const isLastWuphf = index === wuphfs.length - 1

        return (
          <Wuphf
            key={`${wuphf.userId}-${wuphf.id}`}
            {...wuphf}
            deleteWuphf={deleteWuphf}
            {...(isLastWuphf ? { lastWuphfElementRef } : {})}
          />
        )
      })}
    </div>
  )
}
