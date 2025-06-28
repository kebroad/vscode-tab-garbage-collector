# VS Code Tab Garbage Collector Extension

A VS Code extension that automatically closes inactive tabs to keep your workspace clean and organized.

## Overview

This extension monitors tab activity and automatically closes tabs that haven't been viewed for a specified period. It helps reduce clutter and improve performance by removing unused tabs from your workspace.

## Features

- **Automatic Tab Cleanup**: Closes tabs that haven't been active for a configurable time period
- **Smart Window Management**: Optionally closes the entire window if it's the last remaining tab
- **Configurable Settings**: Customizable timeout periods and behavior options
- **Activity Tracking**: Monitors when tabs are viewed, edited, or become active
- **Safety Features**: Never closes tabs with unsaved changes or pinned tabs
- **Status Bar Integration**: Shows current status and inactive tab count
- **Manual Controls**: Commands for manual cleanup and statistics

## Installation

1. Clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run compile` to build the extension
4. Press F5 in VS Code to launch the extension in a new Extension Development Host window

## Usage

### Automatic Operation

Once installed and enabled, the extension will:
- Monitor all open tabs for activity
- Automatically close tabs that have been inactive for the configured time period
- Show a status indicator in the status bar
- Ask for confirmation before closing multiple tabs

### Manual Commands

The extension provides several commands accessible via the Command Palette (`Ctrl+Shift+P`):

- **Tab Garbage Collector: Cleanup Now** - Manually trigger cleanup of inactive tabs
- **Tab Garbage Collector: Show Statistics** - Display current tab statistics
- **Tab Garbage Collector: Toggle Enabled** - Quickly enable/disable the extension

### Status Bar

The extension adds a status bar item that shows:
- `$(check) Tab GC` - All tabs are active
- `$(trash) X inactive` - X tabs are ready for cleanup (clickable)
- `$(circle-slash) Tab GC` - Extension is disabled

## Configuration

### Settings

The extension can be configured through VS Code settings:

- `tabGarbageCollector.enabled` (boolean, default: true)
  - Enable or disable the tab garbage collector

- `tabGarbageCollector.inactiveTimeoutMinutes` (number, default: 30)
  - Number of minutes of inactivity before closing a tab
  - Range: 1-1440 minutes (1 minute to 24 hours)

- `tabGarbageCollector.closeWindowIfLastTab` (boolean, default: true)
  - Close the entire window if the last tab is being closed

- `tabGarbageCollector.excludePatterns` (array of strings, default: ["**/node_modules/**", "**/.git/**"])
  - File patterns to exclude from garbage collection
  - Uses glob patterns (e.g., "**/*.log", "**/temp/**")

### Example Configuration

```json
{
  "tabGarbageCollector.enabled": true,
  "tabGarbageCollector.inactiveTimeoutMinutes": 60,
  "tabGarbageCollector.closeWindowIfLastTab": false,
  "tabGarbageCollector.excludePatterns": [
    "**/node_modules/**",
    "**/.git/**",
    "**/*.log",
    "**/temp/**"
  ]
}
```

## Safety Features

The extension includes several safety mechanisms:

- **Never closes dirty tabs** - Tabs with unsaved changes are always preserved
- **Respects pinned tabs** - Pinned tabs are never automatically closed
- **User confirmation** - Asks for confirmation before closing multiple tabs
- **Exclude patterns** - Can exclude specific file types or directories
- **Graceful degradation** - Continues working even if some operations fail

## How It Works

1. **Activity Tracking**: The extension monitors when tabs become active, when files are edited, and when files are saved
2. **Timestamp Storage**: Each tab's last activity time is stored and updated
3. **Periodic Checks**: Every minute, the extension checks for inactive tabs
4. **Cleanup Process**: Inactive tabs are closed, with safety checks and user confirmation
5. **Window Management**: Optionally closes the window if it's the last remaining tab

## Development

### Project Structure

```
vscode-tab-garbage-collector/
├── src/
│   ├── extension.ts            # Main extension entry point
│   ├── tabManager.ts           # Core tab tracking and management logic
│   ├── activityTracker.ts      # Tab activity monitoring
│   └── configuration.ts        # Settings and configuration management
├── package.json                # Extension manifest and dependencies
└── README.md                   # This file
```

### Building and Testing

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch for changes
npm run watch

# Run tests
npm test

# Package for distribution
npm run package
```

### Debugging

1. Open the project in VS Code
2. Press F5 to launch the Extension Development Host
3. Open multiple files to test the extension
4. Check the Debug Console for logs
5. Use the Command Palette to test commands

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This extension is licensed under the MIT License.

## Changelog

### 0.0.1
- Initial release
- Basic tab garbage collection functionality
- Configuration options
- Status bar integration
- Manual commands 