# Midday Desktop App

A Tauri-based desktop application for Midday that supports multiple environments with a native transparent titlebar on macOS.

## Features

- **Environment Support**: Development, Staging, and Production environments
- **Transparent Titlebar**: Native macOS transparent titlebar with traffic light buttons
- **Responsive Design**: Minimum window size of 1450x900 for optimal experience

## Environment Configuration

The desktop app supports three environments, each loading a different URL:

- **Development**: `http://localhost:3001`
- **Staging**: `https://beta.midday.ai`
- **Production**: `https://app.midday.ai`

## Running the App

### Development Mode
```bash
# Run in development environment (loads localhost:3001)
bun run tauri:dev
```

### Staging Mode
```bash
# Run in staging environment (loads beta.midday.ai)
bun run tauri:staging
```

### Production Mode
```bash
# Run in production environment (loads app.midday.ai)
bun run tauri:prod
```

## Building the App

### Development Build
```bash
bun run tauri:build
```

### Staging Build
```bash
bun run tauri:build:staging
```

### Production Build
```bash
bun run tauri:build:prod
```

## Environment Variable

The environment is controlled by the `MIDDAY_ENV` environment variable:

- `development` or `dev` → `http://localhost:3001`
- `staging` → `https://beta.midday.ai`
- `production` or `prod` → `https://app.midday.ai`

If no environment is specified, it defaults to development mode.

## Manual Environment Setting

You can also set the environment manually:

```bash
# macOS/Linux
MIDDAY_ENV=staging tauri dev

# Windows (PowerShell)
$env:MIDDAY_ENV="staging"; tauri dev

# Windows (Command Prompt)
set MIDDAY_ENV=staging && tauri dev
```

## Window Features

- **Transparent Titlebar**: On macOS, the app uses a transparent titlebar while keeping the native traffic light buttons (red, yellow, green)
- **Minimum Size**: 1450x900 pixels for optimal user experience
- **Responsive**: Window can be resized but maintains minimum dimensions 