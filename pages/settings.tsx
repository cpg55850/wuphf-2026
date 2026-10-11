import React, { useEffect, useState } from 'react'

import axios from 'axios'
import Head from 'next/head'
import { signOut } from 'next-auth/react'
import propTypes from 'prop-types'
import { useForm } from 'react-hook-form'
import styled from 'styled-components'

import { darkTheme } from '../assets/themes/darkTheme'
import { lavaTheme } from '../assets/themes/lavaTheme'
import { lightTheme } from '../assets/themes/lightTheme'
import FormInput from '../components/forms/FormInput'
import SelectInput from '../components/forms/SelectInput'
import TextArea from '../components/forms/TextArea'
import Avatar from '../components/general/Avatar'
import Button from '../components/general/Button'
import withAuth from '../components/layout/withAuth'
import GoogleLogo from '../components/other/GoogleLogo'
import Sidebar from '../components/settings/Sidebar'
import Paragraph from '../components/styledComponents/Paragraph'
import { useAvatars } from '../hooks/useAvatar'
import { useCustomTheme } from '../hooks/useCustomTheme'
import { useWuphfUser } from '../hooks/WuphfUserContext'

AccountSettings.propTypes = {
  avatar: propTypes.string,
  username: propTypes.string,
  biography: propTypes.string,
}

