import React, { useState } from 'react'
import axios from 'axios'
import { useSession } from 'next-auth/react'
import {
  FieldErrors,
  UseFormGetValues,
  UseFormHandleSubmit,
  UseFormRegister,
  UseFormWatch,
} from 'react-hook-form'

import { useAvatars } from '../../hooks/useAvatar'
import { useWuphfUser } from '../../hooks/WuphfUserContext'
import FormInput from '../forms/FormInput'
import SelectInput from '../forms/SelectInput'
import TextArea from '../forms/TextArea'
import Button from '../general/Button'
import Loading from '../layout/Loading'
import Title from '../styledComponents/Title'

interface RegistrationFormValues {
  username: string
  animal: string
  bio: string
}

interface SettingsFormProps {
  selectedAnimal: Avatar
  setSelectedAnimal: React.Dispatch<React.SetStateAction<Avatar>>
  animals: Avatar[]
  handleSubmit: UseFormHandleSubmit<RegistrationFormValues>
  errors: FieldErrors<RegistrationFormValues>
  watch: UseFormWatch<RegistrationFormValues>
  isSubmitting: boolean
  register: UseFormRegister<RegistrationFormValues>
  getValues: UseFormGetValues<RegistrationFormValues>
}

function SettingsForm(props: SettingsFormProps) {
  const { data: session } = useSession()

  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<any>()
  const { setWuphfUser } = useWuphfUser()
  const { lookupAvatarIdByUrl } = useAvatars()

  const onSubmit = () => {
    registerUser()
  }

  function registerUser() {
    if (!session?.user?.email) return

    setLoading(true)
    axios
      .post('/api/users', {
        email: session.user.email,
        userName: props.getValues('username'),
        bio: props.getValues('bio'),
        avatarId: lookupAvatarIdByUrl(props.getValues('animal')),
      })
      .then((res) => {
        setLoading(false)
        setWuphfUser(res.data)
      })
      .catch((err) => {
        setError(err)
        setLoading(false)
      })
  }

  if (loading) return <Loading />

  return (
    <div className="rounded-[15px] border border-[#adadad] p-6">
      <Title>WUPHF</Title>
      <form onSubmit={props.handleSubmit(onSubmit)}>
        <FormInput
          id="username"
          label="Username"
          register={props.register}
          error={props.errors.username}
        />
        <SelectInput register={props.register} id="animal" label="Your Animal">
          {props.animals.map((animal) => (
            <option
              value={animal.url}
              key={`animal-option-${animal.name}`}
              className="text-black"
            >
              {animal.name}
            </option>
          ))}
        </SelectInput>

        <TextArea
          id="bio"
          label="Biography"
          register={props.register}
          error={props.errors.bio}
          rows={3}
        />

        <Button variant="primary" type="submit" disabled={props.isSubmitting}>
          Submit
        </Button>
      </form>
      {error && (
        <p className="mt-4 text-sm text-red-500">
          {JSON.stringify(error?.response?.data || error, null, 2)}
        </p>
      )}
    </div>
  )
}

export default SettingsForm
