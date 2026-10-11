import React, { useState, useEffect, useContext } from 'react'
import { ThemeProvider } from 'styled-components'
import styled from 'styled-components'
import reset from 'styled-reset'
import { createGlobalStyle } from 'styled-components'
import { darkTheme } from '../assets/themes/darkTheme'
import { lightTheme } from '../assets/themes/lightTheme'
import { lavaTheme } from '../assets/themes/lavaTheme'
import Loading from '../components/layout/Loading'
import { useWuphfUser } from './WuphfUserContext'

const CustomThemeContext = React.createContext()

const CustomThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(lightTheme)
  const [mounted, setMounted] = useState(false)
  const [hasMounted, setHasMounted] = useState(false)
  const { wuphfUser } = useWuphfUser()

  function changeTheme(theme) {
    setTheme(theme)
    localStorage.setItem('theme', JSON.stringify(theme))
  }

  useEffect(() => {
    // If the theme is in local storage,
    // set the theme on load.
    // Else, set the theme to the default.
    if (localStorage.getItem('theme')) {
      setTheme(JSON.parse(localStorage.getItem('theme')))
    } else {
      localStorage.setItem('theme', JSON.stringify(lightTheme))
    }

    // Page needs to mount before we render it, otherwise we can't access local storage.
    // We need to access local storage before rendering so that
    // we can set the theme before load and prevent a white flash.
    setMounted(true)
    // Wait 10ms to set hasMounted to true.
    // The transition CSS property will be set after 10ms.
    // Prevents background-color from transitioning from white to desired theme on load.
    setTimeout(() => setHasMounted(true), 10)
  }, [])

  useEffect(() => {
    // If the WuphfUser updates, then switch the theme to theme from DB.
    if (wuphfUser?.theme !== undefined) {
      changeTheme(lookupTheme(wuphfUser.theme))
    }
  }, [wuphfUser])

  const GlobalStyle = createGlobalStyle`
		${reset}
		* {
			box-sizing: border-box;
		}
		html {
			font-family: "Open Sans", sans-serif;
			font-size: 1rem;
			background-color: ${({ theme }) => theme.colors.body};
			color: ${({ theme }) => theme.colors.text};
			transition: ${({ hasMounted }) =>
        hasMounted ? 'background-color 0.5s ease;' : 'none'};
		}
	`

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

const useCustomTheme = () => {
  const customThemeContext = useContext(CustomThemeContext)

  return customThemeContext
}

function lookupTheme(theme) {
  if (theme === 'light') {
    return lightTheme
  } else if (theme === 'lava') {
    return lavaTheme
  } else if (theme === 'dark') {
    return darkTheme
  }
}

export { CustomThemeProvider, useCustomTheme }
