import React, { useEffect, useState } from 'react'

import { yupResolver } from '@hookform/resolvers/yup'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'

import { useAvatars } from '../../hooks/useAvatar'
import Avatar from '../general/Avatar'
import SettingsForm from '../settings/SettingsForm'
import Container from '../styledComponents/Container'

interface RegistrationFormValues {
  username: string
  animal: string
  bio: string
}

const schema = yup.object({
  username: yup.string().trim().required('Required'),
  animal: yup.string().required('Required'),
  bio: yup.string().required('Required'),
})

function RegistrationForm() {
  const { avatars } = useAvatars()
  const [selectedAvatar, setSelectedAvatar] = useState(avatars[0])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    getValues,
  } = useForm<RegistrationFormValues>({
    mode: 'onTouched',
    resolver: yupResolver(schema),
    defaultValues: {
      animal: avatars[0]?.url || '',
    },
  })

  useEffect(() => {
    const subscription = watch((value) => {
      if (!value.animal) return

      const matchedAvatar = avatars.find(
        (avatar: any) =>
          avatar.url.toUpperCase() === value.animal?.toUpperCase(),
      )

      if (matchedAvatar) {
        setSelectedAvatar(matchedAvatar)
      }
    })

    return () => subscription.unsubscribe()
  }, [watch, avatars])

  return (
    <Container>
      <div className="mx-4 sm:grid sm:grid-cols-2">
        <div className="flex items-center justify-center p-4">
          <Avatar
            username={watch('username')}
            profileImageUrl={watch('animal') || 'animal_svgs/dog_nau7in.svg'}
            size="large"
          />
        </div>
        <SettingsForm
          selectedAnimal={selectedAvatar}
          setSelectedAnimal={setSelectedAvatar}
          animals={avatars}
          handleSubmit={handleSubmit}
          errors={errors}
          watch={watch}
          isSubmitting={isSubmitting}
          register={register}
          getValues={getValues}
        />
      </div>
    </Container>
  )
}

export default RegistrationForm
