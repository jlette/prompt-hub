import { Injectable } from '@nestjs/common';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import type {
  DbSchema,
  CategoryEntity,
  PromptEntity,
  UserEntity,
  VoteEntity,
} from './storage.types';

@Injectable()
export class StorageService {
  private readonly dbPath: string;

  constructor() {
    const dataDir = process.env.DATA_DIR ?? join(process.cwd(), 'data');
    this.dbPath = join(dataDir, 'db.json');
  }

  getDb(): DbSchema {
    this.ensureDataDir();
    if (!existsSync(this.dbPath)) {
      const initial: DbSchema = { categories: [], users: [], prompts: [], votes: [] };
      this.writeDb(initial);
      return initial;
    }
    const raw = readFileSync(this.dbPath, 'utf-8');
    const db = JSON.parse(raw) as DbSchema;
    this.migrateDb(db);
    return db;
  }

  /** Ensure users/votes exist and prompts have userId; create system user if missing */
  private migrateDb(db: DbSchema): void {
    let dirty = false;
    if (!db.users) {
      db.users = [];
      dirty = true;
    }
    if (!db.votes) {
      db.votes = [];
      dirty = true;
    }
    for (const p of db.prompts) {
      if ((p as PromptEntity & { userId?: number }).userId === undefined) {
        (p as PromptEntity).userId = 1;
        dirty = true;
      }
    }
    const hasSystemUser = db.users.some((u) => u.id === 1);
    if (!hasSystemUser && db.prompts.length > 0) {
      db.users.push({
        id: 1,
        username: 'Système',
        passwordHash:
          '$2b$10$placeholder.no.login.system.user.xYz123456789',
      });
      dirty = true;
    }
    if (dirty) this.writeDb(db);
  }

  private writeDb(db: DbSchema): void {
    this.ensureDataDir();
    writeFileSync(this.dbPath, JSON.stringify(db, null, 2), 'utf-8');
  }

  private ensureDataDir(): void {
    const dir = join(this.dbPath, '..');
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  saveDb(db: DbSchema): void {
    this.writeDb(db);
  }

  getNextPromptId(db: DbSchema): number {
    if (db.prompts.length === 0) return 1;
    return Math.max(...db.prompts.map((p) => p.id)) + 1;
  }

  getCategoryById(db: DbSchema, id: number): CategoryEntity | undefined {
    return db.categories.find((c) => c.id === id);
  }

  getPromptById(db: DbSchema, id: number): PromptEntity | undefined {
    return db.prompts.find((p) => p.id === id);
  }

  getNextUserId(db: DbSchema): number {
    if (db.users.length === 0) return 1;
    return Math.max(...db.users.map((u) => u.id)) + 1;
  }

  getUserById(db: DbSchema, id: number): UserEntity | undefined {
    return db.users.find((u) => u.id === id);
  }

  getUserByUsername(db: DbSchema, username: string): UserEntity | undefined {
    return db.users.find(
      (u) => u.username.toLowerCase() === username.toLowerCase(),
    );
  }

  getVote(
    db: DbSchema,
    promptId: number,
    userId: number,
  ): VoteEntity | undefined {
    return db.votes.find(
      (v) => v.promptId === promptId && v.userId === userId,
    );
  }

  setVote(db: DbSchema, promptId: number, userId: number, type: 'up' | 'down'): void {
    const existing = this.getVote(db, promptId, userId);
    if (existing) {
      existing.type = type;
    } else {
      db.votes.push({ promptId, userId, type });
    }
  }

  removeVote(db: DbSchema, promptId: number, userId: number): void {
    const index = db.votes.findIndex(
      (v) => v.promptId === promptId && v.userId === userId,
    );
    if (index !== -1) db.votes.splice(index, 1);
  }

  /** Remove a prompt and all its votes. */
  deletePrompt(db: DbSchema, promptId: number): void {
    db.prompts = db.prompts.filter((p) => p.id !== promptId);
    db.votes = db.votes.filter((v) => v.promptId !== promptId);
  }
}
