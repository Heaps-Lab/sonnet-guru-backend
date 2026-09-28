import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisService } from '../services/redis.service';
import { OTPUtil } from '../utils/otp.util';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [RedisService, OTPUtil],
  exports: [RedisService, OTPUtil],
})
export class RedisModule {}
