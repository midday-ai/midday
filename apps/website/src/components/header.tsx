"use client";

import { cn } from "@midday/ui/cn";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@midday/ui/navigation-menu";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { FaDiscord, FaGithub } from "react-icons/fa";
import {
  MdOutlineDescription,
  MdOutlineIntegrationInstructions,
  MdOutlineMemory,
} from "react-icons/md";
import { LogoIcon } from "./logo-icon";

type ListItemProps = {
  title: string;
  href: string;
  external?: boolean;
  icon: () => React.JSX.Element;
  className?: string;
};

const components: ListItemProps[] = [
  {
    title: "Documentation",
    href: "https://docs.midday.ai",
    icon: () => <MdOutlineDescription size={20} />,
    external: true,
  },
  {
    title: "Open Source",
    href: "https://git.new/midday",
    icon: () => <FaGithub size={19} />,
    external: true,
  },
  {
    title: "Join the community",
    href: "https://go.midday.ai/anPiuRx",
    icon: () => <FaDiscord size={20} />,
    external: true,
  },
  {
    title: "Apps & Integrations",
    href: "https://docs.midday.ai",
    icon: () => <MdOutlineIntegrationInstructions size={20} />,
    external: true,
  },
  {
    title: "Engine",
    href: "/engine",
    icon: () => <MdOutlineMemory size={21} />,
  },
];

const ListItem = ({
  className,
  title,
  icon: Icon,
  external,
  ...props
}: ListItemProps) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          target={external ? "_blank" : undefined}
          className={cn(
            "block select-none space-y-1 p-3 leading-none no-underline outline-none transition-colors hover:bg-secondary focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="flex items-center">
            <div className="w-8">
              <Icon />
            </div>
            <div className="text-sm font-medium leading-none">{title}</div>
          </div>
        </Link>
      </NavigationMenuLink>
    </li>
  );
};

const links = [
  {
    title: "Pricing",
    path: "/pricing",
    name: "pricing",
  },
  {
    title: "Updates",
    path: "/updates",
    name: "updates",
  },
  {
    title: "Story",
    path: "/story",
    name: "story",
  },
  {
    title: "Download",
    path: "/download",
    name: "download",
  },
];

const listVariant = {
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
    },
  },
  hidden: {
    opacity: 0,
  },
};

const itemVariant = {
  hidden: { opacity: 0 },
  show: { opacity: 1 },
};

export function Header() {
  const pathname = usePathname();
  const [isOpen, setOpen] = useState(false);

  const lastPath = `/${pathname.split("/").pop()}`;

  const handleToggleMenu = () => {
    setOpen((prev) => {
      document.body.style.overflow = prev ? "" : "hidden";
      return !prev;
    });
  };

  if (pathname.includes("pitch")) {
    return null;
  }

  return (
    <header className="h-12 sticky mt-4 top-4 z-50 px-2 md:px-4 md:flex justify-center">
      <nav className="border border-border p-3 flex items-center backdrop-filter backdrop-blur-xl bg-[#121212] bg-opacity-70">
        <NavigationMenu>
          <Link href="/">
            <span className="sr-only">Midday Logo</span>
            <LogoIcon />
          </Link>

          <ul className="space-x-2 font-medium text-sm hidden md:flex mx-3">
            {links.map(({ path, name, title }) => {
              const isActive =
                path === "/updates"
                  ? pathname.includes("updates")
                  : path === lastPath;

              return (
                <li key={path}>
                  <Link
                    href={path}
                    className={cn(
                      "h-8 items-center justify-center text-sm font-medium transition-colors px-3 py-2 inline-flex text-secondary-foreground hover:bg-secondary",
                      isActive && "bg-secondary hover:bg-secondary"
                    )}
                  >
                    {title}
                  </Link>
                </li>
              );
            })}

            <li>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Developers</NavigationMenuTrigger>
                  <NavigationMenuContent className="bg-[#121212]">
                    <ul className="w-[200px] pb-2">
                      {components.map((component) => (
                        <ListItem
                          key={component.title}
                          title={component.title}
                          href={component.href}
                          icon={component.icon}
                          external={component.external}
                        />
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </li>
          </ul>
        </NavigationMenu>

        <button
          type="button"
          className="ml-auto md:hidden p-2"
          onClick={() => handleToggleMenu()}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={18}
            height={13}
            fill="none"
          >
            <path
              fill="currentColor"
              d="M0 12.195v-2.007h18v2.007H0Zm0-5.017V5.172h18v2.006H0Zm0-5.016V.155h18v2.007H0Z"
            />
          </svg>
        </button>

        <a className="text-sm font-medium" href="https://app.midday.ai">
          Sign in
        </a>
      </nav>

      {isOpen && (
        <motion.div
          className="fixed bg-background top-0 right-0 left-0 bottom-0 h-screen z-10 px-2 m-[1px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="mt-4 flex justify-between p-3 relative">
            <button type="button" onClick={handleToggleMenu}>
              <span className="sr-only">Midday Logo</span>
              <LogoIcon />
            </button>

            <button
              type="button"
              className="ml-auto md:hidden p-2 absolute right-[10px] top-2"
              onClick={handleToggleMenu}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={24}
                height={24}
                className="fill-primary"
              >
                <path fill="none" d="M0 0h24v24H0V0z" />
                <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
              </svg>
            </button>
          </div>

          <div className="h-full overflow-auto">
            <motion.ul
              initial="hidden"
              animate="show"
              className="px-3 pt-8 text-xl text-[#878787] space-y-8 mb-8"
              variants={listVariant}
            >
              {links.map(({ path, name, title }) => {
                const isActive =
                  path === "/updates"
                    ? pathname.includes("updates")
                    : path === lastPath;

                return (
                  <motion.li variants={itemVariant} key={path}>
                    <Link
                      href={path}
                      className={cn(isActive && "text-primary")}
                      onClick={handleToggleMenu}
                    >
                      {title}
                    </Link>
                  </motion.li>
                );
              })}

              <motion.li variants={itemVariant} onClick={handleToggleMenu}>
                <Link href="/engine">Engine</Link>
              </motion.li>

              <motion.li variants={itemVariant}>
                <Link href="https://app.midday.ai">Get started</Link>
              </motion.li>

              <motion.li
                variants={itemVariant}
                className="flex items-center space-x-2"
              >
                <FaGithub />
                <Link href="https://git.new/midday">Open Source</Link>
              </motion.li>

              <motion.li
                className="mt-auto border-t-[1px] pt-8"
                variants={itemVariant}
              >
                <Link
                  className="text-xl text-primary"
                  href="https://app.midday.ai"
                >
                  Sign in
                </Link>
              </motion.li>
            </motion.ul>
          </div>
        </motion.div>
      )}
    </header>
  );
}
