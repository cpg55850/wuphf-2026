import React, { ReactNode, HTMLAttributes } from 'react'

export interface TitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode
  className?: string
}

export default function Title({
  children,
  className = '',
  ...props
}: TitleProps) {
  return (
    <h1
      className={`mb-4 text-center font-bold text-xl ${className}`}
      {...props}
    >
      {children}
    </h1>
  )
}
