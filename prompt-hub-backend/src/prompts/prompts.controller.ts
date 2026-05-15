import {
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Body,
  Param,
  ParseIntPipe,
  NotFoundException,
  ForbiddenException,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request as ExpressRequest } from 'express';
import { StorageService } from '../storage/storage.service';
import { AuthService } from '../auth/auth.service';
import { PromptAuthGuard } from '../auth/prompt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreatePromptDto } from './dto/create-prompt.dto';
import { UpdatePromptDto } from './dto/update-prompt.dto';
import type { DbSchema, PromptEntity, UserEntity } from '../storage/storage.types';

export interface PromptWithCategoryDto {
  id: number;
  title: string;
  content: string;
  score: number;
  createdAt: string;
  category: { id: number; name: string };
  author: { id: number; username: string };
  userVote: 'up' | 'down' | null;
}

function buildPromptDto(
  prompt: PromptEntity,
  db: DbSchema,
  storage: StorageService,
  currentUserId: number | undefined,
): PromptWithCategoryDto {
  const category = storage.getCategoryById(db, prompt.categoryId);
  const authorEntity = storage.getUserById(db, prompt.userId);
  const vote = currentUserId
    ? storage.getVote(db, prompt.id, currentUserId)
    : undefined;
  // userVote is always set: null when not connected or when user has not voted
  const userVote: 'up' | 'down' | null = vote?.type ?? null;
  return {
    id: prompt.id,
    title: prompt.title,
    content: prompt.content,
    score: prompt.score,
    createdAt: prompt.createdAt,
    category: category ?? { id: prompt.categoryId, name: '' },
    author: authorEntity
      ? { id: authorEntity.id, username: authorEntity.username }
      : { id: prompt.userId, username: '' },
    userVote,
  };
}

@ApiTags('Prompts')
@Controller('prompts')
export class PromptsController {
  constructor(
    private readonly storage: StorageService,
    private readonly authService: AuthService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all prompts (optional auth for userVote)' })
  @ApiResponse({ status: 200, description: 'List of prompts' })
  findAll(@Req() req: ExpressRequest): PromptWithCategoryDto[] {
    const db = this.storage.getDb();
    const currentUser = this.authService.getOptionalUserFromRequest(req);
    const currentUserId = currentUser?.id;
    const sorted = [...db.prompts].sort((a, b) => b.score - a.score);
    return sorted.map((prompt) =>
      buildPromptDto(prompt, db, this.storage, currentUserId),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one prompt by id' })
  @ApiResponse({ status: 200, description: 'Prompt' })
  @ApiResponse({ status: 404, description: 'Prompt not found' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: ExpressRequest,
  ): PromptWithCategoryDto {
    const db = this.storage.getDb();
    const prompt = this.storage.getPromptById(db, id);
    if (!prompt) throw new NotFoundException('Prompt not found');
    const currentUser = this.authService.getOptionalUserFromRequest(req);
    return buildPromptDto(prompt, db, this.storage, currentUser?.id);
  }

  @UseGuards(PromptAuthGuard)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a prompt (auth required when AUTH_ENABLED=true)' })
  @ApiResponse({ status: 201, description: 'Prompt created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(
    @Body() dto: CreatePromptDto,
    @CurrentUser() user: UserEntity,
  ): PromptWithCategoryDto {
    const db = this.storage.getDb();
    const id = this.storage.getNextPromptId(db);
    const prompt: PromptEntity = {
      id,
      title: dto.title,
      content: dto.content,
      categoryId: dto.categoryId,
      userId: user.id,
      score: 0,
      createdAt: new Date().toISOString(),
    };
    db.prompts.push(prompt);
    this.storage.saveDb(db);
    return buildPromptDto(prompt, db, this.storage, user.id);
  }

  @UseGuards(PromptAuthGuard)
  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a prompt (author only when AUTH_ENABLED=true)' })
  @ApiResponse({ status: 200, description: 'Prompt updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not the author' })
  @ApiResponse({ status: 404, description: 'Prompt not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePromptDto,
    @CurrentUser() user: UserEntity,
  ): PromptWithCategoryDto {
    const db = this.storage.getDb();
    const prompt = this.storage.getPromptById(db, id);
    if (!prompt) throw new NotFoundException('Prompt not found');
    // System user (id 1) can edit any prompt when auth is disabled
    const isSystemUser = user.id === 1;
    if (!isSystemUser && prompt.userId !== user.id) {
      throw new ForbiddenException('Not the author');
    }
    prompt.title = dto.title;
    prompt.content = dto.content;
    prompt.categoryId = dto.categoryId;
    this.storage.saveDb(db);
    return buildPromptDto(prompt, db, this.storage, user.id);
  }

  @UseGuards(PromptAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a prompt (author only when AUTH_ENABLED=true)' })
  @ApiResponse({ status: 204, description: 'Prompt deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not the author' })
  @ApiResponse({ status: 404, description: 'Prompt not found' })
  delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserEntity,
  ): void {
    const db = this.storage.getDb();
    const prompt = this.storage.getPromptById(db, id);
    if (!prompt) throw new NotFoundException('Prompt not found');
    const isSystemUser = user.id === 1;
    if (!isSystemUser && prompt.userId !== user.id) {
      throw new ForbiddenException('Not the author');
    }
    this.storage.deletePrompt(db, id);
    this.storage.saveDb(db);
  }

  @UseGuards(PromptAuthGuard)
  @Post(':id/upvote')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upvote a prompt (auth required when AUTH_ENABLED=true)' })
  @ApiResponse({ status: 200, description: 'Prompt with updated score' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Prompt not found' })
  upvote(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserEntity,
  ): PromptWithCategoryDto {
    return this.applyVote(id, user.id, 'up');
  }

  @UseGuards(PromptAuthGuard)
  @Post(':id/downvote')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Downvote a prompt (auth required when AUTH_ENABLED=true)' })
  @ApiResponse({ status: 200, description: 'Prompt with updated score' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Prompt not found' })
  downvote(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserEntity,
  ): PromptWithCategoryDto {
    return this.applyVote(id, user.id, 'down');
  }

  private applyVote(
    promptId: number,
    userId: number,
    type: 'up' | 'down',
  ): PromptWithCategoryDto {
    const db = this.storage.getDb();
    const prompt = this.storage.getPromptById(db, promptId);
    if (!prompt) throw new NotFoundException('Prompt not found');
    const existing = this.storage.getVote(db, promptId, userId);
    const delta = type === 'up' ? 1 : -1;
    if (!existing) {
      prompt.score += delta;
      this.storage.setVote(db, promptId, userId, type);
    } else if (existing.type === type) {
      prompt.score -= delta;
      this.storage.removeVote(db, promptId, userId);
    } else {
      prompt.score += delta * 2;
      this.storage.setVote(db, promptId, userId, type);
    }
    this.storage.saveDb(db);
    return buildPromptDto(prompt, db, this.storage, userId);
  }
}
