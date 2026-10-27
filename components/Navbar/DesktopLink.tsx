import React, { MouseEvent } from 'react'

import Link from 'next/link'

export interface DesktopLinkProps {
  url: string
  text: string
  isShown?: boolean
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void
}

function capitalize(text: string): string {
  if (!text) return ''
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export default function DesktopLink({ url, text, onClick }: DesktopLinkProps) {
  return (
    <li className="list-none flex bg-body hover:bg-highlight active:bg-highlightPressed rounded-xl transition-colors">
      <Link href={url} passHref legacyBehavior>
        <a
          onClick={onClick}
          className="text-text no-underline flex px-4 py-2 h-full w-full justify-center items-center rounded-md"
        >
          {capitalize(text)}
        </a>
      </Link>
    </li>
  )
}
