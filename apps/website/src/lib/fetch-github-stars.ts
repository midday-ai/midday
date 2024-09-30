"use server";

export async function fetchGithubStars() {
  const response = await fetch(
    "https://api.github.com/repos/midday-ai/midday",
    {
      next: {
        revalidate: 3600,
      },
      cache: "force-cache",
    },
  );

  return response.json();
}
