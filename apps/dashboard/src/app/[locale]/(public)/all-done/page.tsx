import Image from "next/image";
import { notFound } from "next/navigation";
import type { SearchParams } from "nuqs";
import appIcon from "public/appicon.png";
import { EventEmitter } from "./event-emitter";
import { searchParamsSchema } from "./schema";

type Props = {
  searchParams: Promise<SearchParams>;
};

const AllDonePage = async (props: Props) => {
  const searchParams = await props.searchParams;
  const parsedSearchParams = searchParamsSchema.safeParse(searchParams);

  if (!parsedSearchParams.success) {
    notFound();
  }

  return (
    <>
      <EventEmitter event={parsedSearchParams.data.event} />
      <div>
        <div className="h-screen flex flex-col items-center justify-center text-center text-sm text-[#606060]">
          <Image
            src={appIcon}
            width={80}
            height={80}
            alt="Midday"
            quality={100}
            className="mb-10"
          />

          <p>You may close this browser tab when done</p>
        </div>
      </div>
    </>
  );
};

export default AllDonePage;
