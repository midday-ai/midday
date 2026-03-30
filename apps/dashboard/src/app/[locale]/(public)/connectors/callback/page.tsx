import { ConnectorCallbackEmitter } from "./emitter";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ConnectorCallbackPage(props: Props) {
  const searchParams = await props.searchParams;
  const status = searchParams.status as string | undefined;
  const isSuccess = status === "success";

  return (
    <>
      <ConnectorCallbackEmitter status={status} />
      <div className="h-screen flex flex-col items-center justify-center text-center px-8">
        {isSuccess ? (
          <>
            <h1 className="text-lg font-medium mb-2">Connected</h1>
            <p className="text-sm text-[#606060]">You may close this window.</p>
          </>
        ) : (
          <>
            <h1 className="text-lg font-medium mb-2">
              Connection {status === "failed" ? "failed" : "pending"}
            </h1>
            <p className="text-sm text-[#606060]">
              {status === "failed"
                ? "Something went wrong. Please try again."
                : "Waiting for connection..."}
            </p>
          </>
        )}
      </div>
    </>
  );
}
