# Contributing to Solomon AI

Thank you for your interest in contributing to Solomon AI! We're excited to have you join our open-source community. Your contributions help make Solomon AI a powerful financial workspace for small businesses.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [How to Contribute](#how-to-contribute)
4. [Development Workflow](#development-workflow)
5. [Submitting a Pull Request](#submitting-a-pull-request)
6. [Coding Guidelines](#coding-guidelines)
7. [Community](#community)

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before contributing.

## Getting Started

1. Fork the repository to your GitHub account.
2. Clone your fork to your local machine:
   ```sh
   git clone https://github.com/YOUR_USERNAME/financial-platform-as-a-service.git
   cd financial-platform-as-a-service
   ```
3. Set up the development environment by following our [Getting Started Guide](https://github.com/SolomonAIEngineering/financial-platform-as-a-service/docs/contributing/getting-started).

## How to Contribute

1. Check existing [issues](https://github.com/SolomonAIEngineering/financial-platform-as-a-service/issues) and [pull requests](https://github.com/SolomonAIEngineering/financial-platform-as-a-service/pulls) to avoid duplication.
2. If you're addressing a new issue, create one before starting development.
3. For feature requests or large-scale refactoring, wait for approval (removal of `needs-approval` label) before coding.
4. For bugs, security issues, or documentation improvements, you can start coding immediately.

## Development Workflow

1. Create a new branch for your work:
   ```sh
   git switch -c feature/your-feature-name
   ```
2. Make your changes, following our [Coding Guidelines](#coding-guidelines).
3. Commit your changes with clear, descriptive messages.
4. Push your branch to your fork:
   ```sh
   git push origin feature/your-feature-name
   ```

### Installing Dependencies

We use [Corepack](https://nodejs.org/api/corepack.html) and [BUN](https://bun.io/) for package management.

1. Enable Corepack:
   ```sh
   corepack enable
   ```
2. Install dependencies:
   ```sh
   bun install
   ```

### Building the Project

Build the project using:
```bash
bun build
```

### Linting and Formatting

Check and fix code formatting:
```bash
bun fmt
```
## Project Structure

Our project follows a monorepo structure to maintain organization and clarity:

```bash
.
├── CHANGELOG.md
├── LICENSE
├── README.md
├── apps
│   ├── api
│   ├── dashboard
│   ├── docs
│   ├── engine
│   ├── lead
│   ├── mobile
│   ├── website
│   └── www
├── biome.json
├── bun.lockb
├── bunfig.toml
├── commitlint.config.ts
├── docs
│   ├── developer
│   └── platform
├── github.png
├── internal
│   ├── app-config
│   ├── backend-client
│   ├── billing
│   ├── cache
│   ├── db
│   ├── email
│   ├── encoding
│   ├── encryption
│   ├── error
│   ├── events
│   ├── hash
│   ├── id
│   ├── keys
│   ├── logs
│   ├── metrics
│   ├── providers
│   ├── resend
│   ├── schema
│   ├── store
│   ├── tinybird
│   ├── vercel
│   ├── worker-logging
│   └── zod
├── midday.code-workspace
├── package.json
├── packages
│   ├── analytics
│   ├── app-store
│   ├── assets
│   ├── documents
│   ├── editor
│   ├── email
│   ├── env
│   ├── events
│   ├── import
│   ├── inbox
│   ├── jobs
│   ├── kv
│   ├── location
│   ├── notification
│   ├── stripe
│   ├── supabase
│   ├── tsconfig
│   ├── ui
│   └── utils
├── saasfly-logo.svg
├── services
│   ├── gateway
│   ├── latency-benchmarks
│   ├── logdrain
│   └── semantic-cache
├── tooling
│   ├── eslint-config
│   ├── prettier-config
│   ├── tailwind-config
│   └── typescript-config
├── tsconfig.json
├── turbo
│   └── generators
├── turbo.json
├── types
│   └── index.ts
└── vercel.json
```

Key directories and their purposes:

- `apps/`: Contains individual applications (e.g., api, dashboard, docs, engine, lead, mobile, website, www)
- `docs/`: Documentation for developers and platform
- `internal/`: Internal modules and utilities (e.g., app-config, backend-client, billing, cache, db)
- `packages/`: Shared packages and modules (e.g., analytics, app-store, assets, documents, editor)
- `services/`: Microservices and specialized services (e.g., gateway, latency-benchmarks, logdrain)
- `tooling/`: Development and build tools (e.g., eslint-config, prettier-config, tailwind-config)
- `types/`: Global TypeScript type definitions

Other important files:

- `biome.json`: Configuration for Biome (linter/formatter)
- `bun.lockb`: Bun package manager lock file
- `bunfig.toml`: Bun configuration file
- `commitlint.config.ts`: Commit message linting configuration
- `turbo.json`: Turborepo configuration for monorepo management
- `vercel.json`: Vercel deployment configuration

This structure allows for better code organization, shared resources, and easier management of multiple applications and services within the Solomon AI ecosystem.

## Coding Guidelines

- Write concise, well-documented TypeScript code.
- Use functional components with TypeScript interfaces.
- Follow functional and declarative programming patterns; avoid classes.
- Use descriptive variable names with auxiliary verbs (e.g., `isLoading`, `hasError`).
- Prefer iteration and modularization over code duplication.
- Use Shadcn UI, Radix UI, and Tailwind CSS for components and styling.
- Implement responsive design with a mobile-first approach.
- Optimize for performance, especially in React and Next.js components:
  - Minimize use of `use client`, `useEffect`, and `useState`.
  - Favor React Server Components (RSC) where possible.
  - Use dynamic loading for non-critical components.
- Use `next-safe-action` for all server actions with proper validation and error handling.
- Utilize `useQueryState` for query state management.

## Testing

- Write unit tests for new features or bug fixes using Jest and React Testing Library.
- Aim for high test coverage, especially for critical functionality.
- Run tests before submitting a pull request:
  ```bash
  bun test
  ```

## Documentation

- Update relevant documentation when adding or modifying features.
- Use clear, concise language in comments and documentation.
- For significant changes, update the README.md file if necessary.

### :beetle: Bug Reports and Other Issues

A great way to contribute to the project is to send a detailed issue when you encounter a problem. We always appreciate a well-written, thorough bug report. :v:

In short, since you are most likely a developer, **provide a ticket that you would like to receive**.

- **Review the documentation and [Support Guide](https://github.com/jessesquires/.github/blob/main/SUPPORT.md)** before opening a new issue.

- **Do not open a duplicate issue!** Search through existing issues to see if your issue has previously been reported. If your issue exists, comment with any additional information you have. You may simply note "I have this problem too", which helps prioritize the most common problems and requests. 

- **Prefer using [reactions](https://github.blog/2016-03-10-add-reactions-to-pull-requests-issues-and-comments/)**, not comments, if you simply want to "+1" an existing issue.

- **Fully complete the provided issue template.** The bug report template requests all the information we need to quickly and efficiently address your issue. Be clear, concise, and descriptive. Provide as much information as you can, including steps to reproduce, stack traces, compiler errors, library versions, OS versions, and screenshots (if applicable).

- **Use [GitHub-flavored Markdown](https://help.github.com/en/github/writing-on-github/basic-writing-and-formatting-syntax).** Especially put code blocks and console outputs in backticks (```). This improves readability.

## :love_letter: Feature Requests

Feature requests are welcome! While we will consider all requests, we cannot guarantee your request will be accepted. We want to avoid [feature creep](https://en.wikipedia.org/wiki/Feature_creep). Your idea may be great, but also out-of-scope for the project. If accepted, we cannot make any commitments regarding the timeline for implementation and release. However, you are welcome to submit a pull request to help!

- **Do not open a duplicate feature request.** Search for existing feature requests first. If you find your feature (or one very similar) previously requested, comment on that issue.

- **Fully complete the provided issue template.** The feature request template asks for all necessary information for us to begin a productive conversation. 

- Be precise about the proposed outcome of the feature and how it relates to existing features. Include implementation details if possible.

## :mag: Triaging Issues

You can triage issues which may include reproducing bug reports or asking for additional information, such as version numbers or reproduction instructions. Any help you can provide to quickly resolve an issue is very much appreciated!

## :repeat: Submitting Pull Requests

We **love** pull requests! Before [forking the repo](https://help.github.com/en/github/getting-started-with-github/fork-a-repo) and [creating a pull request](https://help.github.com/en/github/collaborating-with-issues-and-pull-requests/proposing-changes-to-your-work-with-pull-requests) for non-trivial changes, it is usually best to first open an issue to discuss the changes, or discuss your intended approach for solving the problem in the comments for an existing issue.

For most contributions, after your first pull request is accepted and merged, you will be [invited to the project](https://help.github.com/en/github/setting-up-and-managing-your-github-user-account/inviting-collaborators-to-a-personal-repository) and given **push access**. :tada:

*Note: All contributions will be licensed under the project's license.*

- **Smaller is better.** Submit **one** pull request per bug fix or feature. A pull request should contain isolated changes pertaining to a single bug fix or feature implementation. **Do not** refactor or reformat code that is unrelated to your change. It is better to **submit many small pull requests** rather than a single large one. Enormous pull requests will take enormous amounts of time to review, or may be rejected altogether. 

- **Coordinate bigger changes.** For large and non-trivial changes, open an issue to discuss a strategy with the maintainers. Otherwise, you risk doing a lot of work for nothing!

- **Prioritize understanding over cleverness.** Write code clearly and concisely. Remember that source code usually gets written once and read often. Ensure the code is clear to the reader. The purpose and logic should be obvious to a reasonably skilled developer, otherwise you should add a comment that explains it.

- **Follow existing coding style and conventions.** Keep your code consistent with the style, formatting, and conventions in the rest of the code base. When possible, these will be enforced with a linter. Consistency makes it easier to review and modify in the future.

- **Include test coverage.** Add unit tests or UI tests when possible. Follow existing patterns for implementing tests.

- **Update the example project** if one exists to exercise any new functionality you have added.

- **Add documentation.** Document your changes with code doc comments or in existing guides.

- **Update the CHANGELOG** for all enhancements and bug fixes. Include the corresponding issue number if one exists, and your GitHub username. (example: "- Fixed crash in profile view. #123 @jessesquires")

- **Use the repo's default branch.** Branch from and [submit your pull request](https://help.github.com/en/github/collaborating-with-issues-and-pull-requests/creating-a-pull-request-from-a-fork) to the repo's default branch. Usually this is `main`, but it could be `dev`, `develop`, or `master`.

- **[Resolve any merge conflicts](https://help.github.com/en/github/collaborating-with-issues-and-pull-requests/resolving-a-merge-conflict-on-github)** that occur.

- **Promptly address any CI failures**. If your pull request fails to build or pass tests, please push another commit to fix it. 

- When writing comments, use properly constructed sentences, including punctuation.

- Use spaces, not tabs.

## :memo: Writing Commit Messages

Please [write a great commit message](https://chris.beams.io/posts/git-commit/).

1. Separate subject from body with a blank line
1. Limit the subject line to 50 characters
1. Capitalize the subject line
1. Do not end the subject line with a period
1. Use the imperative mood in the subject line (example: "Fix networking issue")
1. Wrap the body at about 72 characters
1. Use the body to explain **why**, *not what and how* (the code shows that!)
1. If applicable, prefix the title with the relevant component name. (examples: "[Docs] Fix typo", "[Profile] Fix missing avatar")

```
[TAG] Short summary of changes in 50 chars or less

Add a more detailed explanation here, if necessary. Possibly give 
some background about the issue being fixed, etc. The body of the 
commit message can be several paragraphs. Further paragraphs come 
after blank lines and please do proper word-wrap.

Wrap it to about 72 characters or so. In some contexts, 
the first line is treated as the subject of the commit and the 
rest of the text as the body. The blank line separating the summary 
from the body is critical (unless you omit the body entirely); 
various tools like `log`, `shortlog` and `rebase` can get confused 
if you run the two together.

Explain the problem that this commit is solving. Focus on why you
are making this change as opposed to how or what. The code explains 
how or what. Reviewers and your future self can read the patch, 
but might not understand why a particular solution was implemented.
Are there side effects or other unintuitive consequences of this
change? Here's the place to explain them.

 - Bullet points are okay, too

 - A hyphen or asterisk should be used for the bullet, preceded
   by a single space, with blank lines in between

Note the fixed or relevant GitHub issues at the end:

Resolves: #123
See also: #456, #789
```

## :white_check_mark: Code Review

- **Review the code, not the author.** Look for and suggest improvements without disparaging or insulting the author. Provide actionable feedback and explain your reasoning.

- **You are not your code.** When your code is critiqued, questioned, or constructively criticized, remember that you are not your code. Do not take code review personally.

- **Always do your best.** No one writes bugs on purpose. Do your best, and learn from your mistakes.

- Kindly note any violations to the guidelines specified in this document. 

## :nail_care: Coding Style

Consistency is the most important. Following the existing style, formatting, and naming conventions of the file you are modifying and of the overall project. Failure to do so will result in a prolonged review process that has to focus on updating the superficial aspects of your code, rather than improving its functionality and performance.

For example, if all private properties are prefixed with an underscore `_`, then new ones you add should be prefixed in the same way. Or, if methods are named using camelcase, like `thisIsMyNewMethod`, then do not diverge from that by writing `this_is_my_new_method`. You get the idea. If in doubt, please ask or search the codebase for something similar.

When possible, style and format will be enforced with a linter.

## :medal_sports: Certificate of Origin

*Developer's Certificate of Origin 1.1*

By making a contribution to this project, I certify that:

> 1. The contribution was created in whole or in part by me and I have the right to submit it under the open source license indicated in the file; or
> 1. The contribution is based upon previous work that, to the best of my knowledge, is covered under an appropriate open source license and I have the right under that license to submit that work with modifications, whether created in whole or in part by me, under the same open source license (unless I am permitted to submit under a different license), as indicated in the file; or
> 1. The contribution was provided directly to me by some other person who certified (1), (2) or (3) and I have not modified it.
> 1. I understand and agree that this project and the contribution are public and that a record of the contribution (including all personal information I submit with it, including my sign-off) is maintained indefinitely and may be redistributed consistent with this project or the open source license(s) involved.

## [No Brown M&M's](https://en.wikipedia.org/wiki/Van_Halen#Contract_riders)

If you are reading this, bravo dear user and (hopefully) contributor for making it this far! You are awesome. :100: 

To confirm that you have read this guide and are following it as best as possible, **include this emoji at the top** of your issue or pull request: :black_heart: `:black_heart:`


## Review Process

- All contributions will be reviewed by maintainers.
- Be open to feedback and be prepared to make changes to your code.
- Reviewers will look for code quality, test coverage, and adherence to project guidelines.
- Once approved, a maintainer will merge your PR.

## Community

- Join our [Discord server](https://discord.gg/solomonai) for discussions and support.
- Follow us on [Twitter](https://twitter.com/SolomonAIEng) for updates.
- Subscribe to our [newsletter](https://solomonai.com/newsletter) for important announcements.
- Attend our monthly community calls (schedule available on Discord).

Thank you for contributing to Solomon AI! Your efforts help empower small businesses with advanced financial tools.