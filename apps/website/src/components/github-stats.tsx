import { ChartSSR } from "@/components/chart-ssr";
import { getGithubStats } from "@/lib/fetch-github";
import { LuGitFork } from "react-icons/lu";
import {
  MdBalance,
  MdOutlineAdjust,
  MdOutlineBrightness1,
  MdOutlineStarBorder,
} from "react-icons/md";

export async function GithubStats() {
  const data = await getGithubStats();

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
              Intl.NumberFormat("en", {
                notation: "compact",
                minimumFractionDigits: 0,
                maximumFractionDigits: 1,
              }).format(data.repository.stargazers.totalCount ?? 0)}
          </span>
        </div>

        <div className="flex items-center space-x-1">
          <LuGitFork />
          <span className="text-xs shrink-0">
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
          <span className="text-xs shrink-0">
            {data?.repository &&
              Intl.NumberFormat("en", {
                notation: "compact",
                minimumFractionDigits: 0,
                maximumFractionDigits: 1,
              }).format(data.repository.commits.history.totalCount ?? 0)}
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
