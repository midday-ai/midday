import { Icons } from "@midday/ui/icons";

export function ChatEmpty() {
  return (
    <div className="mt-24 flex w-full flex-col items-center justify-center text-center">
      <Icons.LogoSmall />
      <span className="mt-6 text-xl font-medium">
        Hello, how can I help <br />
        you today?
      </span>
    </div>
  );
}
