export function TransactionsListHeader() {
  return (
    <div className="flex py-3 border-b-[1px]">
      <span className="font-medium text-sm w-[50%]">Description</span>
      <span className="font-medium text-sm w-[35%]">Amount</span>
      <span className="font-medium text-sm ml-auto">Status</span>
    </div>
  );
}
