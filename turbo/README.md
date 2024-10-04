# Project Generator for Monorepo

<div align="center" width="100%">
    <img src="../../saasfly-logo.svg" width="128" alt="" />
</div>


## Overview

The Project Generator for Monorepo is a sophisticated tool designed to streamline the development process within a monorepo architecture. By automating the creation of new packages and applications, it ensures consistency, enforces best practices, and significantly reduces setup time across various project types.

### Key Benefits

- 🚀 Accelerate project initialization
- 🔄 Maintain consistency across the monorepo
- 🛠 Enforce best practices in project setup
- 🌐 Support for multiple project types and technologies
- 🧩 Easy integration of new packages into existing ecosystem

## Table of Contents

- [Features](#features)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#usage)
  - [Generating a New Project](#generating-a-new-project)
  - [Makefile Commands](#makefile-commands)
- [Project Types](#project-types)
- [Directory Structure](#directory-structure)
- [Configuration](#configuration)
- [Templates](#templates)
- [Development Tools](#development-tools)
- [Desktop and Mobile Application Support](#desktop-and-mobile-application-support)
- [Styling](#styling)
- [Utility Scripts](#utility-scripts)
- [Continuous Integration](#continuous-integration)
- [Documentation](#documentation)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Support](#support)
- [Acknowledgements](#acknowledgements)

## Features

- 🚀 **Flexible Project Types**: 
  - React Library
  - Regular Package
  - Full-stack Application
  - Desktop App (Electron)
  - Mobile App (React Native)
  - Cloudflare Worker
  - TypeScript Library
- 🛠 **Automated Tooling Setup**:
  - Testing (Vitest)
  - Documentation (Storybook)
  - Linting (ESLint)
  - Formatting (Prettier)
- 🖥 **Cross-Platform Support**: Desktop, mobile, and web applications
- 🎨 **Consistent Styling**: Tailwind CSS integration
- 🏗 **Customizable Templates**: Easily adaptable for specific project needs
- 🔄 **Post-Generation Verification**: Ensures correct setup
- 🔧 **Utility Scripts**: For file conversion and common development tasks
- 📦 **Monorepo Structure**: Optimized for large-scale project management

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- bun (v6 or later)
- Bun (latest version)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/SolomonAIEngineering/financial-platform-as-a-service/project-generator-monorepo.git
   cd project-generator-monorepo
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Set up environment (if necessary):
   ```bash
   cp .env.example .env
   # Edit .env with your specific configurations
   ```

## Usage

### Generating a New Project

To create a new package or application:

```bash
bun generate
```

Follow the interactive prompts to specify:
1. Project name
2. Project type
3. Additional features or configurations

### Makefile Commands

The project includes a Makefile for common tasks:

- Convert files to .hbs format:
  ```
  make convert-to-hbs TARGET_DIR=<directory>
  ```
- Start docker desktop:
  ```
  make start_dev_instance
  ```
- Display help:
  ```
  make help
  ```

## Project Types

Detailed information about each project type:

1. **React Library**: 
   - Purpose: Reusable React components
   - Key features: Storybook integration, component testing setup
   
2. **Regular Package**: 
   - Purpose: Utility functions or non-React libraries
   - Key features: TypeScript configuration, modular structure

3. **Full-stack Application**: 
   - Purpose: Complete web applications
   - Key features: Front-end and back-end setup, database configurations

4. **Desktop App**: 
   - Purpose: Electron-based desktop applications
   - Key features: Main and renderer process setup, native OS integration

5. **Mobile App**: 
   - Purpose: React Native mobile applications
   - Key features: iOS and Android configurations, native module support

6. **Cloudflare Worker**: 
   - Purpose: Serverless edge computing functions
   - Key features: Worker script templates, Wrangler configuration

7. **TypeScript Library**: 
   - Purpose: Standalone TypeScript libraries
   - Key features: Advanced TypeScript configurations, declaration file generation

## Directory Structure

```
monorepo/
├── apps/
│   ├── web-app/
│   ├── desktop-app/
│   └── mobile-app/
├── packages/
│   ├── ui-components/
│   ├── utils/
│   └── api-client/
├── generator/
│   ├── config.ts
│   ├── templates/
│   └── scripts/
├── docs/
├── scripts/
├── Makefile
├── package.json
└── README.md
```

## Configuration

The `generator/config.ts` file is the heart of the project generator. It defines:

- User prompts and validation
- File and directory creation logic
- Template processing and variable injection
- Post-generation tasks and verifications

Customize this file to add new project types or modify existing ones.

## Templates

Each project type has its own set of templates located in `generator/templates/`. These include:

- Base files (e.g., `package.json`, `tsconfig.json`)
- Specific configurations (e.g., `.storybook/`, `electron-builder.yml`)
- Sample components or entry files

To modify templates:
1. Edit the relevant files in `generator/templates/`
2. Update `generator/config.ts` if new files are added or removed

## Development Tools

The generator sets up a comprehensive suite of development tools:

- **Storybook**: Interactive UI component development
- **Vitest**: Fast, ESM-native testing framework
- **TypeScript**: Static typing and advanced JavaScript features
- **ESLint & Prettier**: Code linting and formatting
- **Tailwind CSS**: Utility-first CSS framework
- **Husky & lint-staged**: Pre-commit hooks for code quality

## Desktop and Mobile Application Support

### Desktop Apps (Electron)
- Includes main process and renderer setup
- IPC communication helpers
- Auto-update configuration

### Mobile Apps (React Native)
- iOS and Android project initialization
- Navigation setup
- Native module linking configuration

## Styling

- Tailwind CSS for web and desktop projects
- React Native styling for mobile projects
- Global styles and theming support
- Dark mode configuration

## Utility Scripts

- `convert_to_hbs.sh`: Converts template files to Handlebars format
- `update_deps.js`: Checks and updates project dependencies
- `generate_docs.js`: Automates documentation generation

## Continuous Integration

The project includes CI configurations for:
- GitHub Actions
- CircleCI
- GitLab CI

These ensure that generated projects maintain quality and consistency.

## Documentation

- Auto-generated API documentation using TypeDoc
- User guides for each project type
- Contribution guidelines and code of conduct

## Troubleshooting

Common issues and their solutions:
1. **Generation fails**: Ensure all dependencies are installed and you're using the correct Node.js version.
2. **Template rendering errors**: Check for syntax errors in Handlebars templates.
3. **Post-generation scripts fail**: Verify that all required tools (e.g., Bun) are installed and in your PATH.

For more issues, consult the [FAQ](docs/FAQ.md) or open a GitHub issue.

## Roadmap

Planned features and improvements:
- [ ] GraphQL API project type
- [ ] Serverless function templates (AWS Lambda, Azure Functions)
- [ ] Golang Microservice

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details on:
- Submitting bug reports and feature requests
- Code contribution process
- Coding standards and best practices

## License

This project is licensed under the [AGPL License](LICENSE).

## Support

For support:
- Open an issue on GitHub
- Join our [Discord community](https://discord.gg/solomonai)
- Email us at support@solomon-ai.co

## Acknowledgements

- [Plop.js](https://plopjs.com/) - The core of our code generation
- [Turborepo](https://turborepo.org/) - Inspiration for our monorepo structure
- [Our contributors](CONTRIBUTORS.md) - For their valuable input and code contributions

---

Made with ❤️ by Solomon AI Engineering Team

[Visit our website](https://www.solomon-ai.app) | [Follow us on Twitter](https://twitter.com/SolomonAIEng)