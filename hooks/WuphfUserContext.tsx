import React, { useState, useEffect, useContext, createContext } from 'react'
import axios from 'axios'

interface WuphfUserContextType {
  wuphfUser: WuphfUser | undefined
  setWuphfUser: React.Dispatch<React.SetStateAction<WuphfUser | undefined>>
  wuphfUserLoading: boolean
  setWuphfUserLoading: React.Dispatch<React.SetStateAction<boolean>>
  wuphfUserError: ApiError | undefined
  setWuphfUserError: React.Dispatch<React.SetStateAction<ApiError | undefined>>
}

const WuphfUserContext = createContext<WuphfUserContextType | undefined>(
  undefined,
)

interface WuphfUserContextProviderProps {
  setTheme?: (theme: string) => void
  children: React.ReactNode
}

export const WuphfUserContextProvider = ({
  setTheme,
  children,
}: WuphfUserContextProviderProps) => {
  const [wuphfUser, setWuphfUser] = useState<WuphfUser | undefined>(undefined)
  const [wuphfUserLoading, setWuphfUserLoading] = useState<boolean>(true)
  const [wuphfUserError, setWuphfUserError] = useState<ApiError | undefined>(
    undefined,
  )

  async function getUser(): Promise<void> {
    const res = await axios.get('/api/me').catch((err) => {
      setWuphfUserError({
        data: err.response?.data,
        status: err.response?.status,
      })
      setWuphfUserLoading(false)
    })

    if (res) {
      const newWuphfUser: WuphfUser = res.data
      setWuphfUser(newWuphfUser)
      setWuphfUserLoading(false)
      setWuphfUserError(undefined)

      if (newWuphfUser.theme && setTheme) {
        setTheme(newWuphfUser.theme)
      }
    }
  }

  useEffect(() => {
    getUser()
  }, [])

  useEffect(() => {
    if (wuphfUser !== undefined) {
      setWuphfUserError(undefined)
    }
  }, [wuphfUser])

  return (
    <WuphfUserContext.Provider
      value={{
        wuphfUser,
        setWuphfUser,
        wuphfUserLoading,
        setWuphfUserLoading,
        wuphfUserError,
        setWuphfUserError,
      }}
    >
      {children}
    </WuphfUserContext.Provider>
  )
}

export const useWuphfUser = (): WuphfUserContextType => {
  const context = useContext(WuphfUserContext)

  if (context === undefined) {
    throw new Error(
      'useWuphfUser must be used within a WuphfUserContextProvider',
    )
  }

  return context
}

export { WuphfUserContext }
