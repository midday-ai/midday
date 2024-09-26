import { notFound } from "next/navigation";
import { EventEmitter } from "./event-emitter";
import { searchParamsSchema } from "./schema";

type Props = {
  searchParams: Record<string, string | string[] | undefined>;
};

const AllDonePage = ({ searchParams }: Props) => {
  const parsedSearchParams = searchParamsSchema.safeParse(searchParams);

  if (!parsedSearchParams.success) {
    notFound();
  }

  return (
    <>
      <EventEmitter event={parsedSearchParams.data.event} />
      <div className="w-dvw h-dvh flex items-center justify-center">
        <p>All done, you can close this window!</p>
      </div>
    </>
  );
};

export default AllDonePage;
