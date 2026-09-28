import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private redisClient: Redis;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    try {
      const redisConfig = {
        host: this.configService.get('REDIS_HOST', 'localhost'),
        port: this.configService.get('REDIS_PORT', 6379),
        password: this.configService.get('REDIS_PASSWORD'),
        retryDelayOnFailover: 100,
        enableReadyCheck: false,
        maxRetriesPerRequest: null,
        lazyConnect: true,
        connectTimeout: 10000,
        commandTimeout: 5000,
        db: 0, // Use database 0 for OTP storage
      };

      this.redisClient = new Redis(redisConfig);

      this.redisClient.on('connect', () => {
        this.logger.log('✅ Redis connected successfully');
      });

      this.redisClient.on('ready', () => {
        this.logger.log('✅ Redis ready to accept commands');
      });

      this.redisClient.on('error', (error) => {
        this.logger.error('❌ Redis connection error:', error.message);
      });

      this.redisClient.on('close', () => {
        this.logger.warn('⚠️ Redis connection closed');
      });

      // Test connection
      await this.redisClient.ping();
      this.logger.log('🔗 Redis connection established');
    } catch (error) {
      this.logger.error('❌ Failed to initialize Redis:', error.message);
      throw error;
    }
  }

  async onModuleDestroy() {
    if (this.redisClient) {
      await this.redisClient.quit();
      this.logger.log('🔌 Redis connection closed');
    }
  }

  /**
   * Store OTP in Redis with TTL (Time To Live)
   */
  async setOTP(
    email: string, 
    otp: string, 
    ttlSeconds: number = 300 // 5 minutes default
  ): Promise<void> {
    try {
      const key = this.getOTPKey(email);
      await this.redisClient.setex(key, ttlSeconds, otp);
      this.logger.log(`📧 OTP stored for email: ${email} (TTL: ${ttlSeconds}s)`);
    } catch (error) {
      this.logger.error(`❌ Failed to store OTP for ${email}:`, error.message);
      throw error;
    }
  }

  /**
   * Get OTP from Redis
   */
  async getOTP(email: string): Promise<string | null> {
    try {
      const key = this.getOTPKey(email);
      const otp = await this.redisClient.get(key);
      this.logger.log(`🔍 OTP retrieved for email: ${email} - ${otp ? 'Found' : 'Not found'}`);
      return otp;
    } catch (error) {
      this.logger.error(`❌ Failed to get OTP for ${email}:`, error.message);
      throw error;
    }
  }

  /**
   * Delete OTP from Redis (after successful verification)
   */
  async deleteOTP(email: string): Promise<boolean> {
    try {
      const key = this.getOTPKey(email);
      const result = await this.redisClient.del(key);
      this.logger.log(`🗑️ OTP deleted for email: ${email} - ${result ? 'Success' : 'Not found'}`);
      return result > 0;
    } catch (error) {
      this.logger.error(`❌ Failed to delete OTP for ${email}:`, error.message);
      throw error;
    }
  }

  /**
   * Check if OTP exists and get remaining TTL
   */
  async getOTPTTL(email: string): Promise<number> {
    try {
      const key = this.getOTPKey(email);
      const ttl = await this.redisClient.ttl(key);
      return ttl; // -1 if no expiry, -2 if key doesn't exist
    } catch (error) {
      this.logger.error(`❌ Failed to get OTP TTL for ${email}:`, error.message);
      throw error;
    }
  }

  /**
   * Increment OTP attempt counter for rate limiting
   */
  async incrementAttempts(
    email: string, 
    ttlSeconds: number = 3600 // 1 hour
  ): Promise<number> {
    try {
      const key = this.getAttemptsKey(email);
      const current = await this.redisClient.incr(key);
      
      // Set TTL only on first attempt
      if (current === 1) {
        await this.redisClient.expire(key, ttlSeconds);
      }
      
      this.logger.log(`🔢 OTP attempts for ${email}: ${current}`);
      return current;
    } catch (error) {
      this.logger.error(`❌ Failed to increment attempts for ${email}:`, error.message);
      throw error;
    }
  }

  /**
   * Get current attempt count
   */
  async getAttempts(email: string): Promise<number> {
    try {
      const key = this.getAttemptsKey(email);
      const attempts = await this.redisClient.get(key);
      return attempts ? parseInt(attempts, 10) : 0;
    } catch (error) {
      this.logger.error(`❌ Failed to get attempts for ${email}:`, error.message);
      throw error;
    }
  }

  /**
   * Reset attempt counter (after successful verification)
   */
  async resetAttempts(email: string): Promise<boolean> {
    try {
      const key = this.getAttemptsKey(email);
      const result = await this.redisClient.del(key);
      this.logger.log(`🔄 Attempts reset for email: ${email}`);
      return result > 0;
    } catch (error) {
      this.logger.error(`❌ Failed to reset attempts for ${email}:`, error.message);
      throw error;
    }
  }

  /**
   * Store temporary user data during registration
   */
  async setTempUserData(
    email: string, 
    userData: any, 
    ttlSeconds: number = 1800 // 30 minutes
  ): Promise<void> {
    try {
      const key = this.getTempUserKey(email);
      await this.redisClient.setex(key, ttlSeconds, JSON.stringify(userData));
      this.logger.log(`💾 Temp user data stored for: ${email}`);
    } catch (error) {
      this.logger.error(`❌ Failed to store temp user data for ${email}:`, error.message);
      throw error;
    }
  }

  /**
   * Get temporary user data
   */
  async getTempUserData(email: string): Promise<any | null> {
    try {
      const key = this.getTempUserKey(email);
      const data = await this.redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      this.logger.error(`❌ Failed to get temp user data for ${email}:`, error.message);
      throw error;
    }
  }

  /**
   * Delete temporary user data
   */
  async deleteTempUserData(email: string): Promise<boolean> {
    try {
      const key = this.getTempUserKey(email);
      const result = await this.redisClient.del(key);
      this.logger.log(`🗑️ Temp user data deleted for: ${email}`);
      return result > 0;
    } catch (error) {
      this.logger.error(`❌ Failed to delete temp user data for ${email}:`, error.message);
      throw error;
    }
  }

  /**
   * Health check for Redis connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.redisClient.ping();
      return result === 'PONG';
    } catch (error) {
      this.logger.error('❌ Redis health check failed:', error.message);
      return false;
    }
  }

  /**
   * Get Redis connection info for monitoring
   */
  async getConnectionInfo(): Promise<any> {
    try {
      const info = await this.redisClient.info('server');
      return info;
    } catch (error) {
      this.logger.error('❌ Failed to get Redis info:', error.message);
      return null;
    }
  }

  // Private helper methods for consistent key naming
  private getOTPKey(email: string): string {
    return `otp:${email.toLowerCase()}`;
  }

  private getAttemptsKey(email: string): string {
    return `attempts:${email.toLowerCase()}`;
  }

  private getTempUserKey(email: string): string {
    return `temp_user:${email.toLowerCase()}`;
  }

  // Getter for direct Redis access if needed
  get client(): Redis {
    return this.redisClient;
  }
}