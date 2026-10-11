import React, { MouseEvent } from 'react'

import Link from 'next/link'

export interface MobileLinkProps {
  url: string
  text: string
  isShown?: boolean
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void
}

function capitalize(text: string): string {
  if (!text) return ''
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export default function MobileLink({
  url,
  text,
  isShown = false,
  onClick,
}: MobileLinkProps) {
  return (
    <li
      className={`list-none flex justify-center items-center bg-inherit px-2 w-full text-center transition-all duration-500 ease-in-out hover:bg-button-primary-bg hover:cursor-pointer active:bg-primary ${
        isShown ? 'h-[33.33vh]' : 'h-0'
      }`}
    >
      <Link href={url} passHref legacyBehavior>
        <a
          onClick={onClick}
          className="text-inherit transition-all duration-500 ease-in-out hover:text-button-primary-text flex justify-center items-center no-underline h-full w-full"
        >
          {capitalize(text)}
        </a>
      </Link>
    </li>
  )
}
