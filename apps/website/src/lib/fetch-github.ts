"use server";

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

export async function getGithubStats() {
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

  const stats = Object.keys(starsPerDate).map((key) => {
    return {
      date: new Date(key),
      value: starsPerDate[key],
    };
  });

  return {
    stats,
    repository,
  };
}
