import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { PaymentStatus, PaymentGateway } from '../../common/enums/payment.enum';

export type PaymentClaimDocument = PaymentClaim & Document;

@Schema({ timestamps: true })
export class PaymentClaim {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Course', required: true })
  courseId: Types.ObjectId;

  @Prop({ type: String, enum: PaymentGateway, required: true })
  gateway: PaymentGateway;

  @Prop({ required: true })
  senderNumber: string;

  @Prop({ required: true, unique: true })
  transactionId: string;

  @Prop({ required: true })
  amountPaid: number;

  @Prop({ type: String, enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Prop()
  adminRemarks: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  verifiedBy: Types.ObjectId;

  @Prop()
  verifiedAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'Enrollment' })
  enrollmentId: Types.ObjectId;
}

export const PaymentClaimSchema = SchemaFactory.createForClass(PaymentClaim);

PaymentClaimSchema.index({ userId: 1, courseId: 1 });
PaymentClaimSchema.index({ transactionId: 1 });
PaymentClaimSchema.index({ status: 1 });
