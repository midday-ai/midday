import { ChartSSR } from "@/components/chart-ssr";
import { LuGitFork } from "react-icons/lu";
import {
  MdBalance,
  MdOutlineAdjust,
  MdOutlineBrightness1,
  MdOutlineStarBorder,
} from "react-icons/md";

async function getAllStargazers({ owner, name }) {
  let endCursor = undefined;
  let hasNextPage = true;
  let added = [];

  while (hasNextPage) {
    const request = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `bearer ${process.env.GITHUB_TOKEN}`,
      },
      next: {
        revalidate: 3600,
      },
      body: JSON.stringify({
        variables: { after: endCursor, owner, name },
        query: `query Repository($owner: String!, $name: String!, $after: String) {
          repository(owner: $owner, name: $name) {
            stargazers (first: 100, after: $after) {
              pageInfo {
                endCursor
                hasNextPage
              }
              edges {
               starredAt
              }
            }
          }
        }`,
      }),
    });

    const { data } = await request.json();

    added = added.concat(data.repository.stargazers.edges);
    hasNextPage = data.repository.stargazers.pageInfo.hasNextPage;
    endCursor = data.repository.stargazers.pageInfo.endCursor;
  }

  return added;
}

async function githubRequest({ owner, name }) {
  const request = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `bearer ${process.env.GITHUB_TOKEN}`,
    },
    next: {
      revalidate: 3600,
    },
    body: JSON.stringify({
      variables: { owner, name },
      query: `query Repository($owner: String!, $name: String!) {
          repository(owner: $owner, name: $name) {
            forks {
              totalCount
            }
            watchers {
              totalCount
            }
            stargazers {
              totalCount
            }
             commits:object(expression: "main") {
              ... on Commit {
                history {
                  totalCount
                }
              }
            }
          }
        }`,
    }),
  });

  return request.json();
}

export async function GithubStats() {
  const stargazers = await getAllStargazers({
    owner: "midday-ai",
    name: "midday",
  });

  const {
    data: { repository },
  } = await githubRequest({
    owner: "midday-ai",
    name: "midday",
  });

  const starsPerDate = stargazers.reduce((acc, curr) => {
    const date = curr.starredAt.substring(0, 10);

    if (acc[date]) {
      acc[date]++;
    } else {
      acc[date] = 1;
    }
    return acc;
  }, {});

  const data = Object.keys(starsPerDate).map((key) => {
    return {
      date: new Date(key),
      value: starsPerDate[key],
    };
  });

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
            {repository.stargazers.totalCount}
          </span>
        </div>

        <div className="flex items-center space-x-1">
          <LuGitFork />
          <span className="text-xs shrink-0">
            {repository.forks.totalCount}
          </span>
        </div>

        <div className="flex items-center space-x-1">
          <MdOutlineAdjust />
          <span className="text-xs shrink-0">
            {repository.commits.history.totalCount}
          </span>
        </div>
      </div>

      <div className="pb-10 mt-10 h-[130px]">
        <ChartSSR data={data} />
        <p className="text-[#878787] text-sm mt-4">Updated one hour ago</p>
      </div>
    </>
  );
}
