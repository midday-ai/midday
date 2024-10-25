# Project Generator for Monorepo

<div align="center">
    <img src="../../saasfly-logo.svg" width="128" alt="SaaSfly Logo" />
</div>

## Overview

The **Project Generator for Monorepo** is an advanced tool engineered to streamline the development workflow within a monorepo architecture. By automating the creation of new packages and applications, it ensures consistency, enforces best practices, and significantly reduces setup time across various project types. The generator supports a wide array of technologies and frameworks, making it a versatile solution for large-scale software development.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
- [Usage](#usage)
  - [Generating a New Project](#generating-a-new-project)
  - [Makefile Commands](#makefile-commands)
- [Project Types](#project-types)
  - [React Library](#react-library)
  - [Regular Package](#regular-package)
  - [Full-stack Application](#full-stack-application)
  - [Desktop App (Electron)](#desktop-app-electron)
  - [Mobile App (React Native)](#mobile-app-react-native)
  - [Cloudflare Worker](#cloudflare-worker)
  - [TypeScript Library](#typescript-library)
- [Directory Structure](#directory-structure)
- [Configuration Files](#configuration-files)
- [Templates](#templates)
- [Development Tools](#development-tools)
- [Cross-Platform Support](#cross-platform-support)
  - [Desktop Applications](#desktop-applications)
  - [Mobile Applications](#mobile-applications)
- [Styling and Theming](#styling-and-theming)
- [Utility Scripts](#utility-scripts)
- [Continuous Integration and Deployment](#continuous-integration-and-deployment)
- [Documentation Generation](#documentation-generation)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Support](#support)
- [Acknowledgements](#acknowledgements)

## Features

- **Flexible Project Generation**: Supports multiple project types, including React libraries, TypeScript packages, full-stack applications, Electron desktop apps, React Native mobile apps, Cloudflare Workers, and TypeScript libraries.
- **Automated Tooling Setup**: Configures testing frameworks (Vitest), documentation tools (Storybook), linting (ESLint), and formatting (Prettier) out of the box.
- **Cross-Platform Compatibility**: Provides templates and configurations for web, desktop, and mobile applications.
- **Consistent Styling**: Integrates Tailwind CSS and supports custom theming to ensure a consistent look and feel across projects.
- **Customizable Templates**: Utilizes Handlebars templates for easy customization and extension.
- **Post-Generation Validation**: Includes scripts to verify the integrity of generated projects.
- **Utility Scripts**: Offers a suite of scripts for common development tasks, such as dependency updates and documentation generation.
- **Monorepo Optimization**: Designed to work seamlessly within a monorepo managed by tools like Turborepo or Nx.

## Architecture

The generator is built using [Plop.js](https://plopjs.com/), a micro-generator framework that leverages Handlebars for template rendering. It operates within a monorepo managed by package managers like [pnpm](https://pnpm.io/) or [Bun](https://bun.sh/), ensuring efficient dependency management and build processes.

**Core Components:**

- **Generator Core (`generator/config.ts`)**: Defines prompts, actions, and logic for project generation.
- **Templates (`generator/templates/`)**: Contains the boilerplate code for each project type.
- **Scripts (`generator/scripts/`)**: Includes utility scripts for tasks like file conversion and post-generation setup.
- **Makefile**: Provides command shortcuts for common operations.

## Getting Started

### Prerequisites

- **Node.js**: Version 14.x or later.
- **Bun**: Latest version (alternative to Node.js for faster performance).
- **pnpm**: Preferred package manager for monorepo management.
- **Git**: For version control.

### Installation

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/SolomonAIEngineering/financial-platform-as-a-service/project-generator-monorepo.git
   cd project-generator-monorepo
   ```

2. **Install Dependencies:**

   ```bash
   pnpm install
   ```

   Ensure that `pnpm` is installed globally (`npm install -g pnpm`).

3. **Set Up Environment Variables (Optional):**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` to include any necessary environment-specific configurations.

### Configuration

The generator uses environment variables and configuration files to customize its behavior. Key configuration files include:

- **`.env`**: Contains environment-specific variables.
- **`generator/config.ts`**: Defines the generator's prompts and actions.
- **`wrangler.toml`** (for Cloudflare Workers): Configures deployment settings.

## Usage

### Generating a New Project

Run the generator using the following command:

```bash
pnpm generate
```

Alternatively, if using Bun:

```bash
bun generate
```

Follow the interactive prompts to specify:

1. **Project Name**: The name of the new project (e.g., `my-new-package`).
2. **Project Type**: Choose from the supported project types (React Library, Regular Package, etc.).
3. **Additional Features**: Enable or disable optional features such as testing frameworks, linting, and styling libraries.

### Makefile Commands

The included `Makefile` provides shortcuts for common tasks:

- **Convert Files to Handlebars Format:**

  ```bash
  make convert-to-hbs TARGET_DIR=templates/react-library
  ```

  This command converts files within the specified directory to `.hbs` templates.

- **Start Development Server:**

  ```bash
  make start_dev_instance
  ```

  Starts a development instance using Docker or other specified tools.

- **Display Help:**

  ```bash
  make help
  ```

  Lists all available Makefile commands and their descriptions.

## Project Types

### React Library

- **Purpose**: Create reusable React components and UI elements.
- **Features**:
  - Storybook for component documentation.
  - Vitest for unit testing.
  - Tailwind CSS integration.
  - TypeScript support with strict type checking.

### Regular Package

- **Purpose**: Develop utility functions, algorithms, or services not tied to a UI.
- **Features**:
  - Pure TypeScript setup.
  - Comprehensive testing with Vitest.
  - Linting with ESLint and formatting with Prettier.

### Full-stack Application

- **Purpose**: Build end-to-end applications with both front-end and back-end components.
- **Features**:
  - Integration with frameworks like Next.js or Express.js.
  - Database configuration (PostgreSQL, MongoDB, etc.).
  - API development with REST or GraphQL.
  - Environment-specific configurations.

### Desktop App (Electron)

- **Purpose**: Develop cross-platform desktop applications.
- **Features**:
  - Electron setup with main and renderer processes.
  - IPC communication patterns.
  - Auto-update mechanisms.
  - Native OS integrations and system tray support.

### Mobile App (React Native)

- **Purpose**: Create native mobile applications for iOS and Android.
- **Features**:
  - React Native CLI setup.
  - Navigation with React Navigation.
  - Native module integration.
  - Platform-specific configurations.

### Cloudflare Worker

- **Purpose**: Deploy serverless functions at the edge.
- **Features**:
  - Wrangler configuration for deployment.
  - TypeScript setup tailored for Cloudflare Workers.
  - KV storage and Durable Objects integration.
  - Testing with Miniflare emulator.

### TypeScript Library

- **Purpose**: Develop standalone TypeScript libraries for NPM publishing.
- **Features**:
  - Advanced TypeScript configurations.
  - Generation of declaration files (`.d.ts`).
  - ESM and CJS module support.
  - Tree-shaking and bundle optimization with Rollup or esbuild.

## Directory Structure

The monorepo follows a standardized directory layout:

```
monorepo/
├── apps/
│   ├── web-app/               # Full-stack or front-end applications
│   ├── desktop-app/           # Electron applications
│   └── mobile-app/            # React Native applications
├── packages/
│   ├── ui-components/         # Shared React components
│   ├── utils/                 # Utility functions and services
│   └── api-client/            # API clients and SDKs
├── generator/
│   ├── config.ts              # Generator configuration
│   ├── templates/             # Project templates
│   └── scripts/               # Utility scripts
├── docs/                      # Documentation
├── scripts/                   # Global scripts
├── .eslintrc.js               # Global ESLint configuration
├── .prettierrc                # Global Prettier configuration
├── package.json               # Monorepo package manifest
├── pnpm-workspace.yaml        # pnpm workspace configuration
├── tsconfig.json              # Global TypeScript configuration
└── README.md                  # Monorepo overview
```

## Configuration Files

- **`package.json`**: Defines scripts, dependencies, and project metadata.
- **`pnpm-workspace.yaml`**: Specifies which directories are part of the workspace.
- **`tsconfig.json`**: Configures TypeScript compiler options for the entire monorepo.
- **`.eslintrc.js`**: Linting rules and configurations.
- **`.prettierrc`**: Formatting rules for code consistency.

## Templates

Templates are located in `generator/templates/` and are organized by project type. Each template includes:

- **Base Files**: `package.json`, `README.md`, `LICENSE`, etc.
- **Configuration Files**: `.eslintrc.js`, `.prettierrc`, `tsconfig.json`, etc.
- **Source Code**: Boilerplate code for the specific project type.
- **Test Suites**: Sample tests to demonstrate testing setup.
- **Scripts**: Custom scripts for build, test, and deployment tasks.

**Customizing Templates:**

- Modify existing templates by editing the files in `generator/templates/<project-type>/`.
- Add new templates by creating a new directory and updating `generator/config.ts` accordingly.
- Use Handlebars syntax (`{{variable}}`) to inject dynamic content during generation.

## Development Tools

The generator sets up a comprehensive suite of development tools:

- **Testing**:
  - [Vitest](https://vitest.dev/): Fast, ESM-native testing framework.
  - [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/): For testing React components.
- **Documentation**:
  - [Storybook](https://storybook.js.org/): Interactive UI component development and documentation.
  - [TypeDoc](https://typedoc.org/): Generates API documentation from TypeScript comments.
- **Linting and Formatting**:
  - [ESLint](https://eslint.org/): Code linting with support for TypeScript and React.
  - [Prettier](https://prettier.io/): Code formatter to enforce consistent style.
- **Styling**:
  - [Tailwind CSS](https://tailwindcss.com/): Utility-first CSS framework.
  - [PostCSS](https://postcss.org/): For CSS transformations and plugins.
- **Version Control Hooks**:
  - [Husky](https://typicode.github.io/husky/#/): Git hooks for pre-commit and pre-push actions.
  - [lint-staged](https://github.com/okonet/lint-staged): Runs linters on staged git files.

## Cross-Platform Support

### Desktop Applications

- **Framework**: [Electron](https://www.electronjs.org/)
- **Features**:
  - Main and renderer process separation.
  - Electron Forge or Electron Builder for packaging.
  - Native module support.
  - Auto-updating mechanisms via [electron-updater](https://www.electron.build/auto-update).

### Mobile Applications

- **Framework**: [React Native](https://reactnative.dev/)
- **Features**:
  - Cross-platform development for iOS and Android.
  - Hot reloading and fast refresh.
  - Integration with native modules using [React Native CLI](https://reactnative.dev/docs/environment-setup).
  - Platform-specific code and styling support.

## Styling and Theming

- **Tailwind CSS Integration**:
  - Pre-configured with a default theme.
  - Supports theming and customization via `tailwind.config.js`.
- **Global Styles**:
  - Base styles and utilities included.
  - Dark mode support with media queries or class-based toggling.
- **CSS-in-JS Support**:
  - Optionally integrate libraries like [Styled Components](https://styled-components.com/) or [Emotion](https://emotion.sh/).

## Utility Scripts

- **`convert_to_hbs.sh`**:
  - Converts standard files to Handlebars templates.
  - Usage: `./scripts/convert_to_hbs.sh templates/react-library`.
- **`update_deps.js`**:
  - Checks for outdated dependencies and updates them.
  - Can be integrated with CI pipelines.
- **`generate_docs.js`**:
  - Automates documentation generation using TypeDoc.
  - Configurable to target specific packages or applications.

## Continuous Integration and Deployment

The generator includes CI/CD configurations for popular platforms:

- **GitHub Actions**:
  - Workflows for testing, building, and deploying.
  - Supports matrix builds for multiple Node.js versions.
- **CircleCI**:
  - Configurations for parallelism and caching.
  - Integrates with Orbs for reusable configurations.
- **GitLab CI**:
  - `.gitlab-ci.yml` templates for pipeline stages.
  - Support for Docker images and Kubernetes deployments.

**Deployment Targets**:

- **Web Applications**: Deployed to platforms like Vercel, Netlify, or AWS Amplify.
- **Mobile Applications**: Configurations for App Store and Google Play deployments.
- **Desktop Applications**: Packaging and distribution via installers or package managers.
- **Serverless Functions**: Deployment scripts for AWS Lambda, Azure Functions, or Cloudflare Workers.

## Documentation Generation

- **TypeDoc**: Generates API documentation from TypeScript code comments.
- **Storybook**: Provides a live documentation environment for UI components.
- **Markdown Files**: Automatically generated README and CONTRIBUTING guides.
- **Docz**: Optionally integrate with [Docz](https://www.docz.site/) for comprehensive documentation sites.

## Troubleshooting

**Common Issues and Solutions**:

1. **Generation Fails**:
   - Ensure all dependencies are installed.
   - Verify Node.js and Bun versions match the requirements.
   - Check for typos or invalid characters in the project name.

2. **Template Rendering Errors**:
   - Look for syntax errors in Handlebars templates.
   - Ensure all placeholders (`{{variable}}`) are correctly defined in `generator/config.ts`.

3. **Post-Generation Script Failures**:
   - Confirm that required tools like Bun are installed and accessible in your PATH.
   - Check for permission issues or missing environment variables.

4. **Dependency Conflicts**:
   - Run `pnpm install --force` to resolve conflicts.
   - Use `pnpm audit` to check for vulnerabilities.

**Additional Resources**:

- **FAQs**: Refer to the [FAQ](docs/FAQ.md) document for more information.
- **GitHub Issues**: Search existing issues or open a new one for unresolved problems.

## Roadmap

Planned features and enhancements:

- **GraphQL API Project Type**:
  - Templates for GraphQL servers using Apollo Server or Yoga.
- **Serverless Function Templates**:
  - AWS Lambda, Azure Functions, Google Cloud Functions support.
- **Golang Microservice**:
  - Templates for microservices written in Go.
- **Dockerization**:
  - Dockerfile templates for containerization.
- **Kubernetes Support**:
  - Helm charts and manifests for deployment.
- **Internationalization (i18n)**:
  - Support for multiple languages and locales.
- **Monorepo Performance Optimization**:
  - Caching strategies and build optimizations.

## Contributing

We welcome contributions from the community!

**How to Contribute**:

1. **Fork the Repository**: Click the "Fork" button at the top of the GitHub page.

2. **Clone Your Fork**:

   ```bash
   git clone https://github.com/your-username/project-generator-monorepo.git
   cd project-generator-monorepo
   ```

3. **Create a Feature Branch**:

   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **Implement Your Changes**:
   - Follow the existing code style and conventions.
   - Write tests for new functionality.

5. **Commit Your Changes**:

   ```bash
   git commit -am 'Add new feature: description'
   ```

6. **Push to Your Fork**:

   ```bash
   git push origin feature/your-feature-name
   ```

7. **Submit a Pull Request**:
   - Navigate to the original repository and click "New Pull Request".
   - Provide a clear description of your changes.

**Coding Standards**:

- **TypeScript Best Practices**: Use strict typing, interfaces, and generics.
- **Linting**: Run `pnpm lint` before committing.
- **Testing**: Ensure all tests pass with `pnpm test`.
- **Documentation**: Update relevant documentation and comments.

Please read our [Contributing Guidelines](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md) for more details.

## License

This project is licensed under the **AGPL License**. See the [LICENSE](LICENSE) file for detailed terms.

## Support

For support and inquiries:

- **Issue Tracker**: Use the GitHub [Issues](https://github.com/SolomonAIEngineering/project-generator-monorepo/issues) for bug reports and feature requests.
- **Email**: Contact us at [support@solomon-ai.co](mailto:support@solomon-ai.co).
- **Community**: Join our [Discord Server](https://discord.gg/solomonai) for discussions and help.
- **Documentation**: Refer to the project [Wiki](https://github.com/SolomonAIEngineering/project-generator-monorepo/wiki) for detailed guides and FAQs.

## Acknowledgements

- **[Plop.js](https://plopjs.com/)**: The foundation of our code generation capabilities.
- **[Turborepo](https://turborepo.org/)**: Inspiration for monorepo management.
- **[Nx](https://nx.dev/)**: For providing advanced monorepo tooling and insights.
- **[All Contributors](CONTRIBUTORS.md)**: Thank you to everyone who has contributed to this project.

---

Made with ❤️ by the **Solomon AI Engineering Team**

[![Solomon AI Logo](solomon-ai-logo.png)](https://www.solomon-ai.co)

---