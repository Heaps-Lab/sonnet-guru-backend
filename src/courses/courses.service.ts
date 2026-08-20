import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from './entities/course.entity';
import { Enrollment } from '../payments/entities/enrollment.entity';
import { PaymentClaim } from '../payments/entities/payment-claim.entity';
import { PaymentStatus } from '../common/enums/payment.enum';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { User } from '../users/entities/user.entity';
import { Role } from '../common/enums/role.enum';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

const ALLOWED_THUMBNAIL_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    @InjectRepository(Enrollment)
    private enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(PaymentClaim)
    private paymentClaimRepository: Repository<PaymentClaim>,
  ) {}

  async create(createCourseDto: CreateCourseDto, user: User): Promise<Course> {
    // Only Super Admin, Admin, and Teacher can create courses
    if (![Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER].includes(user.role)) {
      throw new ForbiddenException(
        'You do not have permission to create courses',
      );
    }

    const course = this.courseRepository.create({
      ...createCourseDto,
      instructorId: user.id,
      isPublished: createCourseDto.isPublished || false,
      isActive: true,
    });

    return this.courseRepository.save(course);
  }

  async findAll(user?: User): Promise<Course[]> {
    // Note: modules are intentionally NOT joined/returned here. The list
    // endpoint is meant to be a lightweight course directory; full module
    // content is only returned from findOne() (GET /courses/:id).
    const queryBuilder = this.courseRepository
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.instructor', 'instructor')
      .where('course.isActive = :isActive', { isActive: true });

    if (user && [Role.SUPER_ADMIN, Role.ADMIN].includes(user.role)) {
      // return queryBuilder.orderBy('course.createdAt', 'DESC').getMany();
      // Admin/Super Admin: see ALL courses regardless of publish status
    } else if (user && user.role === Role.TEACHER) {
      // Teacher: see their own courses (any status) + other published courses
      queryBuilder.andWhere(
        '(course.instructorId = :instructorId OR course.isPublished = :isPublished)',
        { instructorId: user.id, isPublished: true },
      );
    } else {
      // Students and unauthenticated: published only
      queryBuilder.andWhere('course.isPublished = :isPublished', {
        isPublished: true,
      });
    }

    return queryBuilder.orderBy('course.createdAt', 'DESC').getMany();
  }

  async findOne(id: string, user?: User): Promise<Course> {
    const queryBuilder = this.courseRepository
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.instructor', 'instructor')
      .leftJoinAndSelect('course.modules', 'modules')
      .leftJoinAndSelect('modules.videos', 'videos')
      .leftJoinAndSelect('modules.sheets', 'sheets')
      .leftJoinAndSelect('modules.quizzes', 'quizzes')
      .where('course.id = :id', { id })
      .andWhere('course.isActive = :isActive', { isActive: true })
      .orderBy('modules.sequenceOrder', 'ASC')
      .addOrderBy('videos.sequenceNumber', 'ASC');

    const course = await queryBuilder.getOne();

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // SUPER_ADMIN and ADMIN: full access always
    if (user && [Role.SUPER_ADMIN, Role.ADMIN].includes(user.role)) {
      return course;
    }

    // TEACHER: full access to their own course, published access to others
    if (user && user.role === Role.TEACHER) {
      if (course.instructorId === user.id) {
        return course;
      }
      if (!course.isPublished) {
        throw new NotFoundException('Course not found');
      }
      return course;
    }

    // STUDENT: must have an active enrollment for this course
    if (user && user.role === Role.STUDENT) {
      const enrollment = await this.enrollmentRepository.findOne({
        where: { userId: user.id, courseId: id, isActive: true },
      });

      if (!enrollment) {
        throw new ForbiddenException(
          'You are not enrolled in this course. Please enroll to access the content.',
        );
      }

      return course;
    }

    // Unauthenticated: only published courses
    if (!course.isPublished) {
      throw new NotFoundException('Course not found');
    }

    return course;
  }

  async update(
    id: string,
    updateCourseDto: UpdateCourseDto,
    user: User,
  ): Promise<Course> {
    const course = await this.findOne(id, user);

    // Only course instructor, admin, or super admin can update
    if (
      course.instructorId !== user.id &&
      ![Role.SUPER_ADMIN, Role.ADMIN].includes(user.role)
    ) {
      throw new ForbiddenException(
        'You do not have permission to update this course',
      );
    }

    await this.courseRepository.update(id, updateCourseDto);
    return this.findOne(id, user);
  }

  async remove(id: string, user: User): Promise<void> {
    const course = await this.findOne(id, user);

    // Only course instructor, admin, or super admin can delete
    if (
      course.instructorId !== user.id &&
      ![Role.SUPER_ADMIN, Role.ADMIN].includes(user.role)
    ) {
      throw new ForbiddenException(
        'You do not have permission to delete this course',
      );
    }

    await this.courseRepository.update(id, { isActive: false });
  }

  async publish(id: string, user: User): Promise<Course> {
    const course = await this.findOne(id, user);

    // Only course instructor, admin, or super admin can publish
    if (
      course.instructorId !== user.id &&
      ![Role.SUPER_ADMIN, Role.ADMIN].includes(user.role)
    ) {
      throw new ForbiddenException(
        'You do not have permission to publish this course',
      );
    }

    await this.courseRepository.update(id, { isPublished: true });
    return this.findOne(id, user);
  }

  async unpublish(id: string, user: User): Promise<Course> {
    const course = await this.findOne(id, user);

    // Only course instructor, admin, or super admin can unpublish
    if (
      course.instructorId !== user.id &&
      ![Role.SUPER_ADMIN, Role.ADMIN].includes(user.role)
    ) {
      throw new ForbiddenException(
        'You do not have permission to unpublish this course',
      );
    }

    await this.courseRepository.update(id, { isPublished: false });
    return this.findOne(id, user);
  }

  async getMyCourses(user: User): Promise<Course[]> {
    if (user.role !== Role.TEACHER) {
      throw new ForbiddenException('Only teachers can access this endpoint');
    }

    return this.courseRepository.find({
      where: { instructorId: user.id, isActive: true },
      relations: { modules: true },
      order: { createdAt: 'DESC' },
    });
  }

  async getEnrolledCourses(user: User): Promise<any[]> {
    if (user.role !== Role.STUDENT) {
      throw new ForbiddenException('Only students can access this endpoint');
    }

    // 1. Fetch active enrollments (payment approved)
    const enrollments = await this.enrollmentRepository.find({
      where: { userId: user.id, isActive: true },
      relations: {
        course: {
          instructor: true,
          modules: {
            videos: true,
            sheets: true,
            quizzes: true,
          },
        },
      },
      order: { enrolledAt: 'DESC' },
    });

    const enrolledCourses = enrollments.map((enrollment) => ({
      ...enrollment.course,
      enrollmentStatus: 'enrolled',
      enrollmentId: enrollment.id,
      enrolledAt: enrollment.enrolledAt,
      progressPercentage: enrollment.progressPercentage,
      completedAt: enrollment.completedAt,
    }));

    // 2. Fetch pending payment claims (payment submitted but not yet approved)
    const pendingClaims = await this.paymentClaimRepository.find({
      where: { userId: user.id, status: PaymentStatus.PENDING },
      relations: {
        course: {
          instructor: true,
        },
      },
      order: { createdAt: 'DESC' },
    });

    // Exclude courses already enrolled (in case of edge cases)
    const enrolledCourseIds = new Set(enrolledCourses.map((c) => c.id));

    const pendingCourses = pendingClaims
      .filter((claim) => !enrolledCourseIds.has(claim.courseId))
      .map((claim) => ({
        ...claim.course,
        enrollmentStatus: 'pending',
        paymentClaimId: claim.id,
        paymentGateway: claim.gateway,
        amountPaid: claim.amountPaid,
        transactionId: claim.transactionId,
        claimSubmittedAt: claim.createdAt,
      }));

    // Return both groups together — frontend can filter by enrollmentStatus
    return [...enrolledCourses, ...pendingCourses];
  }

  async uploadThumbnail(
    id: string,
    file: Express.Multer.File,
    user: User,
  ): Promise<Course> {
    const course = await this.findOne(id, user);

    // Only course instructor, admin, or super admin can upload thumbnail
    if (
      course.instructorId !== user.id &&
      ![Role.SUPER_ADMIN, Role.ADMIN].includes(user.role)
    ) {
      throw new ForbiddenException(
        'You do not have permission to upload a thumbnail for this course',
      );
    }

    if (!file) {
      throw new BadRequestException('Thumbnail file is required');
    }

    if (!ALLOWED_THUMBNAIL_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only JPEG, PNG, and WEBP images are allowed',
      );
    }

    // Generate unique filename
    const fileExtension = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExtension}`;
    const uploadPath = path.join(process.cwd(), 'uploads', 'thumbnails');

    // Ensure upload directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    const filePath = path.join(uploadPath, fileName);

    // Delete old thumbnail file if it was uploaded to our server
    if (
      course.thumbnailUrl &&
      course.thumbnailUrl.includes('/api/v1/thumbnails/')
    ) {
      const oldFileName = course.thumbnailUrl.split('/').pop();
      if (oldFileName) {
        const oldFilePath = path.join(uploadPath, oldFileName);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
    }

    // Save file to disk
    fs.writeFileSync(filePath, file.buffer);

    const thumbnailUrl = `/api/v1/thumbnails/${fileName}`;
    await this.courseRepository.update(id, { thumbnailUrl });

    return this.findOne(id, user);
  }

  getThumbnail(fileName: string): { filePath: string; mimeType: string } {
    const filePath = path.join(
      process.cwd(),
      'uploads',
      'thumbnails',
      fileName,
    );

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Thumbnail not found');
    }

    const extension = path.extname(fileName).toLowerCase();
    const mimeTypeMap: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
    };

    return {
      filePath,
      mimeType: mimeTypeMap[extension] || 'application/octet-stream',
    };
  }
}
