# Foreground Stopwatch

A simple always-on-top stopwatch for Windows that stays visible.

## What it does

This is a small stopwatch that floats on top of all your other windows. Designed for capturing videos to show web/app latency.

Features:
- Always stays on top of other windows
- Click to start/stop/reset

## Requirements

- Node.js (version 14 or higher)
- Windows (built for Windows, but should work on Mac/Linux too)

## How to run

1. Install dependencies:
   ```
   npm install
   ```

2. Start the app:
   ```
   npm start
   ```

## How to build

### Standard Windows installer
```
npm run build
```

### Windows Store package
```
npm run build-appx
```

This creates both a standard installer and an APPX package in the `dist` folder.

## Usage

- Click anywhere on the stopwatch to start/stop timing
- Right-click for reset (or whatever controls are implemented)
- Drag the window around to reposition it
- The window will remember its size when you resize it

## License

MIT - do whatever you want with it.
