import React from 'react'

import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type {
  FieldError,
  FieldValues,
  Path,
  UseFormRegister,
} from 'react-hook-form'

import Error from './Error'
import Label from './Label'

export interface FormSearchInputProps<
  TFieldValues extends FieldValues = FieldValues,
> extends React.InputHTMLAttributes<HTMLInputElement> {
  register: UseFormRegister<TFieldValues>
  id: Path<TFieldValues>
  label?: string
  error?: FieldError
  isEmpty?: boolean
}

function FormSearchInput<TFieldValues extends FieldValues = FieldValues>({
  register,
  error,
  label,
  id,
  isEmpty,
  ...props
}: FormSearchInputProps<TFieldValues>) {
  return (
    <div className="mb-4 w-full">
      {label && <Label htmlFor={id}>{label}</Label>}
      <form
        autoComplete="off"
        className={`flex items-center rounded-full bg-body px-2.5 transition-colors border-[1.5px] ${
          error ? 'border-red-500' : 'border-border focus-within:border-primary'
        }`}
      >
        <input
          id={id}
          autoComplete="off"
          {...register(id)}
          {...props}
          className="w-full bg-body p-2 text-inherit text-app-text outline-none border-none text-base rounded-full focus:outline-none"
        />
        <FontAwesomeIcon
          icon={faMagnifyingGlass}
          className="text-subtext hover:text-red-500 transition-colors cursor-pointer px-1"
        />
      </form>
      {error?.message && <Error>{error.message}</Error>}
    </div>
  )
}

export default FormSearchInput
