"use client";

import { createTeamAction } from "@/actions/create-team-action";
import { Button } from "@midday/ui/button";
import { Input } from "@midday/ui/input";
import { Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hook";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function CreateTeamForm() {
  const [name, setName] = useState("");
  const router = useRouter();
  const createTeam = useAction(createTeamAction);

  return (
    <>
      <Input
        autoFocus
        className="mt-3"
        placeholder="Ex: Acme Marketing or Acme Co"
        required
        autoComplete="off"
        onChange={(evt) => setName(evt.target.value)}
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
