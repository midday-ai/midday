import { BotCard } from "@/components/chat/messages";
import { FormatAmount } from "@/components/format-amount";

type Props = {
  months: number;
  currency: string;
  category: string;
};

export function SpendingUI({ amount, currency, category }: Props) {
  return (
    <BotCard>
      You have spent <FormatAmount amount={amount} currency={currency} /> on the
      category {category}
    </BotCard>
  );
}
