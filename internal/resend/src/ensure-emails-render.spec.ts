import { readdir } from "node:fs/promises";
import path from "node:path";
import React from "react";
import { renderAsync } from "@react-email/render";
import { test } from "vitest";

const pathToDirectoryWithEmails = path.resolve(__dirname, "../emails");

test("That all the emails render without errors", async () => {
  // Maybe later down the line this will need to have some filtering as well
  // to avoid files that are not email templates
  const emailFilenames = await readdir(pathToDirectoryWithEmails, {
    recursive: true,
  });

  for await (const emailFilename of emailFilenames) {
    const pathToEmail = path.join(pathToDirectoryWithEmails, emailFilename);
    const emailModule = (await import(pathToEmail)) as unknown;

    if (
      typeof emailModule === "object" &&
      emailModule !== null &&
      "default" in emailModule &&
      typeof emailModule.default === "function"
    ) {
      await renderAsync(
        React.createElement<Record<string, unknown>>(
          emailModule.default as React.FC,
          "PreviewProps" in emailModule
            ? (emailModule.PreviewProps as Record<string, unknown>)
            : {},
        ),
      );
    }
  }
});
