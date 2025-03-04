// backend/src/services/storage.service.js
const fs = require("fs").promises;
const path = require("path");
const cloudinary = require("../config/cloudinary").cloudinary;

class StorageService {
  constructor() {
    this.useCloudinary = process.env.USE_CLOUDINARY === "true";
  }

  async saveFile(file, directory = "uploads") {
    try {
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

    const result = await cloudinary.uploader.upload(file.path, {
      folder: `quotation-app/${folder}`,
    });

    return {
      url: result.secure_url,
      public_id: result.public_id,
      isCloudinary: true,
    };
  }

  async saveToLocalStorage(file, directory) {
    if (!file) {
      throw new Error("No file provided");
    }

    const targetDir = path.join(process.cwd(), directory);

    // Ensure directory exists
    await fs.mkdir(targetDir, { recursive: true });

    const filename = file.filename;
    const filepath = path.join(directory, filename);

    return {
      url: filepath,
      filename: filename,
      isCloudinary: false,
    };
  }

  async deleteFile(fileData) {
    if (!fileData) return;

    try {
      if (fileData.isCloudinary) {
        await cloudinary.uploader.destroy(fileData.public_id);
      } else {
        const filepath = path.join(process.cwd(), fileData.url);
        await fs.unlink(filepath);
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
