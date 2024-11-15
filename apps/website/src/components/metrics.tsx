export function Metrics() {
  return (
    <div className="flex flex-wrap md:flex-nowrap gap-8 absolute bottom-0 left-0 divide-x">
      <div className="flex flex-col pr-8 text-center">
        <h4 className="text-[#878787] text-sm mb-4">Businesses</h4>
        <span className="text-2xl font-mono text-stroke">10.000+</span>
      </div>
      <div className="flex flex-col px-8 text-center">
        <h4 className="text-[#878787] text-sm mb-4">Bank accounts</h4>
        <span className="text-2xl font-mono text-stroke">3402</span>
      </div>
      <div className="flex flex-col px-8 text-center">
        <h4 className="text-[#878787] text-sm mb-4">Transactions</h4>
        <span className="text-2xl font-mono text-stroke">782K</span>
      </div>
      <div className="flex flex-col px-8 text-center">
        <h4 className="text-[#878787] text-sm mb-4">Transaction value</h4>
        <span className="text-2xl font-mono text-stroke">$812M</span>
      </div>
    </div>
  );
}
