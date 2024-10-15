"use server";

export async function fetchGithubStars() {
  const response = await fetch(
    "https://api.github.com/repos/midday-ai/midday",
    {
      next: {
        revalidate: 3600,
      },
    },
  );

  return response.json();
}
