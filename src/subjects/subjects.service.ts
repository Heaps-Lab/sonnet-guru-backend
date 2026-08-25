import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subject } from './entities/subject.entity';
import { Course } from '../courses/entities/course.entity';
import { Module } from '../modules/entities/module.entity';
import { Video } from '../modules/entities/video.entity';
import { ModuleSheet } from '../modules/entities/module-sheet.entity';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { User } from '../users/entities/user.entity';
import { Role } from '../common/enums/role.enum';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SubjectsService {
  private readonly logger = new Logger(SubjectsService.name);

  constructor(
    @InjectRepository(Subject)
    private subjectRepository: Repository<Subject>,
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    @InjectRepository(Module)
    private moduleRepository: Repository<Module>,
    @InjectRepository(Video)
    private videoRepository: Repository<Video>,
    @InjectRepository(ModuleSheet)
    private sheetRepository: Repository<ModuleSheet>,
  ) {}

  async create(
    createSubjectDto: CreateSubjectDto,
    user: User,
  ): Promise<Subject> {
    // Verify course exists and user has permission
    const course = await this.courseRepository.findOne({
      where: { id: createSubjectDto.courseId },
      relations: { instructor: true },
    });

    if (!course) {
      throw new NotFoundException(
        `Course with ID ${createSubjectDto.courseId} not found`,
      );
    }

    // Check if user is the instructor or admin
    if (user.role !== Role.ADMIN && course.instructorId !== user.id) {
      throw new ForbiddenException(
        'You can only create subjects for your own courses',
      );
    }

    // Check if sequence order already exists for this course
    const existingSubject = await this.subjectRepository.findOne({
      where: {
        courseId: createSubjectDto.courseId,
        sequenceOrder: createSubjectDto.sequenceOrder,
      },
    });

    if (existingSubject) {
      throw new BadRequestException(
        `Subject with sequence order ${createSubjectDto.sequenceOrder} already exists for this course`,
      );
    }

    const subject = this.subjectRepository.create({
      ...createSubjectDto,
      totalModules: 0,
      totalDuration: 0,
    });

    return await this.subjectRepository.save(subject);
  }

  async findAll(user?: User): Promise<Subject[]> {
    const query = this.subjectRepository
      .createQueryBuilder('subject')
      .leftJoinAndSelect('subject.course', 'course')
      .leftJoinAndSelect('subject.modules', 'modules')
      .where('subject.isActive = :isActive', { isActive: true });

    // If not admin, only show subjects from published courses
    if (!user || user.role !== Role.ADMIN) {
      query.andWhere('course.isPublished = :isPublished', {
        isPublished: true,
      });
    }

    query.orderBy('subject.sequenceOrder', 'ASC');

    return await query.getMany();
  }

  async findByCourse(courseId: string, user?: User): Promise<Subject[]> {
    // Verify course exists
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    const query = this.subjectRepository
      .createQueryBuilder('subject')
      .leftJoinAndSelect('subject.modules', 'modules')
      .leftJoinAndSelect('modules.videos', 'videos')
      .leftJoinAndSelect('modules.sheets', 'sheets')
      .leftJoinAndSelect('modules.quizzes', 'quizzes')
      .where('subject.courseId = :courseId', { courseId })
      .andWhere('subject.isActive = :isActive', { isActive: true });

    // If not admin or instructor, only show published modules
    if (
      !user ||
      (user.role !== Role.ADMIN && course.instructorId !== user.id)
    ) {
      query.andWhere('modules.isPublished = :isPublished', {
        isPublished: true,
      });
    }

    query
      .orderBy('subject.sequenceOrder', 'ASC')
      .addOrderBy('modules.sequenceOrder', 'ASC');

    return await query.getMany();
  }

  async findOne(id: string, user?: User): Promise<Subject> {
    const query = this.subjectRepository
      .createQueryBuilder('subject')
      .leftJoinAndSelect('subject.course', 'course')
      .leftJoinAndSelect('subject.modules', 'modules')
      .leftJoinAndSelect('modules.videos', 'videos')
      .leftJoinAndSelect('modules.sheets', 'sheets')
      .leftJoinAndSelect('modules.quizzes', 'quizzes')
      .where('subject.id = :id', { id });

    // If not admin, only show if subject is active and course is published
    if (!user || user.role !== Role.ADMIN) {
      query
        .andWhere('subject.isActive = :isActive', { isActive: true })
        .andWhere('course.isPublished = :isPublished', { isPublished: true });
    }

    query.orderBy('modules.sequenceOrder', 'ASC');

    const subject = await query.getOne();

    if (!subject) {
      throw new NotFoundException(`Subject with ID ${id} not found`);
    }

    return subject;
  }

  async update(
    id: string,
    updateSubjectDto: UpdateSubjectDto,
    user: User,
  ): Promise<Subject> {
    const subject = await this.subjectRepository.findOne({
      where: { id },
      relations: { course: true },
    });

    if (!subject) {
      throw new NotFoundException(`Subject with ID ${id} not found`);
    }

    // Check permissions
    if (user.role !== Role.ADMIN && subject.course.instructorId !== user.id) {
      throw new ForbiddenException(
        'You can only update subjects for your own courses',
      );
    }

    // If updating sequence order, check for conflicts
    if (
      updateSubjectDto.sequenceOrder &&
      updateSubjectDto.sequenceOrder !== subject.sequenceOrder
    ) {
      const existingSubject = await this.subjectRepository.findOne({
        where: {
          courseId: subject.courseId,
          sequenceOrder: updateSubjectDto.sequenceOrder,
        },
      });

      if (existingSubject && existingSubject.id !== id) {
        throw new BadRequestException(
          `Subject with sequence order ${updateSubjectDto.sequenceOrder} already exists for this course`,
        );
      }
    }

    Object.assign(subject, updateSubjectDto);
    return await this.subjectRepository.save(subject);
  }

  async remove(id: string, user: User): Promise<void> {
    const subject = await this.subjectRepository.findOne({
      where: { id },
      relations: { course: true, modules: true },
    });

    if (!subject) {
      throw new NotFoundException(`Subject with ID ${id} not found`);
    }

    // Check permissions
    if (user.role !== Role.ADMIN && subject.course.instructorId !== user.id) {
      throw new ForbiddenException(
        'You can only delete subjects for your own courses',
      );
    }

    this.logger.log(
      `Deleting subject ${id} with ${subject.modules?.length || 0} modules`,
    );

    // Cascade delete all modules with their videos and sheets
    if (subject.modules && subject.modules.length > 0) {
      for (const module of subject.modules) {
        await this.deleteModuleWithFiles(module.id);
      }
    }

    // Delete the subject
    await this.subjectRepository.remove(subject);
    this.logger.log(`Subject ${id} deleted successfully`);
  }

  /**
   * Delete a module along with all its videos, sheets, and files
   */
  private async deleteModuleWithFiles(moduleId: string): Promise<void> {
    this.logger.log(`Deleting module ${moduleId} with all files`);

    // Find all videos for this module
    const videos = await this.videoRepository.find({
      where: { moduleId },
    });

    // Delete video files and records
    for (const video of videos) {
      try {
        const videoPath = path.join(
          process.cwd(),
          'uploads',
          'videos',
          video.fileName,
        );
        if (fs.existsSync(videoPath)) {
          fs.unlinkSync(videoPath);
          this.logger.log(`Deleted video file: ${video.fileName}`);
        }
      } catch (error) {
        this.logger.error(
          `Failed to delete video file ${video.fileName}:`,
          error,
        );
        // Continue even if file deletion fails
      }
      await this.videoRepository.remove(video);
    }

    // Find all sheets for this module
    const sheets = await this.sheetRepository.find({
      where: { moduleId },
    });

    // Delete sheet files and records
    for (const sheet of sheets) {
      try {
        const sheetPath = path.join(
          process.cwd(),
          'uploads',
          'sheets',
          sheet.fileName,
        );
        if (fs.existsSync(sheetPath)) {
          fs.unlinkSync(sheetPath);
          this.logger.log(`Deleted sheet file: ${sheet.fileName}`);
        }
      } catch (error) {
        this.logger.error(
          `Failed to delete sheet file ${sheet.fileName}:`,
          error,
        );
        // Continue even if file deletion fails
      }
      await this.sheetRepository.remove(sheet);
    }

    // Delete the module itself
    const module = await this.moduleRepository.findOne({
      where: { id: moduleId },
    });

    if (module) {
      await this.moduleRepository.remove(module);
      this.logger.log(
        `Module ${moduleId} deleted with ${videos.length} videos and ${sheets.length} sheets`,
      );
    }
  }

  async updateSubjectStats(subjectId: string): Promise<void> {
    const modules = await this.moduleRepository.find({
      where: { subjectId },
    });

    const totalModules = modules.length;
    const totalDuration = modules.reduce(
      (sum, module) => sum + (module.totalDuration || 0),
      0,
    );

    await this.subjectRepository.update(subjectId, {
      totalModules,
      totalDuration,
    });
  }

  async reorderSubjects(
    courseId: string,
    subjectOrders: { id: string; sequenceOrder: number }[],
    user: User,
  ): Promise<Subject[]> {
    // Verify course exists and user has permission
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    if (user.role !== Role.ADMIN && course.instructorId !== user.id) {
      throw new ForbiddenException(
        'You can only reorder subjects for your own courses',
      );
    }

    // Update each subject's sequence order
    for (const { id, sequenceOrder } of subjectOrders) {
      await this.subjectRepository.update(id, { sequenceOrder });
    }

    // Return updated subjects
    return await this.findByCourse(courseId, user);
  }
}
