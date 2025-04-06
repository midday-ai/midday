"use client";

import { useCarousel } from "@midday/ui/carousel";
import { parseAsString, useQueryStates } from "nuqs";
import { useHotkeys } from "react-hotkeys-hook";

export function WidgetsNavigation() {
  const { scrollPrev, scrollNext } = useCarousel();
  const [params] = useQueryStates({
    selectedDate: parseAsString,
  });

  const disabled = params.selectedDate;

  useHotkeys("left", scrollPrev, {
    enabled: !disabled,
  });

  useHotkeys("right", scrollNext, {
    enabled: !disabled,
  });

  return null;
}
