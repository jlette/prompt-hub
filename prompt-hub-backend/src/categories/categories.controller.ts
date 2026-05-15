import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StorageService } from '../storage/storage.service';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly storage: StorageService) {}

  @Get()
  @ApiOperation({ summary: 'List all categories' })
  @ApiResponse({ status: 200, description: 'List of categories' })
  findAll() {
    const db = this.storage.getDb();
    return db.categories;
  }
}
