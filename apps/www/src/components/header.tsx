"use client";

import {
  BusinessConfig,
  ConsumerConfig,
  SolopreneurConfig,
} from "@internal/app-config";
import { cn } from "@midday/ui/cn";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@midday/ui/collapsible";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@midday/ui/context-menu";
import { Icons } from "@midday/ui/icons";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import menuAssistant from "public/menu-assistant.jpg";
import menuEngine from "public/menu-engine.png";
import { useState } from "react";
import { FaDiscord, FaGithub } from "react-icons/fa";
import {
  MdBattery6Bar,
  MdBusinessCenter,
  MdLightbulb,
  MdOutlineDescription,
  MdOutlineIntegrationInstructions,
  MdPerson,
  MdStackedBarChart,
} from "react-icons/md";

import { AnimatedCard } from "./feature-card";

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
  const [showBlur, setShowBlur] = useState(false);
  const [hidden, setHidden] = useState(false);

  const lastPath = `/${pathname.split("/").pop()}`;

  const handleToggleMenu = () => {
    setOpen((prev) => {
      document.body.style.overflow = prev ? "" : "hidden";
      return !prev;
    });
  };

  const handleOnClick = () => {
    setShowBlur(false);
    setHidden(true);

    setTimeout(() => {
      setHidden(false);
    }, 100);
  };

  const links = [
    // {
    //   title: "Features",
    //   cover: (
    //     <Link href="/#assistant" onClick={handleOnClick}>
    //       <div className="bg-zinc-950  h-full rounded-2xl flex items-center justify-center">
    //         <p className="md:text-2xl font-bold text-white antialiased">
    //           Solomon AI Features
    //         </p>
    //       </div>
    //     </Link>
    //   ),
    //   children: [
    //     {
    //       path: "/overview",
    //       title: "Overview",
    //       icon: <Icons.Overview size={20} />,
    //     },
    //     {
    //       path: "/inbox",
    //       title: "Inbox",
    //       icon: <Icons.Inbox2 size={20} />,
    //     },
    //     {
    //       path: "/vault",
    //       title: "Vault",
    //       icon: <Icons.Files size={20} />,
    //     },
    //     {
    //       path: "/tracker",
    //       title: "Tracker",
    //       icon: <Icons.Tracker size={20} />,
    //     },
    //     {
    //       path: "/invoice",
    //       title: "Invoice",
    //       icon: <Icons.Invoice size={20} />,
    //     },
    //   ],
    // },
    {
      title: "Products",
      cover: (
        <Link href="https://business.solomon-ai.app" onClick={handleOnClick}>
          <div className="flex h-full w-full items-center justify-center rounded-2xl bg-zinc-950">
            <AnimatedCard title="Products" subTitle={"Our product offering"} />
          </div>
        </Link>
      ),
      children: [
        {
          path: "https://lead.solomon-ai.app",
          title: "Consulting Services",
          icon: <MdBusinessCenter size={20} />,
        },
        {
          path: "https://app-business.solomon-ai.app/login",
          title: "Intelligence Platform",
          icon: <MdStackedBarChart size={19} />,
        },
        {
          path: "/",
          title: "Developer Platform (Beta)",
          icon: <MdBattery6Bar size={19} />,
        },
      ],
    },
    {
      title: "Pricing",
      path: "/pricing",
    },
    // {
    //   title: "Engineering",
    //   path: "/updates",
    // },
    {
      title: "Story",
      path: "/story",
    },
    {
      title: "Download",
      path: "/download",
    },
    {
      title: "Releases",
      path: "/releases",
    },
    {
      title: "Uptime",
      path: "https://solomon-ai.betteruptime.com/",
    },
    // {
    //   title: "Investors",
    //   path: "/pitch",
    // },
    {
      title: "Developers",
      cover: (
        <Link href="/engine" onClick={handleOnClick}>
          <div className="flex h-full items-center justify-center rounded-2xl bg-zinc-950">
            <AnimatedCard
              title="Engineering"
              subTitle={"How we think about engineering"}
            />
          </div>
        </Link>
      ),
      children: [
        {
          path: "https://github.com/SolomonAIEngineering/frontend-financial-platform",
          title: "Open Source",
          icon: <FaGithub size={19} />,
        },
        {
          path: "https://docs.solomon-ai.app",
          title: "Developer Platform",
          icon: <MdOutlineDescription size={20} />,
        },
        // {
        //   path: "/engine",
        //   title: "Engine",
        //   icon: <MdOutlineMemory size={20} />,
        // },
        // {
        //   title: "Join the community",
        //   path: "https://go.solomon-ai.app/anPiuRx",
        //   icon: <FaDiscord size={19} />,
        // },
        {
          title: "Apps & Integrations",
          path: "https://docs.solomon-ai.app",
          icon: <MdOutlineIntegrationInstructions size={20} />,
        },
      ],
    },
  ];

  if (pathname.includes("pitch")) {
    return null;
  }

  return (
    <header
      className={cn(
        "sticky top-4 z-50 mt-4 justify-center px-2 md:flex md:px-4",
        pathname === "/" &&
          "duration-1s animate-header-slide-down-fade transition ease-in-out",
      )}
    >
      <nav className="z-20 flex h-[50px] items-center rounded-2xl bg-[#121212] bg-opacity-70 px-4 backdrop-blur-xl backdrop-filter">
        <ContextMenu>
          <ContextMenuTrigger>
            <Link href="/">
              <span className="sr-only">Solomon AI Logo</span>
              <Icons.Logo />
            </Link>
          </ContextMenuTrigger>

          <ContextMenuContent
            className="w-[200px] rounded-none bg-[#121212]"
            alignOffset={20}
          >
            <div className="divide-y">
              <ContextMenuItem
                className="flex items-center space-x-2"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(
                      `<svg
                      xmlns="http://www.w3.org/2000/svg"
                      width={102}
                      height={30}
                      fill="none"
                    >
                      <path
                        fill="currentColor"
                        fillRule="evenodd"
                        d="M14.347 0a14.931 14.931 0 0 0-6.282 1.68l6.282 10.88V0Zm0 17.443L8.067 28.32a14.933 14.933 0 0 0 6.28 1.68V17.443ZM15.652 30V17.432l6.285 10.887A14.932 14.932 0 0 1 15.652 30Zm0-17.43V0c2.26.097 4.392.693 6.287 1.682l-6.287 10.889ZM2.336 23.068l10.884-6.284-6.284 10.884a15.093 15.093 0 0 1-4.6-4.6Zm25.33-16.132-10.88 6.282 6.282-10.88a15.094 15.094 0 0 1 4.598 4.598ZM2.335 6.934a15.094 15.094 0 0 1 4.6-4.6l6.284 10.884L2.335 6.934Zm-.654 1.13A14.931 14.931 0 0 0 0 14.35h12.568L1.681 8.064Zm0 13.873a14.932 14.932 0 0 1-1.68-6.282h12.562L1.682 21.938Zm15.754-7.587H30a14.93 14.93 0 0 0-1.68-6.285L17.435 14.35Zm10.884 7.586-10.878-6.28H30a14.932 14.932 0 0 1-1.68 6.28Zm-11.533-5.151 6.281 10.88a15.092 15.092 0 0 0 4.598-4.599l-10.88-6.281Z"
                        clipRule="evenodd"
                      />
                      <path
                        fill="currentColor"
                        d="M92.34 11.912h1.637l2.995 8.223 2.884-8.223h1.619l-4 11.107c-.372 1.06-1.08 1.544-2.196 1.544h-1.172v-1.358h1.024c.502 0 .8-.186.986-.707l.353-.912h-.52l-3.61-9.674ZM82.744 14.814c.39-1.916 1.916-3.126 4.018-3.126 2.549 0 3.963 1.489 3.963 4.13v3.964c0 .446.186.632.614.632h.39v1.358h-.65c-1.005 0-1.88-.335-1.861-1.544-.428.93-1.544 1.767-3.107 1.767-1.954 0-3.535-1.041-3.535-2.79 0-2.028 1.544-2.55 3.702-2.977l2.921-.558c-.018-1.712-.818-2.53-2.437-2.53-1.265 0-2.102.65-2.4 1.804l-1.618-.13Zm1.432 4.39c0 .8.689 1.452 2.14 1.433 1.637 0 2.92-1.153 2.92-3.442v-.167l-2.362.41c-1.47.26-2.698.371-2.698 1.767ZM80.129 8.563v13.21h-1.377l-.056-1.452c-.558 1.042-1.618 1.675-3.144 1.675-2.847 0-4.168-2.419-4.168-5.154s1.321-5.153 4.168-5.153c1.451 0 2.493.558 3.051 1.562V8.563h1.526Zm-7.145 8.28c0 1.915.819 3.701 2.884 3.701 2.028 0 2.865-1.823 2.865-3.702 0-1.953-.837-3.758-2.865-3.758-2.065 0-2.884 1.786-2.884 3.758ZM68.936 8.563v13.21H67.56l-.056-1.452c-.558 1.042-1.619 1.675-3.144 1.675-2.847 0-4.168-2.419-4.168-5.154s1.321-5.153 4.168-5.153c1.45 0 2.493.558 3.05 1.562V8.563h1.526Zm-7.144 8.28c0 1.915.819 3.701 2.884 3.701 2.028 0 2.865-1.823 2.865-3.702 0-1.953-.837-3.758-2.865-3.758-2.065 0-2.884 1.786-2.884 3.758ZM56.212 11.912h1.525v9.86h-1.525v-9.86Zm-.037-1.544V8.6h1.6v1.768h-1.6ZM40.224 11.912h1.395l.056 1.674c.446-1.21 1.47-1.898 2.846-1.898 1.414 0 2.438.763 2.865 2.084.428-1.34 1.47-2.084 3.014-2.084 1.973 0 3.126 1.377 3.126 3.74v6.344H52v-5.897c0-1.805-.707-2.828-1.916-2.828-1.544 0-2.437 1.041-2.437 2.846v5.88H46.12v-5.899c0-1.767-.725-2.827-1.916-2.827-1.526 0-2.456 1.079-2.456 2.827v5.898h-1.525v-9.86Z"
                      />
                    </svg>
                    `,
                    );
                  } catch {}
                }}
              >
                <Icons.LogoIcon />
                <span className="text-sm font-medium">Copy Logo as SVG</span>
              </ContextMenuItem>
              <ContextMenuItem asChild>
                <Link href="/branding" className="flex items-center space-x-2">
                  <Icons.Change />
                  <span className="text-sm font-medium">Branding</span>
                </Link>
              </ContextMenuItem>
              <ContextMenuItem>
                <a
                  href="https://ui.solomon-ai.app"
                  className="flex items-center space-x-2"
                >
                  <Icons.Palette />
                  <span className="text-sm font-medium">Design System</span>
                </a>
              </ContextMenuItem>
            </div>
          </ContextMenuContent>
        </ContextMenu>

        <ul className="mx-3 hidden space-x-2 text-sm font-medium md:flex">
          {links.map(({ path, title, children, cover }) => {
            if (path) {
              return (
                <li key={path}>
                  <Link
                    onClick={handleOnClick}
                    href={path}
                    className="inline-flex h-8 items-center justify-center px-3 py-2 text-sm font-medium text-secondary-foreground transition-opacity duration-200 hover:opacity-70"
                  >
                    {title}
                  </Link>
                </li>
              );
            }

            return (
              <li
                key={path}
                className="group"
                onMouseEnter={() => setShowBlur(true)}
                onMouseLeave={() => setShowBlur(false)}
              >
                <span className="inline-flex h-8 cursor-pointer items-center justify-center px-3 py-2 text-sm font-medium text-secondary-foreground transition-opacity duration-200 hover:opacity-70">
                  {title}
                </span>

                {children && (
                  <div
                    className={cn(
                      "absolute -left-[1px] top-[48px] mt-[2%] flex h-0 w-[676px] overflow-hidden rounded-2xl bg-[#121212] transition-all duration-300 ease-in-out group-hover:h-[250px]",
                      hidden && "hidden",
                    )}
                  >
                    <ul className="flex-0 mt-2 w-[200px] space-y-5 p-4">
                      {children.map((child) => {
                        return (
                          <li key={child.path}>
                            <Link
                              onClick={handleOnClick}
                              href={child.path}
                              className="flex items-center space-x-2 transition-opacity duration-200 hover:opacity-70"
                            >
                              <span>{child.icon}</span>
                              <span className="text-sm font-medium">
                                {child.title}
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>

                    <div className="flex-1 p-4">{cover}</div>
                    <div className="absolute bottom-0 w-full" />
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          className="ml-auto p-2 md:hidden"
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
      </nav>

      {isOpen && (
        <motion.div
          className="fixed -top-[3px] bottom-0 left-0 right-0 z-10 h-screen bg-background px-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="relative mt-4 flex justify-between p-3 px-4">
            <button type="button" onClick={handleToggleMenu}>
              <span className="sr-only">Solomon AI Logo</span>
              <Icons.Logo />
            </button>

            <button
              type="button"
              className="absolute right-[10px] top-2 ml-auto p-2 md:hidden"
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

          <div className="h-screen overflow-auto pb-[150px]">
            <motion.ul
              initial="hidden"
              animate="show"
              className="mb-8 space-y-8 overflow-auto px-3 pt-8 text-xl text-[#878787]"
              variants={listVariant}
            >
              {links.map(({ path, title, children }) => {
                const isActive =
                  path === "/updates"
                    ? pathname.includes("updates")
                    : path === lastPath;

                if (path) {
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
                }

                return (
                  <li key={path}>
                    <Collapsible>
                      <CollapsibleTrigger className="flex w-full items-center justify-between">
                        <span className="text-[#878787]">{title}</span>
                        <Icons.ChevronDown />
                      </CollapsibleTrigger>

                      {children && (
                        <CollapsibleContent>
                          <ul className="ml-4 mt-6 space-y-8" key={path}>
                            {children.map((child) => {
                              return (
                                <li key={child.path}>
                                  <Link
                                    onClick={handleToggleMenu}
                                    href={child.path}
                                    className="text-[#878787]"
                                  >
                                    {child.title}
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        </CollapsibleContent>
                      )}
                    </Collapsible>
                  </li>
                );
              })}

              <motion.li
                className="mt-auto border-t-[1px] pt-8"
                variants={itemVariant}
              >
                <Link
                  className="text-xl text-primary"
                  href="https://app-business.solomon-ai.app"
                >
                  Sign in
                </Link>
              </motion.li>
            </motion.ul>
          </div>
        </motion.div>
      )}

      <div
        className={cn(
          "invisible fixed left-0 top-0 z-10 h-screen w-screen opacity-0 backdrop-blur-md transition-all duration-300",
          showBlur && "visible opacity-100",
        )}
      />
    </header>
  );
}
