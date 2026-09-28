/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Quiz } from './entities/quiz.entity';
import { QuizQuestion } from './entities/quiz-question.entity';
import { QuestionOption } from './entities/question-option.entity';
import { QuizSubmission } from './entities/quiz-submission.entity';
import { SubmissionAnswer } from './entities/submission-answer.entity';
import { Module } from '../modules/entities/module.entity';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { AddQuestionDto } from './dto/add-question.dto';
import { StartQuizDto } from './dto/start-quiz.dto';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { User } from '../users/entities/user.entity';
import { Role } from '../common/enums/role.enum';

// DDD: Quiz Domain Service for calculation logic
export class QuizCalculationService {
  calculateScore(
    answers: SubmissionAnswer[],
    questions: QuizQuestion[],
  ): {
    totalScore: number;
    maxScore: number;
    percentage: number;
    isPassed: boolean;
    passingMarks: number;
  } {
    let totalScore = 0;
    let maxScore = 0;

    for (const question of questions) {
      maxScore += question.marks;

      const answer = answers.find((a) => a.questionId === question.id);
      if (answer && answer.isCorrect) {
        totalScore += question.marks;
      } else if (answer && answer.selectedOptionIndex !== null) {
        // Apply negative marking
        totalScore -= question.negativeMarking;
      }
    }

    // Ensure score doesn't go below 0
    totalScore = Math.max(0, totalScore);

    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

    return {
      totalScore,
      maxScore,
      percentage,
      isPassed: false, // Will be calculated based on quiz passing marks
      passingMarks: 0, // Will be set by the calling service
    };
  }

  evaluateAnswer(
    selectedIndex: number,
    correctIndex: number,
    question: QuizQuestion,
  ): {
    isCorrect: boolean;
    marksObtained: number;
  } {
    const isCorrect = selectedIndex === correctIndex;
    let marksObtained = 0;

    if (isCorrect) {
      marksObtained = question.marks;
    } else if (selectedIndex !== null) {
      marksObtained = -question.negativeMarking;
    }

    return { isCorrect, marksObtained };
  }
}

@Injectable()
export class QuizzesService {
  private calculationService = new QuizCalculationService();

  constructor(
    @InjectRepository(Quiz)
    private quizRepository: Repository<Quiz>,
    @InjectRepository(QuizQuestion)
    private questionRepository: Repository<QuizQuestion>,
    @InjectRepository(QuestionOption)
    private optionRepository: Repository<QuestionOption>,
    @InjectRepository(QuizSubmission)
    private submissionRepository: Repository<QuizSubmission>,
    @InjectRepository(SubmissionAnswer)
    private answerRepository: Repository<SubmissionAnswer>,
    @InjectRepository(Module)
    private moduleRepository: Repository<Module>,
    private dataSource: DataSource,
  ) {}

  async create(
    moduleId: string,
    createQuizDto: CreateQuizDto,
    user: User,
  ): Promise<Quiz> {
    // Verify module exists and is completed
    const module = await this.moduleRepository.findOne({
      where: { id: moduleId },
      relations: { course: true },
    });

    if (!module) {
      throw new NotFoundException('Module not found');
    }

    if (!module.isCompleted) {
      throw new BadRequestException('Cannot create quiz for incomplete module');
    }

    // Check permissions
    if (
      ![Role.SUPER_ADMIN, Role.ADMIN].includes(user.role) &&
      (user.role !== Role.TEACHER || module.course.instructorId !== user.id)
    ) {
      throw new ForbiddenException(
        'You do not have permission to create quizzes for this module',
      );
    }

    // Enforce one quiz per module rule
    const existingQuiz = await this.quizRepository.findOne({
      where: { moduleId, isActive: true },
    });

    if (existingQuiz) {
      throw new BadRequestException(
        'A module can only have one quiz. This module already has a quiz.',
      );
    }

    const quiz = this.quizRepository.create({
      ...createQuizDto,
      moduleId,
      totalMarks: createQuizDto.totalMarks || 0,
      passingMarks: createQuizDto.passingMarks || 0,
    });

    return this.quizRepository.save(quiz);
  }

