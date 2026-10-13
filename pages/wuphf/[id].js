import React, { useState, useEffect } from 'react'

import axios from 'axios'
import Head from 'next/head'
import { useRouter } from 'next/router'

import CommentInput from '../../components/comments/CommentInput'
import Comments from '../../components/comments/Comments'
import Container from '../../components/styledComponents/Container'
import Wuphf from '../../components/wuphfs/Wuphf'

function WuphfPage() {
  const router = useRouter()
  const { id } = router.query
  const [wuphf, setWuphf] = useState(null)
  const [wuphfLoading, setWuphfLoading] = useState(true)
  const [wuphfError, setWuphError] = useState(null)
  const [comments, setComments] = useState(null)
  const [commentsLoading, setCommentsLoading] = useState(true)
  const [commentsError, setCommentsError] = useState(null)

  async function getWuphf() {
    const res = await axios.get(`/api/wuphfs/${id}`).catch((err) => alert(err))

    if (res) {
      console.log('wuphf', res.data)
      setWuphf(res.data)
      setWuphfLoading(false)
    }
  }

  async function getComments() {
    const res = await axios
      .get(`/api/wuphfs/${id}/comments`)
      .catch((err) => alert(err))

    if (res) {
      console.log('wuphf', res.data)
      setComments(res.data)
      setCommentsLoading(false)
    }
  }

  function addComment(comment) {
    setComments([comment, ...comments])
  }

  useEffect(() => {
    if (id) {
      getWuphf()
      getComments()
    }
  }, [id])

  return (
    <Container>
      <div className="shadow-lg border-[.5px] border-border border-solid rounded-[20px]">
        <Head>
          <title>
            {wuphf && `${wuphf.userId} on Wuphf: "${wuphf.postBody}"`} | Wuphf
          </title>
        </Head>

        {wuphf && (
          <Wuphf
            key={wuphf.id}
            // onDelete={() => handleDeleteWuphf(index)}
            {...wuphf}
          />
        )}
        <CommentInput addComment={addComment} />
        {/* <Title>Comments...</Title> */}
        <Comments comments={comments} commentsLoading={commentsLoading} />
        {/* {comments && JSON.stringify(comments, null, 2)} */}
        {/* <Comment /> */}
      </div>
    </Container>
  )
}

// // not working?
// const StyledWuphf = styled(Wuphf)`
// 	border: ${({ theme }) => `1.5px solid ${theme.colors.border}`};
// `

export default WuphfPage
