import Image from "next/image";

const getAuthorTagline = (id: string) =>
  ({
    "5c2176bb-e4f0-4026-a77a-3feaf95fc758": "Engineering", // Pontus
  })[id];

export function PostAuthor({ name, src, id }) {
  return (
    <div className="flex items-center space-x-2">
      <Image
        src={src}
        width={24}
        height={24}
        alt={name}
        className="overflow-hidden rounded-full"
        quality={100}
      />
      <span className="text-xs font-medium">{name}</span>
      <span className="text-xs text-[#878787]">{getAuthorTagline(id)}</span>
    </div>
  );
}
