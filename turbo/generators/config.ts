import { PlopTypes } from "@turbo/gen";

export default function generator(plop: PlopTypes.NodePlopAPI): void {
  // Package generator
  plop.setGenerator("package", {
    description: "Create a new package",
    prompts: [
      {
        type: "input",
        name: "name",
        message: "What is the name of the package?",
      },
      {
        type: "input",
        name: "description",
        message: "What is the description of the package?",
      },
    ],
    actions: [
      {
        type: "add",
        path: "packages/{{kebabCase name}}/package.json",
        templateFile: "templates/package/package.json.hbs",
      },
      {
        type: "add",
        path: "packages/{{kebabCase name}}/tsconfig.json",
        templateFile: "templates/package/tsconfig.json.hbs",
      },
      {
        type: "add",
        path: "packages/{{kebabCase name}}/src/index.ts",
        templateFile: "templates/package/src/index.ts.hbs",
        templateFile: "templates/package/index.ts.hbs",
      },
      {
        type: "add",
        path: "packages/{{kebabCase name}}/README.md",
        templateFile: "templates/package/README.md.hbs",
      },
      {
        type: "add",
        path: "packages/{{kebabCase name}}/.eslintrc.js",
        templateFile: "templates/package/.eslintrc.js.hbs",
      },
      {
        type: "add",
        path: "packages/{{kebabCase name}}/.gitignore",
        templateFile: "templates/package/.gitignore.hbs",
      },
      {
        type: "add",
        path: "packages/{{kebabCase name}}/src/types.ts",
        templateFile: "templates/package/types.ts.hbs",
      },
      {
        type: "add",
        path: "packages/{{kebabCase name}}/src/constants.ts",
        templateFile: "templates/package/constants.ts.hbs",
      },
      {
        type: "add",
        path: "packages/{{kebabCase name}}/src/utils.ts",
        templateFile: "templates/package/utils.ts.hbs",
      },
      {
        type: "add",
        path: "packages/{{kebabCase name}}/tests/index.test.ts",
        templateFile: "templates/package/index.test.ts.hbs",
      },
      {
        type: "add",
        path: "packages/{{kebabCase name}}/CHANGELOG.md",
        templateFile: "templates/package/CHANGELOG.md.hbs",
      },
    ],
  });

  // Next.js App generator
  plop.setGenerator("app", {
    description: "Create a new Next.js app",
    prompts: [
      {
        type: "input",
        name: "name",
        message: "What is the name of the app?",
      },
      {
        type: "input",
        name: "description",
        message: "What is the description of the app?",
      },
    ],
    actions: [
      {
        type: "add",
        path: "apps/{{kebabCase name}}/package.json",
        templateFile: "templates/app/package.json.hbs",
      },
      {
        type: "add",
        path: "apps/{{kebabCase name}}/tsconfig.json",
        templateFile: "templates/app/tsconfig.json.hbs",
      },
      {
        type: "add",
        path: "apps/{{kebabCase name}}/next.config.js",
        templateFile: "templates/app/next.config.js.hbs",
      },
      {
        type: "add",
        path: "apps/{{kebabCase name}}/app/layout.tsx",
        templateFile: "templates/app/app/layout.tsx.hbs",
      },
      {
        type: "add",
        path: "apps/{{kebabCase name}}/app/page.tsx",
        templateFile: "templates/app/app/page.tsx.hbs",
      },
      {
        type: "add",
        path: "apps/{{kebabCase name}}/app/globals.css",
        templateFile: "templates/app/app/globals.css.hbs",
      },
      {
        type: "add",
        path: "apps/{{kebabCase name}}/README.md",
        templateFile: "templates/app/README.md.hbs",
      },
      {
        type: "add",
        path: "apps/{{kebabCase name}}/.eslintrc.js",
        templateFile: "templates/app/.eslintrc.js.hbs",
      },
      {
        type: "add",
        path: "apps/{{kebabCase name}}/.gitignore",
        templateFile: "templates/app/.gitignore.hbs",
      },
      {
        type: "add",
        path: "apps/{{kebabCase name}}/app/types.ts",
        templateFile: "templates/app/app/types.ts.hbs",
      },
      {
        type: "add",
        path: "apps/{{kebabCase name}}/__tests__/index.test.tsx",
        templateFile: "templates/app/__tests__/index.test.tsx.hbs",
      },
      {
        type: "add",
        path: "apps/{{kebabCase name}}/app/api/hello/route.ts",
        templateFile: "templates/app/app/api/hello/route.ts.hbs",
      },
      {
        type: "add",
        path: "apps/{{kebabCase name}}/components/Header.tsx",
        templateFile: "templates/app/components/Header.tsx.hbs",
      },
      {
        type: "add",
        path: "apps/{{kebabCase name}}/lib/utils.ts",
        templateFile: "templates/app/lib/utils.ts.hbs",
      },
      {
        type: "add",
        path: "apps/{{kebabCase name}}/middleware.ts",
        templateFile: "templates/app/middleware.ts.hbs",
      },
      {
        type: "add",
        path: "apps/{{kebabCase name}}/public/favicon.ico",
        templateFile: "templates/app/public/favicon.ico",
      },
      {
        type: "add",
        path: "apps/{{kebabCase name}}/styles/Home.module.css",
        templateFile: "templates/app/styles/Home.module.css.hbs",
      },
      {
        type: "add",
        path: "apps/{{kebabCase name}}/app/error.tsx",
        templateFile: "templates/app/app/error.tsx.hbs",
      },
      {
        type: "add",
        path: "apps/{{kebabCase name}}/app/loading.tsx",
        templateFile: "templates/app/app/loading.tsx.hbs",
      },
    ],
  });
}
