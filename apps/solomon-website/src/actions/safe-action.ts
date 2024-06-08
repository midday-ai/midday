import { createSafeActionClient } from "next-safe-action";

export const action = createSafeActionClient({
  handleReturnedServerError: (e) => {
    if (e instanceof Error) {
      return {
        serverError: e.message,
      };
    }

    return {
      serverError: "Oh no, something went wrong!",
    };
  },
});
