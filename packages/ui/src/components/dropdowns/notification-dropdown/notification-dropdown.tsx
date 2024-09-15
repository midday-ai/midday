import { Fragment } from "react";
import { Menu, Transition } from "@headlessui/react";
import { BellIcon } from "@heroicons/react/20/solid";
import * as React from "react";

interface ViewNotificationDropdownProps
  extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
}

export const ViewNotificationDropdown: React.FC<
  ViewNotificationDropdownProps
> = ({ title, children, ...props }) => {
  return (
    <Menu as="div" className="relative inline-block text-left" {...props}>
      <Menu.Button className="-m-1.5 flex items-center p-1.5">
        <span className="sr-only">Open user menu</span>
        <BellIcon className="ml-2 h-5 w-5 text-gray-400" aria-hidden="true" />
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
        <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
          {children}
        </Menu.Items>
      </Transition>
    </Menu>
  );
};
