import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Module } from './entities/module.entity';
import { Video } from './entities/video.entity';
import { ModuleSheet } from './entities/module-sheet.entity';
import { Course } from '../courses/entities/course.entity';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { UploadVideoDto } from './dto/upload-video.dto';
import { UploadSheetDto } from './dto/upload-sheet.dto';
import { CompleteModuleDto } from './dto/complete-module.dto';
import { User } from '../users/entities/user.entity';
import { Role } from '../common/enums/role.enum';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ModulesService {
  constructor(
    @InjectRepository(Module)
    private moduleRepository: Repository<Module>,
    @InjectRepository(Video)
    private videoRepository: Repository<Video>,
    @InjectRepository(ModuleSheet)
    private sheetRepository: Repository<ModuleSheet>,
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    private dataSource: DataSource,
  ) {}

  async create(
    courseId: string,
    createModuleDto: CreateModuleDto,
    user: User,
  ): Promise<Module> {
    // Verify course exists and user has permission
    const course = await this.courseRepository.findOne({
      where: { id: courseId, isActive: true },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Check permissions
    if (
      ![Role.SUPER_ADMIN, Role.ADMIN].includes(user.role) &&
      (user.role !== Role.TEACHER || course.instructorId !== user.id)
    ) {
      throw new ForbiddenException(
        'You do not have permission to create modules for this course',
      );
    }

    const module = this.moduleRepository.create({
      ...createModuleDto,
      courseId,
    });

    return this.moduleRepository.save(module);
  }

  async findAll(courseId: string, user?: User): Promise<Module[]> {
    const course = await this.courseRepository.findOne({
      where: { id: courseId, isActive: true },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Check if course is published or user has access
    if (
      !course.isPublished &&
      (!user ||
        (![Role.SUPER_ADMIN, Role.ADMIN].includes(user.role) &&
          (user.role !== Role.TEACHER || course.instructorId !== user.id)))
    ) {
      throw new ForbiddenException('Course not accessible');
    }

    const queryBuilder = this.moduleRepository
      .createQueryBuilder('module')
      .leftJoinAndSelect('module.videos', 'videos')
      .leftJoinAndSelect('module.sheets', 'sheets')
      .where('module.courseId = :courseId', { courseId })
      .orderBy('module.sequenceOrder', 'ASC')
      .addOrderBy('videos.sequenceNumber', 'ASC');

    // If user is student, only show published modules
    if (!user || user.role === Role.STUDENT) {
      queryBuilder.andWhere('module.isPublished = :isPublished', {
        isPublished: true,
      });
    }

    return queryBuilder.getMany();
  }

  async findOne(id: string, user?: User): Promise<Module> {
    const module = await this.moduleRepository
      .createQueryBuilder('module')
      .leftJoinAndSelect('module.course', 'course')
      .leftJoinAndSelect('module.videos', 'videos')
      .leftJoinAndSelect('module.sheets', 'sheets')
      .leftJoinAndSelect('module.quizzes', 'quizzes')
      .where('module.id = :id', { id })
      .orderBy('videos.sequenceNumber', 'ASC')
      .getOne();

    if (!module) {
      throw new NotFoundException('Module not found');
    }

    // Check permissions
    if (
      !module.course.isPublished &&
      (!user ||
        (![Role.SUPER_ADMIN, Role.ADMIN].includes(user.role) &&
          (user.role !== Role.TEACHER ||
            module.course.instructorId !== user.id)))
    ) {
      throw new ForbiddenException('Module not accessible');
    }

    return module;
  }

  async update(
    id: string,
    updateModuleDto: UpdateModuleDto,
    user: User,
  ): Promise<Module> {
    const module = await this.findOne(id, user);

    // Check permissions
    if (
      ![Role.SUPER_ADMIN, Role.ADMIN].includes(user.role) &&
      (user.role !== Role.TEACHER || module.course.instructorId !== user.id)
    ) {
      throw new ForbiddenException(
        'You do not have permission to update this module',
      );
    }

    await this.moduleRepository.update(id, updateModuleDto);
    return this.findOne(id, user);
  }

  async uploadVideo(
    moduleId: string,
    uploadVideoDto: UploadVideoDto,
    file: Express.Multer.File,
    user: User,
  ): Promise<Video> {
    const module = await this.findOne(moduleId, user);

    // Check permissions
    if (
      ![Role.SUPER_ADMIN, Role.ADMIN].includes(user.role) &&
      (user.role !== Role.TEACHER || module.course.instructorId !== user.id)
    ) {
      throw new ForbiddenException(
        'You do not have permission to upload videos to this module',
      );
    }

    if (module.isCompleted) {
      throw new BadRequestException('Cannot add videos to a completed module');
    }

    // Check for duplicate sequence number
    const existingVideo = await this.videoRepository.findOne({
      where: { moduleId, sequenceNumber: uploadVideoDto.sequenceNumber },
    });

    if (existingVideo) {
      throw new BadRequestException(
        'Video with this sequence number already exists',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      // Generate unique filename
      const fileExtension = path.extname(file.originalname);
      const fileName = `${uuidv4()}${fileExtension}`;
      const uploadPath = path.join(process.cwd(), 'uploads', 'videos');

      // Ensure upload directory exists
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }

      const filePath = path.join(uploadPath, fileName);

      // Save file to disk
      fs.writeFileSync(filePath, file.buffer);

      // Create video record
      const video = manager.create(Video, {
        ...uploadVideoDto,
        moduleId,
        fileName,
        videoUrl: `/api/v1/videos/${fileName}`,
        fileSize: file.size,
        mimeType: file.mimetype,
        status: 'ready', // In production, this would be 'processing' initially
        duration: 0, // Would be extracted during processing
      });

      const savedVideo = await manager.save(Video, video);

      // Update module total duration (placeholder logic)
      await manager.update(Module, moduleId, {
        totalDuration: () => 'totalDuration + 0', // Would be updated after processing
      });

      return savedVideo;
    });
  }

  async uploadSheet(
    moduleId: string,
    uploadSheetDto: UploadSheetDto,
    file: Express.Multer.File,
    user: User,
  ): Promise<ModuleSheet> {
    const module = await this.findOne(moduleId, user);

    // Check permissions
    if (
      ![Role.SUPER_ADMIN, Role.ADMIN].includes(user.role) &&
      (user.role !== Role.TEACHER || module.course.instructorId !== user.id)
    ) {
      throw new ForbiddenException(
        'You do not have permission to upload sheets to this module',
      );
    }

    // Generate unique filename
    const fileExtension = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExtension}`;
    const uploadPath = path.join(process.cwd(), 'uploads', 'sheets');

    // Ensure upload directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    const filePath = path.join(uploadPath, fileName);

    // Save file to disk
    fs.writeFileSync(filePath, file.buffer);

    // Create sheet record
    const sheet = this.sheetRepository.create({
      ...uploadSheetDto,
      moduleId,
      fileName,
      fileUrl: `/api/v1/sheets/${fileName}`,
      fileSize: file.size,
      mimeType: file.mimetype,
    });

    return this.sheetRepository.save(sheet);
  }

  async completeModule(
    id: string,
    completeModuleDto: CompleteModuleDto,
    user: User,
  ): Promise<Module> {
    const module = await this.findOne(id, user);

    // Check permissions
    if (
      ![Role.SUPER_ADMIN, Role.ADMIN].includes(user.role) &&
      (user.role !== Role.TEACHER || module.course.instructorId !== user.id)
    ) {
      throw new ForbiddenException(
        'You do not have permission to complete this module',
      );
    }

    if (module.videos.length === 0) {
      throw new BadRequestException(
        'Cannot complete module without any videos',
      );
    }

    await this.moduleRepository.update(id, {
      isCompleted: completeModuleDto.isCompleted,
      isPublished: completeModuleDto.isCompleted, // Auto-publish when completed
    });

    return this.findOne(id, user);
  }

  async deleteVideo(videoId: string, user: User): Promise<void> {
    const video = await this.videoRepository
      .createQueryBuilder('video')
      .leftJoinAndSelect('video.module', 'module')
      .leftJoinAndSelect('module.course', 'course')
      .where('video.id = :videoId', { videoId })
      .getOne();

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    // Check permissions
    if (
      ![Role.SUPER_ADMIN, Role.ADMIN].includes(user.role) &&
      (user.role !== Role.TEACHER ||
        video.module.course.instructorId !== user.id)
    ) {
      throw new ForbiddenException(
        'You do not have permission to delete this video',
      );
    }

    if (video.module.isCompleted) {
      throw new BadRequestException(
        'Cannot delete videos from a completed module',
      );
    }

    // Delete file from disk
    const filePath = path.join(
      process.cwd(),
      'uploads',
      'videos',
      video.fileName,
    );
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await this.videoRepository.remove(video);
  }

  async deleteSheet(sheetId: string, user: User): Promise<void> {
    const sheet = await this.sheetRepository
      .createQueryBuilder('sheet')
      .leftJoinAndSelect('sheet.module', 'module')
      .leftJoinAndSelect('module.course', 'course')
      .where('sheet.id = :sheetId', { sheetId })
      .getOne();

    if (!sheet) {
      throw new NotFoundException('Sheet not found');
    }

    // Check permissions
    if (
      ![Role.SUPER_ADMIN, Role.ADMIN].includes(user.role) &&
      (user.role !== Role.TEACHER ||
        sheet.module.course.instructorId !== user.id)
    ) {
      throw new ForbiddenException(
        'You do not have permission to delete this sheet',
      );
    }

    // Delete file from disk
    const filePath = path.join(
      process.cwd(),
      'uploads',
      'sheets',
      sheet.fileName,
    );
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await this.sheetRepository.remove(sheet);
  }

  async getVideo(
    fileName: string,
    user?: User,
  ): Promise<{ filePath: string; mimeType: string }> {
    const video = await this.videoRepository
      .createQueryBuilder('video')
      .leftJoinAndSelect('video.module', 'module')
      .leftJoinAndSelect('module.course', 'course')
      .where('video.fileName = :fileName', { fileName })
      .getOne();

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    // Check if user has access to the video
    if (
      !video.module.course.isPublished &&
      (!user ||
        (![Role.SUPER_ADMIN, Role.ADMIN].includes(user.role) &&
          (user.role !== Role.TEACHER ||
            video.module.course.instructorId !== user.id)))
    ) {
      throw new ForbiddenException('Access denied');
    }

    const filePath = path.join(process.cwd(), 'uploads', 'videos', fileName);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Video file not found');
    }

    return { filePath, mimeType: video.mimeType };
  }

  async getSheet(
    fileName: string,
    user?: User,
  ): Promise<{ filePath: string; mimeType: string }> {
    const sheet = await this.sheetRepository
      .createQueryBuilder('sheet')
      .leftJoinAndSelect('sheet.module', 'module')
      .leftJoinAndSelect('module.course', 'course')
      .where('sheet.fileName = :fileName', { fileName })
      .getOne();

    if (!sheet) {
      throw new NotFoundException('Sheet not found');
    }

    // Check if user has access to the sheet
    if (
      !sheet.module.course.isPublished &&
      (!user ||
        (![Role.SUPER_ADMIN, Role.ADMIN].includes(user.role) &&
          (user.role !== Role.TEACHER ||
            sheet.module.course.instructorId !== user.id)))
    ) {
      throw new ForbiddenException('Access denied');
    }

    // Check if sheet is downloadable for students
    if (user && user.role === Role.STUDENT && !sheet.isDownloadable) {
      throw new ForbiddenException('Download not allowed for this file');
    }

    const filePath = path.join(process.cwd(), 'uploads', 'sheets', fileName);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Sheet file not found');
    }

    return { filePath, mimeType: sheet.mimeType };
  }
}
