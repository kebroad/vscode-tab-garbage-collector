// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { ActivityTracker } from './activityTracker';
import { TabManager } from './tabManager';
import { Configuration } from './configuration';

let activityTracker: ActivityTracker;
let tabManager: TabManager;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Tab Garbage Collector extension is now active!');

	// Initialize components
	activityTracker = new ActivityTracker();
	tabManager = new TabManager(activityTracker);

	// Register commands
	const cleanupCommand = vscode.commands.registerCommand(
		'tabGarbageCollector.cleanupNow',
		async () => {
			await tabManager.cleanupNow();
		}
	);

	const statsCommand = vscode.commands.registerCommand(
		'tabGarbageCollector.showStats',
		() => {
			tabManager.showStats();
		}
	);

	const toggleCommand = vscode.commands.registerCommand(
		'tabGarbageCollector.toggleEnabled',
		async () => {
			await tabManager.toggleEnabled();
		}
	);

	// Add commands to subscriptions
	context.subscriptions.push(cleanupCommand, statsCommand, toggleCommand);

	// Show initial status
	const config = Configuration.getConfig();
	if (config.enabled) {
		vscode.window.showInformationMessage(
			`Tab Garbage Collector enabled (timeout: ${config.inactiveTimeoutMinutes} minutes)`
		);
	}
}

// This method is called when your extension is deactivated
export function deactivate() {
	if (tabManager) {
		tabManager.dispose();
	}
	if (activityTracker) {
		activityTracker.dispose();
	}
}
