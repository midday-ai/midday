import { LogoLarge } from "@/components/logo-large";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import Link from "next/link";
import { Suspense } from "react";
// import { GithubStars } from "./github-stars";
import { SocialLinks } from "./social-links";
import { StatusWidget } from "./status-widget";

export function Footer() {
  return (
    <footer className="border-t-[1px] border-border px-4 md:px-0 pt-10 md:pt-16 bg-[#F6F6F3] dark:bg-[#0C0C0C]">
      <div className="container">
        <div className="flex justify-between items-center border-border border-b-[1px] pb-10 md:pb-16 mb-12">
          <Link href="/" className="scale-50 -ml-[52px] md:ml-0 md:scale-100">
            <LogoLarge />
            <span className="sr-only">Midday</span>
          </Link>

          <h3 className="font-normal md:text-2xl text-right">
            Run your bussiness smarter.
          </h3>
        </div>

        <div className="flex flex-col md:flex-row w-full mb-10 md:mb-20">
          <div className="flex flex-col space-y-8 md:space-y-0 md:flex-row md:w-6/12 justify-between leading-8">
            <div>
              <h6 className="font-medium">Product</h6>
              <ul>
                <li className="text-[#707070] transition-colors hover:text-primary dark:text-[#878787]">
                  <Link href="/">Features</Link>
                </li>
                <li className="text-[#707070] transition-colors hover:text-primary dark:text-[#878787]">
                  <Link href="/pricing">Pricing</Link>
                </li>
                <li className="text-[#707070] transition-colors hover:text-primary dark:text-[#878787]">
                  <Link href="/story">Story</Link>
                </li>
                <li className="text-[#707070] transition-colors hover:text-primary dark:text-[#878787]">
                  <Link href="/updates">Updates</Link>
                </li>
                <li className="text-[#707070] transition-colors hover:text-primary dark:text-[#878787]">
                  <Link href="/download">Download</Link>
                </li>
              </ul>
            </div>

            <div>
              <h6>Resources</h6>
              <ul>
                <li className="text-[#707070] transition-colors hover:text-primary dark:text-[#878787]">
                  <Link href="https://git.new/midday">Github</Link>
                </li>
                <li className="text-[#707070] transition-colors hover:text-primary dark:text-[#878787]">
                  <Link href="/support">Support</Link>
                </li>
                <li className="text-[#707070] transition-colors hover:text-primary dark:text-[#878787]">
                  <Link href="/updates">Updates</Link>
                </li>
                <li className="text-[#707070] transition-colors hover:text-primary dark:text-[#878787]">
                  <Link href="/policy">Privacy policy</Link>
                </li>
                <li className="text-[#707070] transition-colors hover:text-primary dark:text-[#878787]">
                  <Link href="/terms">Terms and Conditions</Link>
                </li>
              </ul>
            </div>

            <div>
              <h6>Solutions</h6>
              <ul>
                <li className="text-[#707070] transition-colors hover:text-primary dark:text-[#878787]">
                  <Link href="/engine">Midday Engine</Link>
                </li>
                <li className="text-[#707070] transition-colors hover:text-primary dark:text-[#878787]">
                  <Link href="https://docs.midday.ai/self-hosted">
                    Self hosted
                  </Link>
                </li>
                <li className="text-[#707070] transition-colors hover:text-primary dark:text-[#878787]">
                  <Link href="/pricing">SaaS hosting</Link>
                </li>
                <li className="text-[#707070] transition-colors hover:text-primary dark:text-[#878787]">
                  <Link href="/open-startup">Open startup</Link>
                </li>
                <li className="text-[#707070] transition-colors hover:text-primary dark:text-[#878787]">
                  <Link href="/oss-friends">OSS friends</Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="md:w-6/12 flex mt-8 md:mt-0 md:justify-end">
            <div className="flex justify-between md:items-end flex-col space-y-14">
              <div className="flex items-center">
                {/* <Suspense>
                  <GithubStars />
                </Suspense> */}

                <SocialLinks />
              </div>
              <div className="md:mr-0 mr-auto">
                <ErrorBoundary>
                  <Suspense>
                    <StatusWidget />
                  </Suspense>
                </ErrorBoundary>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-[#B3B3B2] dark:text-[#3E3E3E] mb-12">
          Cal.com® is a registered trademark by Cal.com, Inc. All rights
          reserved. Apple.com® is a registered trademark by Apple.com, Inc. All
          rights reserved. Discord.com® is a registered trademark by
          Discord.com, Inc. All rights reserved. Github.com® is a registered
          trademark by Github.com, Inc. All rights reserved. Notion.com® is a
          registered trademark by Notion.com, Inc. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
