import { Command } from "commander";
import { get } from "../../client/api.js";
import { type GlobalFlags, resolveFormat } from "../../output/formatter.js";
import { printJson, printJsonList } from "../../output/json.js";
import { printDetail, printTable } from "../../output/table.js";
import { withSpinner } from "../../ui/spinner.js";
import { handleError } from "../../utils/errors.js";

interface Team {
  id: string;
  name: string;
  logoUrl?: string;
  createdAt?: string;
  plan?: string;
}

interface Member {
  id: string;
  email: string;
  fullName?: string;
  role?: string;
}

export function createTeamCommand(): Command {
  const cmd = new Command("team").description("Team info and members");

  cmd
    .command("info")
    .description("Show current team information")
    .addHelpText(
      "after",
      `
Examples:
  midday team info
  midday team info --json`,
    )
    .action(async () => {
      const globals = cmd.parent?.opts() as GlobalFlags;
      const format = resolveFormat(globals);

      try {
        const team = await withSpinner(
          "Fetching team info...",
          () =>
            get<Team>("/teams/current", undefined, {
              apiUrl: globals.apiUrl,
              debug: globals.debug,
            }),
          globals.quiet,
        );

        if (format === "json") {
          printJson(team);
        } else {
          printDetail(team.name, [
            ["ID", team.id],
            ["Plan", team.plan],
            ["Created", team.createdAt],
          ]);
        }
      } catch (error) {
        handleError(error, format);
      }
    });

  cmd
    .command("members")
    .description("List team members")
    .addHelpText(
      "after",
      `
Examples:
  midday team members
  midday team members --json`,
    )
    .action(async () => {
      const globals = cmd.parent?.opts() as GlobalFlags;
      const format = resolveFormat(globals);

      try {
        const data = await withSpinner(
          "Fetching members...",
          () =>
            get<{ data: Member[] }>("/teams/current/members", undefined, {
              apiUrl: globals.apiUrl,
              debug: globals.debug,
            }),
          globals.quiet,
        );

        const members = data.data || [];

        if (format === "json") {
          printJsonList(members);
        } else {
          const rows = members.map((m) => [
            m.fullName || null,
            m.email,
            m.role || null,
          ]);

          printTable({
            title: `Team Members (${members.length})`,
            head: ["Name", "Email", "Role"],
            rows,
          });
        }
      } catch (error) {
        handleError(error, format);
      }
    });

  return cmd;
}
