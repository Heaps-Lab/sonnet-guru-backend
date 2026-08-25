/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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

    // Validate discount percentage
    if (createCourseDto.discount !== undefined) {
      if (createCourseDto.discount < 0 || createCourseDto.discount > 100) {
        throw new BadRequestException('Discount must be between 0 and 100');
      }
    }

    // Calculate discounted price
    const discount = createCourseDto.discount || 0;
    const discountedPrice = this.calculateDiscountedPrice(
      createCourseDto.price,
      discount,
    );

    const course = this.courseRepository.create({
      ...createCourseDto,
      instructorId: user.id,
      isPublished: createCourseDto.isPublished || false,
      isActive: true,
      discount,
      discountedPrice,
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
      .leftJoinAndSelect(
        'course.subjects',
        'subjects',
        'subjects.isActive = :subjectActive',
        { subjectActive: true },
      )
      .leftJoinAndSelect('subjects.modules', 'modules')
      .leftJoinAndSelect('modules.videos', 'videos')
      .leftJoinAndSelect('modules.sheets', 'sheets')
      .leftJoinAndSelect('modules.quizzes', 'quizzes')
      .where('course.id = :id', { id })
      .andWhere('course.isActive = :isActive', { isActive: true })
      .orderBy('subjects.sequenceOrder', 'ASC')
      .addOrderBy('modules.sequenceOrder', 'ASC')
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
      // Filter only published modules for other teachers viewing
      course.subjects =
        course.subjects?.map((subject) => ({
          ...subject,
          modules:
            subject.modules?.filter((module) => module.isPublished) || [],
        })) || [];
      return course;
    }

    // Unauthenticated: only published courses
    if (!course.isPublished) {
      throw new NotFoundException('Course not found');
    }

    // Filter only published modules for unauthenticated users
    course.subjects =
      course.subjects?.map((subject) => ({
        ...subject,
        modules: subject.modules?.filter((module) => module.isPublished) || [],
      })) || [];

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

    // Validate discount if provided
    if (updateCourseDto.discount !== undefined) {
      if (updateCourseDto.discount < 0 || updateCourseDto.discount > 100) {
        throw new BadRequestException('Discount must be between 0 and 100');
      }
    }

    // Calculate new discounted price if price or discount changed
    let discountedPrice = course.discountedPrice;
    const newPrice = updateCourseDto.price ?? course.price;
    const newDiscount = updateCourseDto.discount ?? course.discount;

    if (
      updateCourseDto.price !== undefined ||
      updateCourseDto.discount !== undefined
    ) {
      discountedPrice = this.calculateDiscountedPrice(newPrice, newDiscount);
    }

    await this.courseRepository.update(id, {
      ...updateCourseDto,
      discountedPrice,
    });
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
      relations: {
        subjects: {
          modules: true,
        },
      },
      order: {
        createdAt: 'DESC',
        subjects: {
          sequenceOrder: 'ASC',
          modules: {
            sequenceOrder: 'ASC',
          },
        },
      },
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
          subjects: {
            modules: {
              videos: true,
              sheets: true,
              quizzes: true,
            },
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

  async getCourseStructure(id: string, user?: User): Promise<any> {
    const course = await this.findOne(id, user);

    // Transform the data to provide a cleaner structure
    const structure = {
      id: course.id,
      title: course.title,
      description: course.description,
      fullDescription: course.fullDescription,
      instructor: course.instructor,
      price: course.price,
      isPublished: course.isPublished,
      thumbnailUrl: course.thumbnailUrl,
      category: course.category,
      level: course.level,
      totalDuration: course.totalDuration,
      enrollmentCount: course.enrollmentCount,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
      subjects:
        course.subjects?.map((subject) => ({
          id: subject.id,
          name: subject.name,
          description: subject.description,
          sequenceOrder: subject.sequenceOrder,
          thumbnailUrl: subject.thumbnailUrl,
          totalModules: subject.totalModules,
          totalDuration: subject.totalDuration,
          modules:
            subject.modules?.map((module) => ({
              id: module.id,
              title: module.title,
              description: module.description,
              sequenceOrder: module.sequenceOrder,
              isPublished: module.isPublished,
              isCompleted: module.isCompleted,
              totalDuration: module.totalDuration,
              videosCount: module.videos?.length || 0,
              sheetsCount: module.sheets?.length || 0,
              quizzesCount: module.quizzes?.length || 0,
              videos: module.videos,
              sheets: module.sheets,
              quizzes: module.quizzes,
            })) || [],
        })) || [],
    };

    return structure;
  }

  private calculateDiscountedPrice(price: number, discount: number): number {
    if (discount <= 0) {
      return price;
    }
    const discountAmount = (price * discount) / 100;
    return Number((price - discountAmount).toFixed(2));
  }

  async getEffectivePrice(courseId: string): Promise<number> {
    const course = await this.courseRepository.findOne({
      where: { id: courseId, isActive: true },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Return discounted price if discount exists, otherwise return original price
    return course.discount > 0 && course.discountedPrice
      ? course.discountedPrice
      : course.price;
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
