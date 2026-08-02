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
import { User } from '../../users/entities/user.entity';
import { SubmissionAnswer } from './submission-answer.entity';

@Entity('quiz_submissions')
export class QuizSubmission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  quizId: string;

  @ManyToOne(() => Quiz, (quiz) => quiz.submissions)
  @JoinColumn({ name: 'quizId' })
  quiz: Quiz;

  @Column({ type: 'uuid' })
  studentId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'studentId' })
  student: User;

  @Column({ type: 'int', default: 1 })
  attemptNumber: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0.0 })
  totalScore: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0.0 })
  maxScore: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0.0 })
  percentage: number;

  @Column({ type: 'boolean', default: false })
  isPassed: boolean;

  @Column({
    type: 'enum',
    enum: ['in_progress', 'submitted', 'auto_submitted'],
    default: 'in_progress',
  })
  status: string;

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  submittedAt: Date;

  @Column({ type: 'int', nullable: true })
  timeSpent: number; // in seconds

  @OneToMany(() => SubmissionAnswer, (answer) => answer.submission, {
    cascade: true,
  })
  answers: SubmissionAnswer[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
