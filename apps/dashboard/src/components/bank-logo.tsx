import { Avatar, AvatarFallback, AvatarImage } from "@midday/ui/avatar";

type Props = {
  src?: string;
  alt: string;
  size?: number;
};

export function BankLogo({ src, alt, size = 34 }: Props) {
  return (
    <Avatar
      style={{ width: size, height: size }}
      className="border border-border"
    >
      <AvatarImage src={src} alt={alt} />
      <AvatarImage src="https://cdn-engine.midday.ai/default.jpg" alt={alt} />
    </Avatar>
  );
}
