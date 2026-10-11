import React, { ReactNode } from 'react'

export interface ContainerProps {
  children: ReactNode
  className?: string
}

export default function Container({
  children,
  className = '',
}: ContainerProps) {
  return (
    <div className={`max-w-[686px] mx-auto my-[20px] px-4 ${className}`}>
      {children}
    </div>
  )
}
