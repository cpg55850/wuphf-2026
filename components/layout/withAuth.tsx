import React, { ComponentType, ComponentProps } from 'react'
import { useSession } from 'next-auth/react'

import { useWuphfUser } from '../../hooks/WuphfUserContext'
import Welcome from '../home/Welcome'
import RegistrationForm from '../registration/RegistrationForm'
import Loading from './Loading'

export interface WithAuthProps {
  session?: ReturnType<typeof useSession>['data']
  wuphfUser?: WuphfUser | null
  status?: ReturnType<typeof useSession>['status']
}

export default function withAuth<P extends object>(
  Component: ComponentType<P & WithAuthProps>,
) {
  function Auth(props: P) {
    const { data: session, status } = useSession()
    const { wuphfUser, wuphfUserLoading } = useWuphfUser()

    if (status === 'loading' || wuphfUserLoading) {
      return <Loading />
    }

    if (status === 'unauthenticated') {
      return <Welcome />
    }

    if (!wuphfUser) {
      return <RegistrationForm />
    }

    return (
      <Component
        {...(props as P)}
        session={session}
        wuphfUser={wuphfUser}
        status={status}
      />
    )
  }

  if ((Component as any).getInitialProps) {
    ;(Auth as any).getInitialProps = (Component as any).getInitialProps
  }

  return Auth
}
