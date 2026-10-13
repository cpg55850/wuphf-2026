import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import Head from 'next/head'
import withAuth from '../components/layout/withAuth'
import Container from '../components/styledComponents/Container'
import WuphfInput from '../components/timeline/WuphfInput'
import { WuphfProps } from '../components/wuphfs/Wuphf'
import WuphfsFeed from '../components/wuphfs/WuphfsFeed'

interface HomeProps {
  session: Session
}

function Home({ session }: HomeProps) {
  const [wuphfs, setWuphfs] = useState<WuphfProps[] | null>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [cursor, setCursor] = useState<number | string | null>(null)
  const [maxResults] = useState<number>(20)
  const [error, setError] = useState<ApiError | false>(false)
  const [hasMore, setHasMore] = useState<boolean>(true)

  const deleteWuphf = (wuphfId: string | number): void => {
    setWuphfs((prevWuphfs) =>
      prevWuphfs ? prevWuphfs.filter((w) => w.id !== wuphfId) : [],
    )
  }

  const getWuphfs = async (): Promise<void> => {
    setLoading(true)
    try {
      const res = await axios.get(
        `../api/timeline?&maxResults=${maxResults}&cursor=${cursor}`,
      )
      if (res) {
        if (cursor === res.data.cursor) {
          setHasMore(false)
        }
        setCursor(res.data.cursor)
        const fetchedWuphfs: WuphfProps[] = res.data.timeline.map((w: any) => ({
          ...w,
          userLikePost: w.userLikePost ?? false,
          _count: w._count ?? { Likes: 0, Comments: 0 },
          deleteWuphf,
        }))

        // This is to fix a bug where wuphf was showing up twice for the first wuphf created by a user
        setWuphfs((prevWuphfs) => {
          if (prevWuphfs === null) return fetchedWuphfs

          // Combine and filter out duplicates based on ID
          const existingIds = new Set(prevWuphfs.map((w) => w.id))
          const uniqueNewWuphfs = fetchedWuphfs.filter(
            (w) => !existingIds.has(w.id),
          )
          return [...prevWuphfs, ...uniqueNewWuphfs]
        })
        setLoading(false)
      }
    } catch (err: any) {
      setError({
        data: err.response?.data,
        status: err.response?.status,
      })
      setLoading(false)
    }
  }

  function addWuphf(rawWuphf: Wuphf): void {
    const newWuphf: WuphfProps = {
      ...rawWuphf,
      userLikePost: false,
      _count: { Likes: 0, Comments: 0 },
      deleteWuphf,
    }
    setWuphfs((prevWuphfs) =>
      prevWuphfs ? [newWuphf, ...prevWuphfs] : [newWuphf],
    )
  }

  useEffect(() => {
    getWuphfs()
  }, [])

  return (
    <Container>
      <Head>
        <title>Home | Wuphf</title>
      </Head>
      <div className="flex flex-col gap-4">
        <WuphfInput addWuphf={addWuphf} />
        <WuphfsFeed
          wuphfs={wuphfs}
          loading={loading}
          hasMore={hasMore}
          getWuphfs={getWuphfs}
        />
      </div>
    </Container>
  )
}

export default withAuth(Home)
