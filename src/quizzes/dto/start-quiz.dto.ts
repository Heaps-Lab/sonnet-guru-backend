import { IsOptional, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class StartQuizDto {
  @ApiPropertyOptional({
    description: 'Attempt number (if retaking)',
    example: 2,
  })
  @IsNumber()
  @IsOptional()
  attemptNumber?: number;
}
