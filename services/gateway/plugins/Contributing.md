## 🎉 Welcome

Hello and Thank you for your interest in contributing to Portkey Gateway Plugins! We're excited to welcome new  developers to our community. This guide will help you get started with creating and submitting new guardrails plugins for the Portkey Gateway.

## 🚀 Quick Start

1. Fork the repository on GitHub: [https://github.com/Portkey-AI/gateway](https://github.com/Portkey-AI/gateway)
2. Clone your forked repository to your local machine:
   ```sh
   git clone https://github.com/YOUR_USERNAME/gateway.git
3. Navigate to the plugins directory:
    ```sh 
    cd gateway/plugins
    ```

## 🔧 Creating a New Plugin

Create a new directory for your plugin in the `/plugins` folder:
```sh 
Copy/plugins
  /your-plugin-name
    - manifest.json
    - main-function.ts
    - test-file.test.ts (recommended)
```

Create a `manifest.json` file defining your plugin's properties, credentials, and functions.
Implement your plugin logic in `main-function.ts.`
Write tests for your plugin in `test-file.test.ts`.

For detailed information on plugin structure and implementation, please refer to the  [Plugins README](https://github.com/Portkey-AI/gateway/tree/main/plugins#readme).


## 📝 Plugin Guidelines

Focus on implementing guardrails as the primary function of your plugin.
Ensure your plugin works with the `beforeRequest` and `afterRequest` hooks.
Write clear and concise documentation within your code and in the `manifest.json` file.
Test your plugin thoroughly before submission.


## 🔄 Contributing a Plugin

There are two main ways to contribute a plugin to the Portkey Gateway:

### 1. Work on Existing Issues

1. Check the [Issues tab](https://github.com/Portkey-AI/gateway/issues) in the Portkey Gateway repository.
2. Look for issues labeled with `good-first-issue` and `plugin`.
3. Submit a pull request referencing the original issue number.

### 2. Propose and Develop a New Plugin

If you have an idea for a new plugin:

1. Check the [Issues tab](https://github.com/Portkey-AI/gateway/issues) to ensure a similar plugin hasn't been proposed.
2. Create a new issue with the following title format: [Feature] Your Plugin Name.
3. In the issue description, provide:
   - **Plugin Name**: A clear, descriptive name for your plugin.
   - **Description**: A brief overview of your plugin's functionality and its benefits.
3. Submit a pull request referencing your proposal issue number.

## 📤 Submitting Your Pull Request

When your plugin is ready for review:

1. Ensure your code follows the structure outlined in the [Plugins README](https://github.com/Portkey-AI/gateway/blob/main/plugins/README.md).
3. Run tests to ensure your plugin works as expected.
4. Create a pull request with the following title format: `[New Plugin] Your Plugin Name`.
5. In the pull request description, provide:
   - A link to the original issue or proposal
   - A summary of the changes and new features


The maintainers will review your submission and may suggest changes or improvements. Be prepared to engage in a constructive dialogue and make updates as needed.

## 🧪 Testing

Before submitting your pull request:

1. Write unit tests for your plugin in a `test-file.test.ts` file.
2. Ensure all tests pass by running:



## 🤔 Getting Help
If you have any questions or need assistance while developing your plugin, please join our [Discord](https://discord.gg/DD7vgKK299) community. It's the fastest way to get support and connect with other contributors.

## 🎊 Your Plugin is Accepted!
Once your plugin is reviewed and accepted, it will be merged into the main repository. We appreciate your contribution to making the Portkey Gateway more powerful and versatile!
Thank you for contributing to Portkey Gateway Plugins!
