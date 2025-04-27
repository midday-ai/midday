"use client";

import { useDocumentParams } from "@/hooks/use-document-params";
import { useTRPC } from "@/trpc/client";
import { Button } from "@midday/ui/button";
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@midday/ui/carousel";
import { Icons } from "@midday/ui/icons";
import { useQuery } from "@tanstack/react-query";
import * as React from "react";
import { VaultItem } from "./vault-item";
import { VaultRelatedFilesSkeleton } from "./vault-related-files-skeleton";

export function VaultRelatedFiles() {
  const trpc = useTRPC();
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [count, setCount] = React.useState(0);
  const { params } = useDocumentParams();

  const { data, isLoading } = useQuery(
    trpc.documents.getRelatedFiles.queryOptions(
      {
        pageSize: 12,
        id: params?.id!,
      },
      {
        enabled: !!params?.id,
      },
    ),
  );

  React.useEffect(() => {
    if (!api) {
      return;
    }

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  if (isLoading) {
    return <VaultRelatedFilesSkeleton fullView />;
  }

  if (!data?.length) {
    return null;
  }

  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-medium">Related Files</h2>

        <div className="flex flex-row gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => api?.scrollPrev()}
            disabled={current === 1}
            className="size-6"
          >
            <Icons.ChevronLeft className="size-7" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => api?.scrollNext()}
            disabled={current === count}
            className="size-6"
          >
            <Icons.ChevronRight className="size-7" />
          </Button>
        </div>
      </div>

      <Carousel
        setApi={setApi}
        opts={{
          align: "start",
        }}
        className="w-full"
      >
        <CarouselContent>
          {data?.map((document) => (
            <CarouselItem key={document.id} className="basis-1/3">
              <VaultItem data={document} small />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
}
