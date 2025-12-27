export declare class PersistenceManager {
    private static saveTimers;
    /**
     * Save data to a JSON file with atomic writes (temp file + rename)
     */
    static saveData<T>(filename: string, data: T): Promise<void>;
    /**
     * Load data from a JSON file
     */
    static loadData<T>(filename: string): Promise<T | null>;
    /**
     * Debounced save - prevents excessive file I/O for frequent updates
     * Waits for `delay` milliseconds before actually saving
     */
    static debouncedSave<T>(filename: string, getData: () => T, delay?: number): void;
    /**
     * Immediately flush all pending debounced saves
     */
    static flushAllSaves(): Promise<void>;
    /**
     * Create a timestamped backup of the current file
     */
    static createBackup(filename: string): Promise<void>;
    /**
     * Load from the latest backup file
     */
    static loadFromLatestBackup<T>(filename: string): Promise<T | null>;
    /**
     * Delete old backup files, keeping only the latest N backups
     */
    static cleanupOldBackups(filename: string, keepCount?: number): Promise<void>;
    /**
     * Check if data directory is writable
     */
    static isWritable(): Promise<boolean>;
    /**
     * Get disk usage statistics
     */
    static getStats(): Promise<{
        dataSize: number;
        backupCount: number;
        lastSave: Date | null;
    }>;
}
//# sourceMappingURL=persistence-manager.d.ts.map