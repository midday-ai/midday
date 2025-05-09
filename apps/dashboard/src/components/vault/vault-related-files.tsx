"use client";

import { useDocumentParams } from "@/hooks/use-document-params";
import { useTRPC } from "@/trpc/client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@midday/ui/accordion";
import { Carousel, CarouselContent, CarouselItem } from "@midday/ui/carousel";
import { useQuery } from "@tanstack/react-query";
import * as React from "react";
import { VaultItem } from "./vault-item";
import { VaultRelatedFilesSkeleton } from "./vault-related-files-skeleton";

export function VaultRelatedFiles() {
  const trpc = useTRPC();
  const { params } = useDocumentParams();

  const { data, isLoading } = useQuery(
    trpc.documents.getRelatedDocuments.queryOptions(
      {
        pageSize: 12,
        id: params?.documentId!,
      },
      {
        enabled: !!params?.documentId,
      },
    ),
  );

  if (isLoading) {
    return <VaultRelatedFilesSkeleton />;
  }

  if (!data?.length) {
    return null;
  }

  return (
    <Accordion className="relative mt-2" type="single" collapsible>
      <AccordionItem value="related-files">
        <AccordionTrigger className="text-sm font-medium">
          Related Files
        </AccordionTrigger>
        <AccordionContent>
          <Carousel
            opts={{
              align: "start",
            }}
          >
            <CarouselContent>
              {data?.map((document) => (
                <CarouselItem key={document.id} className="basis-1/3">
                  <VaultItem data={document} small />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
