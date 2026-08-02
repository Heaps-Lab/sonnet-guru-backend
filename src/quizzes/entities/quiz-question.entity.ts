import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Quiz } from './quiz.entity';
import { QuestionOption } from './question-option.entity';

@Entity('quiz_questions')
export class QuizQuestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  quizId: string;

  @ManyToOne(() => Quiz, (quiz) => quiz.questions)
  @JoinColumn({ name: 'quizId' })
  quiz: Quiz;

  @Column({ type: 'text' })
  questionText: string;

  @Column({ type: 'text', nullable: true })
  explanation: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 1.0 })
  marks: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0.0 })
  negativeMarking: number;

  @Column({ type: 'int' })
  correctOptionIndex: number;

  @Column({ type: 'int', default: 1 })
  sequenceNumber: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => QuestionOption, (option) => option.question, {
    cascade: true,
  })
  options: QuestionOption[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
