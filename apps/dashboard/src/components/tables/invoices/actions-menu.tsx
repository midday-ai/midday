"use client";

import { OpenURL } from "@/components/open-url";
import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { useTRPC } from "@/trpc/client";
import { getUrl } from "@/utils/environment";
import { Button } from "@midday/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { useToast } from "@midday/ui/use-toast";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCopyToClipboard } from "usehooks-ts";
import type { Invoice } from "./columns";

type Props = {
  row: Invoice;
};

export function ActionsMenu({ row }: Props) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { setParams } = useInvoiceParams();
  const { toast } = useToast();
  const [, copy] = useCopyToClipboard();

  const deleteInvoiceMutation = useMutation(
    trpc.invoice.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.invoice.get.infiniteQueryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.invoice.getById.queryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.invoice.invoiceSummary.queryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.invoice.defaultSettings.queryKey(),
        });
      },
    }),
  );

  const updateInvoiceMutation = useMutation(
    trpc.invoice.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.invoice.get.infiniteQueryKey(),
        });
      },
    }),
  );
  const handleCopyLink = async () => {
    copy(`${getUrl()}/i/${row.token}`);

    toast({
      duration: 4000,
      title: "Copied link to clipboard.",
      variant: "success",
    });
  };

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild className="relative">
          <Button variant="ghost" className="h-8 w-8 p-0">
            <DotsHorizontalIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          {row.status !== "paid" && row.status !== "canceled" && (
            <DropdownMenuItem
              onClick={() =>
                setParams({
                  invoiceId: row.id,
                  type: "edit",
                })
              }
            >
              Edit invoice
            </DropdownMenuItem>
          )}

          <DropdownMenuItem>
            <OpenURL href={`${getUrl()}/i/${row.token}`}>Open invoice</OpenURL>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleCopyLink}>
            Copy link
          </DropdownMenuItem>

          {row.status !== "draft" && (
            <DropdownMenuItem>
              <a
                // @ts-expect-error
                href={`/api/download/invoice?id=${row.id}&size=${row.template?.size === "a4" ? "a4" : "letter"}`}
                download
              >
                Download
              </a>
            </DropdownMenuItem>
          )}

          {(row.status === "overdue" || row.status === "unpaid") && (
            <DropdownMenuItem
              onClick={() =>
                updateInvoiceMutation.mutate({
                  id: row.id,
                  status: "canceled",
                })
              }
              className="text-[#FF3638]"
            >
              Cancel
            </DropdownMenuItem>
          )}

          {row.status === "canceled" && (
            <DropdownMenuItem
              onClick={() => deleteInvoiceMutation.mutate({ id: row.id })}
              className="text-[#FF3638]"
            >
              Delete
            </DropdownMenuItem>
          )}

          {row.status === "draft" && (
            <DropdownMenuItem
              onClick={() => deleteInvoiceMutation.mutate({ id: row.id })}
              className="text-[#FF3638]"
            >
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
