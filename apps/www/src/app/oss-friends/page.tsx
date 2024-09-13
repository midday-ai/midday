import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "OSS Friends",
};

type Friend = {
  name: string;
  href: string;
  description: string;
};

export default async function Page() {
  const ossFriends: Friend[] = await fetch(
    "https://formbricks.com/api/oss-friends",
    {
      next: {
        revalidate: 3600,
      },
    },
  )
    .then(async (res) => res.json())
    .then(({ data }) => data)
    .catch(() => []);

  return (
    <div className="container max-w-[1050px]">
      <h1 className="mb-8 mt-24 text-center text-5xl font-medium">
        Our Open Source Friends
      </h1>

      <p className="font-sm text-center text-[#878787]">
        We believe in a better and more sustainable future powered by Open
        Source software.
        <br /> Below you can find a list of our friends who are just as
        passionate about open source and the future as we are.
      </p>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {ossFriends.map((friend) => {
          return (
            <div
              key={friend.name}
              className="border border-border bg-[#121212] p-4"
            >
              <div className="mb-2 flex items-center justify-between">
                <a href={friend.href} target="_blank" rel="noreferrer">
                  <h3 className="text-md font-medium">{friend.name}</h3>
                </a>
                <a href={friend.href} target="_blank" rel="noreferrer">
                  <span className="sr-only">Open link</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={24}
                    height={24}
                    className="scale-75 fill-primary"
                  >
                    <path fill="none" d="M0 0h24v24H0V0z" />
                    <path d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" />
                  </svg>
                </a>
              </div>
              <p className="text-sm text-[#878787]">{friend.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
