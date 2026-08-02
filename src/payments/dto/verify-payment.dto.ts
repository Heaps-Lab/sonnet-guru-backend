import { IsNotEmpty, IsEnum, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentStatus } from '../../common/enums/payment.enum';

export class VerifyPaymentDto {
  @ApiProperty({
    description: 'Payment verification status',
    enum: PaymentStatus,
    example: PaymentStatus.APPROVED,
  })
  @IsEnum(PaymentStatus)
  @IsNotEmpty()
  status: PaymentStatus;

  @ApiProperty({
    description: 'Admin remarks for verification',
    example:
      'Transaction confirmed on bKash merchant ledger statement matching ledger date.',
  })
  @IsString()
  @IsNotEmpty()
  adminRemarks: string;
}
