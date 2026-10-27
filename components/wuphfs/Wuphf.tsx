import React, { useState, useEffect, type MouseEvent } from 'react'

import {
  faBan,
  faCheck,
  faEllipsis,
  faPenToSquare,
  faThumbsUp,
  faTrashCan,
  faComment,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import axios from 'axios'
import moment from 'moment'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import TextareaAutosize from 'react-textarea-autosize'

import { useWuphfUser } from '../../hooks/WuphfUserContext'
import Avatar from '../general/Avatar'
import Button from '../general/Button'

export interface WuphfProps extends WuphfApiResponse {
  lastWuphfElementRef?: (node: HTMLElement | null) => void
  deleteWuphf: (id: number) => void
}

export default function Wuphf(props: WuphfProps) {
  const { lastWuphfElementRef, deleteWuphf } = props

  const [editMenuShown, setEditMenuShown] = useState(false)
  const [editable, setEditable] = useState(false)
  const [postContent, setPostContent] = useState(props.postBody ?? '')
  const [userLikePost, setUserLikePost] = useState(props.userLikePost ?? false)
  const [likeCount, setLikeCount] = useState(props._count?.Likes ?? 0)

  const { wuphfUser } = useWuphfUser()
  const { data: session } = useSession()

  const commentCount = props._count?.Comments ?? 0
  const username = props.user?.userName ?? props.userId

  useEffect(() => {
    setPostContent(props.postBody ?? '')
    setUserLikePost(props.userLikePost ?? false)
    setLikeCount(props._count?.Likes ?? 0)
  }, [props.postBody, props.userLikePost, props._count?.Likes])

  function toggleEditMenuShown(e: MouseEvent<SVGSVGElement>) {
    e.preventDefault()
    setEditMenuShown((shown) => !shown)
  }

  function toggleEditable(e: MouseEvent<HTMLLIElement>) {
    e.preventDefault()
    setEditMenuShown(false)
    setEditable((current) => !current)
  }

  function handleEdit(e: React.ChangeEvent<HTMLTextAreaElement>) {
    if (editable) {
      setPostContent(e.target.value)
    }
  }

  async function handleDelete(e: MouseEvent<HTMLLIElement>) {
    e.preventDefault()
    setEditMenuShown(false)

    try {
      await axios.delete(`/api/wuphfs/${props.id}`)
      deleteWuphf(props.id)
    } catch (error) {
      console.error('Failed to delete Wuphf:', error)
    }
  }

  async function handleSave(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault()

    try {
      await axios.patch(`/api/wuphfs/${props.id}`, {
        postBody: postContent,
      })
      setEditable(false)
    } catch (error) {
      console.error('Failed to update Wuphf:', error)
    }
  }

  function handleChild(e: MouseEvent<HTMLTextAreaElement>) {
    e.stopPropagation()
  }

  async function handleLikeToggle() {
    const userId = session?.user?.email

    if (!userId) return

    try {
      if (!userLikePost) {
        await axios.post(`/api/wuphfs/${props.id}/likes`, {
          userId,
          wuphfId: props.id,
        })

        setUserLikePost(true)
        setLikeCount((prev) => prev + 1)
      } else {
        await axios.delete(`/api/wuphfs/${props.id}/likes`, {
          data: {
            userId,
            wuphfId: props.id,
          },
        })

        setUserLikePost(false)
        setLikeCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Failed to toggle Wuphf like:', error)
    }
  }

  function formatTime(createdAt: string | Date) {
    const timeDiff = moment().diff(moment(createdAt), 'hours')

    if (timeDiff < 24) {
      return moment(createdAt).fromNow()
    }

    return moment(createdAt).format('MMM Do')
  }

  return (
    <div
      ref={lastWuphfElementRef}
      className="first:rounded-t-[20px] last:rounded-b-[20px] border-b border-solid border-border transition-colors last:border-b-0"
    >
      <div className="grid w-full grid-cols-[5rem_1fr]">
        {/* Avatar Section */}
        <div className="relative mx-auto p-4 [&>span]:h-[50px] [&>span]:w-[50px]">
          {props.user?.avatar?.url && (
            <Link href={`/user/${encodeURIComponent(props.userId)}`}>
              <Avatar
                username={username}
                profileImageUrl={props.user.avatar.url}
                size="large"
              />
            </Link>
          )}
        </div>

        {/* Post Content Section */}
        <div className="p-4 pl-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Link href={`/user/${encodeURIComponent(props.userId)}`}>
                <h3 className="relative cursor-pointer font-bold hover:underline">
                  {username}
                </h3>
              </Link>

              <span className="text-subtext">·</span>

              <span className="text-subtext">
                {formatTime(props.createdAt)}
              </span>
            </div>

            {wuphfUser?.userName === username && (
              <div className="relative flex cursor-pointer flex-col items-end">
                <FontAwesomeIcon
                  icon={faEllipsis}
                  onClick={toggleEditMenuShown}
                  className={`rounded-full p-1.5 text-lightGrey hover:bg-primary hover:text-text ${
                    editMenuShown ? 'bg-primary text-text' : ''
                  }`}
                />

                {/* Edit Dropdown Menu */}
                {editMenuShown && (
                  <ul className="absolute z-10 mt-8 overflow-hidden rounded-[10px] border border-border bg-highlight shadow-lg">
                    <li
                      onClick={toggleEditable}
                      className="flex cursor-pointer items-center gap-2 px-3 py-1.5 first:rounded-t-[10px] last:rounded-b-[10px] hover:bg-primary hover:text-text"
                    >
                      <FontAwesomeIcon
                        icon={editable ? faBan : faPenToSquare}
                      />
                      <span>{editable ? 'Cancel' : 'Edit'}</span>
                    </li>

                    <li
                      onClick={handleDelete}
                      className="flex cursor-pointer items-center gap-2 px-3 py-1.5 first:rounded-t-[10px] last:rounded-b-[10px] hover:bg-primary hover:text-text"
                    >
                      <FontAwesomeIcon icon={faTrashCan} />
                      <span>Delete</span>
                    </li>
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Post Text and Save Button */}
          <div className="mt-1 flex flex-col items-end gap-1.5">
            {editable ? (
              <TextareaAutosize
                value={postContent}
                onChange={handleEdit}
                onClick={handleChild}
                className="w-full resize-none cursor-text rounded-[10px] border border-darkestBlue bg-transparent px-2 py-1 font-inherit leading-[1.25em] text-inherit shadow-none outline-none"
              />
            ) : (
              <p className="w-full break-words whitespace-pre-wrap py-1 leading-[1.25em]">
                {postContent}
              </p>
            )}

            {editable && (
              <Button
                variant="secondary"
                onClick={handleSave}
                className="flex w-max justify-end gap-2.5"
              >
                <span>Save changes</span>
                <FontAwesomeIcon icon={faCheck} />
              </Button>
            )}
          </div>

          {/* Reactions Footer */}
          <div className="mt-3 flex gap-2">
            {/* Likes */}
            <button
              type="button"
              onClick={handleLikeToggle}
              aria-label={`${userLikePost ? 'Unlike' : 'Like'} post`}
              aria-pressed={userLikePost}
              className={`group flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors ${
                userLikePost ? 'text-like' : 'text-gray-500 hover:text-like'
              } hover:bg-like/10 active:bg-like/20`}
            >
              <FontAwesomeIcon
                icon={faThumbsUp}
                className="transition-colors"
              />
              <span className="font-medium">{likeCount}</span>
            </button>

            {/* Comments */}
            <Link href={`/wuphf/${props.id}`}>
              <div
                className={`group flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors hover:bg-comment/10 active:bg-comment/20 ${
                  commentCount > 0
                    ? 'text-comment'
                    : 'text-gray-500 hover:text-comment'
                }`}
              >
                <FontAwesomeIcon icon={faComment} />
                <span className="font-medium">{commentCount}</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
