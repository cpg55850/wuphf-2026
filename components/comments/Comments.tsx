import React from 'react'

import Comment from './Comment'
import Loading from '../layout/Loading'

export interface CommentsProps {
  comments?: Comments[] | null
  commentsLoading?: boolean
}

export default function CommentsComponent({
  comments,
  commentsLoading,
}: CommentsProps) {
  if (commentsLoading) {
    return <Loading />
  }

  if (!comments || comments.length === 0) {
    return (
      <div className="p-6 text-center text-subtext bg-highlight rounded-b-[20px]">
        <p>No comments... 😢</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col pt-4 gap-4 rounded-b-[20px]">
      {comments.map((comment) => (
        <Comment key={comment.id} comment={comment} />
      ))}
    </div>
  )
}
