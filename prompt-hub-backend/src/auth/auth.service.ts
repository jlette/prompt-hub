import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Request } from 'express';
import { StorageService } from '../storage/storage.service';
import type { UserEntity } from '../storage/storage.types';
import type { JwtPayload } from './jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly storage: StorageService,
    private readonly jwtService: JwtService,
  ) {}

  async register(
    username: string,
    password: string,
  ): Promise<{ access_token: string; user: { id: number; username: string } }> {
    const db = this.storage.getDb();
    const existing = this.storage.getUserByUsername(db, username);
    if (existing) {
      throw new ConflictException('Username already taken');
    }
    const hash = await bcrypt.hash(password, 10);
    const id = this.storage.getNextUserId(db);
    db.users.push({ id, username, passwordHash: hash });
    this.storage.saveDb(db);
    return this.login({ id, username, passwordHash: hash });
  }

  async validateUser(username: string, password: string): Promise<UserEntity | null> {
    const db = this.storage.getDb();
    const user = this.storage.getUserByUsername(db, username);
    if (!user) return null;
    const ok = await bcrypt.compare(password, user.passwordHash);
    return ok ? user : null;
  }

  /** Returns token and user for cookie-based auth. */
  login(user: UserEntity): { access_token: string; user: { id: number; username: string } } {
    const payload = { sub: user.id, username: user.username };
    const access_token = this.jwtService.sign(payload);
    return { access_token, user: { id: user.id, username: user.username } };
  }

  async loginWithCredentials(
    username: string,
    password: string,
  ): Promise<{ access_token: string; user: { id: number; username: string } }> {
    const user = await this.validateUser(username, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.login(user);
  }

  /** Returns current user if valid JWT in request (cookie or header); otherwise null. */
  getOptionalUserFromRequest(req: Request): UserEntity | null {
    const token =
      (req as Request & { cookies?: { token?: string } }).cookies?.token ??
      (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);
    if (!token) return null;
    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      const db = this.storage.getDb();
      const user = this.storage.getUserById(db, payload.sub);
      return user ?? null;
    } catch {
      return null;
    }
  }
}
