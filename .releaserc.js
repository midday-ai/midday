module.exports = {
  branches: ["main"],
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    "@semantic-release/npm",
    "@semantic-release/github",
    [
      "@semantic-release/git",
      {
        message: "chore(release): ${nextRelease.version}",
      },
    ],
  ],
  preset: "angular",
  releaseRules: [
    { type: "docs", scope: "README", release: "patch" },
    { type: "refactor", release: "patch" },
    { type: "style", release: "patch" },
  ],
  parserOpts: {
    noteKeywords: ["BREAKING CHANGE", "BREAKING CHANGES", "BREAKING"],
  },
  // Add this configuration to increase the allowed line length
  rules: {
    "body-max-line-length": [2, "always", 200],
  },
};
