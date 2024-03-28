import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Open Startup | Midday",
};

export default async function Page() {
  return (
    <div className="container max-w-[1050px]">
      <h1 className="mt-24 font-medium text-center text-5xl mb-8">
        Open Startup
      </h1>

      <p className="text-[#878787] font-sm text-center">
        We believe in a better and more sustainable future powered by Open
        Source software.
        <br /> Below you can find a list of our friends who are just as
        passionate about open source and the future as we are.
      </p>

      <div className="grid md:grid-cols-3 gap-6 mt-12">hello</div>
    </div>
  );
}
