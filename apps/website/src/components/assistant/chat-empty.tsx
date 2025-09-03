import { Icons } from "@midday/ui/icons";

export function ChatEmpty() {
  return (
    <div className="w-full mt-24 flex flex-col items-center justify-center text-center">
      <Icons.LogoSmall />
      <span className="font-medium text-xl mt-6">
        Hello, how can I help <br />
        you today?
      </span>
    </div>
  );
}
