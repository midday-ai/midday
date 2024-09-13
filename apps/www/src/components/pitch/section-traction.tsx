"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchGithubStars } from "@/actions/fetch-github-stars";
import { fetchStats } from "@/actions/fetch-stats";

import { Card } from "./ui";

export function SectionTraction() {
  const [stars, setStars] = useState(0);
  const [users, setUsers] = useState(0);
  const [transactions, setTransactions] = useState(0);

  useEffect(() => {
    async function fetchStars() {
      try {
        const response = await fetchGithubStars();
        setStars(response);
      } catch {}
    }

    async function fetchCount() {
      try {
        const { users, transactions } = await fetchStats();
        setUsers(users);
        setTransactions(transactions);
      } catch {}
    }

    fetchStars();
    fetchCount();
  }, []);

  return (
    <div className="relative min-h-screen w-screen">
      <div className="absolute left-4 right-4 top-4 flex justify-between text-lg md:left-8 md:right-8">
        <span>Where we are</span>
        <span className="text-[#878787]">
          <Link href="/">Solomon AI </Link>
        </span>
      </div>
      <div className="container flex min-h-screen flex-col justify-center p-[5%]">
        <div className="grid h-[580px] gap-8 overflow-auto px-4 pb-[100px] md:h-auto md:grid-cols-3 md:px-0 md:pb-0 md:pt-0">
          <div className="space-y-8">
            <Card className="min-h-[365px]">
              <h2 className="text-2xl">Onboarded Practices</h2>

              <p className="text-center text-sm text-[#878787]">
                We have been able to onboard all 5 locations of PromptMD onto
                the platform.
              </p>

              <span className="mt-auto font-mono text-[80px] md:text-[122px]">
                1
              </span>
            </Card>

            <Card className="min-h-[365px]">
              <h2 className="text-2xl">GitHub stars</h2>

              <p className="text-center text-sm text-[#878787]">
                Our goal is to build a great community around Solomon AI and the
                open source community.
              </p>

              <div className="flex items-center space-x-4">
                <span className="relative ml-auto flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                </span>
                <span className="mt-auto font-mono text-[80px] md:text-[122px]">
                  {stars &&
                    Intl.NumberFormat("en", {
                      notation: "compact",
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 1,
                    }).format(stars.stargazers_count ?? 0)}
                </span>
              </div>
            </Card>
          </div>
          <div className="space-y-8">
            <Card className="min-h-[365px]">
              <h2 className="text-2xl">Processed Locations</h2>

              <p className="text-center text-sm text-[#878787]">
                This is the number of locations we have processed for our
                multi-clinic partners.
              </p>

              <div className="flex items-center space-x-4">
                <span className="relative ml-auto flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                </span>

                <span className="mt-auto font-mono text-[80px] md:text-[122px]">
                  {5}
                </span>
              </div>
            </Card>

            <Card className="min-h-[365px]">
              <h2 className="text-2xl">Transactions</h2>

              <p className="text-center text-sm text-[#878787]">
                We are already handling a significant amount of transaction
                data.
              </p>

              <div className="flex items-center space-x-4">
                <span className="relative ml-auto flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                </span>

                <span className="mt-auto font-mono text-[80px] md:text-[122px]">
                  {transactions &&
                    Intl.NumberFormat("en", { notation: "compact" }).format(
                      transactions,
                    )}
                </span>
              </div>
            </Card>
          </div>

          {/* <div className="ml-auto w-full max-w-[820px] h-full border border-border p-6 bg-[#0C0C0C] relative">
            <h2 className="mb-24 block text-[38px] font-medium">
              What people say
            </h2>

            <div className="absolute w-[220px] bottom-6 left-[50%] -mt-5 -ml-[110px] flex justify-center">
              <a
                href="https://twitter.com/search?q=solomon-ai.app&src=typed_query&f=top"
                target="_blank"
                rel="noreferrer"
              >
                <Button className="w-full flex items-center space-x-2 h-10">
                  <span>More posts on</span>
                  <FaXTwitter />
                </Button>
              </a>
            </div>

            <Image src={customers} width={698} alt="Customers" quality={100} />
          </div> */}
        </div>
      </div>
    </div>
  );
}
