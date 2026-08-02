import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

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
  })
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  @IsOptional()
  isDownloadable?: boolean;
}
