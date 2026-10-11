import React, { ReactNode } from 'react'

export interface FormWrapperProps {
  children: ReactNode
  className?: string
}

export function FormWrapper({ children, className = '' }: FormWrapperProps) {
  return (
    <div className={`w-[1000px] max-w-full px-[20px] mx-auto ${className}`}>
      {children}
    </div>
  )
}
