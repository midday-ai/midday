import Image from "next/image";

const getAuthorTagline = (id: string) =>
  ({
    "5c2176bb-e4f0-4026-a77a-3feaf95fc758": "Engineering", // Pontus
  }[id]);

export function PostAuthor({ name, src, id }) {
  return (
    <div className="flex space-x-2 items-center">
      <Image
        src={src}
        width={24}
        height={24}
        alt={name}
        className="rounded-full overflow-hidden"
        quality={100}
      />
      <span className="font-medium text-xs">{name}</span>
      <span className="text-xs text-[#878787]">{getAuthorTagline(id)}</span>
    </div>
  );
}
