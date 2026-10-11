import React from 'react'

import { yupResolver } from '@hookform/resolvers/yup'
import axios from 'axios'
import { useForm } from 'react-hook-form'
import { object, string } from 'yup'

import { useWuphfUser } from '../../hooks/WuphfUserContext'
import Avatar from '../general/Avatar'
import Button from '../general/Button'

interface FormData {
  post: string
}

export interface WuphfInputProps {
  addWuphf: (wuphf: Wuphf) => void
}

const schema = object({
  post: string().trim().required('Please enter a Wuphf.'),
})

export default function WuphfInput({ addWuphf }: WuphfInputProps) {
  const { wuphfUser } = useWuphfUser()
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<FormData>({ resolver: yupResolver(schema) })

  async function postWuphf(): Promise<void> {
    if (!wuphfUser?.userName) return

    try {
      const res = await axios.post<Wuphf>('/api/wuphfs', {
        userName: wuphfUser.userName,
        postBody: watch('post'),
      })

      if (res.data) {
        addWuphf(res.data)
      }
    } catch (err: any) {
      alert(
        err?.response?.data?.message || err?.message || 'Failed to post Wuphf',
      )
    }
  }

  function onSubmit(data: FormData): void {
    console.log(data)
    postWuphf()
    reset()
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={`w-full p-6 rounded-[15px] border-[1.5px] ${
        errors.post ? 'border-red-500' : 'border-border'
      }`}
    >
      <textarea
        placeholder="What's happening?"
        {...register('post')}
        className="font-inherit text-inherit placeholder:text-text bg-transparent border-none border-b border-border outline-none resize-none w-full h-16 mb-2"
      />

      {errors.post && (
        <span className="block text-red-500 pb-4">{errors.post.message}</span>
      )}

      <div className="flex justify-between items-center">
        <Avatar
          size="medium"
          username={wuphfUser?.userName}
          profileImageUrl={wuphfUser?.avatar?.url}
        />
        <Button type="submit" variant="primary">
          WUPHF!
        </Button>
      </div>
    </form>
  )
}
