import { Injectable } from "@nestjs/common";
import { SavedFileInput, StorageProvider, StoredFile } from "../storage.types";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { ConfigService } from "@nestjs/config";
import { createStorageConfig } from "../storage.config";
import { extname } from "path";
import { randomBytes } from "crypto";

@Injectable()
export class R2StorageProvider implements StorageProvider {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(private readonly configService: ConfigService) {
    const storageConfig = createStorageConfig(this.configService);

    const missingValues = [
      ["R2_ACCOUNT_ID", storageConfig.r2.accountId],
      ["R2_ACCESS_KEY_ID", storageConfig.r2.accessKeyId],
      ["R2_SECRET_ACCESS_KEY", storageConfig.r2.secretAccessKey],
      ["R2_BUCKET", storageConfig.r2.bucket],
      ["R2_PUBLIC_URL", storageConfig.r2.publicUrl],
    ].filter(([, value]) => !value);

    if (missingValues.length > 0) {
      throw new Error(
        `Faltan variables de entorno para Cloudflare R2: ${missingValues
          .map(([key]) => key)
          .join(", ")}`,
      );
    }

    this.bucket = storageConfig.r2.bucket;
    this.publicUrl = storageConfig.r2.publicUrl.replace(/\/$/, "");

    this.client = new S3Client({
      region: "auto",
      endpoint: `https://${storageConfig.r2.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: storageConfig.r2.accessKeyId,
        secretAccessKey: storageConfig.r2.secretAccessKey,
      },
    });
  }

  async saveFile(input: SavedFileInput): Promise<StoredFile> {
    const { file, folder } = input;

    const safeExtension = extname(file.originalname).toLowerCase();
    const fileName = `${randomBytes(16).toString("hex")}${safeExtension}`;
    const objectKey = `${folder}/${fileName}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
        Body: file.buffer,
        ContentType: file.mimetype,
        ContentLength: file.size,
      }),
    );

    return {
      originalName: file.originalname,
      fileName,
      objectKey,
      publicUrl: `${this.publicUrl}/${objectKey}`,
      mimeType: file.mimetype,
      size: file.size,
      storageProvider: "r2",
    };
  }
}
