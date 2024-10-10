import { AnimatedNumber } from "../animated-number";
import { FormatAmount } from "../format-amount";

export function Summary() {
  return (
    <div className="w-[240px] flex flex-col space-y-4 divide-y divide-border">
      <div className="flex justify-between items-center">
        <span className="font-mono text-[11px] text-[#878787]">VAT</span>
        <span className="text-right font-mono text-[11px] text-[#878787]">
          <FormatAmount
            amount={2400}
            minimumFractionDigits={0}
            maximumFractionDigits={0}
            currency="USD"
          />
        </span>
      </div>

      <div className="flex justify-between items-center pt-2">
        <span className="font-mono text-[11px] text-[#878787]">Total</span>
        <span className="text-right font-mono text-[21px]">
          <AnimatedNumber
            value={23423423}
            currency="USD"
            minimumFractionDigits={0}
            maximumFractionDigits={0}
          />
        </span>
      </div>
    </div>
  );
}
