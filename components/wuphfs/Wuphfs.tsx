import React, { useState, useEffect } from 'react'

import Wuphf, { WuphfProps } from './Wuphf'
import Loading from '../layout/Loading'

export interface WuphfsProps {
  wuphfs: WuphfProps[]
  wuphfsLoading?: boolean
  lastWuphfElementRef?: (node: HTMLElement | null) => void
}

export default function Wuphfs(props: WuphfsProps) {
  const { lastWuphfElementRef, wuphfsLoading } = props
  const [wuphfs, setWuphfs] = useState<WuphfProps[]>(props.wuphfs)

  useEffect(() => {
    setWuphfs(props.wuphfs)
  }, [props.wuphfs])

  if (wuphfsLoading && (!wuphfs || wuphfs.length === 0)) {
    return <Loading />
  }

  if (!wuphfs || wuphfs.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500 rounded-[20px] border-[1.5px] border-border">
        <p>No Wuphfs found... 😢</p>
      </div>
    )
  }

  function deleteWuphf(wuphfId: string) {
    setWuphfs((prevWuphfs) =>
      prevWuphfs.filter((wuphf) => wuphf.id !== wuphfId),
    )
  }

  return (
    <div className="border-[.5px] border-solid shadow-lg border-border rounded-[20px] overflow-hidden">
      {wuphfs?.map((wuphf, index) => {
        if (wuphfs.length === index + 1) {
          return (
            <React.Fragment key={`${wuphf.userId}-${wuphf.id}`}>
              <Wuphf
                lastWuphfElementRef={lastWuphfElementRef}
                deleteWuphf={deleteWuphf}
                {...wuphf}
              />
            </React.Fragment>
          )
        } else {
          return <Wuphf key={wuphf.id} deleteWuphf={deleteWuphf} {...wuphf} />
        }
      })}
    </div>
  )
}
