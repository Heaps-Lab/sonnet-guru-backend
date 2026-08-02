import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsArray,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class QuizOptionDto {
  @ApiProperty({
    description: 'Option index (0-based)',
    example: 0,
  })
  @IsNumber()
  optionIndex: number;

  @ApiProperty({
    description: 'Option text',
    example: '@Injectable()',
  })
  @IsString()
  @IsNotEmpty()
  text: string;
}

export class AddQuestionDto {
  @ApiProperty({
    description: 'Question text',
    example: 'Which decorator is used to mark a class as injectable in NestJS?',
  })
  @IsString()
  @IsNotEmpty()
  questionText: string;

  @ApiProperty({
    description: 'Question options',
    type: [QuizOptionDto],
    example: [
      { optionIndex: 0, text: '@Injectable()' },
      { optionIndex: 1, text: '@Component()' },
      { optionIndex: 2, text: '@Service()' },
      { optionIndex: 3, text: '@Provider()' },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizOptionDto)
  options: QuizOptionDto[];

  @ApiProperty({
    description: 'Index of the correct option',
    example: 0,
  })
  @IsNumber()
  @IsNotEmpty()
  correctOptionIndex: number;

  @ApiPropertyOptional({
    description: 'Explanation of the correct answer',
    example:
      '@Injectable() decorator marks a class as a provider that can be injected into other classes via dependency injection.',
  })
  @IsString()
  @IsOptional()
  explanation?: string;

  @ApiPropertyOptional({
    description: 'Negative marking for wrong answers',
    example: 0.25,
    default: 0,
  })
  @IsNumber()
  @IsOptional()
  negativeMarking?: number;

  @ApiPropertyOptional({
    description: 'Marks for correct answer',
    example: 2,
    default: 1,
  })
  @IsNumber()
  @IsOptional()
  marks?: number;

  @ApiPropertyOptional({
    description: 'Question sequence number',
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  sequenceNumber?: number;
}
