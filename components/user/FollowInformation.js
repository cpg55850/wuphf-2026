import { useState, useEffect } from 'react'

import { faBell } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import axios from 'axios'
import styled from 'styled-components'


import FollowerModal from './FollowerModal'
import { useWuphfUser } from '../../hooks/WuphfUserContext'
import Button from '../general/Button'
import RoundButton from '../general/RoundButton'


export default function FollowInformation(props) {
    const [showFollowingModal, setShowFollowingModal] = useState(false)
    const [showFollowerModal, setShowFollowerModal] = useState(false)

    const { wuphfUser } = useWuphfUser()

    const { user } = props
    const [following, setFollowing] = useState(props.user.isFollowed)
    const [followersList, setFollowersList] = useState([])
    const [followingList, setFollowingList] = useState([])

    useEffect(() => {
        const newFollowersList = user?.Followers?.map(follower => {
            return {
                userName: follower.followerId,
                avatar: follower.user.avatar.url
            }
        })
        const newFollowingList = user?.Following?.map(following => {
            return {
                userName: following.userId,
                avatar: following.user.avatar.url
            }
        })

        setFollowersList(newFollowersList)
        setFollowingList(newFollowingList)
        setFollowing(user.isFollowed)
    }, [user])

    function handleFollowersClick() {
        if (showFollowerModal) {
            setShowFollowerModal(false)
        } else {
            setShowFollowerModal(true)
        }
    }

    function handleFollowingClick() {
        if (showFollowingModal) {
            setShowFollowingModal(false)
        } else {
            setShowFollowingModal(true)
        }
    }

    async function handleFollow() {
        const res = await axios.post(`/api/users/${encodeURIComponent(user.userName)}/following`)

        if (res) {
            alert(`${user.userName} followed`)
            setFollowing(true)
        }
    }

    async function handleUnfollow() {
        const res = await axios.delete(`/api/users/${encodeURIComponent(user.userName)}/following`)

        if (res) {
            alert(`${user.userName} unfollowed`)
            setFollowing(false)
        }
    }

    if (wuphfUser?.userName === user.userName) {
        return (
            <div>
                <Buttons>
                    <Button variant='primary' onClick={handleFollowingClick} >
                        {user?._count?.Following || '0'} Following
                    </Button>
                    <Button variant='primary' onClick={handleFollowersClick}>
                        {user?._count?.Followers || '0'} Followers
                    </Button>
                </Buttons>
                {showFollowerModal && <FollowerModal title='Followers' rows={followersList} onClose={handleFollowersClick} />}
                {showFollowingModal && <FollowerModal title='Following' rows={followingList} onClose={handleFollowingClick} />}
            </div>
        )
    } else {
        return (
            <Buttons>
                <RoundButton variant='primary'>
                    <FontAwesomeIcon icon={faBell} />
                </RoundButton>
                {following && <Button onClick={handleUnfollow} variant='secondary'>Unfollow</Button>}
                {!following && <Button onClick={handleFollow} variant='primary'>Follow</Button>}
            </Buttons>
        )
    }
}

const Buttons = styled.div`
	display: flex;
	gap: 0.5rem;
`