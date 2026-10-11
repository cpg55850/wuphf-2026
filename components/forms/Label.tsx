import React from 'react'

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode
}

export default function Label({
  children,
  className = '',
  ...props
}: LabelProps) {
  return (
    <label
      className={`block mb-2 font-bold text-base text-app-text ${className}`}
      {...props}
    >
      {children}
    </label>
  )
}
