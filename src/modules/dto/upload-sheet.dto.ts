import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

export class UploadSheetDto {
  @ApiProperty({
    description: 'Sheet title',
    example: 'NestJS Guards Reference Sheet',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    description: 'Sheet description',
    example: 'Quick reference guide for implementing guards in NestJS',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Whether the sheet can be downloaded',
    example: true,
    default: true,
    type: Boolean,
  })
  @Transform(({ value }) => {
    // Handle different input types
    if (value === undefined || value === null) return true; // Default to true
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const lowerValue = value.toLowerCase().trim();
      if (lowerValue === 'true' || lowerValue === '1') return true;
      if (lowerValue === 'false' || lowerValue === '0') return false;
      return true; // Default for invalid strings
    }
    if (typeof value === 'number') return value !== 0;
    return true; // Default fallback
  })
  @IsBoolean()
  @IsOptional()
  isDownloadable?: boolean = true;
}
