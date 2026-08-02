import { IsNotEmpty, IsString, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentGateway } from '../../common/enums/payment.enum';

export class CreatePaymentClaimDto {
  @ApiProperty({
    description: 'Course ID to enroll in',
    example: 'uuid-string',
  })
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @ApiProperty({
    description: 'Payment gateway used',
    enum: PaymentGateway,
    example: PaymentGateway.BKASH,
  })
  @IsEnum(PaymentGateway)
  @IsNotEmpty()
  gateway: PaymentGateway;

  @ApiProperty({
    description: 'Sender mobile number',
    example: '01712345678',
  })
  @IsString()
  @IsNotEmpty()
  senderNumber: string;

  @ApiProperty({
    description: 'Transaction ID from payment gateway',
    example: 'BKX9283JS1',
  })
  @IsString()
  @IsNotEmpty()
  transactionId: string;

  @ApiProperty({
    description: 'Amount paid in BDT',
    example: 4500.0,
  })
  @IsNumber()
  @IsNotEmpty()
  amountPaid: number;
}
