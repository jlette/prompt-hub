export interface CategoryEntity {
  id: number;
  name: string;
}

export interface UserEntity {
  id: number;
  username: string;
  passwordHash: string;
}

export interface VoteEntity {
  promptId: number;
  userId: number;
  type: 'up' | 'down';
}

export interface PromptEntity {
  id: number;
  title: string;
  content: string;
  categoryId: number;
  userId: number;
  score: number;
  createdAt: string;
}

export interface DbSchema {
  categories: CategoryEntity[];
  users: UserEntity[];
  prompts: PromptEntity[];
  votes: VoteEntity[];
}
