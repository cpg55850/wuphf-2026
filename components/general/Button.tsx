import React, { ButtonHTMLAttributes } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'default'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-button-primary-bg text-button-primary-text hover:brightness-90',
  secondary:
    'bg-button-secondary-bg text-button-secondary-text hover:brightness-90',
  default: 'bg-body text-text border border-border hover:bg-highlight',
}

export default function Button({
  children,
  variant = 'default',
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={`font-semibold whitespace-nowrap shrink-0 py-2 px-4 overflow-hidden rounded-md shadow-md cursor-pointer transition-all duration-200 ease-out border-none hover:brightness-95 active:brightness-90 disabled:bg-gray-400 disabled:cursor-not-allowed ${variantClasses[variant] || variantClasses.default} ${className}`}
    >
      {children}
    </button>
  )
}
