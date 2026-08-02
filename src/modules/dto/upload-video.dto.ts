import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class UploadVideoDto {
  @ApiProperty({
    description: 'Video title',
    example: 'Introduction to NestJS Guards',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    description: 'Video description',
    example:
      'Learn how to implement authentication and authorization guards in NestJS',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Video sequence number within the module',
    example: 1,
  })
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  sequenceNumber: number;

  @ApiPropertyOptional({
    description: 'Whether the video can be downloaded',
    example: false,
    default: true,
  })
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  @IsOptional()
  isDownloadable?: boolean;
}
