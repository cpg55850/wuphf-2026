// components/forms/FormInput.tsx
import React from 'react'

import type {
  FieldError,
  FieldErrorsImpl,
  FieldValues,
  Merge,
  Path,
  UseFormRegister,
} from 'react-hook-form'

import Error from './Error'
import Label from './Label'

export interface FormInputProps<
  TFieldValues extends FieldValues = FieldValues,
> extends React.InputHTMLAttributes<HTMLInputElement> {
  register: UseFormRegister<TFieldValues>
  id: Path<TFieldValues>
  label?: string
  error?: FieldError | Merge<FieldError, FieldErrorsImpl<any>>
  enabled?: boolean
}

function FormInput<TFieldValues extends FieldValues = FieldValues>({
  register,
  error,
  label,
  id,
  enabled = true,
  ...props
}: FormInputProps<TFieldValues>) {
  // Extract error message safely regardless of error structure
  const errorMessage =
    typeof error?.message === 'string' ? error.message : undefined

  return (
    <div className="mb-4 w-full">
      {label && <Label htmlFor={id}>{label}</Label>}
      <input
        id={id}
        disabled={!enabled}
        {...register(id)}
        {...props}
        className={`mt-2 block w-full rounded bg-body p-2 text-inherit text-app-text outline-none text-base transition-colors disabled:cursor-not-allowed disabled:opacity-50 border ${
          error ? 'border-red-500' : 'border-border focus:border-primary'
        }`}
      />
      {errorMessage && <Error>{errorMessage}</Error>}
    </div>
  )
}

export default FormInput
