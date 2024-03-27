"use client";

import { fetchGithubStars } from "@/actions/fetch-github-stars";
import { fetchStats } from "@/actions/fetch-stats";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import customers from "./customers.png";
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
    <div className="min-h-screen relative w-screen">
      <div className="absolute left-4 right-4 md:left-8 md:right-8 top-4 flex justify-between text-lg">
        <span>Where we are</span>
        <span className="text-[#878787]">
          <Link href="/">Midday</Link>
        </span>
      </div>
      <div className="flex flex-col min-h-screen justify-center container">
        <div className="grid md:grid-cols-3 gap-8 px-4 md:px-0 md:pt-0 h-[580px] md:h-auto overflow-auto pb-[100px] md:pb-0">
          <div className="space-y-8">
            <Card className="min-h-[360px]">
              <h2 className="text-2xl">Waitlist sign ups</h2>

              <p className="text-[#878787] text-sm text-center">
                We have built Midday in public on X and amassed nearly 4000
                signups ready to start using Midday.
              </p>

              <span className="mt-auto font-mono text-[122px]">3453</span>
            </Card>

            <Card className="min-h-[360px]">
              <h2 className="text-2xl">Github stars</h2>

              <p className="text-[#878787] text-sm text-center">
                Since going open source on the 20th of March 2024 we’ve gained
                834 stars on Github. Our goal is to build a great comunity
                around Midday.
              </p>

              <div className="flex items-center space-x-4">
                <span className="relative ml-auto flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-green-400" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                <span className="mt-auto font-mono text-[122px]">
                  {stars &&
                    Intl.NumberFormat("en", { notation: "compact" }).format(
                      stars.stargazers_count ?? 0
                    )}
                </span>
              </div>
            </Card>
          </div>
          <div className="space-y-8">
            <Card className="min-h-[360px]">
              <h2 className="text-2xl">Private beta users</h2>

              <p className="text-[#878787] text-sm text-center">
                This is how many we’ve let into the system to start using it,
                joined the community and started to form Midday together with
                us.
              </p>

              <div className="flex items-center space-x-4">
                <span className="relative ml-auto flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-green-400" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>

                <span className="mt-auto font-mono text-[122px]">{users}</span>
              </div>
            </Card>

            <Card className="min-h-[360px]">
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

                <span className="mt-auto font-mono text-[122px]">
                  {transactions &&
                    Intl.NumberFormat("en", { notation: "compact" }).format(
                      transactions
                    )}
                </span>
              </div>
            </Card>
          </div>

          <div className="ml-auto w-full max-w-[820px] h-full border border-border rounded-xl p-6 bg-[#0C0C0C]">
            <h2 className="mb-24 block text-[38px]">What users are saying</h2>

            <Image src={customers} width={698} alt="Customers" quality={100} />
          </div>
        </div>
      </div>
    </div>
  );
}
