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
import { Module } from '../../modules/entities/module.entity';
import { QuizQuestion } from './quiz-question.entity';
import { QuizSubmission } from './quiz-submission.entity';

@Entity('quizzes')
export class Quiz {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  moduleId: string;

  @ManyToOne(() => Module, (module) => module.quizzes)
  @JoinColumn({ name: 'moduleId' })
  module: Module;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'int' })
  duration: number; // in minutes

  @Column({ type: 'int' })
  totalMarks: number;

  @Column({ type: 'int', default: 0 })
  passingMarks: number;

  @Column({ type: 'boolean', default: false })
  isPublished: boolean;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 1 })
  maxAttempts: number;

  @Column({ type: 'boolean', default: false })
  shuffleQuestions: boolean;

  @Column({ type: 'boolean', default: false })
  showResultsImmediately: boolean;

  @OneToMany(() => QuizQuestion, (question) => question.quiz, { cascade: true })
  questions: QuizQuestion[];

  @OneToMany(() => QuizSubmission, (submission) => submission.quiz)
  submissions: QuizSubmission[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
