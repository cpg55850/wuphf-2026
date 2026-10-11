import React from 'react'

export default function Loading() {
  return (
    <div className="flex h-[30vh] items-center justify-center">
      <div className="my-10 flex justify-center">
        <div className="m-1 h-4 w-4 animate-[bounce_0.4s_infinite_alternate] rounded-full bg-primary" />
        <div className="m-1 h-4 w-4 animate-[bounce_0.4s_infinite_alternate_200ms] rounded-full bg-primary" />
        <div className="m-1 h-4 w-4 animate-[bounce_0.4s_infinite_alternate_400ms] rounded-full bg-primary" />
      </div>
    </div>
  )
}
