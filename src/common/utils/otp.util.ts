import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

export interface OTPConfig {
  length?: number;
  expiryMinutes?: number;
  maxAttempts?: number;
  allowedCharacters?: string;
}

export interface OTPValidationResult {
  isValid: boolean;
  message: string;
  attemptsRemaining?: number;
  timeRemaining?: number;
}

@Injectable()
export class OTPUtil {
  private readonly logger = new Logger(OTPUtil.name);

  // Default configuration
  private readonly defaultConfig: Required<OTPConfig> = {
    length: 6,
    expiryMinutes: 5,
    maxAttempts: 5,
    allowedCharacters: '0123456789', // Numbers only for better UX
  };

  /**
   * Generate a cryptographically secure OTP
   */
  generateOTP(config: OTPConfig = {}): string {
    const finalConfig = { ...this.defaultConfig, ...config };
    const { length, allowedCharacters } = finalConfig;

    let otp = '';
    const charactersLength = allowedCharacters.length;

    // Use crypto.randomBytes for cryptographically secure random generation
    const randomBytes = crypto.randomBytes(length * 2); // Extra bytes for safety

    for (let i = 0; i < length; i++) {
      const randomIndex = randomBytes[i] % charactersLength;
      otp += allowedCharacters[randomIndex];
    }

    // Ensure no sequential numbers (123456, 654321, etc.)
    if (this.hasSequentialDigits(otp)) {
      return this.generateOTP(config); // Regenerate if sequential
    }

    // Ensure not all same digits (111111, 000000, etc.)
    if (this.hasAllSameDigits(otp)) {
      return this.generateOTP(config); // Regenerate if all same
    }

    this.logger.log(`🎲 Generated OTP with length: ${length}`);
    return otp;
  }

  /**
   * Generate OTP with custom format (e.g., XXX-XXX for 6 digits)
   */
  generateFormattedOTP(
    config: OTPConfig = {},
    separator: string = '',
    groupSize: number = 3
  ): string {
    const otp = this.generateOTP(config);
    
    if (!separator || groupSize <= 0) {
      return otp;
    }

    const groups = [];
    for (let i = 0; i < otp.length; i += groupSize) {
      groups.push(otp.substring(i, i + groupSize));
    }

    return groups.join(separator);
  }

  /**
   * Validate OTP format
   */
  isValidOTPFormat(otp: string, config: OTPConfig = {}): boolean {
    const finalConfig = { ...this.defaultConfig, ...config };
    const { length, allowedCharacters } = finalConfig;

    // Remove any formatting (spaces, hyphens, etc.)
    const cleanOTP = otp.replace(/[^0-9a-zA-Z]/g, '');

    // Check length
    if (cleanOTP.length !== length) {
      return false;
    }

    // Check if all characters are allowed
    for (const char of cleanOTP) {
      if (!allowedCharacters.includes(char)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Clean OTP input (remove formatting)
   */
  cleanOTP(otp: string): string {
    return otp.replace(/[^0-9a-zA-Z]/g, '').toUpperCase();
  }

  /**
   * Compare OTPs safely (constant-time comparison to prevent timing attacks)
   */
  compareOTP(inputOTP: string, storedOTP: string): boolean {
    const cleanInput = this.cleanOTP(inputOTP);
    const cleanStored = this.cleanOTP(storedOTP);

    // Use crypto.timingSafeEqual for constant-time comparison
    if (cleanInput.length !== cleanStored.length) {
      return false;
    }

    const inputBuffer = Buffer.from(cleanInput, 'utf8');
    const storedBuffer = Buffer.from(cleanStored, 'utf8');

    return crypto.timingSafeEqual(inputBuffer, storedBuffer);
  }

  /**
   * Calculate OTP expiry timestamp
   */
  calculateExpiryTime(minutes: number = this.defaultConfig.expiryMinutes): Date {
    return new Date(Date.now() + minutes * 60 * 1000);
  }

  /**
   * Check if OTP has expired
   */
  isOTPExpired(expiryTime: Date): boolean {
    return new Date() > expiryTime;
  }

  /**
   * Get remaining time in seconds
   */
  getRemainingTimeSeconds(expiryTime: Date): number {
    const remaining = expiryTime.getTime() - Date.now();
    return Math.max(0, Math.floor(remaining / 1000));
  }

  /**
   * Format time remaining for display
   */
  formatTimeRemaining(seconds: number): string {
    if (seconds <= 0) return 'Expired';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  }

  /**
   * Generate OTP with metadata
   */
  generateOTPWithMetadata(config: OTPConfig = {}): {
    otp: string;
    expiryTime: Date;
    config: Required<OTPConfig>;
  } {
    const finalConfig = { ...this.defaultConfig, ...config };
    const otp = this.generateOTP(finalConfig);
    const expiryTime = this.calculateExpiryTime(finalConfig.expiryMinutes);

    return {
      otp,
      expiryTime,
      config: finalConfig,
    };
  }

  /**
   * Create email-friendly OTP display
   */
  formatOTPForEmail(otp: string): string {
    // Format as XXX-XXX for better readability in emails
    if (otp.length === 6) {
      return `${otp.substring(0, 3)}-${otp.substring(3, 6)}`;
    }
    return otp;
  }

  /**
   * Create SMS-friendly OTP display
   */
  formatOTPForSMS(otp: string): string {
    // For SMS, keep it simple - just spaces every 3 digits
    if (otp.length === 6) {
      return `${otp.substring(0, 3)} ${otp.substring(3, 6)}`;
    }
    return otp;
  }

  /**
   * Generate backup codes (for account recovery)
   */
  generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric codes
      const code = this.generateOTP({
        length: 8,
        allowedCharacters: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      });
      codes.push(code);
    }
    return codes;
  }

  // Private helper methods
  private hasSequentialDigits(otp: string): boolean {
    for (let i = 0; i < otp.length - 2; i++) {
      const a = parseInt(otp[i]);
      const b = parseInt(otp[i + 1]);
      const c = parseInt(otp[i + 2]);

      // Check ascending (123) or descending (321) sequences
      if ((b === a + 1 && c === b + 1) || (b === a - 1 && c === b - 1)) {
        return true;
      }
    }
    return false;
  }

  private hasAllSameDigits(otp: string): boolean {
    return new Set(otp).size === 1;
  }

  /**
   * Get OTP strength score (0-100)
   */
  getOTPStrength(otp: string): number {
    let score = 0;
    
    // Length score (max 30 points)
    score += Math.min(30, otp.length * 5);
    
    // Uniqueness score (max 30 points)
    const uniqueChars = new Set(otp).size;
    score += (uniqueChars / otp.length) * 30;
    
    // No patterns score (max 40 points)
    if (!this.hasSequentialDigits(otp)) score += 20;
    if (!this.hasAllSameDigits(otp)) score += 20;
    
    return Math.min(100, score);
  }
}