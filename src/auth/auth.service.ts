/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private readonly MAX_MOBILE_SESSIONS = 1;
  private readonly MAX_DESKTOP_SESSIONS = 1;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async register(registerDto: RegisterDto) {
    const user = await this.usersService.create(registerDto);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 24); // Token expires in 24 hours

    // Save token to user
    await this.usersService.updateVerificationToken(
      user.id,
      verificationToken,
      tokenExpiry,
    );

    // Send verification email
    try {
      await this.emailService.sendVerificationEmail(
        user.email,
        user.name,
        verificationToken,
      );
      console.log(`✅ Verification email sent successfully to ${user.email}`);
    } catch (error) {
      // Log error but don't fail registration
      console.error('❌ Failed to send verification email:', error);
      console.error('Error details:', error.message);
      // Don't throw - allow user to register even if email fails
      // They can request resend later
    }

    const { password, ...result } = user;
    return {
      ...result,
      message:
        'Registration successful. Please check your email to verify your account.',
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
        'Please verify your email before logging in. Check your inbox for the verification link.',
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

  async verifyEmail(token: string) {
    const user = await this.usersService.findByVerificationToken(token);

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    // Check if token is expired
    if (
      !user.emailVerificationTokenExpiry ||
      new Date() > user.emailVerificationTokenExpiry
    ) {
      throw new BadRequestException(
        'Verification token has expired. Please request a new one.',
      );
    }

    // Mark email as verified
    await this.usersService.verifyEmail(user.id);

    // Send welcome email
    try {
      await this.emailService.sendWelcomeEmail(user.email, user.name);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
    }

    return {
      message: 'Email verified successfully! You can now log in.',
    };
  }

  async resendVerificationEmail(email: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 24);

    // Update token
    await this.usersService.updateVerificationToken(
      user.id,
      verificationToken,
      tokenExpiry,
    );

    // Send verification email
    await this.emailService.sendVerificationEmail(
      user.email,
      user.name,
      verificationToken,
    );

    return {
      message: 'Verification email sent. Please check your inbox.',
    };
  }
}
