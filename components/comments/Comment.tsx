import React from 'react'

import Link from 'next/link'

import Avatar from '../general/Avatar'

export interface CommentProps {
  comment: Comments
  userName?: string
}

export default function Comment({ comment }: CommentProps) {
  return (
    <div className="flex pb-4 rounded-[20px] not-last:border-b not-last:border-border">
      {/* Avatar Container */}
      <div className="relative shrink-0 px-4 flex justify-center items-start">
        {comment.user && comment.user.avatar?.url && (
          <Avatar
            username={comment.userId ?? ''}
            profileImageUrl={comment.user.avatar.url}
            size="small"
          />
        )}
      </div>

      {/* Comment Main Body */}
      <div className="flex-1">
        {comment.userId && (
          <Link href={`/user/${comment.userId}`}>
            <h3 className="relative font-bold hover:underline cursor-pointer">
              {comment.userId}
            </h3>
          </Link>
        )}
        <p className="mt-2 p-2 rounded bg-inherit color-inherit w-full outline-none resize-none">
          {comment.commentBody}
        </p>
      </div>
    </div>
  )
}
