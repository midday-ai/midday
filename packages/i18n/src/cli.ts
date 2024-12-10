#!/usr/bin/env node

import { select } from "@clack/prompts";
import chalk from "chalk";
import dedent from "dedent";
import { retro } from "gradient-string";
import { init } from "./commands/init.js";
import { translate } from "./commands/translate.js";

console.log(
  retro(`
    ██╗      █████╗ ███╗   ██╗ ██████╗ ██╗   ██╗██╗███╗   ██╗███████╗
    ██║     ██╔══██╗████╗  ██║██╔════╝ ██║   ██║██║████╗  ██║██╔════╝
    ██║     ███████║██╔██╗ ██║██║  ███╗██║   ██║██║██║██╗ ██║█████╗  
    ██║     ██╔══██║██║╚██╗██║██║   ██║██║   ██║██║██║╚██╗██║██╔══╝  
    ███████╗██║  ██║██║ ╚████║╚██████╔╝╚██████╔╝██║██║ ╚████║███████╗
    ╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝  ╚═════╝ ╚═╝╚═╝  ╚═══╝╚══════╝
  `),
);

console.log(
  chalk.gray(dedent`
    Automated AI localization for your applications.
    
    Powered by: ${chalk.bold("Vercel AI SDK")}
  `),
);

console.log();

// Parse command line arguments
const command =
  process.argv[2] ||
  (await select({
    message: "What would you like to do?",
    options: [
      { value: "init", label: "Initialize a new Languine configuration" },
      { value: "translate", label: "Translate to target languages" },
    ],
  }));

const targetLocale = process.argv[3];

if (command === "init") {
  init();
} else if (command === "translate") {
  translate(targetLocale);
} else {
  console.log(chalk.bold("\nAvailable commands:"));
  console.log(dedent`
    ${chalk.cyan("init")}        Initialize a new Languine configuration
    ${chalk.cyan("translate")}   Translate to all target locales
    ${chalk.cyan("translate")} ${chalk.gray("<locale>")}  Translate to a specific locale
    
    Run ${chalk.cyan("languine <command>")} to execute a command
  `);
}
