import '../styles/globals.css'
import { config } from '@fortawesome/fontawesome-svg-core'
import { SessionProvider } from 'next-auth/react'

import Layout from '../components/layout/Layout'
import '@fortawesome/fontawesome-svg-core/styles.css'
config.autoAddCss = false
import { AvatarContextProvider } from '../hooks/useAvatar'
import { CustomThemeProvider } from '../hooks/useCustomTheme'
import { WuphfUserContextProvider } from '../hooks/WuphfUserContext'

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <AvatarContextProvider>
        <WuphfUserContextProvider>
          <CustomThemeProvider>
            <Layout>
              <Component {...pageProps} />
            </Layout>
          </CustomThemeProvider>
        </WuphfUserContextProvider>
      </AvatarContextProvider>
    </SessionProvider>
  )
}

export default MyApp
