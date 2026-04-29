import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { STORAGE_PROVIDER } from './storage.constants';
import { createStorageConfig } from './storage.config';
import { LocalStorageProvider } from './providers/local-storage.provider';
import { R2StorageProvider } from './providers/r2-storage.provider';
import { StorageService } from './storage.service';

@Module({
  imports: [ConfigModule],
  providers: [
    LocalStorageProvider,
    {
      provide: STORAGE_PROVIDER,
      inject: [ConfigService, LocalStorageProvider],
      useFactory: (
        configService: ConfigService,
        localStorageProvider: LocalStorageProvider,
      ) => {
        const storageConfig = createStorageConfig(configService);

        if (storageConfig.driver === 'local') {
          return localStorageProvider;
        }

        return new R2StorageProvider(configService);
      },
    },
    StorageService,
  ],
  exports: [StorageService],
})
export class StorageModule {}