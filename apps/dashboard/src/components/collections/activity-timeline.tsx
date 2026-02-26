"use client";

import { useTRPC } from "@/trpc/client";
import { Avatar, AvatarFallback, AvatarImageNext } from "@midday/ui/avatar";
import { cn } from "@midday/ui/cn";
import { useSuspenseQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

const contactMethodLabels: Record<string, string> = {
  phone: "Phone",
  email: "Email",
  text: "Text",
  in_person: "In Person",
  other: "Other",
};

type Props = {
  caseId: string;
};

export function ActivityTimeline({ caseId }: Props) {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.collections.getNotes.queryOptions({ caseId }),
  );

  const notes = data?.data ?? [];

  if (!notes.length) {
    return (
      <div className="text-center py-8 text-sm text-[#606060]">
        No activity yet. Add a note to get started.
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical timeline line */}
      <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />

      <div className="space-y-4">
        {notes.map((note) => {
          const isSystem = !note.authorId;

          return (
            <div key={note.id} className="relative flex gap-3 pl-0">
              {/* Avatar / dot */}
              <div className="relative z-10 flex-shrink-0">
                {isSystem ? (
                  <div className="size-[30px] flex items-center justify-center">
                    <div className="size-2 rounded-full bg-[#606060]" />
                  </div>
                ) : (
                  <Avatar className="size-[30px]">
                    {note.authorAvatar && (
                      <AvatarImageNext
                        src={note.authorAvatar}
                        alt={note.authorName || ""}
                        width={30}
                        height={30}
                        quality={100}
                      />
                    )}
                    <AvatarFallback className="text-[10px] font-medium">
                      {note.authorName?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>

              {/* Content */}
              <div
                className={cn(
                  "flex-1 min-w-0",
                  isSystem && "opacity-70",
                )}
              >
                {/* Header row */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium truncate">
                    {note.authorName || "System"}
                  </span>
                  <span className="text-[11px] text-[#878787] flex-shrink-0">
                    {formatDistanceToNow(new Date(note.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>

                {/* Tags row */}
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {note.contactName && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#f7f7f7] dark:bg-[#1d1d1d] text-[#606060]">
                      {note.contactName}
                    </span>
                  )}
                  {note.contactMethod && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#DDEBFF] dark:bg-[#1F6FEB]/10 text-[#1F6FEB]">
                      {contactMethodLabels[note.contactMethod] ||
                        note.contactMethod}
                    </span>
                  )}
                  {note.followUpDate && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#DDF1E4] dark:bg-[#00C969]/10 text-[#00C969]">
                      Follow-up:{" "}
                      {new Date(note.followUpDate).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {/* Summary */}
                <p className="text-sm text-[#606060] whitespace-pre-wrap">
                  {note.summary}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
