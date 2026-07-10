import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type EnrollmentDocument = Enrollment & Document;

@Schema({ timestamps: true })
export class Enrollment {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Course', required: true })
  courseId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'PaymentClaim', required: true })
  paymentClaimId: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  enrolledAt: Date;

  @Prop()
  completedAt: Date;

  @Prop({ default: 0 })
  progressPercentage: number;
}

export const EnrollmentSchema = SchemaFactory.createForClass(Enrollment);

EnrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });
EnrollmentSchema.index({ courseId: 1 });
