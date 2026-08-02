import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from './entities/course.entity';
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
    const queryBuilder = this.courseRepository
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.instructor', 'instructor')
      .leftJoinAndSelect('course.modules', 'modules')
      .where('course.isActive = :isActive', { isActive: true });

    // If user is not admin/super admin, only show published courses
    if (
      !user ||
      ![Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER].includes(user.role)
    ) {
      queryBuilder.andWhere('course.isPublished = :isPublished', {
        isPublished: true,
      });
    }

    // If user is teacher, only show their own courses (plus published ones)
    if (user && user.role === Role.TEACHER) {
      queryBuilder.andWhere(
        '(course.instructorId = :instructorId OR course.isPublished = :isPublished)',
        { instructorId: user.id, isPublished: true },
      );
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
      .andWhere('course.isActive = :isActive', { isActive: true });

    // Sort modules and videos by sequence
    queryBuilder
      .orderBy('modules.sequenceOrder', 'ASC')
      .addOrderBy('videos.sequenceNumber', 'ASC');

    const course = await queryBuilder.getOne();

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Check permissions
    if (
      !user ||
      ![Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER].includes(user.role)
    ) {
      if (!course.isPublished) {
        throw new NotFoundException('Course not found');
      }
    }

    if (
      user &&
      user.role === Role.TEACHER &&
      course.instructorId !== user.id &&
      !course.isPublished
    ) {
      throw new ForbiddenException(
        'You do not have permission to view this course',
      );
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
