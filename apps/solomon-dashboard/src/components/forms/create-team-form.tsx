"use client";

import { createTeamAction } from "@/actions/create-team-action";
import { Button } from "@midday/ui/button";
import { Input } from "@midday/ui/input";
import { Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";

export function CreateTeamForm() {
  const [name, setName] = useState("");
  const createTeam = useAction(createTeamAction);

  return (
    <>
      <Input
        autoFocus
        className="mt-3"
        placeholder="Ex: Acme Marketing or Acme Co"
        required
        autoComplete="off"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck="false"
        onChange={(evt) => setName(evt.target.value)}
        onKeyDown={(evt) => {
          if (evt.key === "Enter")
            createTeam.execute({ name, redirectTo: "/teams/invite" });
        }}
      />

      <Button
        className="mt-6"
        disabled={createTeam.status === "executing"}
        onClick={() =>
          createTeam.execute({ name, redirectTo: "/teams/invite" })
        }
      >
        {createTeam.status === "executing" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          "Next"
        )}
      </Button>
    </>
  );
}
