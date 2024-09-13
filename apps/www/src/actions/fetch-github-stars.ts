"use server";

export async function fetchGithubStars() {
  const response = await fetch(
    "https://github.com/SolomonAIEngineering/orbitkit",
    {
      next: {
        revalidate: 300,
      },
    },
  );

  return response.json();
}
