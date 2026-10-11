import React, { ReactNode } from 'react'

export interface MessageBoxProps {
  children: ReactNode
  className?: string
}

export function MessageBox({ children, className = '' }: MessageBoxProps) {
  return (
    <div
      className={`flex items-center justify-center h-[150px] [&>p]:p-4 [&>p]:rounded-[15px] [&>p]:border-[1.5px] [&>p]:border-border ${className}`}
    >
      {children}
    </div>
  )
}
