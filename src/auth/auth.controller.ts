import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerResponse,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyOtpDto, ResendOtpDto } from './dto/verify-otp.dto';
import { ApiResponse } from '../common/dto/response.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register new user',
    description:
      'Create a new user account with email and password. Default role is Student unless specified.',
  })
  @ApiBody({ type: RegisterDto })
  @SwaggerResponse({
    status: 201,
    description: 'User registered successfully',
    schema: {
      example: {
        success: true,
        statusCode: 201,
        message: 'User registered successfully',
        data: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'John Doe',
          email: 'john.doe@example.com',
          phoneNumber: '+8801712345678',
          role: 'Student',
          isActive: true,
          createdAt: '2024-07-16T10:30:00.000Z',
        },
      },
    },
  })
  @SwaggerResponse({
    status: 400,
    description: 'Bad request - Email already exists or invalid input',
    schema: {
      example: {
        success: false,
        statusCode: 400,
        error: 'Bad Request',
        message: 'Email already exists',
      },
    },
  })
  async register(@Body() registerDto: RegisterDto) {
    const user = await this.authService.register(registerDto);
    return ApiResponse.success(
      user,
      'User registered successfully',
      HttpStatus.CREATED,
    );
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User login with device registration',
    description:
      'Authenticate user and register device session. Maximum 1 mobile and 1 desktop device allowed simultaneously.',
  })
  @ApiBody({ type: LoginDto })
  @SwaggerResponse({
    status: 200,
    description: 'Authentication successful',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        message: 'Authentication verified successfully.',
        data: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          user: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            name: 'John Doe',
            email: 'john.doe@example.com',
            role: 'Student',
          },
          sessionState: {
            activeSessionsCount: 1,
            currentSessionId: 'sess_89123847',
          },
        },
      },
    },
  })
  @SwaggerResponse({
    status: 401,
    description: 'Unauthorized - Invalid credentials',
    schema: {
      example: {
        success: false,
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid credentials',
      },
    },
  })
  @SwaggerResponse({
    status: 403,
    description: 'Forbidden - Device limit exceeded',
    schema: {
      example: {
        success: false,
        statusCode: 403,
        error: 'Forbidden',
        message:
          'Active device limit breached. This account is actively bound to another terminal instance.',
      },
    },
  })
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);
    return ApiResponse.success(result, 'Authentication verified successfully.');
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify email with OTP code',
    description:
      'Verify user email address using the 6-digit OTP code sent via email',
  })
  @ApiBody({ type: VerifyOtpDto })
  @SwaggerResponse({
    status: 200,
    description: 'Email verified successfully',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        message: 'Email verified successfully! You can now log in.',
        data: {
          user: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            name: 'John Doe',
            email: 'john.doe@example.com',
            role: 'Student',
          },
        },
      },
    },
  })
  @SwaggerResponse({
    status: 400,
    description: 'Invalid OTP or format error',
    schema: {
      example: {
        success: false,
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid OTP. 3 attempts remaining.',
      },
    },
  })
  @SwaggerResponse({
    status: 429,
    description: 'Too many failed attempts',
    schema: {
      example: {
        success: false,
        statusCode: 429,
        error: 'Too Many Requests',
        message: 'Too many failed attempts. Please request a new OTP.',
      },
    },
  })
  async verifyOTP(@Body() verifyOtpDto: VerifyOtpDto) {
    const result = await this.authService.verifyOTP(
      verifyOtpDto.email,
      verifyOtpDto.otp,
    );
    return ApiResponse.success(result, result.message);
  }

  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resend OTP verification code',
    description: 'Resend a new 6-digit OTP code to the user email address',
  })
  @ApiBody({ type: ResendOtpDto })
  @SwaggerResponse({
    status: 200,
    description: 'New OTP sent successfully',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        message: 'New verification code sent. Please check your email.',
        data: {
          message: 'New verification code sent. Please check your email.',
          otpExpiryMinutes: 5,
        },
      },
    },
  })
  @SwaggerResponse({
    status: 400,
    description: 'Email already verified or user not found',
    schema: {
      example: {
        success: false,
        statusCode: 400,
        error: 'Bad Request',
        message: 'Email is already verified',
      },
    },
  })
  @SwaggerResponse({
    status: 429,
    description: 'Resend cooldown active',
    schema: {
      example: {
        success: false,
        statusCode: 429,
        error: 'Too Many Requests',
        message: 'Please wait 45 seconds before requesting a new OTP.',
      },
    },
  })
  async resendOTP(@Body() resendOtpDto: ResendOtpDto) {
    const result = await this.authService.resendOTP(resendOtpDto.email);
    return ApiResponse.success(result, result.message);
  }

  @Get('otp-status')
  @ApiOperation({
    summary: 'Get OTP verification status',
    description:
      'Check the current status of OTP verification for an email address',
  })
  @ApiQuery({
    name: 'email',
    description: 'Email address to check OTP status',
    example: 'user@example.com',
  })
  @SwaggerResponse({
    status: 200,
    description: 'OTP status retrieved successfully',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        message: 'OTP status retrieved successfully',
        data: {
          exists: true,
          expiresIn: 245,
          attemptsRemaining: 5,
          maxAttempts: 5,
          canResend: false,
        },
      },
    },
  })
  async getOTPStatus(@Query('email') email: string) {
    const result = await this.authService.getOTPStatus(email);
    return ApiResponse.success(result, 'OTP status retrieved successfully');
  }
}
