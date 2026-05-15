import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'alice' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: 'secret123', minLength: 4 })
  @IsString()
  @IsNotEmpty()
  @MinLength(4, { message: 'Password must be at least 4 characters' })
  password: string;
}
