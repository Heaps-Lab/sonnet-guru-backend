import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Put,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import { User } from '../users/entities/user.entity';
import { Subject } from './entities/subject.entity';

@ApiTags('Subjects')
@Controller('subjects')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Create a new subject' })
  @ApiResponse({
    status: 201,
    description: 'The subject has been successfully created.',
    type: Subject,
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Course not found.' })
  async create(
    @Body() createSubjectDto: CreateSubjectDto,
    @CurrentUser() user: User,
  ): Promise<Subject> {
    return await this.subjectsService.create(createSubjectDto, user);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.STUDENT)
  @ApiOperation({ summary: 'Get all subjects' })
  @ApiResponse({
    status: 200,
    description: 'Return all subjects.',
    type: [Subject],
  })
  @ApiQuery({
    name: 'courseId',
    required: false,
    description: 'Filter subjects by course ID',
  })
  async findAll(
    @Query('courseId') courseId?: string,
    @CurrentUser() user?: User,
  ): Promise<Subject[]> {
    if (courseId) {
      return await this.subjectsService.findByCourse(courseId, user);
    }
    return await this.subjectsService.findAll(user);
  }

  @Get('course/:courseId')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.STUDENT)
  @ApiOperation({
    summary: 'Get all subjects for a specific course with modules',
  })
  @ApiParam({
    name: 'courseId',
    description: 'Course ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Return all subjects for the course with their modules.',
    type: [Subject],
  })
  @ApiResponse({ status: 404, description: 'Course not found.' })
  async findByCourse(
    @Param('courseId') courseId: string,
    @CurrentUser() user?: User,
  ): Promise<Subject[]> {
    return await this.subjectsService.findByCourse(courseId, user);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.STUDENT)
  @ApiOperation({ summary: 'Get a subject by id' })
  @ApiParam({
    name: 'id',
    description: 'Subject ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Return the subject with its modules.',
    type: Subject,
  })
  @ApiResponse({ status: 404, description: 'Subject not found.' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user?: User,
  ): Promise<Subject> {
    return await this.subjectsService.findOne(id, user);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Update a subject' })
  @ApiParam({
    name: 'id',
    description: 'Subject ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'The subject has been successfully updated.',
    type: Subject,
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Subject not found.' })
  async update(
    @Param('id') id: string,
    @Body() updateSubjectDto: UpdateSubjectDto,
    @CurrentUser() user: User,
  ): Promise<Subject> {
    return await this.subjectsService.update(id, updateSubjectDto, user);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Delete a subject' })
  @ApiParam({
    name: 'id',
    description: 'Subject ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'The subject has been successfully deleted.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Subject has modules.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Subject not found.' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<{ message: string }> {
    await this.subjectsService.remove(id, user);
    return { message: 'Subject deleted successfully' };
  }

  @Put('course/:courseId/reorder')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Reorder subjects within a course' })
  @ApiParam({
    name: 'courseId',
    description: 'Course ID',
    type: 'string',
  })
  @ApiBody({
    description: 'Array of subject IDs with their new sequence orders',
    schema: {
      type: 'object',
      properties: {
        subjectOrders: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'Subject ID' },
              sequenceOrder: {
                type: 'number',
                description: 'New sequence order',
              },
            },
            required: ['id', 'sequenceOrder'],
          },
        },
      },
      required: ['subjectOrders'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Subjects have been successfully reordered.',
    type: [Subject],
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Course not found.' })
  async reorderSubjects(
    @Param('courseId') courseId: string,
    @Body() body: { subjectOrders: { id: string; sequenceOrder: number }[] },
    @CurrentUser() user: User,
  ): Promise<Subject[]> {
    return await this.subjectsService.reorderSubjects(
      courseId,
      body.subjectOrders,
      user,
    );
  }

  @Patch(':id/stats')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  @ApiOperation({
    summary: 'Update subject statistics (total modules and duration)',
  })
  @ApiParam({
    name: 'id',
    description: 'Subject ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Subject statistics have been successfully updated.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async updateStats(@Param('id') id: string): Promise<{ message: string }> {
    await this.subjectsService.updateSubjectStats(id);
    return { message: 'Subject statistics updated successfully' };
  }
}
