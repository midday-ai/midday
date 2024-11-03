type Props = {
  type?: string;
};

export function EmptyTable({ type }: Props) {
  switch (type) {
    case "exports":
      return (
        <div className="h-[calc(100%-80px)] p-4 flex justify-center items-center">
          <div className="items-center flex flex-col text-center">
            <h2 className="mb-2">Exports</h2>
            <p className="text-sm text-[#878787]">
              This is where your exports based from <br />
              transactions will end up.
            </p>
          </div>
        </div>
      );

    case "transactions":
      return (
        <div className="h-[calc(100%-80px)] p-4 flex justify-center items-center">
          <div className="items-center flex flex-col text-center">
            <h2 className="mb-2">Transactions</h2>
            <p className="text-sm text-[#878787]">
              This is where your attachments from <br />
              transactions will end up.
            </p>
          </div>
        </div>
      );

    case "imports":
      return (
        <div className="h-[calc(100%-80px)] p-4 flex justify-center items-center">
          <div className="items-center flex flex-col text-center">
            <h2 className="mb-2">Imports</h2>
            <p className="text-sm text-[#878787]">
              This is where your imports
              <br />
              will end up.
            </p>
          </div>
        </div>
      );

    case "inbox":
      return (
        <div className="h-[calc(100%-80px)] p-4 flex justify-center items-center">
          <div className="items-center flex flex-col text-center">
            <h2 className="mb-2">Inbox</h2>
            <p className="text-sm text-[#878787]">
              This is where your inbox attachments
              <br />
              will end up.
            </p>
          </div>
        </div>
      );

    case "invoices":
      return (
        <div className="h-[calc(100%-80px)] p-4 flex justify-center items-center">
          <div className="items-center flex flex-col text-center">
            <h2 className="mb-2">Invoices</h2>
            <p className="text-sm text-[#878787]">
              This is where your created
              <br />
              invoices will end up.
            </p>
          </div>
        </div>
      );

    case "search":
      return (
        <div className="h-[calc(100%-80px)] p-4 flex justify-center items-center">
          <div className="items-center flex flex-col text-center">
            <h2 className="mb-2">No results found.</h2>
            <p className="text-sm text-[#878787]">Try adjusting your search.</p>
          </div>
        </div>
      );

    default:
      return (
        <div className="h-[calc(100%-80px)] p-4 flex justify-center items-center">
          <div className="items-center flex flex-col text-center">
            <h2 className="mb-2">Drop your files here</h2>
            <p className="text-sm text-[#878787]">
              Or upload them via the <br /> "Upload file" button above
            </p>
          </div>
        </div>
      );
  }
}
