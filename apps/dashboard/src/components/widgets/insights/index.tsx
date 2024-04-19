import { shuffle } from "@midday/utils";
import { InsightsWidget } from "./insights-widget";

const defaultExamples = [
  {
    id: 1,
    label: `What's my business burn rate?`,
  },
  {
    id: 2,
    label: "How much money did I earn last month?",
  },
  {
    id: 3,
    label: "How much did I spend on software last year?",
  },
  {
    id: 5,
    label: "Show me all recurring costs this year",
  },
  {
    id: 6,
    label: "Show me recurring services we paying for",
  },
  {
    id: 7,
    label: "What are our biggest expenses categories?",
  },
];

const items = shuffle(defaultExamples).slice(0, 4);

export function Insights() {
  return (
    <div className="border aspect-square overflow-hidden relative flex flex-col p-8">
      <h2 className="text-lg">Insights</h2>

      <div className="flex flex-1 flex-col justify-center items-center">
        <InsightsWidget items={items} />
      </div>
    </div>
  );
}
