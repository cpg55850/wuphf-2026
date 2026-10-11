import React from 'react'
import Link from 'next/link'

import WuphfSVG from '../../assets/WuphfSVG'

export default function WuphfLogo(): React.ReactElement {
  return (
    <Link href="/">
      <div className="flex justify-center items-center rounded-full p-[2px] h-10 w-10 hover:cursor-pointer hover:bg-highlight active:bg-highlightPressed">
        <WuphfSVG />
      </div>
    </Link>
  )
}
