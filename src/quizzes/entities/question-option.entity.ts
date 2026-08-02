import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { QuizQuestion } from './quiz-question.entity';

@Entity('question_options')
export class QuestionOption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  questionId: string;

  @ManyToOne(() => QuizQuestion, (question) => question.options)
  @JoinColumn({ name: 'questionId' })
  question: QuizQuestion;

  @Column({ type: 'int' })
  optionIndex: number;

  @Column({ type: 'text' })
  text: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
