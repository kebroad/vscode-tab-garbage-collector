import * as vscode from 'vscode';
import { Configuration } from './configuration';

export interface TabActivity {
    uri: string;
    lastActivityTime: number;
    isDirty: boolean;
    isPinned: boolean;
}

export class ActivityTracker {
    private tabActivities = new Map<string, TabActivity>();
    private disposables: vscode.Disposable[] = [];

    constructor() {
        this.setupEventListeners();
    }

    /**
     * Set up event listeners for tracking tab activity
     */
    private setupEventListeners(): void {
        // Track when active editor changes
        this.disposables.push(
            vscode.window.onDidChangeActiveTextEditor(editor => {
                if (editor) {
                    this.updateActivity(editor.document.uri.toString());
                }
            })
        );

        // Track document changes
        this.disposables.push(
            vscode.workspace.onDidChangeTextDocument(event => {
                this.updateActivity(event.document.uri.toString());
            })
        );

        // Track document saves
        this.disposables.push(
            vscode.workspace.onDidSaveTextDocument(document => {
                this.updateActivity(document.uri.toString());
            })
        );

        // Track when documents are closed
        this.disposables.push(
            vscode.workspace.onDidCloseTextDocument(document => {
                this.removeActivity(document.uri.toString());
            })
        );

        // Initialize with currently open tabs
        this.initializeCurrentTabs();
    }

    /**
     * Initialize tracking for currently open tabs
     */
    private initializeCurrentTabs(): void {
        const currentTime = Date.now();
        
        // Get all open tabs
        vscode.window.tabGroups.all.forEach(group => {
            group.tabs.forEach(tab => {
                if (tab.input instanceof vscode.TabInputText) {
                    const uri = tab.input.uri.toString();
                    this.tabActivities.set(uri, {
                        uri,
                        lastActivityTime: currentTime,
                        isDirty: false,
                        isPinned: tab.isPinned
                    });
                }
            });
        });
    }

    /**
     * Update activity for a specific tab
     */
    public updateActivity(uri: string): void {
        const currentTime = Date.now();
        const existing = this.tabActivities.get(uri);
        
        // Check if file should be excluded
        if (Configuration.isFileExcluded(uri)) {
            return;
        }

        // Get document to check if it's dirty
        const document = vscode.workspace.textDocuments.find(doc => doc.uri.toString() === uri);
        const isDirty = document?.isDirty || false;

        // Get tab to check if it's pinned
        let isPinned = false;
        vscode.window.tabGroups.all.forEach(group => {
            group.tabs.forEach(tab => {
                if (tab.input instanceof vscode.TabInputText && tab.input.uri.toString() === uri) {
                    isPinned = tab.isPinned;
                }
            });
        });

        this.tabActivities.set(uri, {
            uri,
            lastActivityTime: currentTime,
            isDirty,
            isPinned
        });
    }

    /**
     * Remove activity tracking for a specific tab
     */
    public removeActivity(uri: string): void {
        this.tabActivities.delete(uri);
    }

    /**
     * Get all tab activities
     */
    public getTabActivities(): Map<string, TabActivity> {
        return new Map(this.tabActivities);
    }

    /**
     * Get inactive tabs that should be closed
     */
    public getInactiveTabs(): TabActivity[] {
        const timeoutMs = Configuration.getTimeoutMs();
        const currentTime = Date.now();
        const inactiveTabs: TabActivity[] = [];

        this.tabActivities.forEach(activity => {
            const timeSinceActivity = currentTime - activity.lastActivityTime;
            
            // Skip if tab is dirty, pinned, or hasn't been inactive long enough
            if (activity.isDirty || activity.isPinned || timeSinceActivity < timeoutMs) {
                return;
            }

            inactiveTabs.push(activity);
        });

        return inactiveTabs.sort((a, b) => a.lastActivityTime - b.lastActivityTime);
    }

    /**
     * Get statistics about tab activity
     */
    public getStats(): {
        totalTabs: number;
        dirtyTabs: number;
        pinnedTabs: number;
        inactiveTabs: number;
        oldestInactiveTime: number | null;
    } {
        const activities = Array.from(this.tabActivities.values());
        const currentTime = Date.now();
        const timeoutMs = Configuration.getTimeoutMs();

        const dirtyTabs = activities.filter(a => a.isDirty).length;
        const pinnedTabs = activities.filter(a => a.isPinned).length;
        const inactiveTabs = activities.filter(a => 
            !a.isDirty && 
            !a.isPinned && 
            (currentTime - a.lastActivityTime) >= timeoutMs
        ).length;

        const oldestInactive = activities
            .filter(a => !a.isDirty && !a.isPinned)
            .sort((a, b) => a.lastActivityTime - b.lastActivityTime)[0];

        return {
            totalTabs: activities.length,
            dirtyTabs,
            pinnedTabs,
            inactiveTabs,
            oldestInactiveTime: oldestInactive ? oldestInactive.lastActivityTime : null
        };
    }

    /**
     * Dispose of all event listeners
     */
    public dispose(): void {
        this.disposables.forEach(disposable => disposable.dispose());
        this.disposables = [];
        this.tabActivities.clear();
    }
} 