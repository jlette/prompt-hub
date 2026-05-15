import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PromptsController } from './prompts.controller';

@Module({
  imports: [AuthModule],
  controllers: [PromptsController],
})
export class PromptsModule {}
