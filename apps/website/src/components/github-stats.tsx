"use client";

import { getGithubStats } from "@/actions/fetch-github-stats";
import { ChartSSR } from "@/components/chart-ssr";
import { useEffect, useState } from "react";
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
      const response = await getGithubStats();
      setData(response);
    }

    fetchData();
  }, []);

  return (
    <>
      <div className="flex space-x-4 overflow-auto scrollbar-hide mt-6">
        <div className="flex items-center space-x-1">
          <MdOutlineBrightness1 />
          <span className="text-xs shrink-0	">TypeScript</span>
        </div>
        <div className="flex items-center space-x-1">
          <MdBalance />
          <span className="text-xs shrink-0">AGPL-3.0</span>
        </div>
        <div className="flex items-center space-x-1">
          <MdOutlineStarBorder />
          <span className="text-xs shrink-0">
            {data?.repository &&
              Intl.NumberFormat("en", { notation: "compact" }).format(
                data.repository.stargazers.totalCount ?? 0
              )}
          </span>
        </div>

        <div className="flex items-center space-x-1">
          <LuGitFork />
          <span className="text-xs shrink-0">
            {data?.repository &&
              Intl.NumberFormat("en", { notation: "compact" }).format(
                data.repository.forks.totalCount ?? 0
              )}
          </span>
        </div>

        <div className="flex items-center space-x-1">
          <MdOutlineAdjust />
          <span className="text-xs shrink-0">
            {data?.repository &&
              Intl.NumberFormat("en", { notation: "compact" }).format(
                data.repository.commits.history.totalCount ?? 0
              )}
          </span>
        </div>
      </div>

      <div className="pb-10 mt-10 h-[130px]">
        {data?.stats && <ChartSSR data={data?.stats} />}
        <p className="text-[#878787] text-sm mt-4">Updated one hour ago</p>
      </div>
    </>
  );
}
