import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { QuizzesService } from './quizzes.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { AddQuestionDto } from './dto/add-question.dto';
import { StartQuizDto } from './dto/start-quiz.dto';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { Role } from '../common/enums/role.enum';

@ApiTags('Quizzes')
@Controller('modules/:moduleId/quizzes')
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  @ApiBearerAuth()
  @ApiParam({ name: 'moduleId', description: 'Module ID' })
  @ApiOperation({ summary: 'Create a new quiz' })
  @ApiResponse({ status: 201, description: 'Quiz created successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - module not completed',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  create(
    @Param('moduleId', ParseUUIDPipe) moduleId: string,
    @Body() createQuizDto: CreateQuizDto,
    @CurrentUser() user: User,
  ) {
    return this.quizzesService.create(moduleId, createQuizDto, user);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.STUDENT)
  @ApiBearerAuth()
  @ApiParam({ name: 'moduleId', description: 'Module ID' })
  @ApiOperation({ summary: 'Get the quiz for a module (one quiz per module)' })
  @ApiResponse({
    status: 200,
    description: 'Quiz retrieved successfully (null if no quiz exists)',
  })
  @ApiResponse({ status: 404, description: 'Module not found' })
  @ApiResponse({ status: 403, description: 'Module not accessible' })
  @ApiResponse({ status: 401, description: 'Unauthorized - token required' })
  findAll(
    @Param('moduleId', ParseUUIDPipe) moduleId: string,
    @CurrentUser() user: User,
  ) {
    return this.quizzesService.findAll(moduleId, user);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.STUDENT)
  @ApiBearerAuth()
  @ApiParam({ name: 'moduleId', description: 'Module ID' })
  @ApiParam({ name: 'id', description: 'Quiz ID' })
  @ApiOperation({ summary: 'Get quiz by ID' })
  @ApiResponse({ status: 200, description: 'Quiz retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - token required' })
  findOne(
    @Param('moduleId', ParseUUIDPipe) moduleId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.quizzesService.findOne(id, user);
  }

  @Post(':id/questions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  @ApiBearerAuth()
  @ApiParam({ name: 'moduleId', description: 'Module ID' })
  @ApiParam({ name: 'id', description: 'Quiz ID' })
  @ApiOperation({ summary: 'Add question to quiz' })
  @ApiResponse({ status: 201, description: 'Question added successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - quiz already published',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  addQuestion(
    @Param('moduleId', ParseUUIDPipe) moduleId: string,
    @Param('id', ParseUUIDPipe) quizId: string,
    @Body() addQuestionDto: AddQuestionDto,
    @CurrentUser() user: User,
  ) {
    return this.quizzesService.addQuestion(quizId, addQuestionDto, user);
  }

  @Patch(':id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  @ApiBearerAuth()
  @ApiParam({ name: 'moduleId', description: 'Module ID' })
  @ApiParam({ name: 'id', description: 'Quiz ID' })
  @ApiOperation({ summary: 'Publish quiz' })
  @ApiResponse({ status: 200, description: 'Quiz published successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - cannot publish quiz without questions',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  publishQuiz(
    @Param('moduleId', ParseUUIDPipe) moduleId: string,
    @Param('id', ParseUUIDPipe) quizId: string,
    @CurrentUser() user: User,
  ) {
    return this.quizzesService.publishQuiz(quizId, user);
  }

  @Post(':id/start')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT)
  @ApiBearerAuth()
  @ApiParam({ name: 'moduleId', description: 'Module ID' })
  @ApiParam({ name: 'id', description: 'Quiz ID' })
  @ApiOperation({ summary: 'Start quiz attempt (students only)' })
  @ApiResponse({ status: 201, description: 'Quiz started successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - maximum attempts exceeded',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - only students can take quizzes',
  })
  startQuiz(
    @Param('moduleId', ParseUUIDPipe) moduleId: string,
    @Param('id', ParseUUIDPipe) quizId: string,
    @Body() startQuizDto: StartQuizDto,
    @CurrentUser() user: User,
  ) {
    return this.quizzesService.startQuiz(quizId, startQuizDto, user);
  }

  @Get(':id/submissions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  @ApiBearerAuth()
  @ApiParam({ name: 'moduleId', description: 'Module ID' })
  @ApiParam({ name: 'id', description: 'Quiz ID' })
  @ApiOperation({
    summary: 'Get all submissions for a quiz (instructors and admins only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Submissions retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  getAllSubmissions(
    @Param('moduleId', ParseUUIDPipe) moduleId: string,
    @Param('id', ParseUUIDPipe) quizId: string,
    @CurrentUser() user: User,
  ) {
    return this.quizzesService.getAllSubmissions(quizId, user);
  }

  @Get(':id/my-submissions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT)
  @ApiBearerAuth()
  @ApiParam({ name: 'moduleId', description: 'Module ID' })
  @ApiParam({ name: 'id', description: 'Quiz ID' })
  @ApiOperation({ summary: 'Get my quiz submissions (students only)' })
  @ApiResponse({
    status: 200,
    description: 'My submissions retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - only students can access their submissions',
  })
  getMySubmissions(
    @Param('moduleId', ParseUUIDPipe) moduleId: string,
    @Param('id', ParseUUIDPipe) quizId: string,
    @CurrentUser() user: User,
  ) {
    return this.quizzesService.getMySubmissions(quizId, user);
  }
}

// Separate controller for quiz submissions
@ApiTags('Quiz Submissions')
@Controller('quiz-submissions')
export class QuizSubmissionsController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Post(':id/submit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT)
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Submission ID' })
  @ApiOperation({ summary: 'Submit quiz answers (students only)' })
  @ApiResponse({ status: 200, description: 'Quiz submitted successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - quiz already submitted',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - only students can submit quizzes',
  })
  @ApiResponse({ status: 404, description: 'Submission not found' })
  submitQuiz(
    @Param('id', ParseUUIDPipe) submissionId: string,
    @Body() submitQuizDto: SubmitQuizDto,
    @CurrentUser() user: User,
  ) {
    return this.quizzesService.submitQuiz(submissionId, submitQuizDto, user);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Submission ID' })
  @ApiOperation({ summary: 'Get quiz submission details' })
  @ApiResponse({
    status: 200,
    description: 'Submission retrieved successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - access denied' })
  @ApiResponse({ status: 404, description: 'Submission not found' })
  getSubmission(
    @Param('id', ParseUUIDPipe) submissionId: string,
    @CurrentUser() user: User,
  ) {
    return this.quizzesService.getSubmission(submissionId, user);
  }
}
