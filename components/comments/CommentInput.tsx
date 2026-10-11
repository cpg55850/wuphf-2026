import React, { useState, ChangeEvent, FormEvent } from 'react'

import axios from 'axios'
import { useRouter } from 'next/router'

import { useWuphfUser } from '../../hooks/WuphfUserContext'
import Avatar from '../general/Avatar'
import Button from '../general/Button'

export interface CommentInputProps {
  wuphfId?: string | number
  addComment: (comment: Comments) => void
}

export default function CommentInput({
  wuphfId,
  addComment,
}: CommentInputProps) {
  const [comment, setComment] = useState<string>('')
  const { wuphfUser } = useWuphfUser()
  const router = useRouter()

  // Fallback to route query parameter if props.wuphfId isn't passed directly
  const targetId = wuphfId || router.query.wid || router.query.id

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setComment(event.target.value)
  }

  async function commentRequest() {
    if (!comment.trim() || !targetId) return

    try {
      const res = await axios.post<Comments>(
        `/api/wuphfs/${targetId}/comments`,
        {
          commentBody: comment,
        },
      )

      if (res.data) {
        addComment(res.data)
        setComment('')
      }
    } catch (err: any) {
      console.error('Error submitting comment:', err)
      alert(err.response?.data?.message || 'Failed to submit comment.')
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await commentRequest()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-4 p-4 text-text bg-highlight border-x-[1.5px] border-b-[1.5px] border-border"
    >
      <div className="relative shrink-0 [&>span]:w-[50px] [&>span]:h-[50px]">
        {wuphfUser?.userName && (
          <Avatar
            username={wuphfUser.userName}
            profileImageUrl={wuphfUser.avatar?.url}
            size="small"
          />
        )}
      </div>

      <textarea
        value={comment}
        onChange={handleChange}
        placeholder="What do you want to say?"
        rows={1}
        className="font-inherit text-inherit bg-body w-full p-2 rounded resize-none outline-none border-[1.5px] border-border focus:outline-none"
      />

      <Button type="submit" variant="primary">
        Comment!
      </Button>
    </form>
  )
}
