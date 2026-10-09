import { useEffect, useRef, useState } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/router'
import { signOut } from 'next-auth/react'
import styled, { css } from 'styled-components'

import NavigationLink from './DesktopLink'
import Links from './Links'
import MobileLink from './MobileLink'
import WuphfLogo from './WuphfLogo'
import { useSearch } from '../../hooks/useSearch'
import { useWuphfUser } from '../../hooks/WuphfUserContext'
import FormSearchInput from '../forms/FormSearchInput'
import Avatar from '../general/Avatar'
import Button from '../general/Button'

function NavigationBar() {
	const router = useRouter()
	const {
		query,
		register,
		result: searchResult,
		isHidden: isEmpty,
		hide: hideSearch,
	} = useSearch()
	const [expanded, setExpanded] = useState(false)
	const myRef = useRef(null)
	const { wuphfUser } = useWuphfUser()

	function toggleExpanded() {
		if (!expanded) {
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

	function handleSignout() {
		signOut()
	}

	return (
		<Shadow>
			<NavWrapper>
				<StyledNav expanded={expanded} ref={myRef}>
					<LogoAndSearch>
						<WuphfLogo />
						<Search>
							<StyledFormInput
								id='search'
								label=''
								register={register}
								error={query}
								isEmpty={isEmpty}
							/>
							<SearchResultUl isEmpty={isEmpty}>
								{searchResult.map((entry) => (
									<Link
										href={`/user/${entry.username}`}
										key={`search-result-${entry.username}`}
										passHref
									>
										<SearchResultLi onClick={() => hideSearch()}>
											<Avatar
												username={entry.userName}
												profileImageUrl={entry.avatar.url}
												size='small'
											/>
											<div>{entry.username}</div>
										</SearchResultLi>
									</Link>
								))}
							</SearchResultUl>
						</Search>
					</LogoAndSearch>
					{wuphfUser && (
						<>
							<DesktopLinks as='ul' expanded={expanded}>
								<Links
									component={NavigationLink}
									isShown={expanded}
									onClick={() => setExpanded(false)}
									user={wuphfUser}
								/>
								<ButtonWrapper>
									<Button variant='secondary' onClick={handleSignout}>
										Sign Out
									</Button>
								</ButtonWrapper>
							</DesktopLinks>
							<MobileLinks as='ul' expanded={expanded}>
								<Links
									component={MobileLink}
									isShown={expanded}
									onClick={() => setExpanded(false)}
									user={wuphfUser}
								/>
							</MobileLinks>
							<MobileSignOutButton
								expanded={expanded}
								variant='secondary'
								onClick={handleSignout}
							>
								Sign Out
							</MobileSignOutButton>
						</>
					)}
					<Hamburger expanded={expanded} onClick={toggleExpanded}>
						<HamburgerLine expanded={expanded} />
						<HamburgerLine expanded={expanded} />
						<HamburgerLine expanded={expanded} />
					</Hamburger>
				</StyledNav>
			</NavWrapper>
		</Shadow>
	)
}

export default NavigationBar

const StyledImg = styled.img`
	cursor: pointer;
`

const Shadow = styled.div`
	/* box-shadow: 0px 2px 2px rgba(0, 0, 0, 0.1); */
	border-bottom: 1.5px solid ${({ theme }) => theme.colors.border};
`

const NavWrapper = styled.div`
	max-width: 700px;
	margin: auto;
	background-color: ${({ theme }) => theme.colors.body};
	display: block;
	z-index: 2;
`

const StyledNav = styled.nav`
	display: flex;
	height: 57px;
	background-color: ${({ theme }) => theme.colors.body};
	align-items: center;
	justify-content: space-between;
	z-index: inherit;
	padding: 0 1rem;
	@media (max-width: 768px) {
		width: 100%;
	}
`

const LogoAndSearch = styled.div`
	display: flex;
	gap: 1rem;
`

const MobileLinks = styled.ul`
	display: flex;
	flex-grow: 1;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	list-style: none;
	position: fixed;
	top: 0;
	left: 0;
	width: 100vw;
	background-color: inherit;
	transition: 0.5s ease-in-out;
	z-index: 2;
	overflow: hidden;
	height: ${(props) => (props.expanded ? '100vh' : '0px')};
	@media (min-width: 769px) {
		height: 0px;
	}
`

const DesktopLinks = styled.ul`
	display: flex;
	height: inherit;
	list-style: none;
	background-color: inherit;
	transition: 0.5s ease-in-out;
	z-index: 1;
	@media (max-width: 768px) {
		display: none;
	}
`

const MobileSignOutButton = styled(Button)`
	display: none;
	z-index: 2;
	top: 9px;
	left: 1rem;
	position: ${(props) =>
		props.expanded ? 'fixed !important' : 'absolute !important'};
	transition: opacity 0.5s ease-in;
	@media (max-width: 768px) {
		display: ${(props) => (props.expanded ? 'flex' : 'none')};
		opacity: ${(props) => (props.expanded ? '1' : '0')};
	}
`

const Hamburger = styled.div`
	z-index: 2;
	transition: 0.5s ease-in-out;
	display: ${(props) => (props.expanded ? 'flex' : 'none')};
	position: ${(props) =>
		props.expanded ? 'fixed !important' : 'absolute !important'};
	top: 9px;
	right: 1rem;
	background-color: ${({ theme }) => theme.colors.hamburger};
	border-radius: 5px;
	flex-direction: column;
	width: 40px;
	height: 40px;
	position: relative;
	cursor: pointer;
	display: none;

	@media (max-width: 768px) {
		display: flex;
	}

	&:hover {
		/* color: ${(props) => props.theme.colors.darkestBlue}; */
		justify-content: center;
	}
`

const HamburgerLine = styled.div`
	background-color: ${({ theme }) => theme.colors.hamburgerLine};
	position: absolute;
	width: 60%;
	border-radius: 5px;
	height: 2px;
	transition: 0.5s ease-in-out;
	left: 20%;

	:nth-child(1) {
		top: 25%;
		${(props) =>
			props.expanded &&
			css`
				transform: rotate(45deg);
				top: 50%;
			`};
	}
	:nth-child(2) {
		top: 50%;
		opacity: ${(props) => (props.expanded ? '0' : '1')};
	}
	:nth-child(3) {
		top: 75%;
		${(props) =>
			props.expanded &&
			css`
				transform: rotate(-225deg);
				top: 50%;
			`};
	}
`

const StyledFormInput = styled(FormSearchInput)`
	width: 100%;
	padding: 0 10px;
`

const Search = styled.div`
	display: flex;
	align-items: center;
	z-index: 2;
`

const SearchResultUl = styled.ul`
	position: absolute;
	top: 48px;
	height: auto;
	display: ${(props) => (props.isEmpty ? 'none;' : 'block;')};
	border-radius: 0 0 4px 4px;
	border: 1px solid #aaa;
	width: 250px;
	background-color: ${(props) => props.theme.colors.body};
	border: ${(props) => `1.5px solid ${props.theme.colors.border}`};

	border-radius: 15px;
`

const SearchResultLi = styled.li`
	cursor: pointer;
	height: 45px;
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 10px;
	border-bottom: ${({ theme }) => `1.5px solid ${theme.colors.border}`};
	&:hover {
		color: ${(props) => props.theme.button.primary.text};
	}

	&:last-child {
		border-bottom-left-radius: 15px;
		border-bottom-right-radius: 15px;
		border-bottom: none;
	}

	&:first-child {
		border-top-left-radius: 15px;
		border-top-right-radius: 15px;
	}

	&:hover {
		background-color: ${(props) => props.theme.colors.primary};
	}
`

const ButtonWrapper = styled.div`
	display: flex;
	justify-items: center;
	align-items: center;
`
