import { IsString, IsEmail, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTeacherApplicationDto {
  @ApiProperty({
    description: 'Full name of the applicant',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fullName: string;

  @ApiProperty({
    description: 'Email address of the applicant',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  email: string;

  @ApiProperty({
    description: 'Phone number of the applicant',
    example: '+8801712345678',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phoneNumber: string;

  @ApiProperty({
    description: 'Educational qualifications and degrees',
    example: 'MSc in Computer Science, BSc in Mathematics',
  })
  @IsString()
  @IsNotEmpty()
  qualifications: string;

  @ApiProperty({
    description: 'Teaching and work experience',
    example: '5 years of teaching experience at ABC University',
  })
  @IsString()
  @IsNotEmpty()
  experience: string;

  @ApiProperty({
    description: 'Subjects the applicant wants to teach',
    example: 'Mathematics, Computer Science, Physics',
  })
  @IsString()
  @IsNotEmpty()
  subjectsToTeach: string;

  @ApiPropertyOptional({
    description: 'Additional information about the applicant',
    example: 'Available for evening classes and online teaching',
  })
  @IsString()
  @IsOptional()
  additionalInfo?: string;
}