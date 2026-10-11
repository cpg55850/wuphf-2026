import React from 'react'
import { signIn } from 'next-auth/react'

import WuphfSVG from '../../assets/WuphfSVG'
import Button from '../general/Button'
import Paragraph from '../styledComponents/Paragraph'
import Title from '../styledComponents/Title'

export default function Welcome(): React.ReactElement {
  return (
    <div className="flex justify-center">
      <div className="flex flex-col-reverse sm:flex-row justify-center items-center h-auto sm:h-[90vh] w-screen gap-4 p-4 [&_svg]:w-[300px] [&_svg]:h-[150px] sm:[&_svg]:w-auto sm:[&_svg]:h-[350px]">
        {/* Logo Container */}
        <div className="flex justify-center items-center p-4">
          <WuphfSVG height="350px" />
        </div>

        {/* Message Container */}
        <div className="flex justify-center items-center p-4 w-full sm:w-auto sm:max-w-[400px]">
          <div className="border-[1.5px] border-border rounded-[20px] p-6">
            <Title>Welcome!</Title>
            <Paragraph>
              Explore WUPHF, a friendly social media platform where you can find
              like minded animals!
            </Paragraph>
            <div className="flex w-full justify-center">
              <Button variant="primary" onClick={() => signIn('google')}>
                Continue with Google
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
