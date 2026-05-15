import {
  Injectable,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import { StorageService } from '../storage/storage.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { UserEntity } from '../storage/storage.types';

const SYSTEM_USER_ID = 1;
const SYSTEM_USER_PLACEHOLDER_HASH =
  '$2b$10$placeholder.no.login.system.user.xYz123456789';

/**
 * When AUTH_ENABLED is not 'true': allows requests without JWT and sets
 * request.user to the system user (id 1). When AUTH_ENABLED is 'true':
 * requires valid JWT (same as JwtAuthGuard).
 */
@Injectable()
export class PromptAuthGuard implements CanActivate {
  constructor(
    private readonly storage: StorageService,
    private readonly jwtAuthGuard: JwtAuthGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const authEnabled = process.env.AUTH_ENABLED === 'true';

    if (authEnabled) {
      return this.jwtAuthGuard.canActivate(context) as Promise<boolean>;
    }

    const request = context.switchToHttp().getRequest();
    const db = this.storage.getDb();
    let user = this.storage.getUserById(db, SYSTEM_USER_ID);

    if (!user) {
      user = {
        id: SYSTEM_USER_ID,
        username: 'Système',
        passwordHash: SYSTEM_USER_PLACEHOLDER_HASH,
      };
      db.users.push(user);
      this.storage.saveDb(db);
    }

    request.user = user as UserEntity;
    return true;
  }
}
