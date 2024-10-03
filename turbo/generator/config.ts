import type { PlopTypes } from "@turbo/gen";
import fs from "fs";
import path from "path";

const rootPath = process.cwd();

interface PackageAnswers {
  name: string;
  type: "react-library" | "regular" | "app";
}

export default function generator(plop: PlopTypes.NodePlopAPI): void {
  plop.setGenerator("init", {
    description: "Generate a new package for the Monorepo",
    prompts: [
      {
        type: "input",
        name: "name",
        message: "What is the name of the package?",
        validate: (input: string, answers?: PackageAnswers) => {
          if (!input.trim()) {
            return "Package name cannot be empty";
          }
          const basePath = answers?.type === "app" ? "apps" : "packages";
          const packagePath = path.join(
            rootPath,
            basePath,
            input.replace(/^@react-package\//, ""),
          );
          if (fs.existsSync(packagePath)) {
            return "A package or app with this name already exists";
          }
          return true;
        },
      },
      {
        type: "list",
        name: "type",
        message: "What type of package do you want to create?",
        choices: [
          { name: "React Library", value: "react-library" },
          { name: "Regular Package", value: "regular" },
          { name: "App", value: "app" },
        ],
      },
    ],
    actions: (answers) => {
      const actions: PlopTypes.ActionType[] = [
        // Sanitize package name
        (answers) => {
          if (answers && typeof answers === "object" && "name" in answers) {
            answers.name = (answers.name as string)
              .replace(/^@react-package\//, "")
              .trim();
            answers.fullName =
              answers.type === "react-library"
                ? `@react-package/${answers.name}`
                : answers.name;
          }
          return "Config sanitized";
        },
        // Create package or app directory
        {
          type: "add",
          path: path.join(
            rootPath,
            answers.type === "app" ? "apps" : "packages",
            "{{name}}",
            ".gitkeep",
          ),
          template: "",
          force: true,
        },
        // Add root-level files
        {
          type: "addMany",
          destination: path.join(
            rootPath,
            answers.type === "app" ? "apps" : "packages",
            "{{name}}"
          ),
          base: `templates/${answers.type === "react-library" ? "react-package" : answers.type === "app" ? "app" : "package"}`,
          templateFiles: `templates/${answers.type === "react-library" ? "react-package" : answers.type === "app" ? "app" : "package"}/*`,
          globOptions: {
            dot: true,
            nodir: true,
          },
          force: true,
        },

        // Add files in the 'src' directory
        {
          type: "addMany",
          destination: path.join(
            rootPath,
            answers.type === "app" ? "apps" : "packages",
            "{{name}}",
            "src"
          ),
          base: `templates/${answers.type === "react-library" ? "react-package" : answers.type === "app" ? "app" : "package"}/src`,
          templateFiles: `templates/${answers.type === "react-library" ? "react-package" : answers.type === "app" ? "app" : "package"}/src/**/*`,
          globOptions: {
            dot: true,
            nodir: false,
          },
          force: true,
        },

        // Add files in the 'public' directory (for app type)
        ...(answers.type === "app" ? [{
          type: "addMany",
          destination: path.join(
            rootPath,
            "apps",
            "{{name}}",
            "public"
          ),
          base: `templates/app/public`,
          templateFiles: `templates/app/public/**/*`,
          globOptions: {
            dot: true,
            nodir: false,
          },
          force: true,
        }] : []),

        // Add files in the 'styles' directory (for app type)
        ...(answers.type === "app" ? [{
          type: "addMany",
          destination: path.join(
            rootPath,
            "apps",
            "{{name}}",
            "styles"
          ),
          base: `templates/app/styles`,
          templateFiles: `templates/app/styles/**/*`,
          globOptions: {
            dot: true,
            nodir: false,
          },
          force: true,
        }] : []),

        // Update root package.json to include new package or app
        {
          type: "modify",
          path: path.join(rootPath, "package.json"),
          transform: (content: string, answers: PackageAnswers) => {
            try {
              const packageJson = JSON.parse(content);
              if (!packageJson.workspaces) {
                packageJson.workspaces = [];
              }
              packageJson.workspaces.push(
                `${answers.type === "app" ? "apps" : "packages"}/${answers.name}`,
              );
              return JSON.stringify(packageJson, null, 2);
            } catch (error) {
              console.error("Error updating package.json:", error);
              return content;
            }
          },
        },
        // Update package.json in the new package or app to use the correct name
        {
          type: "modify",
          path: path.join(
            rootPath,
            answers.type === "app" ? "apps" : "packages",
            "{{name}}",
            "package.json",
          ),
          transform: (
            content: string,
            answers: PackageAnswers & { fullName: string },
          ) => {
            try {
              const packageJson = JSON.parse(content);
              packageJson.name = answers.fullName;
              return JSON.stringify(packageJson, null, 2);
            } catch (error) {
              console.error("Error updating package.json:", error);
              return content;
            }
          },
        },
      ];

      // Add React-specific files for react-library type
      if (answers.type === "react-library") {
        actions.push(
          // Add turbo/generators/hook-templates files
          {
            type: "addMany",
            destination: path.join(
              rootPath,
              "packages",
              "{{name}}",
              "turbo",
              "generators",
              "hook-templates",
            ),
            base: "templates/react-package/turbo/generators/hook-templates",
            templateFiles:
              "templates/react-package/turbo/generators/hooktemplates/*.hbs",
            globOptions: {
              dot: true,
            },
            force: true,
          },
          // Add turbo/generators/templates files
          {
            type: "addMany",
            destination: path.join(
              rootPath,
              "packages",
              "{{name}}",
              "turbo",
              "generators",
              "templates",
            ),
            base: "templates/react-package/turbo/generators/templates",
            templateFiles:
              "templates/react-package/turbo/generators/templates/*.hbs",
            globOptions: {
              dot: true,
            },
            force: true,
          },
        );
      }

      // Log the actions for debugging
      console.log("Actions to be performed:", JSON.stringify(actions, null, 2));

      return actions;
    },
  });

  plop.setActionType("postRun", (answers: unknown) => {
    const typedAnswers = answers as PackageAnswers;
    const basePath = typedAnswers.type === "app" ? "apps" : "packages";
    const packagePath = path.join(rootPath, basePath, typedAnswers.name);
    if (fs.existsSync(packagePath)) {
      console.log(
        `${typedAnswers.type === "app" ? "App" : "Package"} directory created: ${packagePath}`,
      );
      const files = fs.readdirSync(packagePath);
      console.log(
        `Files in the ${typedAnswers.type === "app" ? "app" : "package"} directory: ${files.join(", ")}`,
      );
    } else {
      console.error(
        `Failed to create ${typedAnswers.type === "app" ? "app" : "package"} directory: ${packagePath}`,
      );
    }
    return "Post-run checks completed";
  });
}
