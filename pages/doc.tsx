// pages/doc.tsx
import { ComponentType } from 'react'

import type { InferGetStaticPropsType, GetStaticProps } from 'next'
import dynamic from 'next/dynamic'
import Head from 'next/head'

import { getApiDocs } from '../swagger'

// Explicitly type the dynamic import so TypeScript knows it accepts a `spec` prop
const SwaggerUI = dynamic(
  () =>
    import('swagger-ui-react') as Promise<{
      default: ComponentType<{ spec: Record<string, any> }>
    }>,
  { ssr: false },
)

type ApiDocProps = {
  spec: Record<string, any>
}

export default function ApiDoc({
  spec,
}: InferGetStaticPropsType<typeof getStaticProps>) {
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

export const getStaticProps: GetStaticProps<ApiDocProps> = async () => {
  const spec = await getApiDocs()
  return {
    props: {
      spec,
    },
  }
}
