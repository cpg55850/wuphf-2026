import React, { useCallback, useEffect, useState } from 'react'

import axios from 'axios'
import moment from 'moment'
import Head from 'next/head'
import { useRouter } from 'next/router'

import Avatar from '../../components/general/Avatar'
import Error from '../../components/layout/Error'
import Loading from '../../components/layout/Loading'
import FollowInformation from '../../components/user/FollowInformation'
import WuphfsFeed from '../../components/wuphfs/WuphfsFeed'

function UserPage() {
  const router = useRouter()
  const { id } = router.query

  const userId = Array.isArray(id) ? id[0] : id

  const [user, setUser] = useState<UserProfileResponse | null>(null)
  const [wuphfs, setWuphfs] = useState<UserWuphfsResponse | null>(null)

  const [userLoading, setUserLoading] = useState(true)
  const [wuphfsLoading, setWuphfsLoading] = useState(true)

  const [userError, setUserError] = useState<ApiError | null>(null)

  const [cursor, setCursor] = useState<number | null>(null)
  const [hasMore, setHasMore] = useState(false)

  const getWuphfs = useCallback(async () => {
    if (!userId) return

    setWuphfsLoading(true)

    try {
      const response = await axios.get<UserWuphfsResponse>(
        `/api/users/${encodeURIComponent(userId)}/wuphfs`,
      )

      setWuphfs(response.data)
    } catch (err: unknown) {
      const error = axios.isAxiosError(err) ? err : null

      setWuphfs(null)

      console.error('Failed to load user Wuphfs:', error?.response?.data ?? err)
    } finally {
      setWuphfsLoading(false)
    }
  }, [userId])

  const getUser = useCallback(async () => {
    if (!userId) return

    setUserLoading(true)
    setUserError(null)

    try {
      const response = await axios.get<UserProfileResponse>(
        `/api/users/${encodeURIComponent(userId)}`,
      )

      setUser(response.data)
    } catch (err: unknown) {
      const error = axios.isAxiosError(err) ? err : null

      setUserError({
        data: error?.response?.data ?? {
          message: 'Failed to load user profile.',
        },
        status: error?.response?.status ?? 500,
      })
    } finally {
      setUserLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (!router.isReady || !userId) return

    void getUser()
    void getWuphfs()
  }, [router.isReady, userId, getUser, getWuphfs])

  if (userError) {
    return <Error error={userError} />
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4">
      <Head>
        <title>{user ? `${user.userName} | Wuphf` : 'Wuphf'}</title>
      </Head>

      {userLoading ? (
        <Loading />
      ) : user ? (
        <section className="relative py-4">
          <div className="h-[178px] rounded-[20px] bg-primary" />

          <div className="mb-4 flex flex-col p-[0.65rem]">
            <header className="relative mb-[0.3rem] flex items-center justify-between">
              <h1 className="text-2xl font-bold">{user.userName}</h1>

              <div className="absolute left-1/2 top-[-80px] -translate-x-1/2 -translate-y-1/2">
                <Avatar
                  username={user.userName}
                  profileImageUrl={user.avatar?.url ?? ''}
                  size="large"
                />
              </div>

              <FollowInformation user={user} />
            </header>

            <h3 className="mb-6 text-xs">
              Joined {moment(user.createdAt).fromNow()}
            </h3>

            {user.bio && <div className="leading-[1.25em]">{user.bio}</div>}
          </div>
        </section>
      ) : null}

      <WuphfsFeed
        wuphfs={wuphfs}
        loading={wuphfsLoading}
        hasMore={hasMore}
        getWuphfs={getWuphfs}
      />
    </main>
  )
}

export default UserPage
