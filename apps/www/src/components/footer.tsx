"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icons } from "@midday/ui/icons";

import { GithubStars } from "./github-stars";
import { SocialLinks } from "./social-links";
import { StatusWidget } from "./status-widget";

export function Footer() {
  const pathname = usePathname();

  if (pathname.includes("pitch")) {
    return null;
  }

  return (
    <footer className="overflow-hidden border-t-[1px] border-border bg-[#0C0C0C] px-4 pt-10 md:max-h-[820px] md:px-6 md:pt-16">
      <div className="container">
        <div className="mb-12 flex items-center justify-between border-b-[1px] border-border pb-10 md:pb-16">
          <Link
            href="/"
            className="-ml-[52px] flex flex-1 scale-50 gap-1 md:ml-0 md:scale-100"
          >
            {/* <LogoLarge /> */}
            <Icons.Logo className="font-bold text-primary" />
            <span className="text-2xl font-bold text-primary">Solomon AI</span>
          </Link>

          <span className="text-right font-normal md:text-2xl">
            A better way to act on your finances
          </span>
        </div>

        <div className="flex w-full flex-col md:flex-row">
          <div className="flex flex-col justify-between space-y-8 leading-8 md:w-6/12 md:flex-row md:space-y-0">
            <div>
              <span className="font-medium">Product</span>
              <ul>
                <li className="text-[#878787] transition-colors">
                  <Link href="/">Features</Link>
                </li>
                <li className="text-[#878787] transition-colors">
                  <Link href="/pricing">Pricing</Link>
                </li>
                <li className="text-[#878787] transition-colors">
                  <Link href="/story">Story</Link>
                </li>
                <li className="text-[#878787] transition-colors">
                  <Link href="/updates">Updates</Link>
                </li>
                <li className="text-[#878787] transition-colors">
                  <Link href="/download">Download</Link>
                </li>
                <li className="text-[#878787] transition-colors">
                  <Link href="/feature-request">Feature Request</Link>
                </li>
              </ul>
            </div>

            <div>
              <span>Resources</span>
              <ul>
                <li className="text-[#878787] transition-colors">
                  <Link href="https://github.com/SolomonAIEngineering/orbitkit">
                    Github
                  </Link>
                </li>
                <li className="text-[#878787] transition-colors">
                  <Link href="/support">Support</Link>
                </li>
                <li className="text-[#878787] transition-colors">
                  <Link href="/policy">Privacy policy</Link>
                </li>
                <li className="text-[#878787] transition-colors">
                  <Link href="/terms">Terms and Conditions</Link>
                </li>
                <li className="text-[#878787] transition-colors">
                  <Link href="/open-startup">Open Startup</Link>
                </li>
                {/* <li className="transition-colors text-[#878787]">
                  <Link href="/pitch">Investors</Link>
                </li> */}
                {/* <li className="transition-colors text-[#878787]">
                  <Link href="/branding">Branding</Link>
                </li> */}
              </ul>
            </div>

            <div>
              <span>Solutions</span>
              <ul>
                {/* <li className="transition-colors text-[#878787]">
                  <Link href="/engine">Solomon AI Engine</Link>
                </li> */}
                {/* <li className="transition-colors text-[#878787]">
                  <Link href="https://docs.solomon-ai.app/self-hosted">
                    Self hosted
                  </Link>
                </li> */}
                {/* <li className="transition-colors text-[#878787]">
                  <Link href="/">SaaS hosting</Link>
                </li> */}
                <li className="text-[#878787] transition-colors">
                  <Link href="/open-startup">Open startup</Link>
                </li>
                {/* <li className="transition-colors text-[#878787]">
                  <Link href="/oss-friends">OSS friends</Link>
                </li> */}
              </ul>
            </div>
          </div>

          <div className="mt-8 flex md:mt-0 md:w-6/12 md:justify-end">
            <div className="flex flex-col justify-between space-y-14 md:items-end">
              <div className="flex items-center">
                <GithubStars />
                <SocialLinks />
              </div>
              <div className="mr-auto md:mr-0">
                <StatusWidget />
              </div>
            </div>
          </div>
        </div>
      </div>

      <h5 className="pointer-events-none text-center text-[500px] leading-none text-[#161616]">
        SolomonAI
      </h5>
    </footer>
  );
}
