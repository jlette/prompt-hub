import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { StorageService } from '../storage/storage.service';
import type { UserEntity } from '../storage/storage.types';

export interface JwtPayload {
  sub: number;
  username: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly storage: StorageService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => req?.cookies?.token ?? null,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'prompt-hub-dev-secret-change-in-prod',
    });
  }

  async validate(payload: JwtPayload): Promise<UserEntity> {
    const db = this.storage.getDb();
    const user = this.storage.getUserById(db, payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
