<p align="center">
    <img alt="React Native Template Obytes" src="https://github.com/obytes/react-native-template-obytes/assets/11137944/a8163d23-897a-4efe-91ce-b9bf7348c18f" width="200" />
</p>

<h1 align="center">
  React Native Template Obytes
</h1>

![expo](https://img.shields.io/github/package-json/dependency-version/obytes/react-native-template-obytes/expo?label=expo) ![react-native](https://img.shields.io/github/package-json/dependency-version/obytes/react-native-template-obytes/react-native?label=react-native) ![GitHub Repo stars](https://img.shields.io/github/stars/obytes/react-native-template-obytes) ![GitHub commit activity (branch)](https://img.shields.io/github/commit-activity/m/obytes/react-native-template-obytes) ![GitHub issues](https://img.shields.io/github/issues/obytes/react-native-template-obytes) ![GitHub closed issues](https://img.shields.io/github/issues-closed-raw/obytes/react-native-template-obytes)

📱 A template for your next React Native project 🚀, Made with developer experience and performance first: Expo, TypeScript, TailwindCSS, Husky, Lint-Staged, expo-router, react-query, react-hook-form, I18n.

> Welcome to the Obytes Mobile Tribe's Expo / React Native Starter Kit!

## 🚀 Motivation

Our goal with this starter kit was to streamline the process of building React Native apps, both for our own team and for our clients. We wanted to create a resource that would allow us to create high-quality apps faster and with less effort, while ensuring that all of our projects adhere to the same code standards and architectural principles.

The benefits of using this starter kit are numerous. It helps our team easily switch between projects, as we can rely on a consistent foundation of code. It also allows us to focus on the business logic of each project rather than getting bogged down in boilerplate code. And, because it promotes consistency across projects, it makes it easier to maintain and scale our apps, as well as share code between teams.

Overall, our starter kit is designed to facilitate efficient and effective app development, helping us to bring the best possible products to our clients

## ✍️ Philosophy

When creating this starter kit, we had several guiding principles in mind::

- **🚀 Production-ready**: We wanted to ensure that this starter was ready for real-world use, providing a solid foundation for building production-grade apps.
- **🥷 Developer experience and productivity**: Our focus was on creating a starter that would enhance the developer experience and increase productivity.
- **🧩 Minimal code and dependencies**: We aimed to keep the codebase and dependencies as small as possible.
- **💪 Well-maintained third-party libraries**: We included only well-maintained and reliable third-party libraries, to provide stability and support for our projects.

## ⭐ Key Features

- ✅ Latest Expo SDK with Custom Dev Client: Leverage the best of the Expo ecosystem while maintaining full control over your app.
- 🎉 [TypeScript](https://www.typescriptlang.org/) for enhanced code quality and bug prevention through static type checking.
- 💅 Minimal UI kit built with [TailwindCSS](https://www.nativewind.dev/), featuring common components essential for your app.
- ⚙️ Multi-environment build support (Production, Staging, Development) using Expo configuration.
- 🦊 Husky for Git Hooks: Automate your git hooks and enforce code standards.
- 💡 Clean project structure with Absolute Imports for easier code navigation and management.
- 🚫 Lint-staged: Run Eslint and TypeScript checks on Git staged files to maintain code quality.
- 🗂 VSCode recommended extensions, settings, and snippets for an enhanced developer experience.
- ☂️ Pre-installed [Expo Router](https://docs.expo.dev/router/introduction/) with examples for comprehensive app navigation.
- 💫 Auth flow implementation using [Zustand](https://github.com/pmndrs/zustand) for state management and [react-native-mmkv](https://github.com/mrousavy/react-native-mmkv) for secure data storage.
- 🛠 10+ [Github Actions](https://github.com/features/actions) workflows for building, releasing, testing, and distributing your app.
- 🔥 [React Query](https://react-query.tanstack.com/) and [axios](https://github.com/axios/axios) for efficient data fetching and state management.
- 🧵 Robust form handling with [react-hook-form](https://react-hook-form.com/) and [zod](https://github.com/colinhacks/zod) for validation, plus keyboard handling.
- 🎯 Localization support with [i18next](https://www.i18next.com/), including Eslint for validation.
- 🧪 Unit testing setup with [Jest](https://jestjs.io/) and [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/).
- 🔍 E2E testing capabilities with [Maestro](https://maestro.mobile.dev/) for comprehensive app testing.

## 🤔 Is this starter for me?

Yes 😀

This starter kit is designed to benefit a wide range of React Native developers, from beginners to experienced professionals. Here's why it might be a good fit for you:

1. **For beginners:** It provides a solid foundation with best practices and common solutions, helping you learn industry-standard approaches to React Native development.

2. **For experienced developers:** It offers a well-structured, production-ready setup that can save you time and effort in project initialization and configuration.

3. **For teams:** It ensures consistency across projects and team members, making it easier to onboard new developers and maintain code quality.

4. **For explorers:** Even if you prefer not to use starter kits, this project can serve as a valuable reference. You can explore the codebase, documentation, and architectural decisions to gain insights and potentially adopt specific solutions for your own projects.

5. **For learners:** The starter kit incorporates up-to-date libraries and patterns, offering an opportunity to familiarize yourself with current best practices in the React Native ecosystem.

6. **For AI-assisted development:** This starter kit works well with AI coding tools. It provides a solid structure and best practices that can guide AI-generated code. This helps ensure that AI assistance leads to high-quality, maintainable code that fits well within your project.

Remember, you don't have to use the entire starter kit as-is. Feel free to cherry-pick ideas, configurations, or code snippets that align with your project needs. Whether you're building a new app from scratch or looking to improve your existing development process, this starter kit can provide valuable insights and practical solutions.

## 😉 Why Expo and not React Native CLI?

We have been using Expo as our main framework since the introduction of [Continuous Native Generation (CNG)](https://docs.expo.dev/workflow/continuous-native-generation/) concept and we are happy with the experience.

I think this question is not valid anymore specially after the last React conference when the core react native team recommended using Expo for new projects.

> "As of today, the only recommended community framework for React Native is Expo. Folks at Expo have been investing in the React Native ecosystem since the early days of React Native and as of today, we believe the developer experience offered by Expo is best in class." React native core team

Still hesitating? Check out this [article](https://reactnative.dev/blog/2024/06/25/use-a-framework-to-build-react-native-apps) or this [video](https://www.youtube.com/watch?v=lifGTznLBcw), maybe this one [video](https://www.youtube.com/watch?v=ek_IdGC0G80) too.

## 🧑‍💻 Stay up to date

We are committed to continually improving our starter kit and providing the best possible resources for building React Native apps. To that end, we regularly add new features and fix any bugs that are discovered.

If you want to stay up to date with the latest developments in our starter kit, you can either watch the repository or hit the "star" button. This will allow you to receive notifications whenever new updates are available.

We value the feedback and contributions of our users, and we encourage you to let us know if you have any suggestions for improving our starter kit. We are always looking for ways to make it even more effective and useful for our community. So, please do not hesitate to reach out and share your thoughts with us.

<!-- add a gif image here  -->

## 💎 Libraries used

- [Expo](https://docs.expo.io/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [Nativewind](https://www.nativewind.dev/v4/overview)
- [Flash list](https://github.com/Shopify/flash-list)
- [React Query](https://tanstack.com/query/v4)
- [Axios](https://axios-http.com/docs/intro)
- [React Hook Form](https://react-hook-form.com/)
- [i18next](https://www.i18next.com/)
- [zustand](https://github.com/pmndrs/zustand)
- [React Native MMKV](https://github.com/mrousavy/react-native-mmkv)
- [React Native Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/docs/)
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/docs/)
- [React Native Svg](https://github.com/software-mansion/react-native-svg)
- [React Error Boundaries](https://github.com/bvaughn/react-error-boundary)
- [Expo Image](https://docs.expo.dev/versions/unversioned/sdk/image/)
- [React Native Keyboard Controller](https://github.com/kirillzyusko/react-native-keyboard-controller)
- [Moti](https://moti.fyi/)
- [React Native Safe Area Context](https://github.com/th3rdwave/react-native-safe-area-context)
- [React Native Screens](https://github.com/software-mansion/react-native-screens)
- [Tailwind Variants](https://www.tailwind-variants.org/)
- [Zod](https://zod.dev/)

## Contributors

This starter is maintained by [Obytes mobile tribe team](https://www.obytes.com/team) and we welcome new contributors to join us in improving it. If you are interested in getting involved in the project, please don't hesitate to open an issue or submit a pull request.

In addition to maintaining this starter kit, we are also available to work on custom projects and help you build your dream app. If you are looking for experienced and reliable developers to bring your app vision to life, please visit our website at [obytes.com/contact](https://www.obytes.com/contact) to get in touch with us. We would be happy to discuss your project in more detail and explore how we can help you achieve your goals.

## 🔥 How to contribute?

Thank you for your interest in contributing to our project. Your involvement is greatly appreciated and we welcome your contributions. Here are some ways you can help us improve this project:

1. Show your support for the project by giving it a 🌟 on Github. This helps us increase visibility and attract more contributors.
2. Share your thoughts and ideas with us by opening an issue. If you have any suggestions or feedback about any aspect of the project, we are always eager to hear from you and have a discussion.
3. If you have any questions about the project, please don't hesitate to ask. Simply open an issue and our team will do our best to provide a helpful and informative response.
4. If you encounter a bug or typo while using the starter kit or reading the documentation, we would be grateful if you could bring it to our attention. You can open an issue to report the issue, or even better, submit a pull request with a fix.

We value the input and contributions of our community and look forward to working with you to improve this project.

## ❓ FAQ

If you have any questions about the starter and want answers, please check out the [Discussions](https://github.com/obytes/react-native-template-obytes/discussions) page.

## 🔖 License

This project is MIT licensed.
