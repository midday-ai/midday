import Link from "next/link";

export function VaultHeader() {
  return (
    <div>
      <Link href="/vault" prefetch>
        <h2 className="text-lg">Recent files</h2>
      </Link>
      <div className="flex py-3 border-b-[1px] justify-between mt-4">
        <span className="font-medium text-sm">Name</span>
        <span className="font-medium text-sm">Tag</span>
      </div>
    </div>
  );
}
