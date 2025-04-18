import Link from "next/link";

export function VaultHeader() {
  return (
    <div className="mb-4">
      <Link href="/vault" prefetch>
        <h2 className="text-lg">Recent files</h2>
      </Link>
    </div>
  );
}