function AccountSettings() {
  const {
    register,
    formState: { errors },
    setValue,
    getValues,
    watch,
    setError,
  } = useForm({
    mode: 'onTouched',
  })

  const [editProfileSettingsEnabled, setEditProfileSettingsEnabled] =
    useState(false)
  const [editVisualSettingsEnabled, setEditVisualSettingsEnabled] =
    useState(false)

  const { wuphfUser, setWuphfUser } = useWuphfUser()
  const { avatars, lookupAvatarIdByUrl } = useAvatars()
  const { changeTheme } = useCustomTheme()

  const [selectedThemeValue, setSelectedThemeValue] = useState(
    wuphfUser?.theme || 'light',
  )

  useEffect(() => {
    if (wuphfUser) {
      setValue('avatar', wuphfUser.avatar?.url || '')
      setValue('username', wuphfUser.userName?.trim() || '')
      setValue('biography_textarea', wuphfUser.bio || '')
      setSelectedThemeValue(wuphfUser.theme || 'light')
    }
  }, [wuphfUser, setValue])

  function handleThemeChange(e) {
    const newTheme = e.target.value
    setSelectedThemeValue(newTheme)

    if (newTheme === 'light') changeTheme(lightTheme)
    if (newTheme === 'lava') changeTheme(lavaTheme)
    if (newTheme === 'dark') changeTheme(darkTheme)
  }

  async function handleEditProfileSettingsButtonClick(e) {
    e.preventDefault()

    if (editProfileSettingsEnabled) {
      const updatedUsername = getValues('username')
      const updatedBio = getValues('biography_textarea')
      const updatedAvatarUrl = getValues('avatar')

      try {
        const res = await axios.patch(
          `/api/users/${encodeURIComponent(wuphfUser.userName)}`,
          {
            userName: updatedUsername,
            bio: updatedBio,
            avatarId: lookupAvatarIdByUrl(updatedAvatarUrl),
          },
        )
        setWuphfUser(res.data)
      } catch (err) {
        console.error('Failed to update profile:', err)
        if (err.response?.status === 400 || err.response?.status === 409) {
          setError('username', {
            type: 'manual',
            message: err.response?.data?.message || 'Failed to update profile.',
          })
        }
      }
    }

    setEditProfileSettingsEnabled(!editProfileSettingsEnabled)
  }

  async function handleEditVisualSettingsButtonClick(e) {
    e.preventDefault()

    if (editVisualSettingsEnabled) {
      try {
        const res = await axios.patch(
          `/api/users/${encodeURIComponent(wuphfUser.userName)}`,
          { theme: selectedThemeValue },
        )
        setWuphfUser(res.data)
      } catch (err) {
        console.error('Failed to update visual settings:', err)
      }
    }

    setEditVisualSettingsEnabled(!editVisualSettingsEnabled)
  }

  async function handleDeleteButtonClick(e) {
    e.preventDefault()
    if (!window.confirm('Are you sure you want to delete your account?')) return

    try {
      await axios.delete(`/api/users/${encodeURIComponent(wuphfUser.userName)}`)
      signOut()
    } catch (err) {
      console.error('Failed to delete account:', err)
    }
  }

  return (
    <div className="flex flex-row gap-[30px] max-w-[686px] mx-auto px-4">
      <Head>
        <title>Settings | Wuphf</title>
      </Head>
      <Sidebar />
      <div className="flex flex-col gap-5 w-full">
        {/* Profile Settings Section */}
        <div>
          <div className="flex flex-row pt-5 ml-0">
            <h2 className="text-2xl font-bold border-none text-left w-full text-app-text">
              Profile Settings
            </h2>
            <div className="text-[1.3rem]">
              <Button
                variant="secondary"
                onClick={handleEditProfileSettingsButtonClick}
              >
                {editProfileSettingsEnabled ? 'Save' : 'Edit'}
              </Button>
            </div>
          </div>

          <div
            id="avatar"
            className="mt-8 mb-4 font-bold text-base text-app-text"
          >
            Avatar:
          </div>
          <div className="flex gap-[30px] items-center">
            <SelectInput
              register={register}
              id="avatar"
              label=""
              enabled={editProfileSettingsEnabled}
            >
              {avatars.map((avatar: any) => (
                <option
                  key={avatar.key}
                  value={avatar.url}
                  className="text-black"
                >
                  {avatar.name}
                </option>
              ))}
            </SelectInput>
            <Avatar
              size="large"
              username={wuphfUser?.userName}
              profileImageUrl={watch('avatar') || 'animal_svgs/dog_nau7in.svg'}
            />
          </div>

          <div
            id="username"
            className="mt-8 mb-4 font-bold text-base text-app-text"
          >
            Username:
          </div>
          <FormInput
            id="username"
            label=""
            register={register}
            error={errors.username}
            enabled={editProfileSettingsEnabled}
          />

          <div
            id="biography"
            className="mt-8 mb-4 font-bold text-base text-app-text"
          >
            Biography:
          </div>
          <TextArea
            register={register}
            id="biography_textarea"
            label=""
            enabled={editProfileSettingsEnabled}
          />
        </div>

        {/* Account Settings Section */}
        <div>
          <h2 className="text-2xl font-bold border-none text-left w-full text-app-text pt-5">
            Account Settings
          </h2>
          <div
            id="linked_account"
            className="mt-8 mb-4 font-bold text-base text-app-text"
          >
            Linked Accounts:
          </div>
          <GoogleLogo />
          <div
            id="delete_account"
            className="mt-8 mb-4 font-bold text-base text-app-text"
          >
            Delete Account:
          </div>
          <Paragraph>
            Permanently remove all account data, Wuphs, and likes. This cannot
            be undone.
          </Paragraph>
          <div className="text-[1.3rem] mt-4">
            <Button variant="secondary" onClick={handleDeleteButtonClick}>
              Delete Account
            </Button>
          </div>
        </div>

        {/* Visual Settings Section */}
        <div>
          <div className="flex flex-row pt-5 ml-0">
            <h2 className="text-2xl font-bold border-none text-left w-full text-app-text">
              Visual Settings
            </h2>
            <div className="text-[1.3rem]">
              <Button
                variant="secondary"
                onClick={handleEditVisualSettingsButtonClick}
              >
                {editVisualSettingsEnabled ? 'Save' : 'Edit'}
              </Button>
            </div>
          </div>

          <div
            id="site_theme"
            className="mt-8 mb-4 font-bold text-base text-app-text"
          >
            Site Theme:
          </div>
          <div className="mb-4 w-full">
            <select
              id="site_theme"
              onChange={handleThemeChange}
              value={selectedThemeValue}
              disabled={!editVisualSettingsEnabled}
              className="mt-2 w-full cursor-pointer appearance-none rounded border border-border bg-body p-2 text-inherit text-app-text outline-none text-base disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="light" className="text-black">
                Light
              </option>
              <option value="lava" className="text-black">
                Lava
              </option>
              <option value="dark" className="text-black">
                Dark
              </option>
            </select>
          </div>

          <div
            id="text_size"
            className="mt-8 mb-4 font-bold text-base text-app-text"
          >
            Text Size:
          </div>
          <SelectInput
            register={register}
            id="font_size"
            label=""
            enabled={editVisualSettingsEnabled}
          >
            <option value="small" className="text-black">
              Small
            </option>
            <option value="medium" className="text-black">
              Medium
            </option>
            <option value="large" className="text-black">
              Large
            </option>
          </SelectInput>
        </div>
      </div>
    </div>
  )
}

export default withAuth(AccountSettings)
