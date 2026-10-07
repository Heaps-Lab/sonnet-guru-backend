import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Not } from 'typeorm';
import { Module } from './entities/module.entity';
import { Video } from './entities/video.entity';
import { ModuleSheet } from './entities/module-sheet.entity';
import { Course } from '../courses/entities/course.entity';
import { Subject } from '../subjects/entities/subject.entity';
import { Enrollment } from '../payments/entities/enrollment.entity';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { UploadVideoDto } from './dto/upload-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { UploadSheetDto } from './dto/upload-sheet.dto';
import { CompleteModuleDto } from './dto/complete-module.dto';
import { User } from '../users/entities/user.entity';
import { Role } from '../common/enums/role.enum';
import { PaymentStatus } from '../common/enums/payment.enum';
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
    @InjectRepository(Subject)
    private subjectRepository: Repository<Subject>,
    @InjectRepository(Enrollment)
    private enrollmentRepository: Repository<Enrollment>,
    private dataSource: DataSource,
  ) {}

  async create(createModuleDto: CreateModuleDto, user: User): Promise<Module> {
    // Verify subject exists and get course info
    const subject = await this.subjectRepository.findOne({
      where: { id: createModuleDto.subjectId, isActive: true },
      relations: { course: true },
    });

    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    const course = subject.course;
    if (!course || !course.isActive) {
      throw new NotFoundException('Course not found or inactive');
    }

    // Check permissions
    if (
      ![Role.SUPER_ADMIN, Role.ADMIN].includes(user.role) &&
      (user.role !== Role.TEACHER || course.instructorId !== user.id)
    ) {
      throw new ForbiddenException(
        'You do not have permission to create modules for this subject',
      );
    }

    // Check if sequence order already exists for this subject
    const existingModule = await this.moduleRepository.findOne({
      where: {
        subjectId: createModuleDto.subjectId,
        sequenceOrder: createModuleDto.sequenceOrder,
      },
    });

    if (existingModule) {
      throw new BadRequestException(
        `Module with sequence order ${createModuleDto.sequenceOrder} already exists for this subject`,
      );
    }

    const module = this.moduleRepository.create({
      ...createModuleDto,
      courseId: createModuleDto.courseId || course.id, // Set courseId for backward compatibility
    });

    const savedModule = await this.moduleRepository.save(module);

    // Update subject stats
    await this.updateSubjectStats(createModuleDto.subjectId);

    return savedModule;
  }

  async findAll(subjectId: string, user?: User): Promise<Module[]> {
    const subject = await this.subjectRepository.findOne({
      where: { id: subjectId, isActive: true },
      relations: { course: true },
    });

    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    const course = subject.course;
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // SUPER_ADMIN / ADMIN: full access always
    if (user && [Role.SUPER_ADMIN, Role.ADMIN].includes(user.role)) {
      return this.moduleRepository
        .createQueryBuilder('module')
        .leftJoinAndSelect('module.videos', 'videos')
        .leftJoinAndSelect('module.sheets', 'sheets')
        .leftJoinAndSelect('module.quizzes', 'quizzes')
        .where('module.subjectId = :subjectId', { subjectId })
        .orderBy('module.sequenceOrder', 'ASC')
        .addOrderBy('videos.sequenceNumber', 'ASC')
        .getMany();
    }

    // TEACHER: full access to their own course
    if (user && user.role === Role.TEACHER && course.instructorId === user.id) {
      return this.moduleRepository
        .createQueryBuilder('module')
        .leftJoinAndSelect('module.videos', 'videos')
        .leftJoinAndSelect('module.sheets', 'sheets')
        .leftJoinAndSelect('module.quizzes', 'quizzes')
        .where('module.subjectId = :subjectId', { subjectId })
        .orderBy('module.sequenceOrder', 'ASC')
        .addOrderBy('videos.sequenceNumber', 'ASC')
        .getMany();
    }

    // STUDENT: must be enrolled
    if (user && user.role === Role.STUDENT) {
      const enrollment = await this.enrollmentRepository.findOne({
        where: { userId: user.id, courseId: course.id, isActive: true },
      });

      if (!enrollment) {
        throw new ForbiddenException(
          'You are not enrolled in this course. Please enroll to access the modules.',
        );
      }

      return this.moduleRepository
        .createQueryBuilder('module')
        .leftJoinAndSelect('module.videos', 'videos')
        .leftJoinAndSelect('module.sheets', 'sheets')
        .leftJoinAndSelect('module.quizzes', 'quizzes')
        .where('module.subjectId = :subjectId', { subjectId })
        .andWhere('module.isPublished = :isPublished', { isPublished: true })
        .orderBy('module.sequenceOrder', 'ASC')
        .addOrderBy('videos.sequenceNumber', 'ASC')
        .getMany();
    }

    // Unauthenticated / others: course must be published, only published modules
    if (!course.isPublished) {
      throw new ForbiddenException('Course not accessible');
    }

    return this.moduleRepository
      .createQueryBuilder('module')
      .leftJoinAndSelect('module.videos', 'videos')
      .leftJoinAndSelect('module.sheets', 'sheets')
      .leftJoinAndSelect('module.quizzes', 'quizzes')
      .where('module.subjectId = :subjectId', { subjectId })
      .andWhere('module.isPublished = :isPublished', { isPublished: true })
      .orderBy('module.sequenceOrder', 'ASC')
      .addOrderBy('videos.sequenceNumber', 'ASC')
      .getMany();
  }

  async findOne(id: string, user?: User): Promise<Module> {
    const module = await this.moduleRepository
      .createQueryBuilder('module')
      .leftJoinAndSelect('module.course', 'course')
      .leftJoinAndSelect('module.subject', 'subject')
      .leftJoinAndSelect('module.videos', 'videos')
      .leftJoinAndSelect('module.sheets', 'sheets')
      .leftJoinAndSelect('module.quizzes', 'quizzes')
      .where('module.id = :id', { id })
      .orderBy('videos.sequenceNumber', 'ASC')
      .getOne();

    if (!module) {
      throw new NotFoundException('Module not found');
    }

    // SUPER_ADMIN / ADMIN: full access always
    if (user && [Role.SUPER_ADMIN, Role.ADMIN].includes(user.role)) {
      return module;
    }

    // TEACHER: full access to their own course
    if (
      user &&
      user.role === Role.TEACHER &&
      module.course.instructorId === user.id
    ) {
      return module;
    }

    // STUDENT: must be enrolled in the course
    if (user && user.role === Role.STUDENT) {
      const enrollment = await this.enrollmentRepository.findOne({
        where: { userId: user.id, courseId: module.courseId, isActive: true },
      });

      if (!enrollment) {
        throw new ForbiddenException(
          'You are not enrolled in this course. Please enroll to access this module.',
        );
      }

      // Check if module is published for students
      if (!module.isPublished) {
        throw new NotFoundException('Module not found');
      }

      return module;
    }

    // Unauthenticated / others: course must be published and module must be published
    if (!module.course.isPublished || !module.isPublished) {
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
    file: Express.Multer.File | undefined,
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

    // Validate that either file or videoUrl is provided
    if (!file && !uploadVideoDto.videoUrl) {
      throw new BadRequestException(
        'Either a video file or a direct video URL must be provided',
      );
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
      let fileName: string | null = null;
      let videoUrl: string;
      let videoSource: 'uploaded' | 'external';
      let fileSize: number = 0;
      let mimeType: string = '';
      let duration: number = uploadVideoDto.duration || 0;

      // Handle file upload
      if (file) {
        if (file.size === 0) {
          throw new BadRequestException('Cannot upload an empty file');
        }

        // Generate unique filename
        const fileExtension = path.extname(file.originalname);
        fileName = `${uuidv4()}${fileExtension}`;
        const uploadPath = path.join(process.cwd(), 'uploads', 'videos');

        // Ensure upload directory exists
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }

        const filePath = path.join(uploadPath, fileName);

        // Save file to disk
        fs.writeFileSync(filePath, file.buffer);

        videoUrl = `/api/v1/videos/${fileName}`;
        videoSource = 'uploaded';
        fileSize = file.size;
        mimeType = file.mimetype;
        // In production, extract actual duration from video
        duration = 0;
      } else {
        // Handle direct URL
        videoUrl = uploadVideoDto.videoUrl!; // We know it exists because we're in this branch
        videoSource = 'external';
        fileName = null;
        fileSize = 0; // Not applicable for external URLs
        mimeType = ''; // Not applicable for external URLs
        duration = uploadVideoDto.duration || 0;
      }

      // Create video record
      const video = manager.create(Video, {
        title: uploadVideoDto.title,
        description: uploadVideoDto.description || null,
        sequenceNumber: uploadVideoDto.sequenceNumber,
        isDownloadable: uploadVideoDto.isDownloadable ?? true,
        moduleId,
        fileName: fileName || null,
        videoUrl,
        videoSource,
        fileSize,
        mimeType,
        duration,
        status: 'ready', // In production, this would be 'processing' initially
      });

      const savedVideo = await manager.save(Video, video);

      // Update module total duration (placeholder logic)
      await manager.update(Module, moduleId, {
        totalDuration: () => 'totalDuration + 0', // Would be updated after processing
      });

      return savedVideo;
    });
  }

  async updateVideo(
    videoId: string,
    updateVideoDto: UpdateVideoDto,
    file: Express.Multer.File | undefined,
    user: User,
  ): Promise<Video> {
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
        'You do not have permission to update this video',
      );
    }

    if (video.module.isCompleted) {
      throw new BadRequestException(
        'Cannot update videos from a completed module',
      );
    }

    // Check for duplicate sequence number if changing it
    if (
      updateVideoDto.sequenceNumber &&
      updateVideoDto.sequenceNumber !== video.sequenceNumber
    ) {
      const existingVideo = await this.videoRepository.findOne({
        where: {
          moduleId: video.moduleId,
          sequenceNumber: updateVideoDto.sequenceNumber,
          id: Not(videoId),
        },
      });

      if (existingVideo) {
        throw new BadRequestException(
          'Video with this sequence number already exists',
        );
      }
    }

    return this.dataSource.transaction(async (manager) => {
      let updateData: Partial<Video> = {};

      // Update basic fields if provided
      if (updateVideoDto.title) updateData.title = updateVideoDto.title;
      if (updateVideoDto.description !== undefined)
        updateData.description = updateVideoDto.description;
      if (updateVideoDto.sequenceNumber)
        updateData.sequenceNumber = updateVideoDto.sequenceNumber;
      if (updateVideoDto.isDownloadable !== undefined)
        updateData.isDownloadable = updateVideoDto.isDownloadable;

      // Handle video replacement scenarios
      if (file || updateVideoDto.videoUrl) {
        // Delete old uploaded file if replacing with a new one
        if (file && video.videoSource === 'uploaded' && video.fileName) {
          const oldFilePath = path.join(
            process.cwd(),
            'uploads',
            'videos',
            video.fileName,
          );
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        }

        if (file) {
          // Upload new file
          if (file.size === 0) {
            throw new BadRequestException('Cannot upload an empty file');
          }

          const fileExtension = path.extname(file.originalname);
          const fileName = `${uuidv4()}${fileExtension}`;
          const uploadPath = path.join(process.cwd(), 'uploads', 'videos');

          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }

          const filePath = path.join(uploadPath, fileName);
          fs.writeFileSync(filePath, file.buffer);

          updateData.fileName = fileName;
          updateData.videoUrl = `/api/v1/videos/${fileName}`;
          updateData.videoSource = 'uploaded';
          updateData.fileSize = file.size;
          updateData.mimeType = file.mimetype;
          updateData.duration = 0; // Would be extracted in production
        } else if (updateVideoDto.videoUrl) {
          // Update to external URL
          updateData.videoUrl = updateVideoDto.videoUrl;
          updateData.videoSource = 'external';
          updateData.fileName = null;
          updateData.fileSize = 0;
          updateData.mimeType = '';
          updateData.duration = updateVideoDto.duration || video.duration;
        }
      }

      // Update the video
      await manager.update(Video, videoId, updateData);

      // Return updated video
      const updatedVideo = await manager.findOne(Video, {
        where: { id: videoId },
      });
      if (!updatedVideo) {
        throw new NotFoundException('Video not found after update');
      }
      return updatedVideo;
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

    // Debug logging
    console.log('Upload Sheet DTO:', uploadSheetDto);
    console.log('isDownloadable value:', uploadSheetDto.isDownloadable);
    console.log('isDownloadable type:', typeof uploadSheetDto.isDownloadable);

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

    // Ensure isDownloadable defaults to true if not provided
    const isDownloadable =
      uploadSheetDto.isDownloadable !== undefined
        ? uploadSheetDto.isDownloadable
        : true;

    console.log('Final isDownloadable value:', isDownloadable);

    // Create sheet record
    const sheet = this.sheetRepository.create({
      ...uploadSheetDto,
      isDownloadable, // Explicitly set it
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

    // Update subject stats if module belongs to a subject
    if (module.subjectId) {
      await this.updateSubjectStats(module.subjectId);
    }

    return this.findOne(id, user);
  }

  private async updateSubjectStats(subjectId: string): Promise<void> {
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

    // Delete file from disk only if it's an uploaded video
    if (video.videoSource === 'uploaded' && video.fileName) {
      const filePath = path.join(
        process.cwd(),
        'uploads',
        'videos',
        video.fileName,
      );
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    // External URLs don't need cleanup

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
    user: User,
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

    const course = video.module.course;

    // SUPER_ADMIN / ADMIN: always allowed
    if ([Role.SUPER_ADMIN, Role.ADMIN].includes(user.role)) {
      // pass through
    }
    // TEACHER: allowed for their own course
    else if (user.role === Role.TEACHER && course.instructorId === user.id) {
      // pass through
    }
    // STUDENT: must be enrolled with APPROVED payment
    else if (user.role === Role.STUDENT) {
      const enrollment = await this.enrollmentRepository.findOne({
        where: { userId: user.id, courseId: course.id, isActive: true },
        relations: { paymentClaim: true },
      });

      if (!enrollment) {
        throw new ForbiddenException(
          'You are not enrolled in this course. Please enroll to watch videos.',
        );
      }

      // Check if payment claim is approved
      if (
        !enrollment.paymentClaim ||
        enrollment.paymentClaim.status !== PaymentStatus.APPROVED
      ) {
        throw new ForbiddenException(
          'Your payment is still pending approval. Please wait for admin verification to access course content.',
        );
      }
    }
    // Any other case: deny
    else {
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
    user: User,
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

    const course = sheet.module.course;

    // SUPER_ADMIN / ADMIN: always allowed
    if ([Role.SUPER_ADMIN, Role.ADMIN].includes(user.role)) {
      // pass through
    }
    // TEACHER: allowed for their own course
    else if (user.role === Role.TEACHER && course.instructorId === user.id) {
      // pass through
    }
    // STUDENT: must be enrolled + sheet must be downloadable
    else if (user.role === Role.STUDENT) {
      const enrollment = await this.enrollmentRepository.findOne({
        where: { userId: user.id, courseId: course.id, isActive: true },
        relations: { paymentClaim: true },
      });

      if (!enrollment) {
        throw new ForbiddenException(
          'You are not enrolled in this course. Please enroll to access study materials.',
        );
      }

      // Check if payment claim is approved
      if (
        !enrollment.paymentClaim ||
        enrollment.paymentClaim.status !== PaymentStatus.APPROVED
      ) {
        throw new ForbiddenException(
          'Your payment is still pending approval. Please wait for admin verification to access course content.',
        );
      }

      if (!sheet.isDownloadable) {
        throw new ForbiddenException('Download not allowed for this file');
      }
    }
    // Any other case: deny
    else {
      throw new ForbiddenException('Access denied');
    }

    const filePath = path.join(process.cwd(), 'uploads', 'sheets', fileName);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Sheet file not found');
    }

    return { filePath, mimeType: sheet.mimeType };
  }
}
