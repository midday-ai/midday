type Props = {
  type: string;
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
