/* eslint-disable @typescript-eslint/require-await */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  TeacherApplication,
  ApplicationStatus,
} from './entities/teacher-application.entity';
import { CreateTeacherApplicationDto } from './dto/create-teacher-application.dto';
import { UpdateTeacherApplicationDto } from './dto/update-teacher-application.dto';
import { User } from '../users/entities/user.entity';
import { Role } from '../common/enums/role.enum';
import { EmailService } from '../email/email.service';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

const ALLOWED_CV_MIME_TYPES = ['application/pdf'];

@Injectable()
export class TeacherApplicationsService {
  private readonly logger = new Logger(TeacherApplicationsService.name);

  constructor(
    @InjectRepository(TeacherApplication)
    private applicationRepository: Repository<TeacherApplication>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private emailService: EmailService,
    private configService: ConfigService,
  ) {}

  async create(
    createApplicationDto: CreateTeacherApplicationDto,
    file: Express.Multer.File,
  ): Promise<TeacherApplication> {
    // Check if email already exists in applications
    const existingApplication = await this.applicationRepository.findOne({
      where: { email: createApplicationDto.email },
    });

    if (existingApplication) {
      throw new ConflictException(
        'An application with this email already exists',
      );
    }

    // Check if email already exists in users table
    const existingUser = await this.userRepository.findOne({
      where: { email: createApplicationDto.email },
    });

    if (existingUser) {
      throw new ConflictException(
        'A user account with this email already exists',
      );
    }

    if (!file) {
      throw new BadRequestException('CV file is required');
    }

    if (!ALLOWED_CV_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only PDF files are allowed for CV',
      );
    }

    // Debug logging
    console.log('Teacher Application DTO:', createApplicationDto);
    console.log('CV File:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    });

    // Generate unique filename
    const fileExtension = path.extname(file.originalname);
    const fileName = `cv_${uuidv4()}${fileExtension}`;
    const uploadPath = path.join(process.cwd(), 'uploads', 'teacher-cvs');

    // Ensure upload directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    const filePath = path.join(uploadPath, fileName);

    try {
      // Save file to disk
      fs.writeFileSync(filePath, file.buffer);
      this.logger.log(`CV file saved: ${fileName}`);

      // Create application record
      const application = this.applicationRepository.create({
        ...createApplicationDto,
        cvFileName: fileName,
        cvFileUrl: `/api/v1/teacher-applications/cv/${fileName}`,
        cvFileSize: file.size,
        cvMimeType: file.mimetype,
        status: ApplicationStatus.PENDING,
      });

      const savedApplication =
        await this.applicationRepository.save(application);
      this.logger.log(
        `Teacher application created with ID: ${savedApplication.id}`,
      );

      // Send email notification to admin with CV attachment
      try {
        const adminEmail =
          this.configService.get<string>('ADMIN_EMAIL') ||
          'sonnetguruedu@gmail.com';
        await this.emailService.sendTeacherApplicationNotification(
          adminEmail,
          savedApplication,
          file.buffer,
          fileName,
        );
        this.logger.log(
          `✅ Admin notification sent for application ${savedApplication.id}`,
        );
      } catch (emailError) {
        this.logger.error(
          `❌ Failed to send admin notification for application ${savedApplication.id}:`,
          emailError,
        );
        // Don't fail the application creation if email fails
      }

      return savedApplication;
    } catch (error) {
      // Clean up file if database save fails
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      this.logger.error('Failed to create teacher application:', error);
      throw error;
    }
  }

  async findAll(user: User): Promise<TeacherApplication[]> {
    // Only super admins can view all applications
    if (user.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException(
        'Only super admins can view teacher applications',
      );
    }

    return await this.applicationRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, user: User): Promise<TeacherApplication> {
    // Only super admins can view applications
    if (user.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException(
        'Only super admins can view teacher applications',
      );
    }

    const application = await this.applicationRepository.findOne({
      where: { id },
    });

    if (!application) {
      throw new NotFoundException(
        `Teacher application with ID ${id} not found`,
      );
    }

    return application;
  }

  async update(
    id: string,
    updateApplicationDto: UpdateTeacherApplicationDto,
    user: User,
  ): Promise<TeacherApplication> {
    // Only super admins can update applications
    if (user.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException(
        'Only super admins can update teacher applications',
      );
    }

    const application = await this.findOne(id, user);

    // Set review information
    if (updateApplicationDto.status) {
      application.reviewedBy = user.name || user.email;
      application.reviewedAt = new Date();
    }

    Object.assign(application, updateApplicationDto);

    const updatedApplication =
      await this.applicationRepository.save(application);
    this.logger.log(
      `Teacher application ${id} updated by ${user.name || user.email}`,
    );

    return updatedApplication;
  }

  async remove(id: string, user: User): Promise<void> {
    // Only super admins can delete applications
    if (user.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException(
        'Only super admins can delete teacher applications',
      );
    }

    const application = await this.findOne(id, user);

    try {
      // Delete CV file from disk
      const filePath = path.join(
        process.cwd(),
        'uploads',
        'teacher-cvs',
        application.cvFileName,
      );

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        this.logger.log(`Deleted CV file: ${application.cvFileName}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to delete CV file ${application.cvFileName}:`,
        error,
      );
      // Continue with database deletion even if file deletion fails
    }

    await this.applicationRepository.remove(application);
    this.logger.log(
      `Teacher application ${id} deleted by ${user.name || user.email}`,
    );
  }

  async getApplicationStats(user: User): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  }> {
    // Only super admins can view stats
    if (user.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException(
        'Only super admins can view teacher application statistics',
      );
    }

    const [total, pending, approved, rejected] = await Promise.all([
      this.applicationRepository.count(),
      this.applicationRepository.count({
        where: { status: ApplicationStatus.PENDING },
      }),
      this.applicationRepository.count({
        where: { status: ApplicationStatus.APPROVED },
      }),
      this.applicationRepository.count({
        where: { status: ApplicationStatus.REJECTED },
      }),
    ]);

    return { total, pending, approved, rejected };
  }

  async downloadCV(fileName: string, user: User): Promise<Buffer> {
    // Only super admins can download CVs
    if (user.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException(
        'Only super admins can download teacher CVs',
      );
    }

    const filePath = path.join(
      process.cwd(),
      'uploads',
      'teacher-cvs',
      fileName,
    );

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('CV file not found');
    }

    try {
      return fs.readFileSync(filePath);
    } catch (error) {
      this.logger.error(`Failed to read CV file ${fileName}:`, error);
      throw new BadRequestException('Failed to read CV file');
    }
  }
}
