import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentClaimDto } from './dto/create-payment-claim.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { Role } from '../common/enums/role.enum';
import { PaymentStatus } from '../common/enums/payment.enum';

@ApiTags('Payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('manual-claim')
  @ApiOperation({
    summary: 'Submit manual payment claim for course enrollment',
  })
  @ApiResponse({
    status: 201,
    description: 'Payment claim submitted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - insufficient amount or invalid data',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - already enrolled or duplicate transaction',
  })
  createPaymentClaim(
    @Body() createPaymentClaimDto: CreatePaymentClaimDto,
    @CurrentUser() user: User,
  ) {
    return this.paymentsService.createPaymentClaim(createPaymentClaimDto, user);
  }

  @Patch('claims/:id/verify')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiParam({ name: 'id', description: 'Payment claim ID' })
  @ApiOperation({ summary: 'Verify payment claim (admins only)' })
  @ApiResponse({ status: 200, description: 'Payment verified successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - claim already processed',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Payment claim not found' })
  verifyPayment(
    @Param('id', ParseUUIDPipe) claimId: string,
    @Body() verifyPaymentDto: VerifyPaymentDto,
    @CurrentUser() user: User,
  ) {
    return this.paymentsService.verifyPayment(claimId, verifyPaymentDto, user);
  }

  @Get('claims')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiQuery({
    name: 'status',
    enum: PaymentStatus,
    required: false,
    description: 'Filter by payment status',
  })
  @ApiOperation({ summary: 'Get all payment claims (admins only)' })
  @ApiResponse({
    status: 200,
    description: 'Payment claims retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  findAllClaims(
    @Query('status') status: PaymentStatus,
    @CurrentUser() user: User,
  ) {
    return this.paymentsService.findAllClaims(user, status);
  }

  @Get('my-claims')
  @ApiOperation({ summary: 'Get my payment claims' })
  @ApiResponse({
    status: 200,
    description: 'My payment claims retrieved successfully',
  })
  findMyClaims(@CurrentUser() user: User) {
    return this.paymentsService.findMyClaims(user);
  }

  @Get('claims/:id')
  @ApiParam({ name: 'id', description: 'Payment claim ID' })
  @ApiOperation({ summary: 'Get payment claim by ID' })
  @ApiResponse({
    status: 200,
    description: 'Payment claim retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - can only view own claims',
  })
  @ApiResponse({ status: 404, description: 'Payment claim not found' })
  findClaim(
    @Param('id', ParseUUIDPipe) claimId: string,
    @CurrentUser() user: User,
  ) {
    return this.paymentsService.findClaim(claimId, user);
  }

  @Get('pending-claims')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Get pending payment claims (admins only)' })
  @ApiResponse({
    status: 200,
    description: 'Pending claims retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  getPendingClaims(@CurrentUser() user: User) {
    return this.paymentsService.getPendingClaims(user);
  }

  @Get('statistics')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Get payment statistics (admins only)' })
  @ApiResponse({
    status: 200,
    description: 'Payment statistics retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  getPaymentStatistics(@CurrentUser() user: User) {
    return this.paymentsService.getPaymentStatistics(user);
  }
}

@ApiTags('Enrollments')
@Controller('enrollments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EnrollmentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('my-enrollments')
  @ApiOperation({ summary: 'Get my course enrollments' })
  @ApiResponse({
    status: 200,
    description: 'My enrollments retrieved successfully',
  })
  getMyEnrollments(@CurrentUser() user: User) {
    return this.paymentsService.getMyEnrollments(user);
  }

  @Get('courses/:courseId')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiOperation({
    summary: 'Get course enrollments (instructors and admins only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Course enrollments retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Course not found' })
  getCourseEnrollments(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @CurrentUser() user: User,
  ) {
    return this.paymentsService.getCourseEnrollments(courseId, user);
  }

  @Get('check/:courseId')
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiOperation({ summary: 'Check enrollment status for a course' })
  @ApiResponse({
    status: 200,
    description: 'Enrollment status retrieved successfully',
  })
  checkEnrollmentStatus(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @CurrentUser() user: User,
  ) {
    return this.paymentsService.checkEnrollmentStatus(courseId, user);
  }
}
