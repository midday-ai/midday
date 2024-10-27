import { Avatar, AvatarImage } from "@midday/ui/avatar";

type Props = {
  src: string | null;
  alt: string;
  size?: number;
};

export function BankLogo({ src, alt, size = 34 }: Props) {
  return (
    <Avatar style={{ width: size, height: size }}>
      {src && <AvatarImage src={src} alt={alt} className="text-transparent" />}
      <AvatarImage src="https://cdn-engine.midday.ai/default.jpg" alt={alt} className="absolute -z-10" />
    </Avatar>
  );
}
