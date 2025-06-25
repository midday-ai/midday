import { formatAmount } from "@midday/utils/format";
import type { LineItem } from "../../../types";
import { calculateLineItemTotal } from "../../../utils/calculate";
import { Description } from "./description";

type Props = {
	lineItems: LineItem[];
	currency: string | null;
	descriptionLabel: string;
	quantityLabel: string;
	priceLabel: string;
	totalLabel: string;
	includeDecimals?: boolean;
	locale: string;
	includeUnits?: boolean;
};

export function LineItems({
	lineItems,
	currency,
	descriptionLabel,
	quantityLabel,
	priceLabel,
	totalLabel,
	includeDecimals = false,
	includeUnits = false,
	locale,
}: Props) {
	const maximumFractionDigits = includeDecimals ? 2 : 0;

	return (
		<div className="mt-5 font-mono">
			<div className="grid grid-cols-[1.5fr_15%_15%_15%] gap-4 items-end relative group mb-2 w-full pb-1 border-b border-border">
				<div className="text-[11px] text-[#878787]">{descriptionLabel}</div>
				<div className="text-[11px] text-[#878787]">{quantityLabel}</div>
				<div className="text-[11px] text-[#878787]">{priceLabel}</div>
				<div className="text-[11px] text-[#878787] text-right">
					{totalLabel}
				</div>
			</div>

			{lineItems.map((item, index) => (
				<div
					key={`line-item-${index.toString()}`}
					className="grid grid-cols-[1.5fr_15%_15%_15%] gap-4 items-start relative group mb-1 w-full py-1"
				>
					<div className="self-start">
						<Description content={item.name} />
					</div>
					<div className="text-[11px] self-start">{item.quantity ?? 0}</div>
					<div className="text-[11px] self-start">
						{currency && includeUnits && item.unit
							? `${formatAmount({
									currency,
									amount: item.price ?? 0,
									maximumFractionDigits,
									locale,
								})}/${item.unit}`
							: currency &&
								formatAmount({
									currency,
									amount: item.price ?? 0,
									maximumFractionDigits,
									locale,
								})}
					</div>
					<div className="text-[11px] text-right self-start">
						{currency &&
							formatAmount({
								maximumFractionDigits,
								currency,
								amount: calculateLineItemTotal({
									price: item.price,
									quantity: item.quantity,
								}),
								locale,
							})}
					</div>
				</div>
			))}
		</div>
	);
}
