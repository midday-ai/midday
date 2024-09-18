import { TrackerCreateSheet } from "./tracker-create-sheet";
import { TrackerScheduleSheet } from "./tracker-schedule-sheet";
import { TrackerUpdateSheet } from "./tracker-update-sheet";

type Props = {
  defaultCurrency: string;
};

export function GlobalSheets({ defaultCurrency }: Props) {
  return (
    <>
      <TrackerUpdateSheet currencyCode={defaultCurrency} />
      <TrackerCreateSheet currencyCode={defaultCurrency} />
      <TrackerScheduleSheet />
    </>
  );
}
