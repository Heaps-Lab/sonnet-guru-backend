import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { QuizSubmission } from './quiz-submission.entity';
import { QuizQuestion } from './quiz-question.entity';

@Entity('submission_answers')
export class SubmissionAnswer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  submissionId: string;

  @ManyToOne(() => QuizSubmission, (submission) => submission.answers)
  @JoinColumn({ name: 'submissionId' })
  submission: QuizSubmission;

  @Column({ type: 'uuid' })
  questionId: string;

  @ManyToOne(() => QuizQuestion)
  @JoinColumn({ name: 'questionId' })
  question: QuizQuestion;

  @Column({ type: 'int', nullable: true })
  selectedOptionIndex: number;

  @Column({ type: 'boolean', default: false })
  isCorrect: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0.0 })
  marksObtained: number;

  @CreateDateColumn({ type: 'timestamp' })
  answeredAt: Date;
}
