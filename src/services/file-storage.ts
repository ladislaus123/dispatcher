import * as fs from 'fs';
import * as path from 'path';

const UPLOADS_DIR = path.join(__dirname, '../../uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export class FileStorage {
  /**
   * Save a base64 file and return a relative URL path
   */
  static saveBase64File(base64String: string, filename: string): string {
    try {
      // Validate inputs
      if (!base64String || !filename) {
        throw new Error('base64String and filename are required');
      }

      // Extract the base64 data (remove data URL prefix if present)
      let base64Data = base64String;
      if (base64String.includes(',')) {
        base64Data = base64String.split(',')[1];
      }

      // Validate base64 format
      if (!base64Data || !/^[A-Za-z0-9+/=]*$/.test(base64Data)) {
        throw new Error('Invalid base64 format');
      }

      // Create a unique filename
      const timestamp = Date.now();
      const random = Math.random().toString(36).substr(2, 9);
      const uniqueFilename = `${timestamp}_${random}_${filename}`;

      // Write file to disk
      const filePath = path.join(UPLOADS_DIR, uniqueFilename);
      const buffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(filePath, buffer);

      // Return relative path that works from the browser
      const fileUrl = `/uploads/${uniqueFilename}`;
      return fileUrl;
    } catch (error: any) {
      throw new Error(`File storage error: ${error.message}`);
    }
  }

  /**
   * Delete a file by its relative URL
   */
  static deleteFile(fileUrl: string): void {
    const filename = path.basename(fileUrl);
    const filePath = path.join(UPLOADS_DIR, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  /**
   * Clean up all uploaded files (useful for cleanup)
   */
  static cleanupUploads(): void {
    if (fs.existsSync(UPLOADS_DIR)) {
      const files = fs.readdirSync(UPLOADS_DIR);
      files.forEach(file => {
        const filePath = path.join(UPLOADS_DIR, file);
        fs.unlinkSync(filePath);
      });
    }
  }
}
