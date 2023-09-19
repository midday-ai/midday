import { useEffect } from "react";

export const useEscapePress = (onEscapePress: () => void) => {
  useEffect(() => {
    const onKeyUp = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") onEscapePress();
    };

    window.addEventListener("keyup", onKeyUp);

    return () => {
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [onEscapePress]);
};
