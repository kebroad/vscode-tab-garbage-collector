import * as vscode from 'vscode';
import { minimatch } from 'minimatch';

export interface TabGarbageCollectorConfig {
    enabled: boolean;
    inactiveTimeoutMinutes: number;
    closeWindowIfLastTab: boolean;
    excludePatterns: string[];
}

export class Configuration {
    private static readonly CONFIG_SECTION = 'tabGarbageCollector';

    /**
     * Get the current configuration
     */
    public static getConfig(): TabGarbageCollectorConfig {
        const config = vscode.workspace.getConfiguration(this.CONFIG_SECTION);
        
        return {
            enabled: config.get<boolean>('enabled', true),
            inactiveTimeoutMinutes: config.get<number>('inactiveTimeoutMinutes', 30),
            closeWindowIfLastTab: config.get<boolean>('closeWindowIfLastTab', true),
            excludePatterns: config.get<string[]>('excludePatterns', ['**/node_modules/**', '**/.git/**'])
        };
    }

    /**
     * Update a specific configuration value
     */
    public static async updateConfig<K extends keyof TabGarbageCollectorConfig>(
        key: K, 
        value: TabGarbageCollectorConfig[K]
    ): Promise<void> {
        const config = vscode.workspace.getConfiguration(this.CONFIG_SECTION);
        await config.update(key, value, vscode.ConfigurationTarget.Global);
    }

    /**
     * Check if a file path should be excluded based on exclude patterns
     */
    public static isFileExcluded(filePath: string): boolean {
        const config = this.getConfig();
        const relativePath = vscode.workspace.asRelativePath(filePath);
        
        return config.excludePatterns.some(pattern => {
            try {
                return minimatch(relativePath, pattern);
            } catch {
                // Fallback to simple string matching if minimatch fails
                return relativePath.includes(pattern.replace(/\*\*/g, ''));
            }
        });
    }

    /**
     * Get the timeout in milliseconds
     */
    public static getTimeoutMs(): number {
        const config = this.getConfig();
        return config.inactiveTimeoutMinutes * 60 * 1000;
    }

    /**
     * Register configuration change listener
     */
    public static onConfigurationChanged(callback: () => void): vscode.Disposable {
        return vscode.workspace.onDidChangeConfiguration(event => {
            if (event.affectsConfiguration(this.CONFIG_SECTION)) {
                callback();
            }
        });
    }
} 