export function cn(
  ...args: (string | false | null | undefined | Record<string, boolean>)[]
): string {
  const classes: string[] = [];

  for (const arg of args) {
    if (!arg) continue;
    if (typeof arg === "string") {
      classes.push(arg);
    } else {
      for (const [key, val] of Object.entries(arg)) {
        if (val) classes.push(key);
      }
    }
  }

  return classes.join(" ");
}
