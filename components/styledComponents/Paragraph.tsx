import React, { ReactNode, HTMLAttributes } from 'react'

export interface ParagraphProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode
  className?: string
}

export default function Paragraph({
  children,
  className = '',
  ...props
}: ParagraphProps) {
  return (
    <h1 className={`mb-4 leading-[1.5rem] ${className}`} {...props}>
      {children}
    </h1>
  )
}
