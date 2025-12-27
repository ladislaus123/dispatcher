export declare class FileStorage {
    /**
     * Save a base64 file and return a relative URL path
     */
    static saveBase64File(base64String: string, filename: string): string;
    /**
     * Delete a file by its relative URL
     */
    static deleteFile(fileUrl: string): void;
    /**
     * Clean up all uploaded files (useful for cleanup)
     */
    static cleanupUploads(): void;
}
//# sourceMappingURL=file-storage.d.ts.map