import { notFound } from "next/navigation";
import type { SearchParams } from "nuqs";
import {
  type AppOAuthErrorCode,
  getErrorDescription,
  getErrorTitle,
} from "@/utils/app-oauth-errors";
import { EventEmitter } from "./event-emitter";
import { searchParamsSchema } from "./schema";

type Props = {
  searchParams: Promise<SearchParams>;
};

const OAuthCallbackPage = async (props: Props) => {
  const searchParams = await props.searchParams;
  const parsedSearchParams = searchParamsSchema.safeParse(searchParams);

  if (!parsedSearchParams.success) {
    notFound();
  }

  const { status, error } = parsedSearchParams.data;
  const isError = status === "error";
  const errorCode = error as AppOAuthErrorCode | undefined;

  return (
    <>
      <EventEmitter status={status} />
      <div className="h-screen flex flex-col items-center justify-center text-center px-8">
        {isError ? (
          <>
            <h1 className="text-lg font-medium mb-2">
              {getErrorTitle(errorCode)}
            </h1>
            <p className="text-sm text-[#606060] max-w-[280px]">
              {getErrorDescription(errorCode)}
            </p>
          </>
        ) : (
          <>
            <h1 className="text-lg font-medium mb-2">Connected</h1>
            <p className="text-sm text-[#606060]">You may close this window.</p>
          </>
        )}
      </div>
    </>
  );
};

export default OAuthCallbackPage;
