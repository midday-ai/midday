"use client";

import { useQueryState } from "nuqs";

export function useDisclosureParams() {
  const [disclosureId, setDisclosureId] = useQueryState("disclosureId");

  return {
    disclosureId,
    setDisclosureId,
    isOpen: !!disclosureId,
    open: (id: string) => setDisclosureId(id),
    close: () => setDisclosureId(null),
  };
}
