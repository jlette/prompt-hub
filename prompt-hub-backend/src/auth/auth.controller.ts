import { Controller, Post, Get, Body, UseGuards, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import * as express from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { CurrentUser } from './current-user.decorator';
import type { UserEntity } from '../storage/storage.types';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User created, cookie set, returns user' })
  @ApiResponse({ status: 409, description: 'Username already taken' })
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: express.Response) {
    const { access_token, user } = await this.authService.register(dto.username, dto.password);
    res.cookie('token', access_token, COOKIE_OPTIONS);
    return user;
  }

  @Post('login')
  @ApiOperation({ summary: 'Login' })
  @ApiResponse({ status: 201, description: 'Cookie set, returns user' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: express.Response) {
    const { access_token, user } = await this.authService.loginWithCredentials(
      dto.username,
      dto.password,
    );
    res.cookie('token', access_token, COOKIE_OPTIONS);
    return user;
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout (clears cookie)' })
  @ApiResponse({ status: 201, description: 'Cookie cleared' })
  logout(@Res({ passthrough: true }) res: express.Response) {
    res.clearCookie('token', { httpOnly: true, sameSite: 'lax', path: '/' });
    return { ok: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({ status: 200, description: 'Current user' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  me(@CurrentUser() user: UserEntity) {
    return { id: user.id, username: user.username };
  }
}
