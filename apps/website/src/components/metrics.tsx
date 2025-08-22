import Link from "next/link";

export function Metrics() {
  return (
    <div className="grid grid-cols-2 md:flex md:flex-nowrap gap-8 lg:absolute bottom-0 left-0 md:divide-x mt-20 lg:mt-0">
      <Link href="/open-startup">
        <div className="flex flex-col md:pr-8 text-center">
          <h4 className="text-[#878787] text-sm mb-4">Businesses</h4>
          <span className="text-2xl font-mono text-stroke">16,600+</span>
        </div>
      </Link>
      <Link href="/open-startup">
        <div className="flex flex-col md:px-8 text-center">
          <h4 className="text-[#878787] text-sm mb-4">Bank accounts</h4>
          <span className="text-2xl font-mono text-stroke">6.100+</span>
        </div>
      </Link>
      <Link href="/open-startup">
        <div className="flex flex-col md:px-8 text-center">
          <h4 className="text-[#878787] text-sm mb-4">Transactions</h4>
          <span className="text-2xl font-mono text-stroke">1.4M</span>
        </div>
      </Link>
      <Link href="/open-startup">
        <div className="flex flex-col md:px-8 text-center">
          <h4 className="text-[#878787] text-sm mb-4">Transaction value</h4>
          <span className="text-2xl font-mono text-stroke">$812M</span>
        </div>
      </Link>
    </div>
  );
}
