export interface ConfigurationItem {
  displayName: string
  target: string
}

export const profileConfigurationItems: ConfigurationItem[] = [
  {
    displayName: 'Avatar',
    target: 'avatar',
  },
  {
    displayName: 'Username',
    target: 'username',
  },
  {
    displayName: 'Biography',
    target: 'biography',
  },
]

export const accountConfigurationItems: ConfigurationItem[] = [
  {
    displayName: 'Linked Accounts',
    target: 'linked_account',
  },
  {
    displayName: 'Delete Account',
    target: 'delete_account',
  },
]

export const visualsConfigurationItems: ConfigurationItem[] = [
  {
    displayName: 'Site Theme',
    target: 'site_theme',
  },
  {
    displayName: 'Text Size',
    target: 'text_size',
  },
]
