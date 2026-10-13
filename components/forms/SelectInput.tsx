import React from 'react'

import type { UseFormRegister, FieldValues, Path } from 'react-hook-form'

import Label from './Label'

export interface SelectInputProps<
  TFieldValues extends FieldValues = FieldValues,
> {
  register: UseFormRegister<TFieldValues>
  id: Path<TFieldValues>
  label?: string
  children: React.ReactNode
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void
  onBlur?: (e: React.FocusEvent<HTMLSelectElement>) => void
  name?: string
  enabled?: boolean
}

const SelectInput = React.forwardRef<HTMLSelectElement, SelectInputProps<any>>(
  (
    { register, id, label, children, onChange, onBlur, name, enabled = true },
    ref,
  ) => {
    const registered = register(id)

    return (
      <div className="mb-4 w-full">
        {label && <Label htmlFor={id}>{label}</Label>}
        <select
          id={id}
          ref={(e) => {
            registered.ref(e)
            if (typeof ref === 'function') {
              ref(e)
            } else if (ref) {
              ref.current = e
            }
          }}
          disabled={!enabled}
          onChange={(e) => {
            registered.onChange(e)
            onChange?.(e)
          }}
          onBlur={(e) => {
            registered.onBlur(e)
            onBlur?.(e)
          }}
          name={registered.name}
          className="mt-2 w-full cursor-pointer appearance-none rounded-xl border border-border border-solid bg-body p-2 text-inherit text-app-text outline-none text-base disabled:cursor-not-allowed disabled:opacity-50"
        >
          {children}
        </select>
      </div>
    )
  },
)

SelectInput.displayName = 'SelectInput'

export default SelectInput
