import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsUrl,
  ValidateIf,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class UpdateVideoDto {
  @ApiPropertyOptional({
    description: 'Video title',
    example: 'Introduction to NestJS Guards',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    description: 'Video description',
    example:
      'Learn how to implement authentication and authorization guards in NestJS',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Video sequence number within the module',
    example: 1,
  })
  @Transform(({ value }) => (value ? parseInt(value) : undefined))
  @IsNumber()
  @IsOptional()
  sequenceNumber?: number;

  @ApiPropertyOptional({
    description: 'Direct video URL (to replace uploaded video or update external URL)',
    example: 'https://example.com/videos/course-intro.mp4',
  })
  @ValidateIf((o) => o.videoUrl !== undefined && o.videoUrl !== '')
  @IsUrl({}, { message: 'videoUrl must be a valid URL' })
  @IsOptional()
  videoUrl?: string;

  @ApiPropertyOptional({
    description: 'Duration in seconds (when updating videoUrl)',
    example: 300,
  })
  @IsNumber()
  @IsOptional()
  duration?: number;

  @ApiPropertyOptional({
    description: 'Whether the video can be downloaded',
    example: false,
  })
  @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : undefined))
  @IsBoolean()
  @IsOptional()
  isDownloadable?: boolean;

  @ApiPropertyOptional({
    description: 'Whether to keep the current video or replace it (for URL updates)',
    example: true,
    default: true,
  })
  @Transform(({ value }) => value !== 'false')
  @IsBoolean()
  @IsOptional()
  keepExisting?: boolean;
}
