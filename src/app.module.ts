/* eslint-disable @typescript-eslint/require-await */
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CoursesModule } from './courses/courses.module';
import { SubjectsModule } from './subjects/subjects.module';
import { ModulesModule } from './modules/modules.module';
import { QuizzesModule } from './quizzes/quizzes.module';
import { PaymentsModule } from './payments/payments.module';
import { TeacherApplicationsModule } from './teacher-applications/teacher-applications.module';
import { RedisModule } from './common/redis/redis.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { MemoryMonitorService } from './common/services/memory-monitor.service';

@Module({
  imports: [
    // Global configuration module
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // TypeORM MySQL connection
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const dbConfig = {
          type: 'mysql' as const,
          host: configService.get<string>('DB_HOST') || 'fresh_mysql',
          port: parseInt(configService.get<string>('DB_PORT') || '3306'),
          username: configService.get<string>('DB_USERNAME') || 'root',
          password:
            configService.get<string>('DB_PASSWORD') || '?D#+D6WJjI4]A^1o',
          database:
            configService.get<string>('DB_NAME') ||
            configService.get<string>('DB_DATABASE') ||
            'serversonnetguru_LMS',
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: false,
          logging: configService.get('NODE_ENV') === 'development',
          charset: 'utf8mb4',
          timezone: 'Z',
        };

        console.log('Database config:', {
          ...dbConfig,
          password: '***hidden***',
        });

        return dbConfig;
      },
      inject: [ConfigService],
    }),

    // Rate limiting / Throttling
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get<number>('THROTTLE_TTL') || 60000,
          limit: configService.get<number>('THROTTLE_LIMIT') || 10,
        },
      ],
      inject: [ConfigService],
    }),

    // Feature modules
    RedisModule,
    AuthModule,
    UsersModule,
    CoursesModule,
    SubjectsModule,
    ModulesModule,
    QuizzesModule,
    PaymentsModule,
    TeacherApplicationsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    MemoryMonitorService, // Add memory monitoring
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
