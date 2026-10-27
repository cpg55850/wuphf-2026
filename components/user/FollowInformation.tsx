import { useState, useEffect } from 'react'

import { faBell } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import axios from 'axios'

import FollowerModal, { type FollowerEntry } from './FollowerModal'
import { useWuphfUser } from '../../hooks/WuphfUserContext'
import Button from '../general/Button'
import RoundButton from '../general/RoundButton'

export interface FollowInformationProps {
  user: UserProfileResponse
}

export default function FollowInformation({ user }: FollowInformationProps) {
  const [showFollowingModal, setShowFollowingModal] = useState(false)
  const [showFollowerModal, setShowFollowerModal] = useState(false)

  const { wuphfUser } = useWuphfUser()

  const [following, setFollowing] = useState(user.isFollowed)
  const [followersList, setFollowersList] = useState<FollowerEntry[]>([])
  const [followingList, setFollowingList] = useState<FollowerEntry[]>([])

  useEffect(() => {
    const newFollowersList: FollowerEntry[] =
      user.Followers?.map((follower) => ({
        userName: follower.followerId,
        avatar: follower.follower?.avatar?.url ?? '',
      })) ?? []

    const newFollowingList: FollowerEntry[] =
      user.Following?.map((followingItem) => ({
        userName: followingItem.userId,
        avatar: followingItem.user?.avatar?.url ?? '',
      })) ?? []

    setFollowersList(newFollowersList)
    setFollowingList(newFollowingList)
    setFollowing(user.isFollowed)
  }, [user])

  function handleFollowersClick() {
    setShowFollowerModal((prev) => !prev)
  }

  function handleFollowingClick() {
    setShowFollowingModal((prev) => !prev)
  }

  async function handleFollow() {
    try {
      await axios.post(
        `/api/users/${encodeURIComponent(user.userName)}/following`,
      )
      setFollowing(true)
    } catch (error) {
      console.error('Failed to follow user:', error)
    }
  }

  async function handleUnfollow() {
    try {
      await axios.delete(
        `/api/users/${encodeURIComponent(user.userName)}/following`,
      )
      setFollowing(false)
    } catch (error) {
      console.error('Failed to unfollow user:', error)
    }
  }

  if (wuphfUser?.userName === user.userName) {
    return (
      <div>
        <div className="flex gap-2">
          <Button variant="primary" onClick={handleFollowingClick}>
            {user.Following?.length ?? 0} Following
          </Button>

          <Button variant="primary" onClick={handleFollowersClick}>
            {user.Followers?.length ?? 0} Followers
          </Button>
        </div>

        {showFollowerModal && (
          <FollowerModal
            title="Followers"
            rows={followersList}
            onClose={handleFollowersClick}
          />
        )}

        {showFollowingModal && (
          <FollowerModal
            title="Following"
            rows={followingList}
            onClose={handleFollowingClick}
          />
        )}
      </div>
    )
  }

  return (
    <div className="flex gap-2">
      <RoundButton variant="primary">
        <FontAwesomeIcon icon={faBell} />
      </RoundButton>

      {following ? (
        <Button onClick={handleUnfollow} variant="secondary">
          Unfollow
        </Button>
      ) : (
        <Button onClick={handleFollow} variant="primary">
          Follow
        </Button>
      )}
    </div>
  )
}
