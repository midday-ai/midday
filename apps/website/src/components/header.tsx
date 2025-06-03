"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@midday/ui/accordion";
import { cn } from "@midday/ui/cn";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@midday/ui/context-menu";
import { Icons } from "@midday/ui/icons";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import menuAssistantLight from "public/menu-assistant-light.jpg";
import menuAssistantDark from "public/menu-assistant.jpg";
import menuEngineLight from "public/menu-engine-light.png";
import menuEngineDark from "public/menu-engine.png";
import { useEffect, useState } from "react";
import { FaDiscord, FaGithub } from "react-icons/fa";
import {
  MdOutlineDashboardCustomize,
  MdOutlineDescription,
  MdOutlineIntegrationInstructions,
  MdOutlineMemory,
} from "react-icons/md";
import { DynamicImage } from "./dynamic-image";

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

  useEffect(() => {
    const setPixelRatio = () => {
      const pixelRatio = window.devicePixelRatio || 1;
      document.documentElement.style.setProperty(
        "--pixel-ratio",
        `${1 / pixelRatio}`,
      );
    };

    setPixelRatio();
    window.addEventListener("resize", setPixelRatio);

    return () => window.removeEventListener("resize", setPixelRatio);
  }, []);

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
    {
      title: "Features",
      cover: (
        <Link href="/#assistant" onClick={handleOnClick}>
          <DynamicImage
            alt="Assistant"
            darkSrc={menuAssistantDark}
            lightSrc={menuAssistantLight}
          />
        </Link>
      ),
      children: [
        {
          path: "/overview",
          title: "Overview",
          icon: <Icons.Overview size={20} />,
        },
        {
          path: "/inbox",
          title: "Inbox",
          icon: <Icons.Inbox2 size={20} />,
        },
        {
          path: "/vault",
          title: "Vault",
          icon: <Icons.Files size={20} />,
        },
        {
          path: "/tracker",
          title: "Tracker",
          icon: <Icons.Tracker size={20} />,
        },
        {
          path: "/invoice",
          title: "Invoice",
          icon: <Icons.Invoice size={20} />,
        },
      ],
    },
    {
      title: "Pricing",
      path: "/pricing",
    },
    {
      title: "Updates",
      path: "/updates",
    },
    {
      title: "Story",
      path: "/story",
    },
    {
      title: "Download",
      path: "/download",
    },
    {
      title: "Developers",
      cover: (
        <Link href="/engine" onClick={handleOnClick}>
          <DynamicImage
            alt="Engine"
            darkSrc={menuEngineDark}
            lightSrc={menuEngineLight}
          />
        </Link>
      ),
      children: [
        {
          path: "https://git.new/midday",
          title: "Open Source",
          icon: <FaGithub size={19} />,
        },
        {
          path: "https://docs.midday.ai",
          title: "Documentation",
          icon: <MdOutlineDescription size={20} />,
        },
        {
          path: "/engine",
          title: "Engine",
          icon: <MdOutlineMemory size={20} />,
        },
        {
          title: "Join the community",
          path: "https://go.midday.ai/anPiuRx",
          icon: <FaDiscord size={19} />,
        },
        {
          title: "Apps & Integrations",
          path: "https://docs.midday.ai/integrations",
          icon: <MdOutlineIntegrationInstructions size={20} />,
        },
        {
          path: "/components",
          title: "Components",
          icon: <MdOutlineDashboardCustomize size={20} />,
        },
      ],
    },
  ];

  if (pathname.includes("pitch")) {
    return null;
  }

  return (
    <header className="sticky mt-4 top-4 z-50 px-2 md:px-4 md:flex justify-center">
      <nav className="border border-border px-4 flex items-center backdrop-filter backdrop-blur-xl bg-[#FFFFFF] dark:bg-[#121212] bg-opacity-70 h-[50px] z-20 relative">
        <ContextMenu>
          <ContextMenuTrigger>
            <Link href="/">
              <span className="sr-only">Midday Logo</span>
              <Icons.LogoSmall className="size-6" />
            </Link>
          </ContextMenuTrigger>

          <ContextMenuContent
            className="w-[200px] dark:bg-[#121212] bg-[#fff] rounded-none"
            alignOffset={20}
          >
            <div className="divide-y">
              <ContextMenuItem
                className="flex items-center space-x-2"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(
                      `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M14.8541 2.6983C15.4799 4.5758 15.4799 6.60604 14.8541 8.48354L14.3118 10.1067L16.3236 8.32414C17.5176 7.26526 18.3366 5.84768 18.6566 4.28424L19.2267 1.49751L20.9604 1.85239L20.3903 4.63913C19.9935 6.578 18.9784 8.33639 17.4977 9.64944L16.2154 10.7862L18.8497 10.2475C20.4134 9.92753 21.8319 9.1087 22.8908 7.91456L24.7781 5.7864L26.1022 6.96044L24.2149 9.0886C22.9018 10.5693 21.1435 11.5845 19.2046 11.9812L17.5244 12.3245L20.0761 13.175C21.5903 13.6797 23.2279 13.6797 24.742 13.175L27.4403 12.2756L28 13.9546L25.3017 14.8541C23.4241 15.4799 21.394 15.4799 19.5165 14.8541L17.8921 14.3118L19.6759 16.3236C20.7347 17.5176 22.1523 18.3355 23.7158 18.6554L26.5025 19.2267L26.1476 20.9604L23.3609 20.3903C21.4219 19.9935 19.6636 18.9784 18.3506 17.4977L17.2149 16.2166L17.7537 18.8497C18.0736 20.4131 18.8915 21.8308 20.0854 22.8896L22.2136 24.7769L21.0396 26.1011L18.9114 24.2138C17.4308 22.9008 16.4155 21.1434 16.0188 19.2046L15.6755 17.5268L14.8261 20.0761C14.3214 21.5902 14.3214 23.2279 14.8261 24.742L15.7256 27.4403L14.0454 28L13.1459 25.3017C12.5201 23.4242 12.5201 21.394 13.1459 19.5165L13.687 17.8898L11.6764 19.6747C10.4822 20.7336 9.6634 22.1522 9.34342 23.7158L8.77327 26.5025L7.03956 26.1464L7.60971 23.3609C8.00648 21.422 9.02157 19.6636 10.5023 18.3506L11.7834 17.2126L9.15027 17.7525C7.58674 18.0725 6.16925 18.8914 5.11037 20.0854L3.22307 22.2136L1.89894 21.0396L3.78624 18.9114C5.09924 17.4307 6.85659 16.4156 8.79538 16.0188L10.4744 15.6744L7.92387 14.825C6.40972 14.3203 4.77213 14.3203 3.25798 14.825L0.559674 15.7244L0 14.0454L2.6983 13.1459C4.57585 12.5201 6.606 12.5201 8.48354 13.1459L10.1067 13.687L8.32414 11.6764C7.26522 10.4823 5.8478 9.66337 4.28424 9.34342L1.49751 8.77327L1.85239 7.03956L4.63913 7.60971C6.57804 8.00648 8.33636 9.0216 9.64944 10.5023L10.7839 11.7822L10.2463 9.15027C9.9264 7.58686 9.10847 6.16923 7.91456 5.11037L5.7864 3.22307L6.96044 1.89777L9.0886 3.78507C10.5694 5.09812 11.5844 6.85651 11.9812 8.79538L12.3245 10.4744L13.175 7.92387C13.6797 6.40976 13.6797 4.77209 13.175 3.25798L12.2756 0.559674L13.9546 0L14.8541 2.6983ZM14 11.2342C12.4732 11.2344 11.2344 12.4732 11.2342 14L11.2493 14.2827C11.3911 15.6767 12.5687 16.7645 14 16.7646C15.4313 16.7645 16.6089 15.6767 16.7507 14.2827L16.7646 14L16.7507 13.7173C16.6185 12.4161 15.5838 11.3817 14.2827 11.2493L14 11.2342Z" fill="white"/>
</svg>
                    `,
                    );
                  } catch {}
                }}
              >
                <Icons.LogoSmall className="size-3" />
                <span className="font-medium text-sm">Copy Logo as SVG</span>
              </ContextMenuItem>
              <ContextMenuItem asChild>
                <Link href="/branding" className="flex items-center space-x-2">
                  <Icons.Change />
                  <span className="font-medium text-sm">Branding</span>
                </Link>
              </ContextMenuItem>
              <ContextMenuItem>
                <a
                  href="https://ui.midday.ai"
                  className="flex items-center space-x-2"
                >
                  <Icons.Palette />
                  <span className="font-medium text-sm">Design System</span>
                </a>
              </ContextMenuItem>
            </div>
          </ContextMenuContent>
        </ContextMenu>

        <ul className="space-x-2 font-medium text-sm hidden md:flex mx-3">
          {links.map(({ path, title, children, cover }) => {
            if (path) {
              return (
                <li key={path}>
                  <Link
                    onClick={handleOnClick}
                    href={path}
                    className="h-8 items-center justify-center text-sm font-medium px-3 py-2 inline-flex text-secondary-foreground transition-opacity hover:opacity-70 duration-200"
                  >
                    {title}
                  </Link>
                </li>
              );
            }

            return (
              <li
                key={title}
                className="group"
                onMouseEnter={() => setShowBlur(true)}
                onMouseLeave={() => setShowBlur(false)}
              >
                <span className="h-8 items-center justify-center text-sm font-medium transition-opacity hover:opacity-70 duration-200 px-3 py-2 inline-flex text-secondary-foreground cursor-pointer">
                  {title}
                </span>

                {children && (
                  <div
                    className={cn(
                      "absolute top-[48px] -inset-x-px bg-[#fff] dark:bg-[#121212] flex h-0 group-hover:h-[250px] overflow-hidden transition-all duration-300 ease-in-out border-l border-r",
                      hidden && "hidden",
                    )}
                  >
                    <ul className="p-4 w-[200px] flex-0 space-y-4 mt-2">
                      {children.map((child) => {
                        return (
                          <li key={child.path}>
                            <Link
                              onClick={handleOnClick}
                              href={child.path}
                              className="flex space-x-2 items-center transition-opacity hover:opacity-70 duration-200"
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
                    <div className="absolute bottom-0 w-full border-b-[1px]" />
                  </div>
                )}
              </li>
            );
          })}
        </ul>

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

        <a
          className="text-sm font-medium pr-2 border-l-[1px] border-border pl-4 hidden md:block"
          href="https://app.midday.ai"
        >
          Sign in
        </a>
      </nav>

      {isOpen && (
        <motion.div
          className="fixed bg-background -top-[2px] right-0 left-0 bottom-0 h-screen z-10 px-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="mt-4 flex justify-between p-3 px-4 relative ml-[1px]">
            <button type="button" onClick={handleToggleMenu}>
              <span className="sr-only">Midday Logo</span>
              <Icons.LogoSmall />
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

          <div className="h-screen pb-[150px] overflow-auto">
            <motion.ul
              initial="hidden"
              animate="show"
              className="px-3 pt-8 text-xl text-[#878787] space-y-8 mb-8 overflow-auto"
              variants={listVariant}
            >
              {links.map(({ path, title, children }, index) => {
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
                  <li key={title}>
                    <Accordion collapsible type="single">
                      <AccordionItem value="item-1" className="border-none">
                        <AccordionTrigger className="flex items-center justify-between w-full font-normal p-0 hover:no-underline">
                          <span className="text-[#878787]">{title}</span>
                        </AccordionTrigger>

                        {children && (
                          <AccordionContent className="text-xl">
                            <ul className="space-y-8 ml-4 mt-6">
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
                          </AccordionContent>
                        )}
                      </AccordionItem>
                    </Accordion>
                  </li>
                );
              })}

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

      <div
        className={cn(
          "fixed w-screen h-screen backdrop-blur-md left-0 top-0 invisible opacity-0 transition-all duration-300 z-10",
          showBlur && "md:visible opacity-100",
        )}
      />
    </header>
  );
}
