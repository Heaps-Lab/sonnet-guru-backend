import { IsNotEmpty, IsEnum, IsString } from 'class-validator';
import { PaymentStatus } from '../../common/enums/payment.enum';

export class VerifyPaymentDto {
  @IsEnum(PaymentStatus)
  @IsNotEmpty()
  status: PaymentStatus;

  @IsString()
  @IsNotEmpty()
  adminRemarks: string;
}
