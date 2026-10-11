// types/global.d.ts

export {} // Ensures this file is treated as a module so `declare global` works properly

declare global {
  interface Account {
    id: string
    userId: string
    type: string
    provider: string
    providerAccountId: string
    refresh_token?: string | null
    access_token?: string | null
    expires_at?: number | null
    token_type?: string | null
    scope?: string | null
    id_token?: string | null
    session_state?: string | null
    oauth_token_secret?: string | null
    oauth_token?: string | null
    user?: User
  }

  interface Session {
    id: string
    sessionToken: string
    userId: string
    expires: string | Date
    user?: User
  }

  interface User {
    id: string
    name?: string | null
    email?: string | null
    emailVerified?: string | Date | null
    image?: string | null
    accounts?: Account[]
    sessions?: Session[]
    WuphfUser?: WuphfUser | null
  }

  interface VerificationToken {
    identifier: string
    token: string
    expires: string | Date
  }

  interface WuphfUser {
    email: string
    userName: string
    createdAt: string | Date
    bio: string
    theme?: string | null
    avatarId: number
    user?: User
    wuphfs?: Wuphf[]
    Likes?: Likes[]
    Followers?: Follower[]
    Following?: Follower[]
    Comments?: Comments[]
    avatar?: Avatar
  }

  interface Wuphf {
    id: number
    userId: string
    pictureUrl?: string | null
    postBody: string
    createdAt: string | Date
    user?: WuphfUser
    Likes?: Likes[]
    Comments?: Comments[]
  }

  interface Likes {
    userId: string
    wuphfId: number
    user?: WuphfUser
    wuphf?: Wuphf
  }

  interface Comments {
    id: number
    createdAt: string | Date
    postsId: number
    userId?: string | null
    commentBody: string
    wuphf?: Wuphf
    user?: WuphfUser | null
  }

  interface Follower {
    userId: string
    followerId: string
    createdAt: string | Date
    user?: WuphfUser
    follower?: WuphfUser
  }

  interface Avatar {
    avatarId: number
    name: string
    url: string
    users?: WuphfUser[]
  }

  // Helper type for API Errors
  interface ApiError {
    data: any
    status: number
  }
}
