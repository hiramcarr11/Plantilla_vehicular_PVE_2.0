import { ConfigService } from "@nestjs/config";
import { StorageDriver } from "./storage.types";

export type StorageConfig = {
  driver: StorageDriver;
  r2: {
    accountId: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucket: string;
    publicUrl: string;
  };
};

export function createStorageConfig(
  configService: ConfigService,
): StorageConfig {
  const driver = configService.get<string>("STORAGE_DRIVER", "local");

  if (driver !== "local" && driver !== "r2") {
    throw new Error('STORAGE_DRIVER debe ser "local" o "r2".');
  }

  return {
    driver,
    r2: {
      accountId: configService.get<string>("R2_ACCOUNT_ID", ""),
      accessKeyId: configService.get<string>("R2_ACCESS_KEY_ID", ""),
      secretAccessKey: configService.get<string>("R2_SECRET_ACCESS_KEY", ""),
      bucket: configService.get<string>("R2_BUCKET", ""),
      publicUrl: configService.get<string>("R2_PUBLIC_URL", ""),
    },
  };
}
