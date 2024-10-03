import type { PlopTypes } from "@turbo/gen";

// Learn more about Turborepo Generators at https://turbo.build/repo/docs/core-concepts/monorepos/code-generation

export default function generator(plop: PlopTypes.NodePlopAPI): void {
  // A simple generator to add a new React component to the internal UI library
  plop.setGenerator("react-component", {
    description: "Adds a new react component",
    prompts: [
      {
        type: "input",
        name: "name",
        message: "What is the name of the component?",
      },
    ],
    actions: [
      {
        type: "add",
        path: "src/{{kebabCase name}}.tsx",
        templateFile: "templates/component.hbs",
      },
      {
        type: "add",
        path: "src/components/{{pascalCase name}}/{{pascalCase name}}.test.tsx",
        templateFile: "templates/componentTest.hbs",
      },
      {
        type: "add",
        path: "src/components/{{pascalCase name}}/{{pascalCase name}}.stories.tsx",
        templateFile: "templates/componentStories.hbs",
      },
      {
        type: "append",
        path: "src/index.ts", // Assuming you have an index file for barrel exports
        template:
          "export * from './components/{{pascalCase name}}/{{pascalCase name}}';\n",
      },
      {
        type: "append",
        path: "package.json",
        pattern: /"exports": {(?<insertion>)/g,
        template:
          '"./src/components/{{kebabCase name}}/{{kebabCase name}}.tsx": "./src/components/{{kebabCase name}}/{{kebabCase name}}.tsx",\n',
      },
    ],
  });

  // Add more generators as needed

  plop.setGenerator("react-hook", {
    description: "Adds a new react hook",
    prompts: [
      {
        type: "input",
        name: "name",
        message: "What is the name of the hook?",
      },
    ],
    actions: [
      // Add component API hook
      {
        type: "add",
        path: "src/hooks/use{{pascalCase name}}Api.ts",
        templateFile: "hook-templates/useApiHook.tsx.hbs",
      },
      // Add hook test file
      {
        type: "add",
        path: "src/hooks/tests/use{{pascalCase name}}Api.test.tsx",
        templateFile: "hook-templates/useApiHook.test.tsx.hbs",
      },
      // Add API response mocks
      {
        type: "add",
        path: "src/mocks/{{camelCase name}}ApiMocks.ts",
        templateFile: "hook-templates/apiMocks.ts.hbs",
      },
      // Add TypeScript type definitions for the hook
      {
        type: "add",
        path: "src/hooks/types/{{camelCase name}}Types.ts",
        templateFile: "hook-templates/hookTypes.ts.hbs",
      },
      // Add documentation
      {
        type: "add",
        path: "src/hooks/docs/{{camelCase name}}ApiHook.md",
        templateFile: "hook-templates/hookDocumentation.md.hbs",
      },
      {
        type: "append",
        path: "src/index.ts", // Assuming you have an index file for barrel exports
        template:
          "export * from './hooks/{{kebabCase name}}/{{kebabCase name}}';\n",
      },
    ],
  });
}
