import { useState, useEffect, useCallback } from 'react'

import axios from 'axios'
import Head from 'next/head'
import { useRouter } from 'next/router'

import CommentInput from '../../components/comments/CommentInput'
import Comments from '../../components/comments/Comments'
import Wuphf from '../../components/wuphfs/Wuphf'

export default function WuphfPage() {
  const router = useRouter()
  const { id } = router.query

  const wuphfId = Array.isArray(id) ? id[0] : id

  const [wuphf, setWuphf] = useState<WuphfApiResponse | null>(null)
  const [wuphfLoading, setWuphfLoading] = useState(true)
  const [wuphfError, setWuphfError] = useState<string | null>(null)

  const [comments, setComments] = useState<Comments[] | null>(null)
  const [commentsLoading, setCommentsLoading] = useState(true)
  const [commentsError, setCommentsError] = useState<string | null>(null)

  const getWuphf = useCallback(async () => {
    if (!wuphfId) return

    setWuphfLoading(true)
    setWuphfError(null)

    try {
      const response = await axios.get<WuphfApiResponse>(
        `/api/wuphfs/${encodeURIComponent(wuphfId)}`,
      )

      setWuphf(response.data)
    } catch (error) {
      console.error('Failed to fetch Wuphf:', error)
      setWuphfError('Unable to load this Wuphf. Please try again.')
    } finally {
      setWuphfLoading(false)
    }
  }, [wuphfId])

  const getComments = useCallback(async () => {
    if (!wuphfId) return

    setCommentsLoading(true)
    setCommentsError(null)

    try {
      const response = await axios.get<Comments[]>(
        `/api/wuphfs/${encodeURIComponent(wuphfId)}/comments`,
      )

      setComments(response.data)
    } catch (error) {
      console.error('Failed to fetch comments:', error)
      setCommentsError('Unable to load comments. Please try again.')
    } finally {
      setCommentsLoading(false)
    }
  }, [wuphfId])

  function addComment(comment: Comments) {
    setComments((currentComments) => [comment, ...(currentComments ?? [])])
  }

  useEffect(() => {
    if (!router.isReady || !wuphfId) return

    void getWuphf()
    void getComments()
  }, [router.isReady, wuphfId, getWuphf, getComments])

  const pageTitle = wuphf
    ? `${wuphf.user?.userName ?? wuphf.userId} on Wuphf: "${wuphf.postBody}"`
    : 'Wuphf'

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6">
      <Head>
        <title>{pageTitle} | Wuphf</title>
        <meta name="description" content="View a Wuphf and its comments." />
      </Head>

      <section className="overflow-hidden rounded-[20px] border border-border shadow-lg">
        {wuphfLoading && (
          <p className="p-6 text-center text-subtext" role="status">
            Loading Wuphf...
          </p>
        )}

        {!wuphfLoading && wuphfError && (
          <div className="p-6 text-center">
            <p className="text-red-500">{wuphfError}</p>
            <button
              type="button"
              onClick={() => void getWuphf()}
              className="mt-3 rounded-lg border border-border px-4 py-2 transition-colors hover:bg-primary"
            >
              Try again
            </button>
          </div>
        )}

        {!wuphfLoading && !wuphfError && wuphf && (
          <Wuphf
            key={wuphf.id}
            {...wuphf}
            deleteWuphf={(deletedId: number) => {
              if (deletedId === wuphf.id) {
                setWuphf(null)
              }
            }}
          />
        )}

        {!wuphfLoading && !wuphfError && !wuphf && (
          <p className="p-6 text-center text-subtext">
            This Wuphf could not be found.
          </p>
        )}

        <div className="border-t border-border p-4">
          <CommentInput addComment={addComment} />

          {commentsError && (
            <div className="mt-4 text-center">
              <p className="text-red-500">{commentsError}</p>
              <button
                type="button"
                onClick={() => void getComments()}
                className="mt-2 rounded-lg border border-border px-4 py-2 transition-colors hover:bg-primary"
              >
                Retry loading comments
              </button>
            </div>
          )}

          <div className="mt-4">
            <Comments comments={comments} commentsLoading={commentsLoading} />
          </div>
        </div>
      </section>
    </main>
  )
}
