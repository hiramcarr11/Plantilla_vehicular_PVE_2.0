import { Injectable } from "@nestjs/common";
import { SavedFileInput, StorageProvider, StoredFile } from "../storage.types";
import { extname, join } from "path";
import { mkdir, writeFile } from "fs/promises";
import { randomBytes } from "crypto";

@Injectable()
export class LocalStorageProvider implements StorageProvider {
  private readonly uploadsRoot = join(process.cwd(), "uploads");

  async saveFile(input: SavedFileInput): Promise<StoredFile> {
    const { file, folder } = input;

    const safeExtension = extname(file.originalname).toLowerCase();
    const fileName = `${randomBytes(16).toString('hex')}${safeExtension}`;
    const folderPath = join(this.uploadsRoot, folder);
    const filePath = join(folderPath, fileName);

    await mkdir(folderPath, { recursive: true });
    await writeFile(filePath, file.buffer);

    const objectKey = `${folder}/${fileName}`;
    const publicUrl = `/uploads/${objectKey}`;

    return {
      originalName: file.originalname,
      fileName,
      objectKey,
      publicUrl,
      mimeType: file.mimetype,
      size: file.size,
      storageProvider: "local",
    };
  }
}
