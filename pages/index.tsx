import { useState, useEffect } from 'react'
import axios from 'axios'
import Head from 'next/head'

import withAuth from '../components/layout/withAuth'
import Container from '../components/styledComponents/Container'
import WuphfInput from '../components/timeline/WuphfInput'
import WuphfsFeed from '../components/wuphfs/WuphfsFeed'

interface HomeProps {
  session: Session
}

function Home({ session }: HomeProps) {
  const [wuphfs, setWuphfs] = useState<Wuphf[] | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [cursor, setCursor] = useState<number | string | null>(null)
  const [maxResults] = useState<number>(20)
  const [error, setError] = useState<ApiError | false>(false)
  const [hasMore, setHasMore] = useState<boolean>(true)

  const getWuphfs = async (): Promise<void> => {
    setLoading(true)
    const res = await axios
      .get(`../api/timeline?&maxResults=${maxResults}&cursor=${cursor}`)
      .catch((err) => {
        setError({
          data: err.response?.data,
          status: err.response?.status,
        })
        setLoading(false)
      })

    if (res) {
      if (cursor === res.data.cursor) {
        setHasMore(false)
      }
      setCursor(res.data.cursor)

      const newWuphfs: Wuphf[] =
        wuphfs !== null ? [...wuphfs, ...res.data.timeline] : res.data.timeline
      setWuphfs(newWuphfs)
      setLoading(false)
    }
  }

  function addWuphf(wuphf: Wuphf): void {
    setWuphfs((prevWuphfs) => (prevWuphfs ? [wuphf, ...prevWuphfs] : [wuphf]))
  }

  // function deleteWuphf(wuphfId: number): void {
  //    setWuphfs((prevWuphfs) => prevWuphfs ? prevWuphfs.filter((w) => w.id !== wuphfId) : null)
  // }

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
