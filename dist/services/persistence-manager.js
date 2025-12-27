"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersistenceManager = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const DATA_DIR = path.join(__dirname, '../../data');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');
// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}
class PersistenceManager {
    /**
     * Save data to a JSON file with atomic writes (temp file + rename)
     */
    static async saveData(filename, data) {
        try {
            const filepath = path.join(DATA_DIR, filename);
            const tempFilepath = filepath + '.tmp';
            // Serialize data to JSON with 2-space indentation
            const jsonData = JSON.stringify(data, null, 2);
            // Write to temp file first
            await fs.promises.writeFile(tempFilepath, jsonData, 'utf8');
            // Create backup of existing file if it exists
            if (fs.existsSync(filepath)) {
                await this.createBackup(filename);
            }
            // Atomically rename temp file to target file
            await fs.promises.rename(tempFilepath, filepath);
            console.log(`[Persistence] Saved ${filename}`);
        }
        catch (error) {
            console.error(`[Persistence] Failed to save ${filename}:`, error);
            throw error;
        }
    }
    /**
     * Load data from a JSON file
     */
    static async loadData(filename) {
        try {
            const filepath = path.join(DATA_DIR, filename);
            if (!fs.existsSync(filepath)) {
                console.log(`[Persistence] No persisted data found for ${filename}`);
                return null;
            }
            const content = await fs.promises.readFile(filepath, 'utf8');
            const data = JSON.parse(content);
            console.log(`[Persistence] Loaded ${filename}`);
            return data;
        }
        catch (error) {
            console.error(`[Persistence] Failed to load ${filename}:`, error);
            // Try to load from backup
            const backupData = await this.loadFromLatestBackup(filename);
            if (backupData) {
                console.log(`[Persistence] Recovered ${filename} from backup`);
                return backupData;
            }
            return null;
        }
    }
    /**
     * Debounced save - prevents excessive file I/O for frequent updates
     * Waits for `delay` milliseconds before actually saving
     */
    static debouncedSave(filename, getData, delay = 2000) {
        // Clear existing timer for this file
        if (this.saveTimers.has(filename)) {
            clearTimeout(this.saveTimers.get(filename));
        }
        // Set new timer
        const timer = setTimeout(async () => {
            try {
                const data = getData();
                await this.saveData(filename, data);
                this.saveTimers.delete(filename);
            }
            catch (error) {
                console.error(`[Persistence] Debounced save failed for ${filename}:`, error);
                this.saveTimers.delete(filename);
            }
        }, delay);
        this.saveTimers.set(filename, timer);
    }
    /**
     * Immediately flush all pending debounced saves
     */
    static async flushAllSaves() {
        const promises = [];
        for (const [filename, timer] of this.saveTimers.entries()) {
            clearTimeout(timer);
            this.saveTimers.delete(filename);
        }
        await Promise.all(promises);
    }
    /**
     * Create a timestamped backup of the current file
     */
    static async createBackup(filename) {
        try {
            const sourceFile = path.join(DATA_DIR, filename);
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFile = path.join(BACKUPS_DIR, `${filename.replace('.json', '')}_${timestamp}.json`);
            if (fs.existsSync(sourceFile)) {
                await fs.promises.copyFile(sourceFile, backupFile);
                console.log(`[Persistence] Created backup: ${path.basename(backupFile)}`);
            }
        }
        catch (error) {
            console.error('[Persistence] Failed to create backup:', error);
            // Don't throw - backup failure shouldn't prevent main save
        }
    }
    /**
     * Load from the latest backup file
     */
    static async loadFromLatestBackup(filename) {
        try {
            const prefix = filename.replace('.json', '');
            const files = await fs.promises.readdir(BACKUPS_DIR);
            const backupFiles = files
                .filter(f => f.startsWith(prefix))
                .sort()
                .reverse();
            if (backupFiles.length === 0) {
                return null;
            }
            const latestBackup = backupFiles[0];
            const backupPath = path.join(BACKUPS_DIR, latestBackup);
            const content = await fs.promises.readFile(backupPath, 'utf8');
            const data = JSON.parse(content);
            console.log(`[Persistence] Loaded from backup: ${latestBackup}`);
            return data;
        }
        catch (error) {
            console.error('[Persistence] Failed to load from backup:', error);
            return null;
        }
    }
    /**
     * Delete old backup files, keeping only the latest N backups
     */
    static async cleanupOldBackups(filename, keepCount = 5) {
        try {
            const prefix = filename.replace('.json', '');
            const files = await fs.promises.readdir(BACKUPS_DIR);
            const backupFiles = files
                .filter(f => f.startsWith(prefix))
                .sort()
                .reverse();
            // Delete files beyond keepCount
            for (let i = keepCount; i < backupFiles.length; i++) {
                const oldBackup = path.join(BACKUPS_DIR, backupFiles[i]);
                await fs.promises.unlink(oldBackup);
                console.log(`[Persistence] Deleted old backup: ${backupFiles[i]}`);
            }
        }
        catch (error) {
            console.error('[Persistence] Failed to cleanup old backups:', error);
            // Don't throw - cleanup failure shouldn't be fatal
        }
    }
    /**
     * Check if data directory is writable
     */
    static async isWritable() {
        try {
            const testFile = path.join(DATA_DIR, '.write-test');
            await fs.promises.writeFile(testFile, 'test');
            await fs.promises.unlink(testFile);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Get disk usage statistics
     */
    static async getStats() {
        try {
            let dataSize = 0;
            const files = await fs.promises.readdir(DATA_DIR);
            for (const file of files) {
                if (file !== 'backups' && file !== '.write-test') {
                    const stat = await fs.promises.stat(path.join(DATA_DIR, file));
                    dataSize += stat.size;
                }
            }
            const backupFiles = await fs.promises.readdir(BACKUPS_DIR);
            return {
                dataSize,
                backupCount: backupFiles.length,
                lastSave: new Date(),
            };
        }
        catch (error) {
            console.error('[Persistence] Failed to get stats:', error);
            return {
                dataSize: 0,
                backupCount: 0,
                lastSave: null,
            };
        }
    }
}
exports.PersistenceManager = PersistenceManager;
PersistenceManager.saveTimers = new Map();
//# sourceMappingURL=persistence-manager.js.map