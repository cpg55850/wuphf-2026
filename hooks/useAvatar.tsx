import React, { useState, useEffect, useContext, ReactNode } from 'react'
import axios from 'axios'

export interface AvatarContextType {
  avatars: Avatar[]
  lookupAvatarIdByUrl: (url: string) => number | undefined
}

const AvatarContext = React.createContext<AvatarContextType | undefined>(
  undefined,
)

export interface AvatarContextProviderProps {
  children: ReactNode
}

export function AvatarContextProvider({
  children,
}: AvatarContextProviderProps) {
  const [avatars, setAvatars] = useState<Avatar[]>([])

  async function getAvatar(): Promise<void> {
    try {
      const res = await axios.get<Avatar[]>('/api/avatar')
      setAvatars(res.data)
    } catch (error) {
      console.error('Failed to fetch avatars:', error)
    }
  }

  function lookupAvatarIdByUrl(url: string): number | undefined {
    const found = avatars.find((avatar) => avatar.url === url)
    return found ? found.avatarId : undefined
  }

  useEffect(() => {
    getAvatar()
  }, [])

  return (
    <AvatarContext.Provider value={{ avatars, lookupAvatarIdByUrl }}>
      {children}
    </AvatarContext.Provider>
  )
}

export const useAvatars = (): AvatarContextType => {
  const context = useContext(AvatarContext)
  if (!context) {
    throw new Error('useAvatars must be used within an AvatarContextProvider')
  }
  return context
}
