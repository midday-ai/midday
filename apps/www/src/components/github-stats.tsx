"use client";

import { useEffect, useState } from "react";
import { getGithubStats } from "@/actions/fetch-github-stats";
import { ChartSSR } from "@/components/chart-ssr";
import { LuGitFork } from "react-icons/lu";
import {
  MdBalance,
  MdOutlineAdjust,
  MdOutlineBrightness1,
  MdOutlineStarBorder,
} from "react-icons/md";

export function GithubStats() {
  const [data, setData] = useState();

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await getGithubStats();
        setData(response);
      } catch {}
    }

    fetchData();
  }, []);

  return (
    <>
      <div className="scrollbar-hide mt-6 flex space-x-4 overflow-auto">
        <div className="flex items-center space-x-1">
          <MdOutlineBrightness1 />
          <span className="shrink-0 text-xs">TypeScript</span>
        </div>
        <div className="flex items-center space-x-1">
          <MdBalance />
          <span className="shrink-0 text-xs">AGPL-3.0</span>
        </div>
        <div className="flex items-center space-x-1">
          <MdOutlineStarBorder />
          <span className="shrink-0 text-xs">
            {data?.repository &&
              Intl.NumberFormat("en", {
                notation: "compact",
                minimumFractionDigits: 0,
                maximumFractionDigits: 1,
              }).format(data.repository.stargazers.totalCount ?? 0)}
          </span>
        </div>

        <div className="flex items-center space-x-1">
          <LuGitFork />
          <span className="shrink-0 text-xs">
            {data?.repository &&
              Intl.NumberFormat("en", {
                notation: "compact",
                minimumFractionDigits: 0,
                maximumFractionDigits: 1,
              }).format(data.repository.forks.totalCount ?? 0)}
          </span>
        </div>

        <div className="flex items-center space-x-1">
          <MdOutlineAdjust />
          <span className="shrink-0 text-xs">
            {data?.repository &&
              Intl.NumberFormat("en", {
                notation: "compact",
                minimumFractionDigits: 0,
                maximumFractionDigits: 1,
              }).format(data.repository.commits.history.totalCount ?? 0)}
          </span>
        </div>
      </div>

      <div className="mt-10 h-[130px] pb-10">
        {data?.stats && <ChartSSR data={data?.stats} />}
        <p className="mt-4 text-sm text-[#878787]">Updated one hour ago</p>
      </div>
    </>
  );
}
