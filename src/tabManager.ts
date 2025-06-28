import * as vscode from 'vscode';
import { ActivityTracker, TabActivity } from './activityTracker';
import { Configuration } from './configuration';

export class TabManager {
    private activityTracker: ActivityTracker;
    private cleanupTimer: NodeJS.Timeout | undefined;
    private statusBarItem: vscode.StatusBarItem;
    private disposables: vscode.Disposable[] = [];

    constructor(activityTracker: ActivityTracker) {
        this.activityTracker = activityTracker;
        this.statusBarItem = vscode.window.createStatusBarItem(
            'tabGarbageCollector.status',
            vscode.StatusBarAlignment.Right,
            100
        );
        
        this.setupEventListeners();
        this.startCleanupTimer();
        this.updateStatusBar();
    }

    /**
     * Set up event listeners for configuration changes
     */
    private setupEventListeners(): void {
        this.disposables.push(
            Configuration.onConfigurationChanged(() => {
                this.restartCleanupTimer();
                this.updateStatusBar();
            })
        );
    }

    /**
     * Start the cleanup timer
     */
    private startCleanupTimer(): void {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
        }

        const config = Configuration.getConfig();
        if (!config.enabled) {
            this.cleanupTimer = undefined;
            return;
        }

        // Check every minute
        this.cleanupTimer = setInterval(() => {
            this.performCleanup();
        }, 60000); // 1 minute
    }

    /**
     * Restart the cleanup timer (called when configuration changes)
     */
    private restartCleanupTimer(): void {
        this.startCleanupTimer();
    }

    /**
     * Perform the cleanup operation
     */
    private async performCleanup(): Promise<void> {
        const config = Configuration.getConfig();
        if (!config.enabled) {
            return;
        }

        const inactiveTabs = this.activityTracker.getInactiveTabs();
        if (inactiveTabs.length === 0) {
            return;
        }

        // Get confirmation if closing multiple tabs
        if (inactiveTabs.length > 3) {
            const result = await vscode.window.showWarningMessage(
                `Close ${inactiveTabs.length} inactive tabs?`,
                'Yes', 'No'
            );
            
            if (result !== 'Yes') {
                return;
            }
        }

        await this.closeTabs(inactiveTabs);
        this.updateStatusBar();
    }

    /**
     * Close a list of tabs
     */
    private async closeTabs(tabs: TabActivity[]): Promise<void> {
        const config = Configuration.getConfig();
        let closedCount = 0;

        for (const tab of tabs) {
            try {
                // Double-check that the tab is still inactive and not dirty
                const currentActivity = this.activityTracker.getTabActivities().get(tab.uri);
                if (!currentActivity || currentActivity.isDirty || currentActivity.isPinned) {
                    continue;
                }

                // Close the tab
                await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
                closedCount++;

                // Small delay to prevent overwhelming the UI
                await new Promise(resolve => setTimeout(resolve, 100));

            } catch (error) {
                console.error(`Failed to close tab ${tab.uri}:`, error);
            }
        }

        if (closedCount > 0) {
            vscode.window.showInformationMessage(
                `Closed ${closedCount} inactive tab${closedCount > 1 ? 's' : ''}`
            );
        }

        // Check if we should close the window
        if (config.closeWindowIfLastTab && closedCount > 0) {
            await this.checkAndCloseWindow();
        }
    }

    /**
     * Check if window should be closed (if it's the last tab)
     */
    private async checkAndCloseWindow(): Promise<void> {
        const remainingTabs = this.activityTracker.getTabActivities();
        
        // Count non-excluded tabs
        let nonExcludedTabs = 0;
        remainingTabs.forEach(activity => {
            if (!Configuration.isFileExcluded(activity.uri)) {
                nonExcludedTabs++;
            }
        });

        if (nonExcludedTabs === 0) {
            console.log('[Tab Garbage Collector] Attempting to close window - no remaining tabs');
            try {
                await vscode.commands.executeCommand('workbench.action.closeWindow');
                console.log('[Tab Garbage Collector] Window close command executed successfully');
            } catch (error) {
                console.error('[Tab Garbage Collector] Failed to close window:', error);
            }
        }
    }

    /**
     * Update the status bar item
     */
    private updateStatusBar(): void {
        const config = Configuration.getConfig();
        const stats = this.activityTracker.getStats();

        if (!config.enabled) {
            this.statusBarItem.text = '$(circle-slash) Tab GC';
            this.statusBarItem.tooltip = 'Tab Garbage Collector is disabled';
            this.statusBarItem.show();
            return;
        }

        if (stats.inactiveTabs > 0) {
            this.statusBarItem.text = `$(trash) ${stats.inactiveTabs} inactive`;
            this.statusBarItem.tooltip = `${stats.inactiveTabs} inactive tabs ready for cleanup`;
            this.statusBarItem.command = 'tabGarbageCollector.cleanupNow';
        } else {
            this.statusBarItem.text = '$(check) Tab GC';
            this.statusBarItem.tooltip = 'All tabs are active';
            this.statusBarItem.command = undefined;
        }

        this.statusBarItem.show();
    }

    /**
     * Manual cleanup trigger
     */
    public async cleanupNow(): Promise<void> {
        await this.performCleanup();
    }

    /**
     * Show statistics
     */
    public showStats(): void {
        const stats = this.activityTracker.getStats();
        const config = Configuration.getConfig();
        
        const message = [
            `**Tab Garbage Collector Statistics**`,
            ``,
            `Total tabs: ${stats.totalTabs}`,
            `Dirty tabs: ${stats.dirtyTabs}`,
            `Pinned tabs: ${stats.pinnedTabs}`,
            `Inactive tabs: ${stats.inactiveTabs}`,
            ``,
            `Timeout: ${config.inactiveTimeoutMinutes} minutes`,
            `Enabled: ${config.enabled ? 'Yes' : 'No'}`,
            `Close window if last tab: ${config.closeWindowIfLastTab ? 'Yes' : 'No'}`
        ].join('\n');

        vscode.window.showInformationMessage(message);
    }

    /**
     * Toggle enabled state
     */
    public async toggleEnabled(): Promise<void> {
        const config = Configuration.getConfig();
        await Configuration.updateConfig('enabled', !config.enabled);
        
        const newState = !config.enabled;
        vscode.window.showInformationMessage(
            `Tab Garbage Collector ${newState ? 'enabled' : 'disabled'}`
        );
    }

    /**
     * Dispose of all resources
     */
    public dispose(): void {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
        }
        
        this.disposables.forEach(disposable => disposable.dispose());
        this.statusBarItem.dispose();
    }
} 