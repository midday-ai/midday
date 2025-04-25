import { VaultItemSkeleton } from "./vault-item-skeleton";

export function VaultGridSkeleton() {
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 3xl:grid-cols-6 gap-8">
        {Array.from({ length: 12 }).map((_, index) => (
          <VaultItemSkeleton key={index.toString()} />
        ))}
      </div>
    </div>
  );
}
