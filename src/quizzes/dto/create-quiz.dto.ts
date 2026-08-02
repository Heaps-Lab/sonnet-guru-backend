import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateQuizDto {
  @ApiProperty({
    description: 'Quiz title',
    example: 'NestJS Guards and Interceptors Quiz',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Quiz description',
    example:
      'Test your knowledge of NestJS guards, interceptors, and middleware concepts',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Quiz duration in minutes',
    example: 30,
  })
  @IsNumber()
  duration: number;

  @ApiPropertyOptional({
    description: 'Total marks for the quiz',
    example: 100,
  })
  @IsNumber()
  @IsOptional()
  totalMarks?: number;

  @ApiPropertyOptional({
    description: 'Passing marks required',
    example: 60,
  })
  @IsNumber()
  @IsOptional()
  passingMarks?: number;

  @ApiPropertyOptional({
    description: 'Maximum attempts allowed',
    example: 3,
    default: 1,
  })
  @IsNumber()
  @IsOptional()
  maxAttempts?: number;

  @ApiPropertyOptional({
    description: 'Whether to shuffle questions',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  shuffleQuestions?: boolean;

  @ApiPropertyOptional({
    description: 'Whether to show results immediately after submission',
    example: true,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  showResultsImmediately?: boolean;
}
