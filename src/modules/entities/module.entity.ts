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
import { Course } from '../../courses/entities/course.entity';
import { Subject } from '../../subjects/entities/subject.entity';
import { Quiz } from '../../quizzes/entities/quiz.entity';
import { Video } from './video.entity';
import { ModuleSheet } from './module-sheet.entity';

@Entity('modules')
export class Module {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  subjectId: string;

  @ManyToOne(() => Subject, (subject) => subject.modules)
  @JoinColumn({ name: 'subjectId' })
  subject: Subject;

  // Keep course relationship for backward compatibility and easy access
  @Column({ type: 'uuid', nullable: true })
  courseId: string;

  @ManyToOne(() => Course, (course) => course.modules)
  @JoinColumn({ name: 'courseId' })
  course: Course;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'int' })
  sequenceOrder: number;

  @Column({ type: 'boolean', default: false })
  isPublished: boolean;

  @Column({ type: 'boolean', default: false })
  isCompleted: boolean; // Track if module creation is finished

  @Column({ type: 'int', default: 0 })
  totalDuration: number; // Total duration of all videos in minutes

  @OneToMany(() => Video, (video) => video.module, { cascade: true })
  videos: Video[];

  @OneToMany(() => ModuleSheet, (sheet) => sheet.module, { cascade: true })
  sheets: ModuleSheet[];

  @OneToMany(() => Quiz, (quiz) => quiz.module)
  quizzes: Quiz[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
