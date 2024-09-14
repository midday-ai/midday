import { Menu, Transition } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import React, { Fragment } from "react";
import { UserAccount } from "solomon-ai-typescript-sdk";

import { cn } from "../../../utils/cn";

interface ProfileDropdownProps {
  user: UserAccount;
  navigationItems: {
    name: string;
    href: string;
  }[];
}

/**
 * Renders a profile dropdown component.
 *
 * @param {ProfileDropdownProps} props - The props for the component.
 * @param {UserAccount} props.user - The user account object.
 * @param {UserNavigationItem[]} props.navigationItems - The navigation items
 *   for the dropdown.
 * @returns {JSX.Element} The rendered profile dropdown component.
 */
export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
  user,
  navigationItems,
}) => {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button className="-m-1.5 flex items-center p-1.5">
        <span className="sr-only">Open user menu</span>
        <img
          className="h-8 w-8 rounded-full bg-gray-50"
          src={user.profileImageUrl}
          alt=""
        />
        <span className="hidden lg:flex lg:items-center">
          <span
            className="ml-4 text-sm font-semibold leading-6 text-secondary"
            aria-hidden="true"
          >
            {user.username}
          </span>
          <ChevronDownIcon
            className="ml-2 h-5 w-5 text-secondary"
            aria-hidden="true"
          />
        </span>
      </Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-32 origin-top-right rounded-md bg-secondary py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
          {navigationItems.map((item) => (
            <Menu.Item key={item.name}>
              {({ active }) => (
                <a
                  href={item.href}
                  className={cn(
                    active ? "bg-gray-50" : "",
                    "block px-3 py-1 text-sm leading-6 text-secondary",
                  )}
                >
                  {item.name}
                </a>
              )}
            </Menu.Item>
          ))}
        </Menu.Items>
      </Transition>
    </Menu>
  );
};
