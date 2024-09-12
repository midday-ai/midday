# Portkey Gateway Plugins

## Table of Contents

- [Portkey Gateway Plugins](#portkey-gateway-plugins)
  - [Table of Contents](#table-of-contents)
  - [Introduction](#introduction)
  - [What are Plugins?](#what-are-plugins)
  - [Why are Plugins Important?](#why-are-plugins-important)
  - [Concepts](#concepts)
    - [Hooks](#hooks)
    - [Guardrails](#guardrails)
    - [Checks](#checks)
  - [Creating a Plugin](#creating-a-plugin)
    - [Folder Structure](#folder-structure)
    - [Manifest File](#manifest-file)
    - [Plugin Function](#plugin-function)
  - [Building Plugins into Your Gateway](#building-plugins-into-your-gateway)
  - [Using Plugins](#using-plugins)
  - [Testing Plugins](#testing-plugins)

## Introduction

This folder contains plugins for the Portkey Gateway. Plugins allow developers to extend the capabilities of the Gateway by adding custom functionality at various stages of the request lifecycle. Currently, the primary type of plugins supported in the AI gateway are guardrails.

## What are Plugins?

Plugins in Portkey enable developers to extend the capabilities of the AI gateway by writing their own functionality. Portkey exposes the concept of hooks, which allows developers to execute custom functions at key points in the request journey. While the plugin system is designed to be extensible, the current focus is on implementing guardrails.

## Why are Plugins Important?

Plugins are crucial for several reasons:

1. **Customization**: They allow you to tailor the Gateway's behavior to your specific needs, especially in terms of implementing guardrails.
2. **Extensibility**: You can add new features and integrations without modifying the core Gateway code.
3. **Modularity**: Plugins can be easily added, removed, or updated without affecting other parts of the system.
4. **Community Contributions**: The plugin system allows the community to contribute and share useful extensions, particularly for guardrail implementations.

## Concepts

### Hooks

Hooks in Portkey's AI gateway allow custom functions to be executed at various stages of the request lifecycle. Currently, four types of hooks are supported:

1. **Start**: Executed at the beginning of the request lifecycle for initial setup and logging.
2. **BeforeRequest**: Executed before the request is sent to the AI model, typically used for implementing guardrails.
3. **AfterRequest**: Executed after the AI model processes the request but before the response is returned, used for post-processing and validations.
4. **End**: Executed at the end of the request lifecycle for final logging and cleanup.

While hooks can be extended for custom logging solutions and other custom functionalities, their primary intended purpose is to set up and enforce guardrails.

### Guardrails

Guardrails in Portkey's AI gateway are a set of checks that are run together within the `beforeRequest` or `afterRequest` hooks to determine a `verdict`. The verdict of a guardrail dictates the actions to be taken on the request or response. For example, if the guardrail fails, the request can be failed, or the response can be returned with a 246 status code indicating that the guardrails failed.

Guardrails can be defined either through the user interface (UI) of Portkey or as a JSON configuration within the Portkey `config`. This flexibility allows for easy management and customization of guardrails according to the specific needs of the application.

### Checks

A check is an individual function that assesses the input prompt or output response against predefined conditions. Each check returns a boolean verdict or may error out if issues are encountered. Checks are the building blocks of guardrails, and Portkey includes a set of predefined checks as well as the ability to add custom checks.

## Creating a Plugin

When creating a plugin for Portkey, keep in mind that it should primarily focus on implementing guardrails. Here's how to structure your plugin:

### Folder Structure

To create a plugin, follow this structure in the `/plugins` folder:

```
/plugins
  /your-plugin-name
    - manifest.json
    - main-function.ts
    - test-file.test.ts (recommended)
```

### Manifest File

The `manifest.json` file defines the plugin's properties, required credentials, and available functions. Here's an example structure:

```json
{
  "id": "your-plugin-id",
  "description": "A brief description of your guardrail plugin",
  "credentials": {
    "type": "object",
    "properties": {
      "apiKey": {
        "type": "string",
        "label": "API Key",
        "description": "Your API key description",
        "encrypted": true
      }
    },
    "required": ["apiKey"]
  },
  "functions": [
    {
      "name": "Your Guardrail Function",
      "id": "yourGuardrailId",
      "supportedHooks": ["beforeRequestHook", "afterRequestHook"],
      "type": "guardrail",
      "description": [
        {
          "type": "subHeading",
          "text": "Description of your guardrail function"
        }
      ],
      "parameters": {
        "type": "object",
        "properties": {
          "paramName": {
            "type": "string",
            "label": "Parameter Label",
            "description": [
              {
                "type": "subHeading",
                "text": "Description of the parameter"
              }
            ]
          }
        },
        "required": ["paramName"]
      }
    }
  ]
}
```

### Plugin Function

Create a TypeScript file (e.g., `main-function.ts`) that exports a handler function. This function will implement your guardrail logic. Here's a basic structure:

```typescript
import {
  HookEventType,
  PluginContext,
  PluginHandler,
  PluginParameters,
} from '../types';

export const handler: PluginHandler = async (
  context: PluginContext,
  parameters: PluginParameters,
  eventType: HookEventType
) => {
  // Your guardrail logic here
  // You can access:
  // - context.request for request data
  // - context.response for response data (in afterRequestHook)
  // - parameters for plugin-specific parameters
  // - eventType to determine which hook is being executed

  return {
    error: null, // or error object if an error occurred
    verdict: true, // or false to indicate if the guardrail passed or failed
    data: {}, // any additional data you want to return
  };
};
```

## Building Plugins into Your Gateway

To build plugins into your Gateway, follow these steps:

1. In the root directory of the Gateway repository, locate the `conf.json` file.
2. Edit the `conf.json` file to specify which plugins you want to enable and provide any necessary credentials. Here's an example:

```json
{
  "plugins_enabled": ["default", "your-guardrail-plugin"],
  "credentials": {
    "your-guardrail-plugin": {
      "apiKey": "your-api-key-here"
    }
  },
  "cache": false
}
```

3. Run the build command to compile the plugins:

```
npm run build-plugins
```

This command will compile the plugins and prepare them for use with the Gateway.

## Using Plugins

Once you've built the plugins, they will be automatically deployed with the Gateway when you run it. You can start the Gateway using one of the following commands:

- For development:
  ```
  npm run dev
  ```
- For Node.js:
  ```
  npm run dev:node
  ```
- For Cloudflare Workers:
  ```
  npm run dev:workerd
  ```

The guardrail plugins you've enabled in the `conf.json` file will be loaded and ready to use.

## Testing Plugins

To test your guardrail plugins:

1. Ensure you have written test files for your plugins (e.g., `test-file.test.ts`).
2. Run the test command:

```
npx jest
```

This command will execute the test files in the plugins repository, allowing you to verify that your guardrail plugins are functioning correctly.
