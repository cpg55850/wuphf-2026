import React, { useEffect, useState } from 'react'

import axios from 'axios'
import moment from 'moment'
import Head from 'next/head'
import { useRouter } from 'next/router'
import styled from 'styled-components'

import Avatar from '../../components/general/Avatar'
import Error from '../../components/layout/Error'
import Loading from '../../components/layout/Loading'
import Container from '../../components/styledComponents/Container'
import FollowInformation from '../../components/user/FollowInformation'
import WuphfsFeed from '../../components/wuphfs/WuphfsFeed'

function UserPage() {
  const router = useRouter()
  const { id } = router.query
  const [user, setUser] = useState()
  const [wuphfs, setWuphfs] = useState(null)
  const [userLoading, setUserLoading] = useState(true)
  const [wuphfsLoading, setWuphfsLoading] = useState(true)
  const [userError, setUserError] = useState()
  const [followingError, setFollowingError] = useState()
  const [wuphfsError, setWuphfsError] = useState()
  const [cursor, setCursor] = useState(null)
  const [hasMore, setHasMore] = useState(false)

  const getWuphfs = async () => {
    setWuphfsLoading(true)
    const res = await axios
      .get(`/api/users/${encodeURIComponent(id)}/wuphfs`)
      .catch((err) => {
        setWuphfsError({ data: err.response.data, status: err.response.status })
        setWuphfsLoading(false)
        setWuphfs([])
      })

    if (res) {
      // TODO: Add pagination to /users/[id]/wuphfs endpoint
      // if (cursor == res.data.cursor) {
      // 	setHasMore(false)
      // }
      // setCursor(res.data.cursor)
      // console.log('res?.data.cursor', res.data.cursor)
      // console.log('res.daata', res.data)
      const newWuphfs = res.data
      setWuphfs(newWuphfs)
      setWuphfsLoading(false)
    }
  }

  async function getUser() {
    const res = await axios
      .get(`/api/users/${encodeURIComponent(id)}`)
      .catch((err) => {
        setUserError({ data: err.response.data, status: err.response.status })
      })
    setUser(res?.data)
    getWuphfs()
    setUserLoading(false)
  }

  useEffect(() => {
    if (id) {
      getUser()
    }
  }, [id])

  // function deleteWuphf(wuphf) {
  // 	setWuphfs(wuphfs.filter((wuphf) => wuphf.id !== wuphfId))
  // }

  if (userError) return <Error error={userError} />

  return (
    <Container>
      <Head>
        <title>{user && user?.userName} | Wuphf</title>
      </Head>
      {userLoading ? (
        <Loading />
      ) : (
        <TopContainer>
          <Banner />
          <HeaderAndBio>
            <Header>
              <Text>
                <Username as="h1">{user?.userName}</Username>
              </Text>
              <AvatarWrapper>
                <Avatar
                  username={user.userName}
                  profileImageUrl={user.avatar.url}
                  size="large"
                  border="shown"
                />
              </AvatarWrapper>
              <FollowInformation user={user} />
            </Header>
            <Joined as="h3">Joined {moment(user?.createdAt).fromNow()}</Joined>
            <Bio>{user?.bio}</Bio>
          </HeaderAndBio>
        </TopContainer>
      )}

      {/* {wuphfsLoading ? <Loading /> : <Wuphfs wuphfs={wuphfs && wuphfs} />} */}
      <WuphfsFeed
        wuphfs={wuphfs}
        loading={wuphfsLoading}
        hasMore={hasMore}
        getWuphfs={getWuphfs}
      />
    </Container>
  )
}

const TopContainer = styled.div`
  position: relative;
`

const Banner = styled.div`
  background-color: ${(props) => props.theme.colors.primary};
  height: 200px;
  border-radius: 20px;
`
const AvatarWrapper = styled.div`
  position: absolute;
  left: 50%;
  transform: translate(-50%, -50%);
`
const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.3rem;
`

const HeaderAndBio = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0.65rem;
  margin-bottom: 1rem;
`

const Text = styled.div``

const Username = styled.h1`
  font-weight: bold;
  font-size: 1.5rem;
`

const Joined = styled.h3`
  font-size: 0.75rem;
  margin-bottom: 1.5rem;
`

const Bio = styled.div`
  line-height: 1.25em;
`

export default UserPage
