import Link from 'next/link'
import styled from 'styled-components'

import Avatar from '../general/Avatar'
import Button from '../general/Button'

export default function FollowerModal({ title, rows, onClose }) {
  return (
    <Modal>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>
            <ModalTitleText>{title}</ModalTitleText>
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </ModalTitle>
        </ModalHeader>
        <ModalBody>
          {rows?.map((entry) => (
            <Link href={`/user/${entry.userName}`} key={entry.userName}>
              <Entry>
                <Avatar
                  username={entry.userName}
                  profileImageUrl={entry.avatar}
                  size="medium"
                />
                {entry.userName}
              </Entry>
            </Link>
          ))}
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

const Modal = styled.div`
  position: fixed;
  z-index: 1000;
  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(3px);

  display: flex;
  justify-content: center;
  align-items: center;
`

const ModalContent = styled.div`
  position: relative;
  /* Use theme body/card background or fallback to white */
  background-color: ${({ theme }) =>
    theme.colors.cardBackground || theme.colors.body || '#ffffff'};
  color: ${({ theme }) => theme.colors.text || '#000000'};
  width: 90%;
  max-width: 450px;
  max-height: 80vh;
  border-radius: 16px;
  border: 1px solid
    ${({ theme }) => theme.colors.border || 'rgba(255, 255, 255, 0.1)'};
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  display: flex;
  flex-direction: column;
`

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid
    ${({ theme }) => theme.colors.border || 'rgba(150, 150, 150, 0.2)'};
`

const ModalTitle = styled.div`
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`

const ModalTitleText = styled.div`
  font-size: 1.25rem;
  font-weight: bold;
  color: ${({ theme }) => theme.colors.text};
`

const ModalBody = styled.div`
  display: flex;
  flex-direction: column;
  padding: 12px 16px;
  overflow-y: auto;
`

const Entry = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  text-decoration: none;
  color: ${({ theme }) => theme.colors.text};
  font-size: 1.1rem;

  &:hover {
    background-color: ${({ theme }) =>
      theme.colors.hoverBackground || 'rgba(150, 150, 150, 0.15)'};
  }
`
