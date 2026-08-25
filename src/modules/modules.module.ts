import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { ModulesService } from './modules.service';
import { ModulesController, FilesController } from './modules.controller';
import { Module as ModuleEntity } from './entities/module.entity';
import { Video } from './entities/video.entity';
import { ModuleSheet } from './entities/module-sheet.entity';
import { Course } from '../courses/entities/course.entity';
import { Subject } from '../subjects/entities/subject.entity';
import { Enrollment } from '../payments/entities/enrollment.entity';
import { memoryStorage } from 'multer';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ModuleEntity,
      Video,
      ModuleSheet,
      Course,
      Subject,
      Enrollment,
    ]),
    MulterModule.register({
      storage: memoryStorage(),
      limits: {
        fileSize: 500 * 1024 * 1024, // 500MB limit for videos
      },
    }),
  ],
  controllers: [ModulesController, FilesController],
  providers: [ModulesService],
  exports: [ModulesService],
})
export class ModulesModule {}
