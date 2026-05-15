import { Module } from '@nestjs/common';
import { StorageModule } from './storage/storage.module';
import { CategoriesModule } from './categories/categories.module';
import { PromptsModule } from './prompts/prompts.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [StorageModule, CategoriesModule, PromptsModule, AuthModule],
})
export class AppModule {}
