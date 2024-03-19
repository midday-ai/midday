"use client";

export function PostLinks({ links }) {
  return (
    <aside className="sticky h-screen min-w-[260px] pt-[150px] space-y-4 flex-col top-[65px] items-start hidden md:flex">
      {links.map((link) => {
        return (
          <button
            type="button"
            key={link.id}
            className="text-[14px]"
            onClick={() => {
              const element = document.getElementById(link.slug);
              element?.scrollIntoView({
                behavior: "smooth",
              });
            }}
          >
            {link.lable}
          </button>
        );
      })}
    </aside>
  );
}
