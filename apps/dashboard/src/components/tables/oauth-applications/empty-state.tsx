export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-[300px] border border-border">
      <h3>No OAuth applications found</h3>
      <p className="text-sm text-muted-foreground">
        No OAuth applications have been created for this team yet.
      </p>
    </div>
  );
}
