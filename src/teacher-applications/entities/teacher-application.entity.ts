import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ApplicationStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
}

@Entity('teacher_applications')
export class TeacherApplication {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  fullName: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 20 })
  phoneNumber: string;

  @Column({ type: 'text' })
  qualifications: string;

  @Column({ type: 'text' })
  experience: string;

  @Column({ type: 'text' })
  subjectsToTeach: string;

  @Column({ type: 'text', nullable: true })
  additionalInfo?: string;

  @Column({ type: 'varchar', length: 255 })
  cvFileName: string;

  @Column({ type: 'varchar', length: 500 })
  cvFileUrl: string;

  @Column({ type: 'bigint' })
  cvFileSize: number;

  @Column({ type: 'varchar', length: 100 })
  cvMimeType: string;

  @Column({
    type: 'enum',
    enum: ApplicationStatus,
    default: ApplicationStatus.PENDING,
  })
  status: ApplicationStatus;

  @Column({ type: 'text', nullable: true })
  adminNotes?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reviewedBy?: string; // Admin who reviewed the application

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt?: Date;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}