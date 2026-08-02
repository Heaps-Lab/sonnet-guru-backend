import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
  IsMobilePhone,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../../common/enums/role.enum';
import { Column } from 'typeorm';

export class RegisterDto {
  @ApiProperty({
    description: 'Full name of the user',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Valid email address',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Phone number (international format)',
    example: '+8801712345678',
  })
  @IsMobilePhone()
  @IsNotEmpty()
  @Column({ type: 'varchar', length: 11, nullable: false })
  phoneNumber: string;

  @ApiProperty({
    description: 'Password (minimum 6 characters)',
    example: 'SecurePass123!',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({
    description: 'User role',
    enum: Role,
    default: Role.STUDENT,
    example: Role.STUDENT,
  })
  @IsEnum(Role)
  @IsOptional()
  role?: Role;
}
