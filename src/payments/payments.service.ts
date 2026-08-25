/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PaymentClaim } from './entities/payment-claim.entity';
import { Enrollment } from './entities/enrollment.entity';
import { Course } from '../courses/entities/course.entity';
import { User } from '../users/entities/user.entity';
import { CreatePaymentClaimDto } from './dto/create-payment-claim.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { PaymentStatus } from '../common/enums/payment.enum';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(PaymentClaim)
    private paymentClaimRepository: Repository<PaymentClaim>,
    @InjectRepository(Enrollment)
    private enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
  ) {}

  async createPaymentClaim(
    createPaymentClaimDto: CreatePaymentClaimDto,
    user: User,
  ): Promise<PaymentClaim> {
    // Verify course exists and is published
    const course = await this.courseRepository.findOne({
      where: {
        id: createPaymentClaimDto.courseId,
        isPublished: true,
        isActive: true,
      },
    });

    if (!course) {
      throw new NotFoundException(
        'Course not found or not available for enrollment',
      );
    }

    // Check if user is already enrolled
    const existingEnrollment = await this.enrollmentRepository.findOne({
      where: { userId: user.id, courseId: course.id, isActive: true },
    });

    if (existingEnrollment) {
      throw new ConflictException('You are already enrolled in this course');
    }

    // Check for existing pending payment claim
    const existingClaim = await this.paymentClaimRepository.findOne({
      where: {
        userId: user.id,
        courseId: course.id,
        status: PaymentStatus.PENDING,
      },
    });

    if (existingClaim) {
      throw new ConflictException(
        'You already have a pending payment claim for this course',
      );
    }

    // Check for duplicate transaction ID
    const duplicateTransaction = await this.paymentClaimRepository.findOne({
      where: { transactionId: createPaymentClaimDto.transactionId },
    });

    if (duplicateTransaction) {
      throw new ConflictException('Transaction ID already exists');
    }

    // Validate amount matches course price (use discounted price if available)
    const effectivePrice =
      course.discount > 0 && course.discountedPrice
        ? course.discountedPrice
        : course.price;

    if (createPaymentClaimDto.amountPaid < effectivePrice) {
      throw new BadRequestException(
        `Payment amount is insufficient. Course price: ${effectivePrice} BDT ${
          course.discount > 0
            ? `(${course.discount}% discount applied, original price: ${course.price} BDT)`
            : ''
        }`,
      );
    }

    const paymentClaim = this.paymentClaimRepository.create({
      ...createPaymentClaimDto,
      userId: user.id,
      status: PaymentStatus.PENDING,
    });

    return this.paymentClaimRepository.save(paymentClaim);
  }

  async verifyPayment(
    claimId: string,
    verifyPaymentDto: VerifyPaymentDto,
    user: User,
  ): Promise<PaymentClaim> {
    // Only admins and super admins can verify payments
    if (![Role.SUPER_ADMIN, Role.ADMIN].includes(user.role)) {
      throw new ForbiddenException(
        'You do not have permission to verify payments',
      );
    }

    const claim = await this.paymentClaimRepository.findOne({
      where: { id: claimId },
      relations: { user: true, course: true },
    });

    if (!claim) {
      throw new NotFoundException('Payment claim not found');
    }

    if (claim.status !== PaymentStatus.PENDING) {
      throw new BadRequestException('Payment claim has already been processed');
    }

    return this.dataSource.transaction(async (manager) => {
      // Update payment claim status
      await manager.update(PaymentClaim, claimId, {
        status: verifyPaymentDto.status,
        adminRemarks: verifyPaymentDto.adminRemarks,
        verifiedBy: user.id,
        verifiedAt: new Date(),
      });

      // If approved, create enrollment
      if (verifyPaymentDto.status === PaymentStatus.APPROVED) {
        // Check if enrollment already exists (edge case)
        const existingEnrollment = await manager.findOne(Enrollment, {
          where: {
            userId: claim.userId,
            courseId: claim.courseId,
            isActive: true,
          },
        });

        if (!existingEnrollment) {
          const enrollment = manager.create(Enrollment, {
            userId: claim.userId,
            courseId: claim.courseId,
            paymentClaimId: claimId,
            isActive: true,
            enrolledAt: new Date(),
          });

          await manager.save(Enrollment, enrollment);

          // Update course enrollment count
          await manager.increment(
            Course,
            { id: claim.courseId },
            'enrollmentCount',
            1,
          );
        }
      }

      // Return updated claim
      const updatedClaim = await manager.findOne(PaymentClaim, {
        where: { id: claimId },
        relations: {
          user: true,
          course: true,
          verifier: true,
          enrollment: true,
        },
      });

      if (!updatedClaim) {
        throw new NotFoundException('Payment claim not found after update');
      }

      return updatedClaim;
    });
  }

  async findAllClaims(
    user: User,
    status?: PaymentStatus,
  ): Promise<PaymentClaim[]> {
    // Only admins and super admins can view all claims
    if (![Role.SUPER_ADMIN, Role.ADMIN].includes(user.role)) {
      throw new ForbiddenException(
        'You do not have permission to view all payment claims',
      );
    }

    const queryBuilder = this.paymentClaimRepository
      .createQueryBuilder('claim')
      .leftJoinAndSelect('claim.user', 'user')
      .leftJoinAndSelect('claim.course', 'course')
      .leftJoinAndSelect('claim.verifier', 'verifier')
      .orderBy('claim.createdAt', 'DESC');

    if (status) {
      queryBuilder.where('claim.status = :status', { status });
    }

    return queryBuilder.getMany();
  }

  async findMyClaims(user: User): Promise<PaymentClaim[]> {
    return this.paymentClaimRepository.find({
      where: { userId: user.id },
      relations: {
        course: true,
        verifier: true,
        enrollment: true,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findClaim(claimId: string, user: User): Promise<PaymentClaim> {
    const claim = await this.paymentClaimRepository.findOne({
      where: { id: claimId },
      relations: { user: true, course: true, verifier: true, enrollment: true },
    });

    if (!claim) {
      throw new NotFoundException('Payment claim not found');
    }

    // Users can only view their own claims, admins can view all
    if (
      ![Role.SUPER_ADMIN, Role.ADMIN].includes(user.role) &&
      claim.userId !== user.id
    ) {
      throw new ForbiddenException('You can only view your own payment claims');
    }

    return claim;
  }

  async getMyEnrollments(user: User): Promise<Enrollment[]> {
    return this.enrollmentRepository.find({
      where: { userId: user.id, isActive: true },
      relations: { course: { instructor: true }, paymentClaim: true },
      order: { enrolledAt: 'DESC' },
    });
  }

  async getCourseEnrollments(
    courseId: string,
    user: User,
  ): Promise<Enrollment[]> {
    const course = await this.courseRepository.findOne({
      where: { id: courseId, isActive: true },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Check permissions - only course instructor, admin, or super admin can view enrollments
    if (
      ![Role.SUPER_ADMIN, Role.ADMIN].includes(user.role) &&
      (user.role !== Role.TEACHER || course.instructorId !== user.id)
    ) {
      throw new ForbiddenException(
        'You do not have permission to view enrollments for this course',
      );
    }

    return this.enrollmentRepository.find({
      where: { courseId, isActive: true },
      relations: { user: true, paymentClaim: true },
      order: { enrolledAt: 'DESC' },
    });
  }

  async checkEnrollmentStatus(
    courseId: string,
    user: User,
  ): Promise<{ isEnrolled: boolean; enrollment?: Enrollment }> {
    const enrollment = await this.enrollmentRepository.findOne({
      where: { userId: user.id, courseId, isActive: true },
      relations: { paymentClaim: true },
    });

    return {
      isEnrolled: !!enrollment,
      enrollment: enrollment || undefined,
    };
  }

  async getPendingClaims(user: User): Promise<PaymentClaim[]> {
    if (![Role.SUPER_ADMIN, Role.ADMIN].includes(user.role)) {
      throw new ForbiddenException(
        'You do not have permission to view pending claims',
      );
    }

    return this.paymentClaimRepository.find({
      where: { status: PaymentStatus.PENDING },
      relations: { user: true, course: true },
      order: { createdAt: 'ASC' }, // Oldest first for processing queue
    });
  }

  async getPaymentStatistics(user: User): Promise<{
    totalClaims: number;
    pendingClaims: number;
    approvedClaims: number;
    rejectedClaims: number;
    totalRevenue: number;
  }> {
    if (![Role.SUPER_ADMIN, Role.ADMIN].includes(user.role)) {
      throw new ForbiddenException(
        'You do not have permission to view payment statistics',
      );
    }

    const [totalClaims, pendingClaims, approvedClaims, rejectedClaims] =
      await Promise.all([
        this.paymentClaimRepository.count(),
        this.paymentClaimRepository.count({
          where: { status: PaymentStatus.PENDING },
        }),
        this.paymentClaimRepository.count({
          where: { status: PaymentStatus.APPROVED },
        }),
        this.paymentClaimRepository.count({
          where: { status: PaymentStatus.REJECTED },
        }),
      ]);

    // Calculate total revenue from approved claims
    const revenueResult = await this.paymentClaimRepository
      .createQueryBuilder('claim')
      .select('SUM(claim.amountPaid)', 'total')
      .where('claim.status = :status', { status: PaymentStatus.APPROVED })
      .getRawOne();

    const totalRevenue = parseFloat(revenueResult?.total || '0');

    return {
      totalClaims,
      pendingClaims,
      approvedClaims,
      rejectedClaims,
      totalRevenue,
    };
  }
}
