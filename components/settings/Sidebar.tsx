import React from 'react'
import {
  faGear,
  faPaintRoller,
  faUser,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import {
  accountConfigurationItems,
  profileConfigurationItems,
  visualsConfigurationItems,
} from '../../assets/settingsPageConfigurations'

export default function Sidebar() {
  return (
    <aside className="hidden xl:flex flex-col gap-4 p-5 w-[250px] -ml-[250px] sticky top-0 left-0 border-r-[1.5px] border-border">
      {/* Profile Section */}
      <div className="flex flex-col gap-2 text-xl">
        <div className="flex flex-row justify-start items-center gap-3">
          <FontAwesomeIcon icon={faUser} />
          <span className="font-medium text-left">Profile</span>
        </div>
        <ul className="flex flex-col gap-1">
          {profileConfigurationItems.map((subtopic, index) => (
            <li
              key={`profile-subtopic-${index}`}
              className="list-none font-light"
            >
              <a
                href={`#${subtopic.target}`}
                className="no-underline text-text hover:underline"
              >
                {subtopic.displayName}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* Account Section */}
      <div className="flex flex-col gap-2 text-xl">
        <div className="flex flex-row justify-start items-center gap-3">
          <FontAwesomeIcon icon={faGear} />
          <span className="font-medium text-left">Account</span>
        </div>
        <ul className="flex flex-col gap-1">
          {accountConfigurationItems.map((subtopic, index) => (
            <li
              key={`account-subtopic-${index}`}
              className="list-none font-light"
            >
              <a
                href={`#${subtopic.target}`}
                className="no-underline text-text hover:underline"
              >
                {subtopic.displayName}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* Visuals Section */}
      <div className="flex flex-col gap-2 text-xl">
        <div className="flex flex-row justify-start items-center gap-3">
          <FontAwesomeIcon icon={faPaintRoller} />
          <span className="font-medium text-left">Visuals</span>
        </div>
        <ul className="flex flex-col gap-1">
          {visualsConfigurationItems.map((subtopic, index) => (
            <li
              key={`visuals-subtopic-${index}`}
              className="list-none font-light"
            >
              <a
                href={`#${subtopic.target}`}
                className="no-underline text-text hover:underline"
              >
                {subtopic.displayName}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}
