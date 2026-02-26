"use client";

import { useTRPC } from "@/trpc/client";
import { Button } from "@midday/ui/button";
import { Calendar } from "@midday/ui/calendar";
import { Input } from "@midday/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@midday/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { Textarea } from "@midday/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useCallback, useState } from "react";

type Props = {
  caseId: string;
};

export function AddNoteForm({ caseId }: Props) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [contactName, setContactName] = useState("");
  const [contactMethod, setContactMethod] = useState<string>("");
  const [followUpDate, setFollowUpDate] = useState<Date | undefined>();
  const [summary, setSummary] = useState("");

  const addNoteMutation = useMutation(
    trpc.collections.addNote.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.collections.getNotes.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.collections.getById.queryKey(),
        });
        // Reset form
        setContactName("");
        setContactMethod("");
        setFollowUpDate(undefined);
        setSummary("");
      },
    }),
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!summary.trim()) return;

      addNoteMutation.mutate({
        caseId,
        contactName: contactName || undefined,
        contactMethod: (contactMethod || undefined) as "phone" | "email" | "text" | "in_person" | "other" | undefined,
        followUpDate: followUpDate?.toISOString(),
        summary: summary.trim(),
      });
    },
    [caseId, contactName, contactMethod, followUpDate, summary, addNoteMutation],
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Input
          placeholder="Contact name (optional)"
          value={contactName}
          onChange={(e) => setContactName(e.target.value)}
          className="h-9 text-sm"
        />

        <Select value={contactMethod} onValueChange={setContactMethod}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Contact method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="phone">Phone</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="text">Text</SelectItem>
            <SelectItem value="in_person">In Person</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="h-9 text-sm justify-start font-normal"
            >
              <CalendarIcon className="mr-2 h-3.5 w-3.5" />
              {followUpDate
                ? format(followUpDate, "MMM d, yyyy")
                : "Follow-up date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={followUpDate}
              onSelect={setFollowUpDate}
              disabled={(date) => date < new Date()}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <Textarea
        placeholder="Summary of interaction... (required)"
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        rows={3}
        className="text-sm resize-none"
      />

      <div className="flex justify-end">
        <Button
          type="submit"
          size="sm"
          disabled={!summary.trim() || addNoteMutation.isPending}
        >
          {addNoteMutation.isPending ? "Saving..." : "Add Note"}
        </Button>
      </div>
    </form>
  );
}
