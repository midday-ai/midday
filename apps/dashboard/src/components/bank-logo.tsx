import { Avatar, AvatarImage } from "@midday/ui/avatar";
import Image from "next/image";

type Props = {
  src: string | null;
  alt: string;
  size?: number;
};

export function BankLogo({ src, alt, size = 34 }: Props) {
  return (
    <Avatar style={{ width: size, height: size }}>
      {src && (
        <Image
          src={src}
          alt={alt}
          className="text-transparent"
          width={size}
          height={size}
          quality={95}
        />
      )}
      <Image
        src="https://cdn-engine.midday.ai/default.jpg"
        alt={alt}
        className="absolute -z-10"
        width={size}
        height={size}
      />
    </Avatar>
  );
}
