import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeacherApplicationsService } from './teacher-applications.service';
import { TeacherApplicationsController } from './teacher-applications.controller';
import { TeacherApplication } from './entities/teacher-application.entity';
import { User } from '../users/entities/user.entity';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [TypeOrmModule.forFeature([TeacherApplication, User]), EmailModule],
  controllers: [TeacherApplicationsController],
  providers: [TeacherApplicationsService],
  exports: [TeacherApplicationsService, TypeOrmModule],
})
export class TeacherApplicationsModule {}
