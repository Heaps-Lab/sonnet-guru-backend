import { IsNotEmpty, IsString, IsNumber, IsEnum } from 'class-validator';
import { PaymentGateway } from '../../common/enums/payment.enum';

export class CreatePaymentClaimDto {
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @IsEnum(PaymentGateway)
  @IsNotEmpty()
  gateway: PaymentGateway;

  @IsString()
  @IsNotEmpty()
  senderNumber: string;

  @IsString()
  @IsNotEmpty()
  transactionId: string;

  @IsNumber()
  @IsNotEmpty()
  amountPaid: number;
}
