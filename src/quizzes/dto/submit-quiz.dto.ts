import {
  IsArray,
  IsNumber,
  IsUUID,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class QuizAnswerDto {
  @ApiProperty({
    description: 'Question ID',
    example: 'uuid-string',
  })
  @IsUUID()
  questionId: string;

  @ApiProperty({
    description: 'Selected option index (0-based)',
    example: 2,
  })
  @IsNumber()
  @IsOptional()
  selectedOptionIndex?: number;
}

export class SubmitQuizDto {
  @ApiProperty({
    description: 'Quiz answers',
    type: [QuizAnswerDto],
    example: [
      { questionId: 'uuid-1', selectedOptionIndex: 0 },
      { questionId: 'uuid-2', selectedOptionIndex: 2 },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizAnswerDto)
  answers: QuizAnswerDto[];

  @ApiProperty({
    description: 'Time spent on quiz in seconds',
    example: 1800,
  })
  @IsNumber()
  @IsOptional()
  timeSpent?: number;
}
