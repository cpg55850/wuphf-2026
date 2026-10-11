// pages/_app.tsx
import '../styles/globals.css'
import '@fortawesome/fontawesome-svg-core/styles.css'

import { config } from '@fortawesome/fontawesome-svg-core'
import type { AppProps } from 'next/app'
import type { Session } from 'next-auth'
import { SessionProvider } from 'next-auth/react'

import Layout from '../components/layout/Layout'
import { AvatarContextProvider } from '../hooks/useAvatar'
import { CustomThemeProvider } from '../hooks/useCustomTheme'
import { WuphfUserContextProvider } from '../hooks/WuphfUserContext'

// Prevent FontAwesome from automatically adding CSS since it's imported above
config.autoAddCss = false

type CustomPageProps = {
  session?: Session
  [key: string]: any
}

function MyApp({ Component, pageProps }: AppProps<CustomPageProps>) {
  const { session, ...restPageProps } = pageProps

  return (
    <SessionProvider session={session}>
      <AvatarContextProvider>
        <WuphfUserContextProvider>
          <CustomThemeProvider>
            <Layout>
              <Component {...restPageProps} />
            </Layout>
          </CustomThemeProvider>
        </WuphfUserContextProvider>
      </AvatarContextProvider>
    </SessionProvider>
  )
}

export default MyApp
