import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CoursesService } from './courses.service';
import { CoursesController, ThumbnailsController } from './courses.controller';
import { Course } from './entities/course.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Course]),
    MulterModule.register({
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit for thumbnails
      },
    }),
  ],
  controllers: [CoursesController, ThumbnailsController],
  providers: [CoursesService],
  exports: [CoursesService],
})
export class CoursesModule {}
