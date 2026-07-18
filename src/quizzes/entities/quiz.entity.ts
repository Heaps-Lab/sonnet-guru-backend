import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Module } from '../../modules/entities/module.entity';

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

  @Column({ type: 'boolean', default: true })
  isPublished: boolean;

  @Column({ type: 'json' })
  questions: {
    questionText: string;
    options: {
      optionIndex: number;
      text: string;
    }[];
    correctOptionIndex: number;
    explanation: string;
    negativeMarking: number;
  }[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
