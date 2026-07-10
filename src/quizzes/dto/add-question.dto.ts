import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsArray,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

class QuizOptionDto {
  @IsNumber()
  optionIndex: number;

  @IsString()
  @IsNotEmpty()
  text: string;
}

export class AddQuestionDto {
  @IsString()
  @IsNotEmpty()
  questionText: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizOptionDto)
  options: QuizOptionDto[];

  @IsNumber()
  @IsNotEmpty()
  correctOptionIndex: number;

  @IsString()
  @IsOptional()
  explanation?: string;

  @IsNumber()
  @IsOptional()
  negativeMarking?: number;
}
