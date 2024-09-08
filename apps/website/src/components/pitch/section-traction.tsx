"use client";

import { fetchGithubStars } from "@/lib/fetch-github-stars";
import { fetchStats } from "@/lib/fetch-stats";
import { Button } from "@midday/ui/button";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FaXTwitter } from "react-icons/fa6";
import customers from "./customers.png";
import { Card } from "./ui";

export function SectionTraction() {
  const [stars, setStars] = useState<number | null>(null);
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
    <div className="min-h-screen relative w-screen">
      <div className="absolute left-4 right-4 md:left-8 md:right-8 top-4 flex justify-between text-lg">
        <span>Where we are</span>
        <span className="text-[#878787]">
          <Link href="/">midday.ai</Link>
        </span>
      </div>
      <div className="flex flex-col min-h-screen justify-center container">
        <div className="grid md:grid-cols-3 gap-8 px-4 md:px-0 md:pt-0 h-[580px] md:h-auto overflow-auto pb-[100px] md:pb-0">
          <div className="space-y-8">
            <Card className="min-h-[365px]">
              <h2 className="text-2xl">Waitlist sign ups</h2>

              <p className="text-[#878787] text-sm text-center">
                We have built Midday in public on X and amassed nearly 4000
                signups ready to start using Midday.
              </p>

              <span className="mt-auto font-mono text-[80px] md:text-[122px]">
                3453
              </span>
            </Card>

            <Card className="min-h-[365px]">
              <h2 className="text-2xl">GitHub stars</h2>

              <p className="text-[#878787] text-sm text-center">
                Our goal is to build a great community around Midday.
              </p>

              <div className="flex items-center space-x-4">
                <span className="relative ml-auto flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-green-400" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
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
              <h2 className="text-2xl">Customers</h2>

              <p className="text-[#878787] text-sm text-center">
                This is the number of customers currently using Midday.
              </p>

              <div className="flex items-center space-x-4">
                <span className="relative ml-auto flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-green-400" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>

                <span className="mt-auto font-mono text-[80px] md:text-[122px]">
                  {users}
                </span>
              </div>
            </Card>

            <Card className="min-h-[365px]">
              <h2 className="text-2xl">Transactions</h2>

              <p className="text-[#878787] text-sm text-center">
                We are already handling a significant amount of transaction
                data.
              </p>

              <div className="flex items-center space-x-4">
                <span className="relative ml-auto flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-green-400" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
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

          <div className="ml-auto w-full max-w-[820px] h-full border border-border p-6 bg-[#0C0C0C] relative">
            <h2 className="mb-24 block text-[38px] font-medium">
              What people say
            </h2>

            <div className="absolute w-[220px] bottom-6 left-[50%] -mt-5 -ml-[110px] flex justify-center">
              <a
                href="https://twitter.com/search?q=midday.ai&src=typed_query&f=top"
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
          </div>
        </div>
      </div>
    </div>
  );
}
