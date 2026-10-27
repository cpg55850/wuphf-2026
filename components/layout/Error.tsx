import React from 'react'

export interface ErrorProps {
  error: ApiError
}

export default function Error({ error }: ErrorProps) {
  return (
    <div className="flex h-[30vh] items-center justify-center">
      <div className="flex items-center justify-center gap-4">
        <div className="text-3xl font-bold">{error?.status}</div>
        <div className="h-[50px] w-[2px] bg-black" />
        <div>
          {String(error?.status) === '500'
            ? 'Internal Server Error'
            : error?.data}
        </div>
      </div>
    </div>
  )
}
