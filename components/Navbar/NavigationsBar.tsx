import React, { useEffect, useRef, useState } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/router'
import { signOut } from 'next-auth/react'

import NavigationLink from './DesktopLink'
import Links from './Links'
import MobileLink from './MobileLink'
import WuphfLogo from './WuphfLogo'
import { useSearch } from '../../hooks/useSearch'
import { useWuphfUser } from '../../hooks/WuphfUserContext'
import FormSearchInput from '../forms/FormSearchInput'
import Avatar from '../general/Avatar'
import Button from '../general/Button'

export default function NavigationBar(): React.ReactElement {
  const router = useRouter()
  const {
    query,
    register,
    result: searchResult = [],
    isHidden: isEmpty,
    hide: hideSearch,
  } = useSearch()
  const [expanded, setExpanded] = useState<boolean>(false)
  const myRef = useRef<HTMLElement | null>(null)
  const { wuphfUser } = useWuphfUser()

  function toggleExpanded(): void {
    if (!expanded && myRef.current) {
      myRef.current.scrollIntoView()
    }
    hideSearch()
    setExpanded(!expanded)
  }

  useEffect(() => {
    setExpanded(false)
  }, [])

  useEffect(() => {
    hideSearch()
  }, [router.pathname])

  function handleSignout(): void {
    signOut()
  }

  return (
    <div className="border-b-[1.5px] border-border">
      <div className="max-w-[700px] mx-auto bg-body block z-10">
        <nav
          ref={myRef}
          className="flex h-[57px] bg-body items-center justify-between px-4 w-full"
        >
          {/* Logo & Search Input */}
          <div className="flex gap-4 items-center">
            <WuphfLogo />
            <div className="relative flex items-center z-20">
              <FormSearchInput
                id="search"
                label=""
                register={register}
                error={query}
                isEmpty={isEmpty}
                className="w-full px-[10px]"
              />

              {/* Search Results Dropdown */}
              {!isEmpty && (
                <ul className="absolute top-[48px] left-0 h-auto w-[250px] bg-body border-[1.5px] border-border rounded-[15px] shadow-lg overflow-hidden z-30">
                  {searchResult.map((entry: any) => {
                    const username = entry.username || entry.userName || ''
                    const avatarUrl =
                      typeof entry.avatar === 'string'
                        ? entry.avatar
                        : entry.avatar?.url

                    return (
                      <Link
                        href={`/user/${username}`}
                        key={`search-result-${username}`}
                        passHref
                        legacyBehavior
                      >
                        <li
                          onClick={() => hideSearch()}
                          className="cursor-pointer h-[45px] flex items-center gap-[10px] p-[10px] border-b-[1.5px] border-border last:border-b-0 hover:bg-primary hover:text-button-primary-text transition-colors"
                        >
                          <Avatar
                            username={username}
                            profileImageUrl={avatarUrl}
                            size="small"
                          />
                          <div>{username}</div>
                        </li>
                      </Link>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Nav Links */}
          {wuphfUser && (
            <>
              {/* Desktop Links */}
              <ul className="hidden md:flex h-full list-none bg-inherit items-center z-10">
                <Links
                  component={NavigationLink}
                  isShown={expanded}
                  onClick={() => setExpanded(false)}
                  user={wuphfUser}
                />
                <div className="flex justify-center items-center ml-2">
                  <Button variant="secondary" onClick={handleSignout}>
                    Sign Out
                  </Button>
                </div>
              </ul>

              {/* Mobile Drawer Links */}
              <ul
                className={`flex md:hidden flex-col justify-center items-center list-none fixed top-0 left-0 w-screen bg-body transition-all duration-500 ease-in-out z-20 overflow-hidden ${
                  expanded
                    ? 'h-screen opacity-100'
                    : 'h-0 opacity-0 pointer-events-none'
                }`}
              >
                <Links
                  component={MobileLink}
                  isShown={expanded}
                  onClick={() => setExpanded(false)}
                  user={wuphfUser}
                />
              </ul>

              {/* Mobile Sign Out Button (Only rendered/visible when mobile drawer is expanded) */}
              {expanded && (
                <Button
                  variant="secondary"
                  onClick={handleSignout}
                  className="md:hidden fixed z-30 top-[9px] left-4"
                >
                  Sign Out
                </Button>
              )}
            </>
          )}

          {/* Hamburger Menu Toggle Button */}
          <button
            type="button"
            onClick={toggleExpanded}
            className={`md:hidden z-30 bg-hamburger rounded-[5px] flex flex-col justify-center items-center w-10 h-10 cursor-pointer ${
              expanded ? 'fixed top-[9px] right-4' : 'relative'
            }`}
          >
            <div
              className={`bg-hamburgerLine absolute w-[60%] rounded-[5px] h-[2px] transition-all duration-500 ease-in-out left-[20%] ${
                expanded ? 'rotate-45 top-1/2' : 'top-[25%]'
              }`}
            />
            <div
              className={`bg-hamburgerLine absolute w-[60%] rounded-[5px] h-[2px] transition-all duration-500 ease-in-out left-[20%] top-1/2 ${
                expanded ? 'opacity-0' : 'opacity-100'
              }`}
            />
            <div
              className={`bg-hamburgerLine absolute w-[60%] rounded-[5px] h-[2px] transition-all duration-500 ease-in-out left-[20%] ${
                expanded ? '-rotate-45 top-1/2' : 'top-[75%]'
              }`}
            />
          </button>
        </nav>
      </div>
    </div>
  )
}
