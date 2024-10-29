"use client";

import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { Button } from "@midday/ui/button";

export function EmptyState() {
  const { setParams } = useInvoiceParams();

  return (
    <div className="flex items-center justify-center ">
      <div className="flex flex-col items-center mt-40">
        <div className="text-center mb-6 space-y-2">
          <h2 className="font-medium text-lg">No invoices</h2>
          <p className="text-[#606060] text-sm">
            You haven't created any invoices yet. <br />
            Go ahead and create your first one.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() =>
            setParams({
              type: "create",
            })
          }
        >
          Create invoice
        </Button>
      </div>
    </div>
  );
}

export function NoResults() {
  const { setParams } = useInvoiceParams();

  return (
    <div className="flex items-center justify-center ">
      <div className="flex flex-col items-center mt-40">
        <div className="text-center mb-6 space-y-2">
          <h2 className="font-medium text-lg">No results</h2>
          <p className="text-[#606060] text-sm">
            Try another search, or adjusting the filters
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => setParams(null, { shallow: false })}
        >
          Clear filters
        </Button>
      </div>
    </div>
  );
}
