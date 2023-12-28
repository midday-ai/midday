import { Icons } from "@midday/ui/icons";

export default function Tracker() {
  return (
    <div className="h-[calc(100vh-300px)] flex items-center justify-center">
      <div className="flex flex-col items-center">
        <Icons.WorkInProgress className="mb-4 w-[35px] h-[35px]" />
        <div className="text-center mb-6 space-y-2">
          <h2 className="font-medium text-lg">Tracker is work in progress</h2>
          <p className="text-[#606060] text-sm">
            We are currently working on our tracker feature
            <br /> In the meantime you can check our <br />
            <a
              href="https://midday-ai.notion.site/86823a9c0e2d4da6976d499df27cdfe3?v=b480460de3664974b01e4a098e50de54"
              className="underline underline-offset-1"
            >
              Roadmap
            </a>{" "}
            for progress updates.
          </p>
        </div>
      </div>
    </div>
  );
}
