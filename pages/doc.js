// pages/doc.js
import dynamic from 'next/dynamic'
import Head from 'next/head'

import { getApiDocs } from '../swagger'

// Dynamically load swagger-ui-react on the client side only
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false })

export default function ApiDoc({ spec }) {
  return (
    <>
      <Head>
        <title>API Documentation</title>
        <link
          rel="stylesheet"
          href="https://unpkg.com/swagger-ui-react@5/swagger-ui.css"
        />
      </Head>
      <div style={{ padding: '20px' }}>
        <SwaggerUI spec={spec} />
      </div>
    </>
  )
}

export async function getStaticProps() {
  const spec = await getApiDocs()
  return {
    props: {
      spec,
    },
  }
}