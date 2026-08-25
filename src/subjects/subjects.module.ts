import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubjectsService } from './subjects.service';
import { SubjectsController } from './subjects.controller';
import { Subject } from './entities/subject.entity';
import { Course } from '../courses/entities/course.entity';
import { Module as ModuleEntity } from '../modules/entities/module.entity';
import { Video } from '../modules/entities/video.entity';
import { ModuleSheet } from '../modules/entities/module-sheet.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Subject,
      Course,
      ModuleEntity,
      Video,
      ModuleSheet,
      User,
    ]),
  ],
  controllers: [SubjectsController],
  providers: [SubjectsService],
  exports: [SubjectsService, TypeOrmModule],
})
export class SubjectsModule {}
