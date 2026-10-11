import React from 'react'

export interface ErrorProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children?: React.ReactNode
}

export default function Error({
  children,
  className = '',
  ...props
}: ErrorProps) {
  if (!children) return null

  return (
    <p
      className={`my-2 text-sm text-red-500 font-medium ${className}`}
      {...props}
    >
      {children}
    </p>
  )
}
