import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

export type AvatarSize = 'small' | 'medium' | 'large'

export interface AvatarProps {
  username: string
  profileImageUrl?: string
  size?: AvatarSize
}

const sizeMap: Record<AvatarSize, number> = {
  small: 30,
  medium: 50,
  large: 150,
}

export default function Avatar({
  username,
  profileImageUrl,
  size = 'medium',
}: AvatarProps) {
  const dimension = sizeMap[size] || sizeMap.medium

  return (
    <Link href={`/user/${username}`} className="inline-block">
      <Image
        width={dimension}
        height={dimension}
        src={profileImageUrl || '/animal_svgs/dog_nau7in.svg'}
        alt={username}
        title={username}
        className="rounded-full border border-lightGrey object-cover"
      />
    </Link>
  )
}
