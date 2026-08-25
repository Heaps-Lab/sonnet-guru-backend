import { PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateTeacherApplicationDto } from './create-teacher-application.dto';
import { ApplicationStatus } from '../entities/teacher-application.entity';

export class UpdateTeacherApplicationDto extends PartialType(
  CreateTeacherApplicationDto,
) {
  @ApiPropertyOptional({
    description: 'Application status',
    enum: ApplicationStatus,
    example: ApplicationStatus.APPROVED,
    enumName: 'ApplicationStatus',
  })
  @IsEnum(ApplicationStatus)
  @IsOptional()
  status?: ApplicationStatus;

  @ApiPropertyOptional({
    description: 'Admin notes about the application review',
    example:
      'Excellent qualifications. Approved for mathematics courses. Will be contacted for interview.',
  })
  @IsString()
  @IsOptional()
  adminNotes?: string;
}
