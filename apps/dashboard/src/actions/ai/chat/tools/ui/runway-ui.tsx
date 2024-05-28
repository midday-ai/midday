import { BotCard } from "@/components/chat/messages";

type Props = {
  months: number;
};

export function RunwayUI({ months }: Props) {
  const result = `${months?.toString()} months`;

  return (
    <BotCard>
      <p>{result}</p>
    </BotCard>
  );
}
