import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Course } from '../../courses/entities/course.entity';
import { Enrollment } from './enrollment.entity';
import { PaymentStatus, PaymentGateway } from '../../common/enums/payment.enum';

@Entity('payment_claims')
export class PaymentClaim {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid' })
  courseId: string;

  @ManyToOne(() => Course)
  @JoinColumn({ name: 'courseId' })
  course: Course;

  @Column({
    type: 'enum',
    enum: PaymentGateway,
  })
  gateway: PaymentGateway;

  @Column({ type: 'varchar', length: 50 })
  senderNumber: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  transactionId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amountPaid: number;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({ type: 'text', nullable: true })
  adminRemarks: string;

  @Column({ type: 'uuid', nullable: true })
  verifiedBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'verifiedBy' })
  verifier: User;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt: Date;

  @OneToOne(() => Enrollment, (enrollment) => enrollment.paymentClaim)
  enrollment: Enrollment;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
