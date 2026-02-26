export default function AccountDetailLoading() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      {/* Back link */}
      <div className="h-4 w-32 bg-muted rounded" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted" />
          <div className="space-y-2">
            <div className="h-6 w-48 bg-muted rounded" />
            <div className="h-4 w-32 bg-muted rounded" />
          </div>
        </div>
        <div className="text-right space-y-2">
          <div className="h-6 w-32 bg-muted rounded ml-auto" />
          <div className="h-4 w-12 bg-muted rounded ml-auto" />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={`card-${i}`} className="border border-border px-4 py-3">
            <div className="h-3 w-16 bg-muted rounded mb-2" />
            <div className="h-5 w-24 bg-muted rounded" />
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="space-y-2">
        <div className="h-5 w-28 bg-muted rounded" />
        <div className="border border-border">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={`row-${i}`}
              className="h-12 border-b border-border last:border-b-0 bg-muted/30"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
