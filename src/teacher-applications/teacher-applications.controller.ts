import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Res,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiParam,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { TeacherApplicationsService } from './teacher-applications.service';
import { CreateTeacherApplicationDto } from './dto/create-teacher-application.dto';
import { UpdateTeacherApplicationDto } from './dto/update-teacher-application.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { Role } from '../common/enums/role.enum';
import { ApiResponse as ApiResponseDto } from '../common/dto/response.dto';

@ApiTags('Teacher Applications')
@Controller('teacher-applications')
export class TeacherApplicationsController {
  constructor(
    private readonly teacherApplicationsService: TeacherApplicationsService,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('cv'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Submit teacher application',
    description:
      'Submit a new teacher application with CV upload. CV must be in PDF format only. Email must be unique across both applications and existing users.',
  })
  @ApiBody({
    description: 'Teacher application data with CV file',
    schema: {
      type: 'object',
      properties: {
        fullName: {
          type: 'string',
          description: 'Full name of the applicant',
          example: 'John Doe',
          maxLength: 255,
        },
        email: {
          type: 'string',
          format: 'email',
          description: 'Email address of the applicant (must be unique)',
          example: 'john.doe@example.com',
          maxLength: 255,
        },
        phoneNumber: {
          type: 'string',
          description: 'Phone number of the applicant',
          example: '+8801712345678',
          maxLength: 20,
        },
        qualifications: {
          type: 'string',
          description: 'Educational qualifications and degrees',
          example: 'MSc in Computer Science, BSc in Mathematics',
        },
        experience: {
          type: 'string',
          description: 'Teaching and work experience',
          example: '5 years of teaching experience at ABC University',
        },
        subjectsToTeach: {
          type: 'string',
          description: 'Subjects the applicant wants to teach',
          example: 'Mathematics, Computer Science, Physics',
        },
        additionalInfo: {
          type: 'string',
          description: 'Additional information about the applicant (optional)',
          example: 'Available for evening classes and online teaching',
        },
        cv: {
          type: 'string',
          format: 'binary',
          description: 'CV file in PDF format only',
        },
      },
      required: [
        'fullName',
        'email',
        'phoneNumber',
        'qualifications',
        'experience',
        'subjectsToTeach',
        'cv',
      ],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Teacher application submitted successfully',
    schema: {
      example: {
        success: true,
        statusCode: 201,
        message:
          'Teacher application submitted successfully. You will be notified about the status via email.',
        data: {
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          fullName: 'John Doe',
          email: 'john.doe@example.com',
          phoneNumber: '+8801712345678',
          qualifications: 'MSc in Computer Science, BSc in Mathematics',
          experience: '5 years of teaching experience',
          subjectsToTeach: 'Mathematics, Computer Science, Physics',
          additionalInfo: 'Available for evening classes',
          cvFileName: 'cv_f47ac10b-58cc-4372-a567-0e02b2c3d479.pdf',
          cvFileUrl:
            '/api/v1/teacher-applications/cv/cv_f47ac10b-58cc-4372-a567-0e02b2c3d479.pdf',
          cvFileSize: 1024000,
          cvMimeType: 'application/pdf',
          status: 'Pending',
          createdAt: '2024-08-24T10:30:00.000Z',
          updatedAt: '2024-08-24T10:30:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file type, missing CV, or validation error',
    schema: {
      example: {
        success: false,
        statusCode: 400,
        message: 'Invalid file type. Only PDF files are allowed for CV',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Email already exists in applications or users',
    schema: {
      example: {
        success: false,
        statusCode: 409,
        message: 'An application with this email already exists',
        error: 'Conflict',
      },
    },
  })
  async create(
    @Body() createTeacherApplicationDto: CreateTeacherApplicationDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const application = await this.teacherApplicationsService.create(
      createTeacherApplicationDto,
      file,
    );

    return ApiResponseDto.success(
      application,
      'Teacher application submitted successfully. You will be notified about the status via email.',
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all teacher applications',
    description:
      'Retrieve all teacher applications with pagination and filtering options. Only accessible by Super Admins.',
  })
  @ApiResponse({
    status: 200,
    description: 'Teacher applications retrieved successfully',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        message: 'Retrieved 5 teacher applications',
        data: [
          {
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            fullName: 'John Doe',
            email: 'john.doe@example.com',
            phoneNumber: '+8801712345678',
            qualifications: 'MSc in Computer Science',
            experience: '5 years teaching experience',
            subjectsToTeach: 'Mathematics, Computer Science',
            additionalInfo: 'Available for evening classes',
            cvFileName: 'cv_f47ac10b.pdf',
            cvFileUrl: '/api/v1/teacher-applications/cv/cv_f47ac10b.pdf',
            cvFileSize: 1024000,
            cvMimeType: 'application/pdf',
            status: 'Pending',
            adminNotes: null,
            reviewedBy: null,
            reviewedAt: null,
            createdAt: '2024-08-24T10:30:00.000Z',
            updatedAt: '2024-08-24T10:30:00.000Z',
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Super Admin access required',
    schema: {
      example: {
        success: false,
        statusCode: 403,
        message: 'Only super admins can view teacher applications',
        error: 'Forbidden',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
    schema: {
      example: {
        success: false,
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized',
      },
    },
  })
  async findAll(@CurrentUser() user: User) {
    const applications = await this.teacherApplicationsService.findAll(user);
    return ApiResponseDto.success(
      applications,
      `Retrieved ${applications.length} teacher applications`,
    );
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get teacher application statistics',
    description:
      'Get comprehensive statistics of teacher applications including counts by status. Only accessible by Super Admins.',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        message: 'Statistics retrieved successfully',
        data: {
          total: 15,
          pending: 8,
          approved: 5,
          rejected: 2,
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Super Admin access required',
    schema: {
      example: {
        success: false,
        statusCode: 403,
        message: 'Only super admins can view teacher application statistics',
        error: 'Forbidden',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async getStats(@CurrentUser() user: User) {
    const stats =
      await this.teacherApplicationsService.getApplicationStats(user);
    return ApiResponseDto.success(stats, 'Statistics retrieved successfully');
  }

  @Get('cv/:fileName')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiParam({
    name: 'fileName',
    description: 'CV file name (e.g., cv_uuid.pdf)',
    example: 'cv_f47ac10b-58cc-4372-a567-0e02b2c3d479.pdf',
  })
  @ApiOperation({
    summary: 'Download teacher CV',
    description:
      'Download CV file of a teacher application. Returns PDF file as binary data with proper headers. Only accessible by Super Admins.',
  })
  @ApiResponse({
    status: 200,
    description: 'CV file downloaded successfully',
    content: {
      'application/pdf': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
    headers: {
      'Content-Type': {
        description: 'MIME type of the file',
        schema: { type: 'string', example: 'application/pdf' },
      },
      'Content-Disposition': {
        description: 'Attachment header with filename',
        schema: {
          type: 'string',
          example: 'attachment; filename="cv_uuid.pdf"',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'CV file not found',
    schema: {
      example: {
        success: false,
        statusCode: 404,
        message: 'CV file not found',
        error: 'Not Found',
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Super Admin access required',
    schema: {
      example: {
        success: false,
        statusCode: 403,
        message: 'Only super admins can download teacher CVs',
        error: 'Forbidden',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async downloadCV(
    @Param('fileName') fileName: string,
    @CurrentUser() user: User,
    @Res() res: Response,
  ) {
    const fileBuffer = await this.teacherApplicationsService.downloadCV(
      fileName,
      user,
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(fileBuffer);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    description: 'Teacher application UUID',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @ApiOperation({
    summary: 'Get teacher application by ID',
    description:
      'Retrieve a specific teacher application with all details including CV information. Only accessible by Super Admins.',
  })
  @ApiResponse({
    status: 200,
    description: 'Teacher application retrieved successfully',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        message: 'Teacher application retrieved successfully',
        data: {
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          fullName: 'John Doe',
          email: 'john.doe@example.com',
          phoneNumber: '+8801712345678',
          qualifications: 'MSc in Computer Science, BSc in Mathematics',
          experience: '5 years of teaching experience at ABC University',
          subjectsToTeach: 'Mathematics, Computer Science, Physics',
          additionalInfo: 'Available for evening classes and online teaching',
          cvFileName: 'cv_f47ac10b-58cc-4372-a567-0e02b2c3d479.pdf',
          cvFileUrl:
            '/api/v1/teacher-applications/cv/cv_f47ac10b-58cc-4372-a567-0e02b2c3d479.pdf',
          cvFileSize: 1024000,
          cvMimeType: 'application/pdf',
          status: 'Approved',
          adminNotes:
            'Excellent qualifications. Approved for mathematics department.',
          reviewedBy: 'Admin Name',
          reviewedAt: '2024-08-24T12:00:00.000Z',
          createdAt: '2024-08-24T10:30:00.000Z',
          updatedAt: '2024-08-24T12:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Teacher application not found',
    schema: {
      example: {
        success: false,
        statusCode: 404,
        message:
          'Teacher application with ID f47ac10b-58cc-4372-a567-0e02b2c3d479 not found',
        error: 'Not Found',
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Super Admin access required',
    schema: {
      example: {
        success: false,
        statusCode: 403,
        message: 'Only super admins can view teacher applications',
        error: 'Forbidden',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    const application = await this.teacherApplicationsService.findOne(id, user);
    return ApiResponseDto.success(
      application,
      'Teacher application retrieved successfully',
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    description: 'Teacher application UUID',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @ApiOperation({
    summary: 'Update teacher application',
    description:
      'Update teacher application status (Pending/Approved/Rejected) or add admin notes. Automatically records reviewer and review timestamp. Only accessible by Super Admins.',
  })
  @ApiBody({
    description: 'Update application status and/or admin notes',
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['Pending', 'Approved', 'Rejected'],
          description: 'New application status',
          example: 'Approved',
        },
        adminNotes: {
          type: 'string',
          description: 'Admin notes about the application review',
          example:
            'Excellent qualifications. Approved for mathematics department.',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Teacher application updated successfully',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        message: 'Teacher application updated successfully',
        data: {
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          fullName: 'John Doe',
          email: 'john.doe@example.com',
          status: 'Approved',
          adminNotes:
            'Excellent qualifications. Approved for mathematics department.',
          reviewedBy: 'Admin Name',
          reviewedAt: '2024-08-24T12:00:00.000Z',
          updatedAt: '2024-08-24T12:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Teacher application not found',
    schema: {
      example: {
        success: false,
        statusCode: 404,
        message: 'Teacher application with ID f47ac10b not found',
        error: 'Not Found',
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Super Admin access required',
    schema: {
      example: {
        success: false,
        statusCode: 403,
        message: 'Only super admins can update teacher applications',
        error: 'Forbidden',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid status or validation error',
    schema: {
      example: {
        success: false,
        statusCode: 400,
        message:
          'status must be one of the following values: Pending, Approved, Rejected',
        error: 'Bad Request',
      },
    },
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTeacherApplicationDto: UpdateTeacherApplicationDto,
    @CurrentUser() user: User,
  ) {
    const application = await this.teacherApplicationsService.update(
      id,
      updateTeacherApplicationDto,
      user,
    );
    return ApiResponseDto.success(
      application,
      'Teacher application updated successfully',
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    description: 'Teacher application UUID',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @ApiOperation({
    summary: 'Delete teacher application',
    description:
      'Permanently delete a teacher application and its associated CV file from the server. This action cannot be undone. Only accessible by Super Admins.',
  })
  @ApiResponse({
    status: 200,
    description: 'Teacher application deleted successfully',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        message: 'Teacher application deleted successfully',
        data: null,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Teacher application not found',
    schema: {
      example: {
        success: false,
        statusCode: 404,
        message: 'Teacher application with ID f47ac10b not found',
        error: 'Not Found',
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Super Admin access required',
    schema: {
      example: {
        success: false,
        statusCode: 403,
        message: 'Only super admins can delete teacher applications',
        error: 'Forbidden',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    await this.teacherApplicationsService.remove(id, user);
    return ApiResponseDto.success(
      null,
      'Teacher application deleted successfully',
    );
  }
}
