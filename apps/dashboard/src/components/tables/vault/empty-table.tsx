type Props = {
  type: string;
};

export function EmptyTable({ type }: Props) {
  switch (type) {
    case "inbox":
      return (
        <div className="h-[calc(100%-80px)] p-4 flex justify-center items-center">
          <div className="items-center flex flex-col text-center">
            <h2 className="mb-2">This is your inbox</h2>
            <p className="text-sm text-[#878787]">
              Everything that will be sent to your <br />
              Midday email will end up here.
            </p>
          </div>
        </div>
      );

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
              This is where your attachments for
              <br />
              transactions will end up.
            </p>
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
