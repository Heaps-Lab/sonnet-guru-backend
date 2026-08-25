import { IsString, IsNotEmpty, IsOptional, IsInt, Min, IsUUID, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSubjectDto {
  @ApiProperty({
    description: 'The ID of the course this subject belongs to',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @IsUUID()
  @IsNotEmpty()
  courseId: string;

  @ApiProperty({
    description: 'Name of the subject',
    example: 'Introduction to JavaScript'
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Description of the subject',
    example: 'Learn the fundamentals of JavaScript programming'
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Order of the subject within the course',
    example: 1
  })
  @IsInt()
  @Min(1)
  sequenceOrder: number;

  @ApiPropertyOptional({
    description: 'Thumbnail URL for the subject',
    example: 'https://example.com/thumbnail.jpg'
  })
  @IsUrl()
  @IsOptional()
  thumbnailUrl?: string;
}