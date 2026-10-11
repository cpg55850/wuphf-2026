import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import axios from 'axios'

// Define types for search form values and search results
export type SearchFormValues = {
  search: string
}

export type SearchResultUser = {
  username: string
  avatar: string
}

// Type definition for raw API user response
type ApiUser = {
  userName: string
  avatar: string
  [key: string]: any
}

export function useSearch() {
  const [result, setResult] = useState<SearchResultUser[]>([])
  const [isHidden, setIsHidden] = useState<boolean>(true)

  const {
    register,
    formState: { errors },
    watch,
  } = useForm<SearchFormValues>({
    defaultValues: {
      search: '',
    },
  })

  useEffect(() => {
    // Watch form input changes
    const subscription = watch(async (value) => {
      const searchTerm = value.search?.trim() ?? ''

      if (searchTerm === '') {
        setResult([])
        setIsHidden(true)
        return
      }

      try {
        setIsHidden(false)
        const response = await axios.get<ApiUser[]>('/api/search', {
          params: {
            userName: searchTerm,
          },
        })

        const users: SearchResultUser[] = response.data
          .slice(0, 10)
          .map((user) => ({
            username: user.userName,
            avatar: user.avatar,
          }))

        setResult(users)

        if (users.length === 0) {
          setIsHidden(true)
        }
      } catch (error) {
        console.error('Failed to fetch search results:', error)
        setResult([])
        setIsHidden(true)
      }
    })

    return () => subscription.unsubscribe()
  }, [watch])

  function hide() {
    setIsHidden(true)
  }

  return {
    query: errors.search,
    register,
    result,
    isHidden,
    hide,
  }
}
