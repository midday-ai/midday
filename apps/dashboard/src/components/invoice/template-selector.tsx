"use client";

import { localDateToUTCMidnight } from "@midday/invoice/recurring";
import { cn } from "@midday/ui/cn";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { addDays, parseISO } from "date-fns";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { useTRPC } from "@/trpc/client";
import { CreateTemplateDialog } from "./create-template-dialog";

export function TemplateSelector() {
  const { watch, setValue } = useFormContext();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: templates, refetch } = useQuery(
    trpc.invoiceTemplate.list.queryOptions(),
  );

  const currentTemplateId = watch("template.id");
  const currentTemplateName = watch("template.name") || "Default";

  const handleSelectTemplate = (template: NonNullable<typeof templates>[0]) => {
    // Set entire template object at once - react-hook-form handles nested objects
    setValue("template", template, { shouldDirty: true });

    // Always update invoice-level fields from the template, even if null/undefined
    // This ensures switching templates fully replaces the previous template's content
    setValue("fromDetails", template.fromDetails ?? null, {
      shouldDirty: true,
    });
    setValue("paymentDetails", template.paymentDetails ?? null, {
      shouldDirty: true,
    });
    setValue("noteDetails", template.noteDetails ?? null, {
      shouldDirty: true,
    });

    // Recalculate dueDate based on the new template's paymentTermsDays
    const paymentTermsDays = template.paymentTermsDays ?? 30;
    const issueDate = watch("issueDate");
    if (issueDate) {
      const issueDateParsed = parseISO(issueDate);
      const newDueDate = addDays(issueDateParsed, paymentTermsDays);
      setValue("dueDate", localDateToUTCMidnight(newDueDate), {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  };

  const handleTemplateCreated = async (newTemplate: {
    id: string;
    name: string;
  }) => {
    // Invalidate count query so settings-menu has fresh data
    queryClient.invalidateQueries({
      queryKey: trpc.invoiceTemplate.count.queryKey(),
    });

    // Refetch the templates list to get the full new template data
    const { data: updatedTemplates } = await refetch();

    // Find the newly created template with all its data
    const fullTemplate = updatedTemplates?.find((t) => t.id === newTemplate.id);

    if (fullTemplate) {
      // Set the full template data
      handleSelectTemplate(fullTemplate);
    } else {
      // Fallback: just set id, name, and isDefault if template not found
      setValue("template.id", newTemplate.id, { shouldDirty: true });
      setValue("template.name", newTemplate.name, { shouldDirty: true });
      setValue("template.isDefault", false, { shouldDirty: true });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="h-9 px-3 flex items-center justify-center gap-2 border border-border hover:bg-accent transition-colors text-xs"
          >
            <span className="max-w-[120px] truncate">
              {currentTemplateName}
            </span>
            <Icons.ChevronDown className="size-4 text-[#666]" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="start" sideOffset={10}>
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-[10px] text-muted-foreground font-normal px-2 py-1.5">
              TEMPLATES
            </DropdownMenuLabel>
            {templates?.map((template) => (
              <DropdownMenuCheckboxItem
                key={template.id}
                checked={currentTemplateId === template.id}
                onCheckedChange={() => handleSelectTemplate(template)}
                className={cn(
                  "text-xs",
                  currentTemplateId === template.id
                    ? "dark:bg-[#131313] text-primary"
                    : "text-[#666]",
                  "hover:dark:bg-[#131313]",
                )}
              >
                <span className="flex items-center gap-1">
                  {template.name}
                  {template.isDefault && (
                    <span className="text-muted-foreground text-[10px]">
                      (Default)
                    </span>
                  )}
                </span>
              </DropdownMenuCheckboxItem>
            ))}
            {(!templates || templates.length === 0) && (
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                No templates yet
              </div>
            )}
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => setDialogOpen(true)}
            className="text-xs cursor-pointer"
          >
            <Icons.Add className="mr-2 size-4" />
            Create new
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateTemplateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={handleTemplateCreated}
      />
    </>
  );
}
