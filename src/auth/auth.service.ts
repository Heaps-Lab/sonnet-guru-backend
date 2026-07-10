import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  private readonly MAX_MOBILE_SESSIONS = 1;
  private readonly MAX_DESKTOP_SESSIONS = 1;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const user = await this.usersService.create(registerDto);
    const { password, ...result } = (user as any).toObject();
    return result;
  }

  async login(loginDto: LoginDto) {
    const { email, password, deviceId, deviceName } = loginDto;

    // Find user
    const user = await this.usersService.findByEmail(email);
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

    await this.usersService.updateSessions(
      user._id.toString(),
      updatedSessions,
    );

    // Generate JWT
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      sessionId,
    };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user._id.toString(),
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
}
