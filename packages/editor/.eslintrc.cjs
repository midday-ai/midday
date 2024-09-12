/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ["@tooling/eslint-config/react.js"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "./tsconfig.lint.json",
    tsconfigRootDir: __dirname,
  },
};
