"use client";

import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { useQueryState } from "nuqs";
import { SearchField } from "./search-field";

export function BrokersHeader() {
  const [, setCreateBroker] = useQueryState("createBroker");

  return (
    <div className="flex items-center justify-between pt-6">
      <SearchField placeholder="Search brokers" />

      <div className="hidden sm:block">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setCreateBroker("true")}
        >
          <Icons.Add />
        </Button>
      </div>
    </div>
  );
}
