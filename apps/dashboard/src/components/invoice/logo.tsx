"use client";

import { Icons } from "@midday/ui/icons";
import { Skeleton } from "@midday/ui/skeleton";
import { useToast } from "@midday/ui/use-toast";
import { useFormContext } from "react-hook-form";
import { useTemplateUpdate } from "@/hooks/use-template-update";
import { useUpload } from "@/hooks/use-upload";
import { useUserQuery } from "@/hooks/use-user";

export function Logo() {
  const { watch, setValue } = useFormContext();
  const logoUrl = watch("template.logoUrl");
  const { uploadFile, isLoading } = useUpload();
  const { toast } = useToast();

  const { data: user } = useUserQuery();
  const { updateTemplate } = useTemplateUpdate();

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const { url } = await uploadFile({
          file,
          path: [user?.teamId ?? "", "invoice", file.name],
          bucket: "avatars",
        });

        setValue("template.logoUrl", url, {
          shouldValidate: true,
          shouldDirty: true,
        });

        updateTemplate({ logoUrl: url });
      } catch (_error) {
        toast({
          title: "Something went wrong, please try again.",
          variant: "error",
        });
      }
    }
  };

  return (
    <div className="relative h-[80px] group">
      <label htmlFor="logo-upload" className="block h-full">
        {isLoading ? (
          <Skeleton className="w-full h-full" />
        ) : logoUrl ? (
          <div className="max-w-[300px] h-full">
            <img
              src={logoUrl}
              alt="Invoice logo"
              className="h-full w-auto object-contain"
            />
            <button
              type="button"
              className="absolute inset-0 bg-black bg-opacity-50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity flex-col gap-1"
              onClick={(e) => {
                e.preventDefault();
                setValue("template.logoUrl", undefined, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
                updateTemplate({ logoUrl: null });
              }}
            >
              <Icons.Clear className="size-4" />
              <span className="text-xs font-medium">Remove</span>
            </button>
          </div>
        ) : (
          <div className="h-[80px] w-[80px] bg-[repeating-linear-gradient(-60deg,#DBDBDB,#DBDBDB_1px,transparent_1px,transparent_5px)] dark:bg-[repeating-linear-gradient(-60deg,#2C2C2C,#2C2C2C_1px,transparent_1px,transparent_5px)]" />
        )}
      </label>

      <input
        id="logo-upload"
        type="file"
        accept="image/jpeg,image/jpg,image/png"
        className="hidden"
        onChange={handleUpload}
        disabled={isLoading}
      />
    </div>
  );
}
