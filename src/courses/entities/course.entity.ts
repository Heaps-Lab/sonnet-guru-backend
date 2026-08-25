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
import { User } from '../../users/entities/user.entity';
import { Module } from '../../modules/entities/module.entity';
import { Subject } from '../../subjects/entities/subject.entity';
import { Enrollment } from '../../payments/entities/enrollment.entity';

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', nullable: true })
  fullDescription: string;

  @Column({ type: 'uuid' })
  instructorId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'instructorId' })
  instructor: User;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  discount: number; // Discount percentage (0-100)

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  discountedPrice: number; // Calculated price after discount

  @Column({ type: 'boolean', default: true })
  isPublished: boolean;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true })
  thumbnailUrl: string;

  @Column({ type: 'text', nullable: true })
  introLink: string; // Introduction video URL (MP4 or any video link)

  @Column({ type: 'varchar', length: 100, nullable: true })
  category: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  level: string;

  @Column({ type: 'int', default: 0 })
  totalDuration: number;

  @Column({ type: 'int', default: 0 })
  enrollmentCount: number;

  @OneToMany(() => Subject, (subject) => subject.course)
  subjects: Subject[];

  @OneToMany(() => Module, (module) => module.course)
  modules: Module[];

  @OneToMany(() => Enrollment, (enrollment) => enrollment.course)
  enrollments: Enrollment[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
