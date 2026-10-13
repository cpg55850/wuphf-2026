import React, { useState, MouseEvent } from 'react'

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

export interface WuphfProps extends Omit<Wuphf, 'id'> {
  id: string | number
  userLikePost: boolean
  _count: {
    Likes: number
    Comments: number
  }
  lastWuphfElementRef?: (node: HTMLElement | null) => void
  deleteWuphf: (id: string | number) => void
  user?: WuphfUser
}

export default function Wuphf(props: WuphfProps) {
  const { lastWuphfElementRef, deleteWuphf } = props

  const [editMenuShown, setEditMenuShown] = useState<boolean>(false)
  const [editable, setEditable] = useState<boolean>(false)
  const [postContent, setPostContent] = useState<string>(props.postBody)

  const [userLikePost, setUserLikePost] = useState<boolean>(props.userLikePost)
  const [likeCount, setLikeCount] = useState<number>(props._count?.Likes ?? 0)
  const { wuphfUser } = useWuphfUser()

  const { data: session } = useSession()

  function toggleEditMenuShown(e: MouseEvent) {
    e.preventDefault()
    setEditMenuShown(!editMenuShown)
  }

  function toggleEditable(e: MouseEvent) {
    e.preventDefault()
    setEditMenuShown(false)
    setEditable(!editable)
  }

  function handleEdit(e: React.ChangeEvent<HTMLTextAreaElement>) {
    if (editable) {
      setPostContent(e.target.value)
    }
  }

  function handleDelete(e: MouseEvent) {
    e.preventDefault()
    setEditMenuShown(false)
    axios.delete(`/api/wuphfs/${props.id}`).then(() => {
      deleteWuphf(props.id)
    })
  }

  function handleSave(e: MouseEvent) {
    e.preventDefault()
    setEditable(false)
    axios.patch(`/api/wuphfs/${props.id}`, {
      postBody: postContent,
    })
  }

  function handleChild(e: MouseEvent) {
    e.stopPropagation()
  }

  async function handleLikeToggle() {
    if (!session?.user?.email) return

    if (!userLikePost) {
      await axios
        .post(`/api/wuphfs/${props.id}/likes`, {
          userId: session.user.email,
          wuphfId: props.id,
        })
        .then(() => {
          setUserLikePost(true)
          setLikeCount((prev) => prev + 1)
        })
    } else {
      await axios
        .delete(`/api/wuphfs/${props.id}/likes`, {
          data: {
            userId: session.user.email,
            wuphfId: props.id,
          },
        })
        .then(() => {
          setUserLikePost(false)
          setLikeCount((prev) => Math.max(0, prev - 1))
        })
    }
  }

  function formatTime(createdAt: string | Date) {
    const currentTime = moment()
    const wuphfTime = moment(createdAt)
    const timeDiff = currentTime.diff(wuphfTime, 'h')

    if (timeDiff < 24) {
      return moment(createdAt).fromNow()
    } else {
      return moment(createdAt).format('MMM Do')
    }
  }

  return (
    <div
      ref={lastWuphfElementRef}
      className="first:rounded-t-[20px] last:rounded-b-[20px] not-last:border-b not-last:border-border hover:bg-highlight transition-colors"
    >
      <div className="grid grid-cols-[5rem_1fr] w-full">
        {/* Avatar Section */}
        <div className="relative p-4 mx-auto [&>span]:w-[50px] [&>span]:h-[50px]">
          {props.user && props.user.avatar?.url && (
            <Link href={`/user/${props.userId}`}>
              <Avatar
                username={props.userId}
                profileImageUrl={props.user.avatar.url}
                size="large"
              />
            </Link>
          )}
        </div>

        {/* Post Content Section */}
        <div className="p-4 pl-0">
          <div className="flex justify-between items-center">
            <div className="flex gap-1 items-center">
              <Link href={`/user/${props.userId}`}>
                <h3 className="relative font-bold hover:underline cursor-pointer">
                  {props.userId}
                </h3>
              </Link>
              <span className="text-subtext">·</span>
              <span className="text-subtext">
                {formatTime(props?.createdAt)}
              </span>
            </div>

            {wuphfUser?.userName === props.userId && (
              <div className="relative flex flex-col items-end cursor-pointer">
                <FontAwesomeIcon
                  icon={faEllipsis}
                  onClick={toggleEditMenuShown}
                  className={`p-1.5 rounded-full text-lightGrey hover:bg-primary hover:text-text ${
                    editMenuShown ? 'bg-primary text-text' : ''
                  }`}
                />

                {/* Edit Dropdown Menu */}
                {editMenuShown && (
                  <ul className="absolute mt-8 rounded-[10px] bg-highlight shadow-lg z-10 overflow-hidden border border-border">
                    {!editable ? (
                      <li
                        onClick={toggleEditable}
                        className="px-3 py-1.5 flex items-center gap-2 cursor-pointer first:rounded-t-[10px] last:rounded-b-[10px] hover:text-text hover:bg-primary"
                      >
                        <FontAwesomeIcon icon={faPenToSquare} />
                        <span>Edit</span>
                      </li>
                    ) : (
                      <li
                        onClick={toggleEditable}
                        className="px-3 py-1.5 flex items-center gap-2 cursor-pointer first:rounded-t-[10px] last:rounded-b-[10px] hover:text-text hover:bg-primary"
                      >
                        <FontAwesomeIcon icon={faBan} />
                        <span>Cancel</span>
                      </li>
                    )}
                    <li
                      onClick={handleDelete}
                      className="px-3 py-1.5 flex items-center gap-2 cursor-pointer first:rounded-t-[10px] last:rounded-b-[10px] hover:text-text hover:bg-primary"
                    >
                      <FontAwesomeIcon icon={faTrashCan} />
                      <span>Delete</span>
                    </li>
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Post Text & Save Button Row */}
          <div className="flex flex-col items-end gap-1.5 mt-1">
            {editable ? (
              <TextareaAutosize
                value={postContent}
                onChange={handleEdit}
                onClick={handleChild}
                className="font-inherit text-inherit py-1 px-2 leading-[1.25em] bg-transparent rounded-[10px] resize-none w-full outline-none shadow-none border border-darkestBlue cursor-text"
              />
            ) : (
              <p className="w-full py-1 leading-[1.25em] whitespace-pre-wrap break-words">
                {postContent}
              </p>
            )}

            {editable && (
              <Button
                variant="secondary"
                onClick={handleSave}
                className="flex justify-end gap-2.5 w-max"
              >
                <span>Save changes</span>
                <FontAwesomeIcon icon={faCheck} />
              </Button>
            )}
          </div>

          {/* Reactions Footer */}
          <div className="flex gap-4 mt-3">
            {/* Likes */}
            <div
              className={`flex items-center gap-1.5 ${
                userLikePost ? 'text-like' : 'text-gray-500'
              }`}
            >
              <FontAwesomeIcon
                icon={faThumbsUp}
                onClick={handleLikeToggle}
                className="cursor-pointer p-1.5 rounded-full transition-colors hover:bg-likeHover hover:text-like active:bg-likeActive"
              />
              <span className="cursor-pointer font-medium">{likeCount}</span>
            </div>

            {/* Comments */}
            <Link href={`/wuphf/${props.id}`}>
              <div
                className={`flex items-center gap-1.5 ${
                  props._count?.Comments > 0 ? 'text-comment' : 'text-gray-500'
                }`}
              >
                <FontAwesomeIcon
                  icon={faComment}
                  className="cursor-pointer p-1.5 rounded-full transition-colors hover:bg-commentHover hover:text-comment active:bg-commentActive"
                />
                <span className="cursor-pointer font-medium">
                  {props._count?.Comments}
                </span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
