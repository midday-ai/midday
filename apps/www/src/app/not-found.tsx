import { NotFoundTerminal } from "@/components/not-found-terminal";

export default function NotFound() {
  return (
    <div className="fixed bottom-0 left-0 right-0 top-0 z-10 bg-[#0C0C0C]">
      <h1 className="mt-20 text-center font-mono text-[140px] font-medium md:text-[300px]">
        404
      </h1>

      <NotFoundTerminal />
    </div>
  );
}
