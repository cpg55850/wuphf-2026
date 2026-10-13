import React from 'react'

import type {
  FieldError,
  FieldValues,
  Path,
  UseFormRegister,
} from 'react-hook-form'

import Error from './Error'
import Label from './Label'

export interface TextAreaProps<
  TFieldValues extends FieldValues = FieldValues,
> extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  register: UseFormRegister<TFieldValues>
  id: Path<TFieldValues>
  label?: string
  error?: FieldError
  enabled?: boolean
}

function TextArea<TFieldValues extends FieldValues = FieldValues>({
  register,
  error,
  label,
  id,
  enabled = true,
  ...props
}: TextAreaProps<TFieldValues>) {
  return (
    <div className="mb-4 w-full">
      {label && <Label htmlFor={id}>{label}</Label>}
      <textarea
        id={id}
        disabled={!enabled}
        {...register(id)}
        {...props}
        className={`mt-2 w-full min-h-[100px] rounded-xl border border-solid bg-body p-2 text-app-text outline-none text-base resize-y transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          error ? 'border-red-500' : 'border-border focus:border-primary'
        }`}
      />
      {error?.message && <Error>{error.message}</Error>}
    </div>
  )
}

export default TextArea
