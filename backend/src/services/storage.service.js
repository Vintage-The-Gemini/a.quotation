// backend/src/services/storage.service.js
const fs = require("fs-extra");
const path = require("path");
const cloudinary = require("../config/cloudinary").cloudinary;

class StorageService {
  constructor() {
    this.useCloudinary = process.env.USE_CLOUDINARY === "true";
    console.log(
      `Storage Service initialized with Cloudinary: ${this.useCloudinary}`
    );
  }

  async saveFile(file, directory = "uploads") {
    try {
      if (!file) {
        throw new Error("No file provided");
      }

      console.log(`Saving file: ${file.originalname} to ${directory}`);

      if (this.useCloudinary) {
        return await this.saveToCloudinary(file, directory);
      } else {
        return await this.saveToLocalStorage(file, directory);
      }
    } catch (error) {
      console.error(`Error saving file: ${error.message}`);
      throw error;
    }
  }

  async saveToCloudinary(file, folder) {
    if (!file) {
      throw new Error("No file provided");
    }

    try {
      console.log(`Uploading to Cloudinary: ${file.originalname}`);

      // Ensure the file path is absolute
      const filePath = file.path.startsWith("/")
        ? file.path
        : path.join(process.cwd(), file.path);

      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(filePath, {
        folder: `quotation-app/${folder}`,
        resource_type: "auto", // Allow different types of files
      });

      console.log(`Cloudinary upload successful: ${result.secure_url}`);

      return {
        url: result.secure_url,
        public_id: result.public_id,
        isCloudinary: true,
      };
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      throw new Error(`Failed to upload to Cloudinary: ${error.message}`);
    }
  }

  async saveToLocalStorage(file, directory) {
    if (!file) {
      throw new Error("No file provided");
    }

    console.log(`Saving to local storage: ${file.originalname}`);

    const targetDir = path.join(process.cwd(), directory);

    try {
      // Ensure directory exists
      await fs.ensureDir(targetDir);
      console.log(`Ensured directory exists: ${targetDir}`);

      // Get the filename from the path (in case multer stored it somewhere temporary)
      const filename = path.basename(file.path);
      const targetPath = path.join(directory, filename);
      console.log(`Target path: ${targetPath}`);

      // If file is not already in the target directory, copy it there
      if (file.path !== path.join(process.cwd(), targetPath)) {
        const sourcePath = file.path;
        const destinationPath = path.join(process.cwd(), targetPath);

        console.log(`Copying from ${sourcePath} to ${destinationPath}`);

        // Copy file to destination
        await fs.copyFile(sourcePath, destinationPath);

        // Remove the original file (if it was temporary)
        try {
          await fs.unlink(sourcePath);
          console.log(`Removed temporary file: ${sourcePath}`);
        } catch (unlinkError) {
          console.warn(`Could not remove temp file: ${unlinkError.message}`);
        }
      }

      return {
        url: targetPath,
        filename: filename,
        isCloudinary: false,
      };
    } catch (error) {
      console.error("Local file save error:", error);
      throw new Error(`Failed to save file locally: ${error.message}`);
    }
  }

  async deleteFile(fileData) {
    if (!fileData) return;

    try {
      console.log(`Attempting to delete file:`, fileData);

      if (fileData.isCloudinary && fileData.public_id) {
        console.log(`Deleting from Cloudinary: ${fileData.public_id}`);
        await cloudinary.uploader.destroy(fileData.public_id);
        console.log("Cloudinary file deleted successfully");
      } else if (fileData.url) {
        const filepath = path.join(process.cwd(), fileData.url);
        console.log(`Deleting local file: ${filepath}`);

        try {
          await fs.access(filepath);
          await fs.unlink(filepath);
          console.log("Local file deleted successfully");
        } catch (error) {
          console.error(
            `File does not exist or cannot be accessed: ${filepath}`
          );
        }
      }
    } catch (error) {
      console.error(`Error deleting file: ${error.message}`);
      // Don't throw error to prevent blocking operations
    }
  }

  getFileUrl(fileData) {
    if (!fileData) return null;

    if (fileData.isCloudinary) {
      return fileData.url;
    } else {
      return process.env.API_URL
        ? `${process.env.API_URL}/${fileData.url}`
        : `/${fileData.url}`;
    }
  }
}

module.exports = new StorageService();
