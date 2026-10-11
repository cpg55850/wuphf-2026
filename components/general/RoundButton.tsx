import React from 'react'
import Button, { ButtonProps } from './Button'

export interface RoundButtonProps extends ButtonProps {
  // Inherits all props from ButtonProps (variant, theme, etc.)
}

export default function RoundButton({
  children,
  className = '',
  ...props
}: RoundButtonProps) {
  return (
    <Button
      {...props}
      className={`flex items-center justify-center h-9 w-9 rounded-full p-0 ${className}`}
    >
      {children}
    </Button>
  )
}
