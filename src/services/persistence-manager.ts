import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(__dirname, '../../data');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

export class PersistenceManager {
  private static saveTimers: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Save data to a JSON file with atomic writes (temp file + rename)
   */
  static async saveData<T>(filename: string, data: T): Promise<void> {
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
    } catch (error) {
      console.error(`[Persistence] Failed to save ${filename}:`, error);
      throw error;
    }
  }

  /**
   * Load data from a JSON file
   */
  static async loadData<T>(filename: string): Promise<T | null> {
    try {
      const filepath = path.join(DATA_DIR, filename);

      if (!fs.existsSync(filepath)) {
        console.log(`[Persistence] No persisted data found for ${filename}`);
        return null;
      }

      const content = await fs.promises.readFile(filepath, 'utf8');
      const data = JSON.parse(content) as T;

      console.log(`[Persistence] Loaded ${filename}`);
      return data;
    } catch (error) {
      console.error(`[Persistence] Failed to load ${filename}:`, error);

      // Try to load from backup
      const backupData = await this.loadFromLatestBackup<T>(filename);
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
  static debouncedSave<T>(
    filename: string,
    getData: () => T,
    delay: number = 2000
  ): void {
    // Clear existing timer for this file
    if (this.saveTimers.has(filename)) {
      clearTimeout(this.saveTimers.get(filename)!);
    }

    // Set new timer
    const timer = setTimeout(async () => {
      try {
        const data = getData();
        await this.saveData(filename, data);
        this.saveTimers.delete(filename);
      } catch (error) {
        console.error(`[Persistence] Debounced save failed for ${filename}:`, error);
        this.saveTimers.delete(filename);
      }
    }, delay);

    this.saveTimers.set(filename, timer);
  }

  /**
   * Immediately flush all pending debounced saves
   */
  static async flushAllSaves(): Promise<void> {
    const promises: Promise<void>[] = [];

    for (const [filename, timer] of this.saveTimers.entries()) {
      clearTimeout(timer);
      this.saveTimers.delete(filename);
    }

    await Promise.all(promises);
  }

  /**
   * Create a timestamped backup of the current file
   */
  static async createBackup(filename: string): Promise<void> {
    try {
      const sourceFile = path.join(DATA_DIR, filename);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(
        BACKUPS_DIR,
        `${filename.replace('.json', '')}_${timestamp}.json`
      );

      if (fs.existsSync(sourceFile)) {
        await fs.promises.copyFile(sourceFile, backupFile);
        console.log(`[Persistence] Created backup: ${path.basename(backupFile)}`);
      }
    } catch (error) {
      console.error('[Persistence] Failed to create backup:', error);
      // Don't throw - backup failure shouldn't prevent main save
    }
  }

  /**
   * Load from the latest backup file
   */
  static async loadFromLatestBackup<T>(filename: string): Promise<T | null> {
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
      const data = JSON.parse(content) as T;

      console.log(`[Persistence] Loaded from backup: ${latestBackup}`);
      return data;
    } catch (error) {
      console.error('[Persistence] Failed to load from backup:', error);
      return null;
    }
  }

  /**
   * Delete old backup files, keeping only the latest N backups
   */
  static async cleanupOldBackups(filename: string, keepCount: number = 5): Promise<void> {
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
    } catch (error) {
      console.error('[Persistence] Failed to cleanup old backups:', error);
      // Don't throw - cleanup failure shouldn't be fatal
    }
  }

  /**
   * Check if data directory is writable
   */
  static async isWritable(): Promise<boolean> {
    try {
      const testFile = path.join(DATA_DIR, '.write-test');
      await fs.promises.writeFile(testFile, 'test');
      await fs.promises.unlink(testFile);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get disk usage statistics
   */
  static async getStats(): Promise<{
    dataSize: number;
    backupCount: number;
    lastSave: Date | null;
  }> {
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
    } catch (error) {
      console.error('[Persistence] Failed to get stats:', error);
      return {
        dataSize: 0,
        backupCount: 0,
        lastSave: null,
      };
    }
  }
}
