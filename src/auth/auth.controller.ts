import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerResponse,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
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
}
