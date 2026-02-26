"use client";

import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { useQueryState } from "nuqs";
import { SearchField } from "./search-field";

export function SyndicationsHeader() {
  const [, setCreateSyndicator] = useQueryState("createSyndicator");

  return (
    <div className="flex items-center justify-between pt-6">
      <SearchField placeholder="Search syndicators" />

      <div className="hidden sm:block">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setCreateSyndicator("true")}
        >
          <Icons.Add />
        </Button>
      </div>
    </div>
  );
}
