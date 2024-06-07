import { createTeamAction } from "@/actions/create-team-action";
import { Button } from "@midday/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@midday/ui/dialog";
import { Input } from "@midday/ui/input";
import { Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";

type Props = {
  onOpenChange: (isOpen: boolean) => void;
};

export function CreateTeamModal({ onOpenChange }: Props) {
  const [name, setName] = useState("");
  const createTeam = useAction(createTeamAction, {
    onSuccess: () => onOpenChange(false),
  });

  return (
    <DialogContent className="max-w-[455px]">
      <div className="p-4">
        <DialogHeader>
          <DialogTitle>Create team</DialogTitle>
          <DialogDescription>
            For example, you can use the name of your company or department.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 mb-6">
          <Input
            autoFocus
            placeholder="Team Name"
            onChange={(evt) => setName(evt.target.value)}
            onKeyDown={(evt) => {
              if (evt.key === "Enter") createTeam.execute({ name });
            }}
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck="false"
          />
        </div>

        <DialogFooter>
          <div className="space-x-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              disabled={createTeam.status === "executing"}
              onClick={() => createTeam.execute({ name })}
            >
              {createTeam.status === "executing" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Continue"
              )}
            </Button>
          </div>
        </DialogFooter>
      </div>
    </DialogContent>
  );
}
