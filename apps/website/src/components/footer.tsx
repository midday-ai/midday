import { LogoLarge } from "@/components/logo-large";
import Link from "next/link";
import { Suspense } from "react";
import { GithubStars } from "./github-stars";
import { SocialLinks } from "./social-links";
import { StatusWidget } from "./status-widget";

export function Footer() {
  return (
    <footer className="border-t-[1px] border-border pt-16">
      <div className="container">
        <div className="flex justify-between items-center border-border border-b-[1px] pb-16 mb-12">
          <Link href="/">
            <LogoLarge />
          </Link>

          <h3 className="font-normal text-2xl">Run your bussiness smarter.</h3>
        </div>

        <div className="flex w-full mb-20">
          <div className="flex w-6/12 justify-between leading-8">
            <div>
              <h6 className="font-medium">Product</h6>
              <ul>
                <li className="text-[#878787]">
                  <Link href="/">Features</Link>
                </li>
                <li className="text-[#878787]">
                  <Link href="/pricing">Pricing</Link>
                </li>
                <li className="text-[#878787]">
                  <Link href="/story">Story</Link>
                </li>
                <li className="text-[#878787]">
                  <Link href="/updates">Updates</Link>
                </li>
                <li className="text-[#878787]">
                  <Link href="/download">Download</Link>
                </li>
              </ul>
            </div>

            <div>
              <h6>Resources</h6>
              <ul>
                <li className="text-[#878787]">
                  <Link href="https://git.new/midday">Github</Link>
                </li>
                <li className="text-[#878787]">
                  <Link href="/support">Support</Link>
                </li>
                <li className="text-[#878787]">
                  <Link href="/updates">Updates</Link>
                </li>
                <li className="text-[#878787]">
                  <Link href="/privacy">Privacy policy</Link>
                </li>
                <li className="text-[#878787]">
                  <Link href="/terms">Terms and Conditions</Link>
                </li>
              </ul>
            </div>

            <div>
              <h6>Solutions</h6>
              <ul>
                <li className="text-[#878787]">
                  <Link href="/engine">Midday Engine</Link>
                </li>
                <li className="text-[#878787]">
                  <Link href="/docs/self-hosted">Self hosted</Link>
                </li>
                <li className="text-[#878787]">
                  <Link href="/pricing">SaaS hosting</Link>
                </li>
                <li className="text-[#878787]">
                  <Link href="/open-startup">Open startup</Link>
                </li>
                <li className="text-[#878787]">
                  <Link href="/oss-friends">OSS friends</Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="w-6/12 flex justify-end">
            <div className="flex justify-between items-end flex-col">
              <div className="flex items-center">
                <Suspense>
                  <GithubStars />
                </Suspense>

                <SocialLinks />
              </div>
              <div>
                <Suspense>
                  <StatusWidget />
                </Suspense>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-[#3E3E3E] mb-12">
          Cal.com® is a registered trademark by Cal.com, Inc. All rights
          reserved. Cal.com® is a registered trademark by Cal.com, Inc. All
          rights reserved. Cal.com® is a registered trademark by Cal.com, Inc.
          All rights reserved. Cal.com® is a registered trademark by Cal.com,
          Inc. All rights reserved. Cal.com® is a registered trademark by
          Cal.com, Inc. All rights reserved. Cal.com® is a registered trademark
          by Cal.com, Inc. All rights reserved. Cal.com® is a registered
          trademark by Cal.com, Inc. All rights reserved. Cal.com® is a
          registered trademark by Cal.com, Inc. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
