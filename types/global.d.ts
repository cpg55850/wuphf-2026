// types/global.d.ts

export {}

declare global {
  // NextAuth / Prisma models

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

  // Database/domain models

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

  // Database avatar model
  interface Avatar {
    avatarId: number
    name: string
    url: string
    users?: WuphfUser[]
  }

  // Shared shapes from documented API responses

  interface ApiAvatarSummary {
    id: number
    url: string
  }

  interface ApiWuphfCounts {
    Likes: number
    Comments: number
  }

  interface ApiFollowerSummary {
    userId: string
    followerId?: string
    user?: {
      avatar?: ApiAvatarSummary
    }
    follower?: {
      avatar?: ApiAvatarSummary
    }
  }

  interface ApiUserCounts {
    Followers: number
    Following: number
  }

  // GET /api/wuphfs
  // GET /api/wuphfs/{wid}
  // GET /api/users/{uid}/wuphfs
  interface WuphfApiResponse extends Wuphf {
    _count: ApiWuphfCounts
    user?: WuphfUser
    userLikePost?: boolean
  }

  // GET /api/users/{uid}/wuphfs
  type UserWuphfsResponse = WuphfApiResponse[]

  // Posts embedded in GET /api/users/{uid}.
  // The documented example includes counts but not userLikePost.
  interface ProfileWuphfResponse extends Wuphf {
    _count: ApiWuphfCounts
  }

  // GET /api/users/{uid}
  interface UserProfileResponse {
    email: string
    userName: string
    bio: string
    theme?: string | null
    avatarId: number
    createdAt?: string
    updatedAt?: string
    isFollowed: boolean
    avatar?: ApiAvatarSummary
    wuphfs?: ProfileWuphfResponse[]
    Followers?: ApiFollowerSummary[]
    Following?: ApiFollowerSummary[]
    _count: ApiUserCounts
  }

  // GET /api/users/search
  // The documented example returns a nested avatar object.
  interface UserSearchResponse {
    userName: string
    avatar: {
      url: string
    } | null
  }

  // GET /api/avatars
  interface AvatarApiResponse {
    id: number
    url: string
    createdAt: string
    updatedAt: string
  }

  // API error wrapper used by the frontend
  interface ApiError {
    data: unknown
    status: number
  }
}
