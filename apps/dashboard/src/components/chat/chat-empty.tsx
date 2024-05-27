import { shuffle } from "@midday/utils";

const defaultExamples = [
  {
    id: 1,
    label: `What's my current burn rate`,
  },
  {
    id: 2,
    label: "How much money did I earn last month",
  },
  {
    id: 3,
    label: "How much do I spend on software last month?",
  },
  {
    id: 5,
    label: "Show me all transactions without reciepts",
  },
  {
    id: 6,
    label: "Show me my biggest income",
  },
  {
    id: 7,
    label: "What are our biggest expenses",
  },
];

const items = shuffle(defaultExamples).slice(0, 3);

type Props = {
  onSubmit: (value: string) => void;
};

export function ChatEmpty({ onSubmit }: Props) {
  return (
    <div className="w-full mt-24 flex flex-col items-center justify-center text-center">
      <span className="font-medium text-xl">
        Hi Pontus, how can I help you today?
      </span>

      <ul className="flex flex-col justify-center items-center space-y-3 flex-shrink mt-6">
        {items.map((example) => (
          <li
            key={example.id}
            className="rounded-full dark:bg-secondary bg-[#F2F1EF] text-xs font-mono text-[#606060] hover:opacity-80 transition-all cursor-default"
          >
            <button
              onClick={() => onSubmit(example.label)}
              type="button"
              className="inline-block p-3 py-2"
            >
              <span>{example.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
