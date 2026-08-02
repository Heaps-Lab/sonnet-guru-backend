import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateModuleDto {
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
    description: 'Module sequence order within the course',
    example: 3,
  })
  @IsNumber()
  @IsNotEmpty()
  sequenceOrder: number;
}
