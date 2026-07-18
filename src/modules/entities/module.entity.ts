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
import { Quiz } from '../../quizzes/entities/quiz.entity';

@Entity('modules')
export class Module {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
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

  @Column({ type: 'boolean', default: true })
  isPublished: boolean;

  @Column({ type: 'json', nullable: true })
  sheets: {
    title: string;
    fileUrl: string;
    isDownloadable: boolean;
    uploadedAt: Date;
  }[];

  @Column({ type: 'json', nullable: true })
  videos: {
    title: string;
    videoUrl: string;
    duration: number;
    hlsPlaylistUrl: string;
  }[];

  @OneToMany(() => Quiz, (quiz) => quiz.module)
  quizzes: Quiz[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
