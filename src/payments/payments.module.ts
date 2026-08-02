import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import {
  PaymentsController,
  EnrollmentsController,
} from './payments.controller';
import { PaymentClaim } from './entities/payment-claim.entity';
import { Enrollment } from './entities/enrollment.entity';
import { Course } from '../courses/entities/course.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentClaim, Enrollment, Course, User])],
  controllers: [PaymentsController, EnrollmentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
