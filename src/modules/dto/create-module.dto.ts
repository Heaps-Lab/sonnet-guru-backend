import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateModuleDto {
  @ApiProperty({
    description: 'Subject ID this module belongs to',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  subjectId: string;

  @ApiPropertyOptional({
    description: 'Course ID (optional, for backward compatibility)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID()
  @IsOptional()
  courseId?: string;

  @ApiProperty({
    description: 'Module title',
    example: 'Module 3: Advanced NestJS Concepts',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Module description',
    example:
      'Learn advanced NestJS concepts including guards, interceptors, and custom decorators',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Module sequence order within the subject',
    example: 3,
  })
  @IsNumber()
  @IsNotEmpty()
  sequenceOrder: number;
}