  async addQuestion(
    quizId: string,
    addQuestionDto: AddQuestionDto,
    user: User,
  ): Promise<QuizQuestion> {
    const quiz = await this.quizRepository.findOne({
      where: { id: quizId },
      relations: { module: { course: true }, questions: true },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    // Check permissions
    if (
      ![Role.SUPER_ADMIN, Role.ADMIN].includes(user.role) &&
      (user.role !== Role.TEACHER ||
        quiz.module.course.instructorId !== user.id)
    ) {
      throw new ForbiddenException(
        'You do not have permission to add questions to this quiz',
      );
    }

    if (quiz.isPublished) {
      throw new BadRequestException('Cannot add questions to published quiz');
    }

    // Validate that adding this question doesn't exceed quiz total marks
    const currentQuestionsMarks = quiz.questions
      .filter((q) => q.isActive !== false) // Only count active questions
      .reduce((sum, q) => sum + Number(q.marks), 0);

    const newQuestionMarks = Number(addQuestionDto.marks || 1);
    const quizTotalMarks = Number(quiz.totalMarks);

    if (currentQuestionsMarks + newQuestionMarks > quizTotalMarks) {
      throw new BadRequestException(
        `Cannot add question with ${newQuestionMarks.toFixed(2)} marks. Current questions total: ${currentQuestionsMarks.toFixed(2)}, Quiz total marks: ${quizTotalMarks.toFixed(2)}. Remaining marks available: ${(quizTotalMarks - currentQuestionsMarks).toFixed(2)}`,
      );
    }

    return this.dataSource.transaction(async (manager) => {
      // Create question without options (to avoid cascade duplication)
      const { options: _, ...questionData } = addQuestionDto;

      const question = manager.create(QuizQuestion, {
        ...questionData,
        quizId,
        marks: addQuestionDto.marks || 1,
        negativeMarking: addQuestionDto.negativeMarking || 0,
        sequenceNumber:
          addQuestionDto.sequenceNumber ||
          (await this.getNextSequenceNumber(quizId)),
      });

      const savedQuestion = await manager.save(QuizQuestion, question);

      // Create options separately
      const options = addQuestionDto.options.map((option) =>
        manager.create(QuestionOption, {
          ...option,
          questionId: savedQuestion.id,
        }),
      );

      await manager.save(QuestionOption, options);

      // Note: We don't update quiz total marks here anymore
      // Quiz total marks is fixed and questions distribute within that total

      return savedQuestion;
    });
  }

  async findAll(moduleId: string, user: User): Promise<Quiz | null> {
    const module = await this.moduleRepository.findOne({
      where: { id: moduleId },
      relations: { course: true },
    });

    if (!module) {
      throw new NotFoundException('Module not found');
    }
    // Check access permissions
    if (
      !module.course.isPublished &&
      ![Role.SUPER_ADMIN, Role.ADMIN].includes(user.role) &&
      (user.role !== Role.TEACHER || module.course.instructorId !== user.id)
    ) {
      throw new ForbiddenException('Module not accessible');
    }

    const queryBuilder = this.quizRepository
      .createQueryBuilder('quiz')
      .leftJoinAndSelect('quiz.questions', 'questions')
      .leftJoinAndSelect('questions.options', 'options')
      .where('quiz.moduleId = :moduleId', { moduleId })
      .andWhere('quiz.isActive = :isActive', { isActive: true })
      .orderBy('questions.sequenceNumber', 'ASC')
      .addOrderBy('options.optionIndex', 'ASC');

    // Students only see published quizzes, admins (SUPER_ADMIN, ADMIN, course instructor) see all quizzes
    if (
      user.role === Role.STUDENT ||
      (user.role === Role.TEACHER && module.course.instructorId !== user.id)
    ) {
      queryBuilder.andWhere('quiz.isPublished = :isPublished', {
        isPublished: true,
      });
    }

    // Since we enforce one quiz per module, return the single quiz or null
    const quiz = await queryBuilder.getOne();

    // Hide correct answers for students
    if (quiz && user.role === Role.STUDENT) {
      quiz.questions = quiz.questions.map((question) => {
        const { correctOptionIndex, explanation, ...rest } = question;
        return rest;
      }) as QuizQuestion[];
    }

    return quiz;
  }

  async findOne(
    id: string,
    user: User,
    includeAnswers: boolean = false,
  ): Promise<Quiz> {
    const queryBuilder = this.quizRepository
      .createQueryBuilder('quiz')
      .leftJoinAndSelect('quiz.module', 'module')
      .leftJoinAndSelect('module.course', 'course')
      .leftJoinAndSelect('quiz.questions', 'questions')
      .leftJoinAndSelect('questions.options', 'options')
      .where('quiz.id = :id', { id })
      .andWhere('quiz.isActive = :isActive', { isActive: true })
      .orderBy('questions.sequenceNumber', 'ASC')
      .addOrderBy('options.optionIndex', 'ASC');

    const quiz = await queryBuilder.getOne();

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    // Check permissions
    if (
      !quiz.module.course.isPublished &&
      ![Role.SUPER_ADMIN, Role.ADMIN].includes(user.role) &&
      (user.role !== Role.TEACHER ||
        quiz.module.course.instructorId !== user.id)
    ) {
      throw new ForbiddenException('Quiz not accessible');
    }

    // Students only see published quizzes, admins (SUPER_ADMIN, ADMIN, course instructor) can see unpublished quizzes
    if (
      (user.role === Role.STUDENT ||
        (user.role === Role.TEACHER &&
          quiz.module.course.instructorId !== user.id)) &&
      !quiz.isPublished
    ) {
      throw new NotFoundException('Quiz not found');
    }

    // Hide correct answers for students unless it's for review after submission
    if (!includeAnswers && user.role === Role.STUDENT) {
      quiz.questions = quiz.questions.map((question) => {
        const { correctOptionIndex, explanation, ...rest } = question;
        return rest;
      }) as QuizQuestion[];
    }

    return quiz;
  }

  async startQuiz(
    quizId: string,
    startQuizDto: StartQuizDto,
    user: User,
  ): Promise<QuizSubmission> {
    if (user.role !== Role.STUDENT) {
      throw new ForbiddenException('Only students can take quizzes');
    }

    const quiz = await this.findOne(quizId, user);

    // Check existing attempts
    const existingAttempts = await this.submissionRepository.count({
      where: { quizId, studentId: user.id },
    });

    if (existingAttempts >= quiz.maxAttempts) {
      throw new BadRequestException('Maximum attempts exceeded');
    }

    // Check for ongoing submission
    const ongoingSubmission = await this.submissionRepository.findOne({
      where: { quizId, studentId: user.id, status: 'in_progress' },
    });

    if (ongoingSubmission) {
      return ongoingSubmission;
    }

    const submission = this.submissionRepository.create({
      quizId,
      studentId: user.id,
      attemptNumber: existingAttempts + 1,
      maxScore: quiz.totalMarks,
      startedAt: new Date(),
    });

    return this.submissionRepository.save(submission);
  }

  async submitQuiz(
    submissionId: string,
    submitQuizDto: SubmitQuizDto,
    user: User,
  ): Promise<QuizSubmission> {
    if (user.role !== Role.STUDENT) {
      throw new ForbiddenException('Only students can submit quizzes');
    }

    const submission = await this.submissionRepository.findOne({
      where: { id: submissionId, studentId: user.id },
      relations: { quiz: { questions: { options: true } } },
    });

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    if (submission.status !== 'in_progress') {
      throw new BadRequestException('Quiz already submitted');
    }

    const result = await this.dataSource.transaction(async (manager) => {
      // Process answers
      const answers = [];
      for (const answerDto of submitQuizDto.answers) {
        const question = submission.quiz.questions.find(
          (q) => q.id === answerDto.questionId,
        );
        if (!question) continue;

        const evaluation = this.calculationService.evaluateAnswer(
          answerDto.selectedOptionIndex ?? -1,
          question.correctOptionIndex,
          question,
        );

        const answer = manager.create(SubmissionAnswer, {
          submissionId: submission.id,
          questionId: question.id,
          selectedOptionIndex: answerDto.selectedOptionIndex,
          isCorrect: evaluation.isCorrect,
          marksObtained: evaluation.marksObtained,
        });

        answers.push(answer);
      }

      await manager.save(SubmissionAnswer, answers);

      // Calculate final score
      const scoreResult = this.calculationService.calculateScore(
        answers,
        submission.quiz.questions,
      );
      const isPassed =
        scoreResult.percentage >=
        (submission.quiz.passingMarks / submission.quiz.totalMarks) * 100;

      // Update submission
      await manager.update(QuizSubmission, submission.id, {
        totalScore: scoreResult.totalScore,
        percentage: scoreResult.percentage,
        isPassed,
        status: 'submitted',
        submittedAt: new Date(),
        timeSpent: submitQuizDto.timeSpent,
      });

      // Return updated submission
      const updatedSubmission = await manager.findOne(QuizSubmission, {
        where: { id: submission.id },
        relations: { quiz: true, answers: { question: true } },
      });

      if (!updatedSubmission) {
        throw new NotFoundException('Submission not found after update');
      }

      return updatedSubmission;
    });

    if (!result) {
      throw new NotFoundException('Failed to process quiz submission');
    }

    return result;
  }

  async getSubmission(
    submissionId: string,
    user: User,
  ): Promise<QuizSubmission> {
    const submission = await this.submissionRepository.findOne({
      where: { id: submissionId },
      relations: {
        quiz: { module: { course: true } },
        student: true,
        answers: { question: { options: true } },
      },
    });

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    // Check permissions
    if (user.role === Role.STUDENT && submission.studentId !== user.id) {
      throw new ForbiddenException('Access denied');
    }

    if (
      user.role === Role.TEACHER &&
      submission.quiz.module.course.instructorId !== user.id
    ) {
      throw new ForbiddenException('Access denied');
    }

    return submission;
  }

  async getMySubmissions(
    quizId: string,
    user: User,
  ): Promise<QuizSubmission[]> {
    if (user.role !== Role.STUDENT) {
      throw new ForbiddenException(
        'Only students can access their submissions',
      );
    }

    return this.submissionRepository.find({
      where: { quizId, studentId: user.id },
      relations: { quiz: true },
      order: { attemptNumber: 'DESC' },
    });
  }

  async getAllSubmissions(
    quizId: string,
    user: User,
  ): Promise<QuizSubmission[]> {
    const quiz = await this.quizRepository.findOne({
      where: { id: quizId },
      relations: { module: { course: true } },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    // Check permissions - only instructors and admins can see all submissions
    if (
      ![Role.SUPER_ADMIN, Role.ADMIN].includes(user.role) &&
      (user.role !== Role.TEACHER ||
        quiz.module.course.instructorId !== user.id)
    ) {
      throw new ForbiddenException(
        'You do not have permission to view submissions for this quiz',
      );
    }

    return this.submissionRepository.find({
      where: { quizId },
      relations: { student: true },
      order: { createdAt: 'DESC' },
    });
  }

  async publishQuiz(quizId: string, user: User): Promise<Quiz> {
    const quiz = await this.quizRepository.findOne({
      where: { id: quizId },
      relations: { module: { course: true }, questions: true },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    // Check permissions
    if (
      ![Role.SUPER_ADMIN, Role.ADMIN].includes(user.role) &&
      (user.role !== Role.TEACHER ||
        quiz.module.course.instructorId !== user.id)
    ) {
      throw new ForbiddenException(
        'You do not have permission to publish this quiz',
      );
    }

    if (quiz.questions.length === 0) {
      throw new BadRequestException('Cannot publish quiz without questions');
    }

    // Validate that question marks sum equals quiz total marks
    const questionsMarksSum = quiz.questions
      .filter((q) => q.isActive !== false) // Only count active questions
      .reduce((sum, q) => sum + Number(q.marks), 0);

    const quizTotalMarks = Number(quiz.totalMarks);

    // Use a small tolerance for decimal comparison (0.01 for 2 decimal places)
    const tolerance = 0.01;
    const marksDifference = Math.abs(questionsMarksSum - quizTotalMarks);

    if (marksDifference > tolerance) {
      throw new BadRequestException(
        `Cannot publish quiz. Questions total marks (${questionsMarksSum.toFixed(2)}) must equal quiz total marks (${quizTotalMarks.toFixed(2)})`,
      );
    }

    await this.quizRepository.update(quizId, { isPublished: true });
    return this.findOne(quizId, user);
  }

  async deleteQuestion(
    questionId: string,
    user: User,
  ): Promise<{
    message: string;
    deletedQuestion: { id: string; questionText: string };
  }> {
    // Get question with quiz and course relations for permission checking
    const question = await this.questionRepository.findOne({
      where: { id: questionId, isActive: true },
      relations: {
        quiz: {
          module: { course: true },
        },
        options: true,
      },
    });

    if (!question) {
      throw new NotFoundException('Question not found or already deleted');
    }

    // Check permissions - only quiz creators/instructors and admins can delete questions
    if (
      ![Role.SUPER_ADMIN, Role.ADMIN].includes(user.role) &&
      (user.role !== Role.TEACHER ||
        question.quiz.module.course.instructorId !== user.id)
    ) {
      throw new ForbiddenException(
        'You do not have permission to delete questions from this quiz',
      );
    }

    // Check if quiz is published - cannot delete questions from published quizzes
    if (question.quiz.isPublished) {
      throw new BadRequestException(
        'Cannot delete questions from a published quiz',
      );
    }

    // Use transaction to ensure data consistency
    const result = await this.dataSource.transaction(async (manager) => {
      // Store question info for response
      const deletedQuestionInfo = {
        id: question.id,
        questionText: question.questionText,
      };

      // Soft delete the question (set isActive to false)
      await manager.update(QuizQuestion, questionId, {
        isActive: false,
      });

      // Soft delete all associated options
      await manager.update(QuestionOption, { questionId }, { isActive: false });

      // Update sequence numbers for remaining questions
      const remainingQuestions = await manager.find(QuizQuestion, {
        where: {
          quizId: question.quizId,
          isActive: true,
        },
        order: { sequenceNumber: 'ASC' },
      });

      // Filter and update questions that come after the deleted one
      const questionsToUpdate = remainingQuestions.filter(
        (q) => q.sequenceNumber > question.sequenceNumber,
      );

      for (const q of questionsToUpdate) {
        await manager.update(QuizQuestion, q.id, {
          sequenceNumber: q.sequenceNumber - 1,
        });
      }

      return deletedQuestionInfo;
    });

    return {
      message: 'Question and its options deleted successfully',
      deletedQuestion: result,
    };
  }

  async restoreQuestion(
    questionId: string,
    user: User,
  ): Promise<{
    message: string;
    restoredQuestion: { id: string; questionText: string };
  }> {
    // Get question even if inactive for restoration
    const question = await this.questionRepository.findOne({
      where: { id: questionId },
      relations: {
        quiz: {
          module: { course: true },
        },
        options: true,
      },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    if (question.isActive) {
      throw new BadRequestException('Question is already active');
    }

    // Check permissions
    if (
      ![Role.SUPER_ADMIN, Role.ADMIN].includes(user.role) &&
      (user.role !== Role.TEACHER ||
        question.quiz.module.course.instructorId !== user.id)
    ) {
      throw new ForbiddenException(
        'You do not have permission to restore questions in this quiz',
      );
    }

    // Check if quiz is published
    if (question.quiz.isPublished) {
      throw new BadRequestException(
        'Cannot restore questions in a published quiz',
      );
    }

    // Use transaction for restoration
    const result = await this.dataSource.transaction(async (manager) => {
      // Store question info for response
      const restoredQuestionInfo = {
        id: question.id,
        questionText: question.questionText,
      };

      // Restore the question
      await manager.update(QuizQuestion, questionId, {
        isActive: true,
      });

      // Restore all associated options
      await manager.update(QuestionOption, { questionId }, { isActive: true });

      return restoredQuestionInfo;
    });

    return {
      message: 'Question and its options restored successfully',
      restoredQuestion: result,
    };
  }

  async permanentDeleteQuestion(
    questionId: string,
    user: User,
  ): Promise<{
    message: string;
    deletedQuestion: { id: string; questionText: string };
  }> {
    // Only super admins can permanently delete
    if (user.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException(
        'Only super administrators can permanently delete questions',
      );
    }

    const question = await this.questionRepository.findOne({
      where: { id: questionId },
      relations: {
        quiz: {
          module: { course: true },
        },
        options: true,
      },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    // Check if quiz is published
    if (question.quiz.isPublished) {
      throw new BadRequestException(
        'Cannot permanently delete questions from a published quiz',
      );
    }

    // Use transaction for permanent deletion
    const result = await this.dataSource.transaction(async (manager) => {
      const deletedQuestionInfo = {
        id: question.id,
        questionText: question.questionText,
      };

      // Permanently delete all options first (due to foreign key constraints)
      await manager.delete(QuestionOption, { questionId });

      // Permanently delete the question
      await manager.delete(QuizQuestion, questionId);

      // Update sequence numbers for remaining questions
      const remainingQuestions = await manager.find(QuizQuestion, {
        where: {
          quizId: question.quizId,
        },
        order: { sequenceNumber: 'ASC' },
      });

      // Filter and update questions that come after the deleted one
      const questionsToUpdate = remainingQuestions.filter(
        (q) => q.sequenceNumber > question.sequenceNumber,
      );

      for (const q of questionsToUpdate) {
        await manager.update(QuizQuestion, q.id, {
          sequenceNumber: q.sequenceNumber - 1,
        });
      }

      return deletedQuestionInfo;
    });

    return {
      message: 'Question and its options permanently deleted',
      deletedQuestion: result,
    };
  }

  private async getNextSequenceNumber(quizId: string): Promise<number> {
    const count = await this.questionRepository.count({ where: { quizId } });
    return count + 1;
  }
}
