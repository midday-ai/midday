import { NotFoundTerminal } from "@/components/not-found-terminal";

export default function NotFound() {
  return (
    <div className="fixed bg-[#0C0C0C] top-0 right-0 bottom-0 left-0 z-30">
      <h1 className="font-mono md:text-[300px] text-[140px] font-medium text-center mt-20">
        404
      </h1>

      <NotFoundTerminal />
    </div>
  );
}
