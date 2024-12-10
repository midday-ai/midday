import { execSync } from "node:child_process";
import { confirm, outro, text } from "@clack/prompts";
import chalk from "chalk";
import dedent from "dedent";

export async function getApiKey(name: string, key: string) {
  if (key in process.env) {
    return process.env[key];
  }
  return (async () => {
    let apiKey: string | symbol;
    do {
      apiKey = await text({
        message: dedent`
          ${chalk.bold(`Please provide your ${name} API key.`)}

          To skip this message, set ${chalk.bold(key)} env variable, and run again. 
          
          You can do it in three ways:
          - by creating an ${chalk.bold(".env.local")} file (make sure to ${chalk.bold(".gitignore")} it)
            ${chalk.gray(`\`\`\`
              ${key}=<your-key>
              \`\`\`
            `)}
          - by passing it inline:
            ${chalk.gray(`\`\`\`
              ${key}=<your-key> npx cali
              \`\`\`
            `)}
          - by setting it as an env variable in your shell (e.g. in ~/.zshrc or ~/.bashrc):
            ${chalk.gray(`\`\`\`
              export ${key}=<your-key>
              \`\`\`
            `)},
          `,
        validate: (value) =>
          value.length > 0 ? undefined : `Please provide a valid ${key}.`,
      });
    } while (typeof apiKey === "undefined");

    if (typeof apiKey === "symbol") {
      outro(chalk.gray("Bye!"));
      process.exit(0);
    }

    const save = await confirm({
      message: `Do you want to save it for future runs in .env.local?`,
    });

    if (save) {
      execSync(`echo "${key}=${apiKey}" >> .env.local`);
      execSync(`echo ".env.local" >> .gitignore`);
    }

    return apiKey;
  })();
}
