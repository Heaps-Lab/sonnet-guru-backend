import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CompleteModuleDto {
  @ApiProperty({
    description: 'Mark module as completed to enable quiz creation',
    example: true,
  })
  @IsBoolean()
  isCompleted: boolean;
}
