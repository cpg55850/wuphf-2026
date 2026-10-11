import React, { ComponentType, JSX } from 'react'

export interface LinksProps {
  component: ComponentType<any>
  user?: WuphfUser | null
  [key: string]: any
}

interface LinkItem {
  id: number
  text: string
  url: string
}

export default function Links({
  component: Component,
  user,
  ...props
}: LinksProps): JSX.Element {
  const links: LinkItem[] = [
    {
      id: 1,
      text: 'home',
      url: '/',
    },
    {
      id: 2,
      text: 'profile',
      url: `/user/${user?.userName ?? ''}`,
    },
    {
      id: 3,
      text: 'settings',
      url: '/settings/',
    },
  ]

  return (
    <>
      {links.map((link) => (
        <Component key={link.id} text={link.text} url={link.url} {...props} />
      ))}
    </>
  )
}
