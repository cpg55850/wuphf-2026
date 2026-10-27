import React, { MouseEvent } from 'react'

import Link from 'next/link'

import Avatar from '../general/Avatar'
import Button from '../general/Button'

export interface FollowerEntry {
  userName: string
  avatar?: string
}

export interface FollowerModalProps {
  title: string
  rows?: FollowerEntry[]
  onClose: (e?: MouseEvent<HTMLButtonElement>) => void
}

export default function FollowerModal({
  title,
  rows,
  onClose,
}: FollowerModalProps) {
  const handleBackdropClick = () => {
    onClose()
  }

  const handleModalClick = (e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()
  }

  return (
    <div
      className="fixed inset-0 z-[1000] flex h-screen w-screen items-center justify-center bg-black/60 backdrop-blur-[3px]"
      onClick={handleBackdropClick}
    >
      {/* Modal Card Content */}
      <div
        className="relative flex max-h-[80vh] w-[90%] max-w-[450px] flex-col overflow-hidden rounded-[16px] border border-border bg-cardBackground text-text shadow-[0_10px_25px_rgba(0,0,0,0.3)]"
        onClick={handleModalClick}
      >
        {/* Modal Header */}
        <div className="flex justify-between border-b border-border bg-body">
          <div className="flex w-full items-center justify-between p-4 px-5">
            <h2 className="text-[1.25rem] font-bold text-text">{title}</h2>
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex flex-col overflow-y-auto bg-body p-3 px-4">
          {rows && rows.length > 0 ? (
            rows.map((entry) => (
              <Link href={`/user/${entry.userName}`} key={entry.userName}>
                <div className="flex cursor-pointer items-center gap-3 rounded-lg p-2.5 text-[1.1rem] text-text transition-colors hover:bg-hoverBackground">
                  <Avatar
                    username={entry.userName}
                    profileImageUrl={entry.avatar}
                    size="medium"
                  />
                  <span>{entry.userName}</span>
                </div>
              </Link>
            ))
          ) : (
            <div className="p-4 text-center text-text">No followers... 😢</div>
          )}
        </div>
      </div>
    </div>
  )
}
