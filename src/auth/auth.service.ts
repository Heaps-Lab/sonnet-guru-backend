/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { RedisService } from '../common/services/redis.service';
import { OTPUtil } from '../common/utils/otp.util';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

// Custom exception for rate limiting
class TooManyRequestsException extends HttpException {
  constructor(message: string) {
    super(message, HttpStatus.TOO_MANY_REQUESTS);
  }
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly MAX_MOBILE_SESSIONS = 1;
  private readonly MAX_DESKTOP_SESSIONS = 1;
  private readonly MAX_OTP_ATTEMPTS = 5;
  private readonly OTP_EXPIRY_MINUTES = 5;
  private readonly OTP_RESEND_COOLDOWN = 60; // 1 minute cooldown for resend

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private redisService: RedisService,
    private otpUtil: OTPUtil,
  ) {}

  async register(registerDto: RegisterDto) {
    const user = await this.usersService.create(registerDto);

    // Generate OTP for email verification
    const otp = this.otpUtil.generateOTP({
      length: 6,
      expiryMinutes: this.OTP_EXPIRY_MINUTES,
    });

    // Store OTP in Redis with 5-minute TTL
    await this.redisService.setOTP(
      user.email,
      otp,
      this.OTP_EXPIRY_MINUTES * 60, // Convert to seconds
    );

    // Store temporary user registration data
    await this.redisService.setTempUserData(user.email, {
      userId: user.id,
      registrationTime: new Date(),
      status: 'pending_verification',
    });

    // Send OTP verification email
    try {
      await this.emailService.sendOTPVerificationEmail(
        user.email,
        user.name,
        otp,
      );
      this.logger.log(`✅ OTP verification email sent to ${user.email}`);
    } catch (error) {
      this.logger.error('❌ Failed to send OTP email:', error?.message);
      // Clean up Redis data if email fails
      await this.redisService.deleteOTP(user.email);
      await this.redisService.deleteTempUserData(user.email);
      throw new BadRequestException(
        'Failed to send verification email. Please try again.',
      );
    }

    const { password, ...result } = user;
    return {
      ...result,
      message:
        'Registration successful. Please check your email for the 6-digit verification code.',
      otpExpiryMinutes: this.OTP_EXPIRY_MINUTES,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password, deviceId, deviceName } = loginDto;

    // Find user (with password hash, needed for credential validation)
    const user = await this.usersService.findByEmailWithPassword(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Validate password
    const isPasswordValid = await this.usersService.validatePassword(
      password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if email is verified (only for students)
    if (user.role === 'Student' && !user.isEmailVerified) {
      throw new ForbiddenException(
        'Please verify your email before logging in. Check your inbox for the verification code.',
      );
    }

    // Check device limits (simplified - 1 mobile + 1 desktop)
    const activeSessions = user.activeSessions || [];
    const isMobile =
      deviceName.toLowerCase().includes('mobile') ||
      deviceName.toLowerCase().includes('android') ||
      deviceName.toLowerCase().includes('ios');

    const existingDeviceSession = activeSessions.find(
      (s) => s.deviceId === deviceId,
    );

    if (!existingDeviceSession) {
      // Check if adding new device would exceed limits
      const mobileCount = activeSessions.filter(
        (s) =>
          s.deviceName.toLowerCase().includes('mobile') ||
          s.deviceName.toLowerCase().includes('android') ||
          s.deviceName.toLowerCase().includes('ios'),
      ).length;

      const desktopCount = activeSessions.length - mobileCount;

      if (isMobile && mobileCount >= this.MAX_MOBILE_SESSIONS) {
        throw new ForbiddenException(
          'Active device limit breached. This account is actively bound to another terminal instance. Revoke prior sessions before proceeding.',
        );
      }

      if (!isMobile && desktopCount >= this.MAX_DESKTOP_SESSIONS) {
        throw new ForbiddenException(
          'Active device limit breached. This account is actively bound to another terminal instance. Revoke prior sessions before proceeding.',
        );
      }
    }

    // Generate session
    const sessionId = `sess_${uuidv4().substring(0, 8)}`;

    // Update or add session
    let updatedSessions;
    if (existingDeviceSession) {
      updatedSessions = activeSessions.map((s) =>
        s.deviceId === deviceId
          ? { ...s, sessionId, lastActive: new Date() }
          : s,
      );
    } else {
      updatedSessions = [
        ...activeSessions,
        { deviceId, deviceName, sessionId, lastActive: new Date() },
      ];
    }

    await this.usersService.updateSessions(user.id.toString(), updatedSessions);

    // Generate JWT
    const payload = {
      sub: user.id.toString(),
      email: user.email,
      role: user.role,
      sessionId,
    };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
      sessionState: {
        activeSessionsCount: updatedSessions.length,
        currentSessionId: sessionId,
      },
    };
  }

  async validateUser(userId: string) {
    return this.usersService.findById(userId);
  }

  async verifyOTP(email: string, inputOTP: string) {
    // Check if OTP exists
    const storedOTP = await this.redisService.getOTP(email);
    if (!storedOTP) {
      throw new BadRequestException(
        'OTP not found or expired. Please request a new one.',
      );
    }

    // Check attempt count
    const attempts = await this.redisService.getAttempts(email);
    if (attempts >= this.MAX_OTP_ATTEMPTS) {
      await this.redisService.deleteOTP(email);
      throw new TooManyRequestsException(
        'Too many failed attempts. Please request a new OTP.',
      );
    }

    // Validate OTP format
    if (!this.otpUtil.isValidOTPFormat(inputOTP)) {
      await this.redisService.incrementAttempts(email);
      throw new BadRequestException(
        'Invalid OTP format. Please enter a 6-digit code.',
      );
    }

    // Compare OTPs
    const isValid = this.otpUtil.compareOTP(inputOTP, storedOTP);
    if (!isValid) {
      const newAttempts = await this.redisService.incrementAttempts(email);
      const remaining = this.MAX_OTP_ATTEMPTS - newAttempts;

      if (remaining <= 0) {
        await this.redisService.deleteOTP(email);
        throw new TooManyRequestsException(
          'Too many failed attempts. Please request a new OTP.',
        );
      }

      throw new BadRequestException(
        `Invalid OTP. ${remaining} attempts remaining.`,
      );
    }

    // OTP is valid - get user data
    const tempUserData = await this.redisService.getTempUserData(email);
    if (!tempUserData) {
      throw new BadRequestException(
        'User data not found. Please register again.',
      );
    }

    // Mark user as verified in database
    await this.usersService.verifyEmail(tempUserData.userId);

    // Clean up Redis data
    await this.redisService.deleteOTP(email);
    await this.redisService.resetAttempts(email);
    await this.redisService.deleteTempUserData(email);

    // Get updated user
    const user = await this.usersService.findById(tempUserData.userId);
    if (!user) {
      throw new BadRequestException('User not found after verification.');
    }

    // Send welcome email
    try {
      await this.emailService.sendWelcomeEmail(user.email, user.name);
      this.logger.log(`✅ Welcome email sent to ${user.email}`);
    } catch (error) {
      this.logger.error('❌ Failed to send welcome email:', error.message);
    }

    return {
      message: 'Email verified successfully! You can now log in.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async resendOTP(email: string) {
    // Check if user exists
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Check if already verified
    if (user.isEmailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    // Check if there's an existing OTP (cooldown check)
    const existingOTP = await this.redisService.getOTP(email);
    if (existingOTP) {
      const ttl = await this.redisService.getOTPTTL(email);
      const remainingTime = Math.max(0, ttl);

      // If OTP was sent less than cooldown period ago, reject
      const otpAge = this.OTP_EXPIRY_MINUTES * 60 - remainingTime;
      if (otpAge < this.OTP_RESEND_COOLDOWN) {
        const waitTime = this.OTP_RESEND_COOLDOWN - otpAge;
        throw new TooManyRequestsException(
          `Please wait ${waitTime} seconds before requesting a new OTP.`,
        );
      }
    }

    // Generate new OTP
    const otp = this.otpUtil.generateOTP({
      length: 6,
      expiryMinutes: this.OTP_EXPIRY_MINUTES,
    });

    // Store new OTP (overwrites existing)
    await this.redisService.setOTP(email, otp, this.OTP_EXPIRY_MINUTES * 60);

    // Reset attempt counter
    await this.redisService.resetAttempts(email);

    // Update temporary user data timestamp
    await this.redisService.setTempUserData(email, {
      userId: user.id,
      registrationTime: new Date(),
      status: 'pending_verification',
      resent: true,
    });

    // Send new OTP email
    try {
      await this.emailService.sendOTPVerificationEmail(email, user.name, otp);
      this.logger.log(`✅ OTP resent to ${email}`);
    } catch (error) {
      this.logger.error('❌ Failed to resend OTP email:', error.message);
      throw new BadRequestException(
        'Failed to send verification email. Please try again.',
      );
    }

    return {
      message: 'New verification code sent. Please check your email.',
      otpExpiryMinutes: this.OTP_EXPIRY_MINUTES,
    };
  }

  async getOTPStatus(email: string) {
    const storedOTP = await this.redisService.getOTP(email);
    if (!storedOTP) {
      return {
        exists: false,
        message: 'No OTP found for this email',
      };
    }

    const ttl = await this.redisService.getOTPTTL(email);
    const attempts = await this.redisService.getAttempts(email);
    const remainingAttempts = Math.max(0, this.MAX_OTP_ATTEMPTS - attempts);

    return {
      exists: true,
      expiresIn: Math.max(0, ttl),
      attemptsRemaining: remainingAttempts,
      maxAttempts: this.MAX_OTP_ATTEMPTS,
      canResend:
        ttl > 0 &&
        ttl <= this.OTP_EXPIRY_MINUTES * 60 - this.OTP_RESEND_COOLDOWN,
    };
  }

  /**
   * Clean up expired or orphaned OTP data
   */
  async cleanupOTPData(email: string) {
    try {
      await this.redisService.deleteOTP(email);
      await this.redisService.resetAttempts(email);
      await this.redisService.deleteTempUserData(email);
      this.logger.log(`🧹 Cleaned up OTP data for ${email}`);
    } catch (error) {
      this.logger.error(
        `❌ Failed to cleanup OTP data for ${email}:`,
        error.message,
      );
    }
  }
}
