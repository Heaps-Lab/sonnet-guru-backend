import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuizzesService, QuizCalculationService } from './quizzes.service';
import {
  QuizzesController,
  QuizSubmissionsController,
} from './quizzes.controller';
import { Quiz } from './entities/quiz.entity';
import { QuizQuestion } from './entities/quiz-question.entity';
import { QuestionOption } from './entities/question-option.entity';
import { QuizSubmission } from './entities/quiz-submission.entity';
import { SubmissionAnswer } from './entities/submission-answer.entity';
import { Module as ModuleEntity } from '../modules/entities/module.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Quiz,
      QuizQuestion,
      QuestionOption,
      QuizSubmission,
      SubmissionAnswer,
      ModuleEntity,
    ]),
  ],
  controllers: [QuizzesController, QuizSubmissionsController],
  providers: [QuizzesService, QuizCalculationService],
  exports: [QuizzesService],
})
export class QuizzesModule {}
