import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCourseDto {
  @ApiProperty({
    description: 'Course title',
    example: 'Complete NestJS Backend Development',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Course description',
    example:
      'Learn to build scalable backend applications with NestJS, TypeORM, and MySQL',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({
    description: 'Full detailed description',
    example:
      'This comprehensive course covers advanced NestJS concepts, database design with TypeORM, authentication, authorization, and deployment strategies.',
  })
  @IsString()
  @IsOptional()
  fullDescription?: string;

  @ApiProperty({
    description: 'Course price in BDT',
    example: 4500.0,
  })
  @IsNumber()
  @IsNotEmpty()
  price: number;

  @ApiPropertyOptional({
    description: 'Course thumbnail URL',
    example: 'https://cdn.example.com/thumbnails/nestjs-course.jpg',
  })
  @IsString()
  @IsOptional()
  thumbnailUrl?: string;

  @ApiPropertyOptional({
    description: 'Course category',
    example: 'Web Development',
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({
    description: 'Course difficulty level',
    example: 'Intermediate',
    enum: ['Beginner', 'Intermediate', 'Advanced'],
  })
  @IsString()
  @IsOptional()
  level?: string;

  @ApiPropertyOptional({
    description: 'Whether the course is published and visible to students',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;
}
