import React, { useEffect, ReactNode } from 'react'
import axios from 'axios'

import { useWuphfUser } from '../../hooks/WuphfUserContext'
import NavigationBar from '../Navbar/NavigationsBar'

export interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { setWuphfUserError, setWuphfUser } = useWuphfUser()

  async function getUser(): Promise<void> {
    try {
      const res = await axios.get<WuphfUser>('/api/me')
      if (res.data) {
        setWuphfUser(res.data)
        setWuphfUserError(null)
      }
    } catch (err: any) {
      setWuphfUserError({
        data: err.response?.data,
        status: err.response?.status,
      })
    }
  }

  useEffect(() => {
    getUser()
  }, [])

  return (
    <div className="min-h-screen bg-body text-text">
      <NavigationBar />
      <main>{children}</main>
    </div>
  )
}
