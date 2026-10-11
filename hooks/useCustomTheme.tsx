import React, { useState, useEffect, useContext, createContext } from 'react'
import { ThemeProvider, createGlobalStyle } from 'styled-components'
import reset from 'styled-reset'

import { darkTheme } from '../assets/themes/darkTheme'
import { lightTheme } from '../assets/themes/lightTheme'
import { lavaTheme } from '../assets/themes/lavaTheme'
import { useWuphfUser } from './WuphfUserContext'

interface CustomThemeContextType {
  theme: any
  changeTheme: (theme: any) => void
  lookupTheme: (themeName: string) => any
}

const CustomThemeContext = createContext<CustomThemeContextType | undefined>(
  undefined,
)

interface GlobalStyleProps {
  hasMounted: boolean
}

const GlobalStyle = createGlobalStyle<GlobalStyleProps>`
  ${reset}
  * {
    box-sizing: border-box;
  }
  html {
    font-family: "Open Sans", sans-serif;
    font-size: 1rem;
    background-color: ${({ theme }: { theme: any }) => theme.colors.body};
    color: ${({ theme }: { theme: any }) => theme.colors.text};
    transition: ${({ hasMounted }) =>
      hasMounted ? 'background-color 0.5s ease;' : 'none'};
  }
`

export const CustomThemeProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [theme, setTheme] = useState<any>(lightTheme)
  const [mounted, setMounted] = useState<boolean>(false)
  const [hasMounted, setHasMounted] = useState<boolean>(false)
  const { wuphfUser } = useWuphfUser()

  function changeTheme(newTheme: any) {
    setTheme(newTheme)
    localStorage.setItem('theme', JSON.stringify(newTheme))

    // Sync with Tailwind CSS root classes for hybrid compatibility
    const root = document.documentElement
    root.classList.remove('dark', 'lava')
    if (newTheme === darkTheme) {
      root.classList.add('dark')
    } else if (newTheme === lavaTheme) {
      root.classList.add('lava')
    }
  }

  useEffect(() => {
    const savedThemeJson = localStorage.getItem('theme')
    if (savedThemeJson) {
      try {
        const parsedTheme = JSON.parse(savedThemeJson)
        setTheme(parsedTheme)

        // Sync Tailwind root class on mount
        const root = document.documentElement
        root.classList.remove('dark', 'lava')
        if (parsedTheme?.colors?.body === darkTheme.colors.body) {
          root.classList.add('dark')
        } else if (parsedTheme?.colors?.body === lavaTheme.colors.body) {
          root.classList.add('lava')
        }
      } catch (e) {
        setTheme(lightTheme)
        localStorage.setItem('theme', JSON.stringify(lightTheme))
      }
    } else {
      localStorage.setItem('theme', JSON.stringify(lightTheme))
    }

    setMounted(true)
    setTimeout(() => setHasMounted(true), 10)
  }, [])

  useEffect(() => {
    if (wuphfUser?.theme !== undefined) {
      const resolvedTheme = lookupTheme(wuphfUser.theme)
      if (resolvedTheme) {
        changeTheme(resolvedTheme)
      }
    }
  }, [wuphfUser])

  return (
    mounted && (
      <CustomThemeContext.Provider
        value={{
          theme,
          changeTheme,
          lookupTheme,
        }}
      >
        <ThemeProvider theme={theme}>
          <GlobalStyle hasMounted={hasMounted} />
          {children}
        </ThemeProvider>
      </CustomThemeContext.Provider>
    )
  )
}

export const useCustomTheme = (): CustomThemeContextType => {
  const customThemeContext = useContext(CustomThemeContext)

  if (customThemeContext === undefined) {
    throw new Error('useCustomTheme must be used within a CustomThemeProvider')
  }

  return customThemeContext
}

export function lookupTheme(themeName: string): any {
  if (themeName === 'light') {
    return lightTheme
  } else if (themeName === 'lava') {
    return lavaTheme
  } else if (themeName === 'dark') {
    return darkTheme
  }
  return lightTheme
}

export { CustomThemeContext }
