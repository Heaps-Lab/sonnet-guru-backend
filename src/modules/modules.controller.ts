/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFile,
  Res,
  Req,
  StreamableFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
  ApiHeader,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response, Request } from 'express';
import { createReadStream, statSync } from 'fs';
import { ModulesService } from './modules.service';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { UploadVideoDto } from './dto/upload-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { UploadSheetDto } from './dto/upload-sheet.dto';
import { CompleteModuleDto } from './dto/complete-module.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { Role } from '../common/enums/role.enum';

@ApiTags('Modules')
@Controller('courses/:courseId/modules')
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  @ApiBearerAuth()
  @ApiParam({
    name: 'courseId',
    description: 'Course ID (for route compatibility)',
  })
  @ApiOperation({ summary: 'Create a new module' })
  @ApiResponse({ status: 201, description: 'Module created successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  create(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() createModuleDto: CreateModuleDto,
    @CurrentUser() user: User,
  ) {
    return this.modulesService.create(createModuleDto, user);
  }

  @Get()
  @ApiParam({
    name: 'courseId',
    description: 'Course ID (deprecated - modules now belong to subjects)',
  })
  @ApiOperation({
    summary: 'Get all modules - Use /subjects/:subjectId/modules instead',
  })
  @ApiResponse({ status: 200, description: 'Modules retrieved successfully' })
  findAll(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @CurrentUser() user?: User,
  ) {
    // This endpoint is kept for backward compatibility
    // but should be deprecated in favor of /subjects/:subjectId/modules
    throw new Error(
      'Please use GET /subjects/:subjectId to get modules by subject',
    );
  }

  @Get(':id')
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiParam({ name: 'id', description: 'Module ID' })
  @ApiOperation({ summary: 'Get module by ID' })
  @ApiResponse({ status: 200, description: 'Module retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Module not found' })
  findOne(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user?: User,
  ) {
    return this.modulesService.findOne(id, user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  @ApiBearerAuth()
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiParam({ name: 'id', description: 'Module ID' })
  @ApiOperation({ summary: 'Update module' })
  @ApiResponse({ status: 200, description: 'Module updated successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  update(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateModuleDto: UpdateModuleDto,
    @CurrentUser() user: User,
  ) {
    return this.modulesService.update(id, updateModuleDto, user);
  }

  @Post(':id/videos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('video'))
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiParam({ name: 'id', description: 'Module ID' })
  @ApiOperation({
    summary: 'Upload video to module',
    description:
      'Upload a video file or provide a direct video URL. Either file or videoUrl must be provided.',
  })
  @ApiResponse({ status: 201, description: 'Video uploaded successfully' })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - either file or videoUrl required, or duplicate sequence',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  uploadVideo(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('id', ParseUUIDPipe) moduleId: string,
    @Body() uploadVideoDto: UploadVideoDto,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: User,
  ) {
    return this.modulesService.uploadVideo(
      moduleId,
      uploadVideoDto,
      file,
      user,
    );
  }

  @Patch('videos/:videoId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('video'))
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiParam({ name: 'videoId', description: 'Video ID' })
  @ApiOperation({
    summary: 'Update video in module',
    description:
      'Update video metadata, replace with new file, or change to direct URL.',
  })
  @ApiResponse({ status: 200, description: 'Video updated successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - duplicate sequence or invalid data',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Video not found' })
  updateVideo(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('videoId', ParseUUIDPipe) videoId: string,
    @Body() updateVideoDto: UpdateVideoDto,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: User,
  ) {
    return this.modulesService.updateVideo(videoId, updateVideoDto, file, user);
  }

  @Post(':id/sheets')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('sheet'))
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiParam({ name: 'id', description: 'Module ID' })
  @ApiOperation({ summary: 'Upload sheet to module' })
  @ApiResponse({ status: 201, description: 'Sheet uploaded successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  uploadSheet(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('id', ParseUUIDPipe) moduleId: string,
    @Body() uploadSheetDto: UploadSheetDto,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: User,
  ) {
    return this.modulesService.uploadSheet(
      moduleId,
      uploadSheetDto,
      file,
      user,
    );
  }

  @Patch(':id/complete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  @ApiBearerAuth()
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiParam({ name: 'id', description: 'Module ID' })
  @ApiOperation({ summary: 'Mark module as completed' })
  @ApiResponse({ status: 200, description: 'Module completed successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - cannot complete module without videos',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  completeModule(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('id', ParseUUIDPipe) moduleId: string,
    @Body() completeModuleDto: CompleteModuleDto,
    @CurrentUser() user: User,
  ) {
    return this.modulesService.completeModule(
      moduleId,
      completeModuleDto,
      user,
    );
  }

  @Delete('videos/:videoId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  @ApiBearerAuth()
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiParam({ name: 'videoId', description: 'Video ID' })
  @ApiOperation({ summary: 'Delete video from module' })
  @ApiResponse({ status: 200, description: 'Video deleted successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Video not found' })
  deleteVideo(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('videoId', ParseUUIDPipe) videoId: string,
    @CurrentUser() user: User,
  ) {
    return this.modulesService.deleteVideo(videoId, user);
  }

  @Delete('sheets/:sheetId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  @ApiBearerAuth()
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiParam({ name: 'sheetId', description: 'Sheet ID' })
  @ApiOperation({ summary: 'Delete sheet from module' })
  @ApiResponse({ status: 200, description: 'Sheet deleted successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Sheet not found' })
  deleteSheet(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('sheetId', ParseUUIDPipe) sheetId: string,
    @CurrentUser() user: User,
  ) {
    return this.modulesService.deleteSheet(sheetId, user);
  }
}

// Separate controller for file serving
@ApiTags('Files')
@Controller()
export class FilesController {
  constructor(private readonly modulesService: ModulesService) {}

  @Get('videos/:fileName')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.STUDENT)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Stream video file (supports HTTP Range requests for seeking)',
  })
  @ApiParam({ name: 'fileName', description: 'Video file name' })
  @ApiHeader({
    name: 'Range',
    description: 'Byte range for partial content, e.g. bytes=0-1023',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Full video file streamed successfully',
  })
  @ApiResponse({
    status: 206,
    description: 'Partial video content streamed successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - token required' })
  @ApiResponse({ status: 403, description: 'Access denied - not enrolled' })
  @ApiResponse({ status: 404, description: 'Video not found' })
  async streamVideo(
    @Param('fileName') fileName: string,
    @CurrentUser() user: User,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { filePath, mimeType } = await this.modulesService.getVideo(
      fileName,
      user,
    );

    const { size } = statSync(filePath);
    const range = req.headers.range;

    // Memory optimization: Set smaller default chunk size for better memory usage
    const DEFAULT_CHUNK_SIZE = 1024 * 1024; // 1MB chunks instead of full file

    // No Range header: provide chunked streaming instead of full file
    if (!range) {
      res.set({
        'Content-Type': mimeType,
        'Content-Length': size.toString(),
        'Accept-Ranges': 'bytes',
        'Content-Disposition': `inline; filename="${fileName}"`,
        'Cache-Control': 'public, max-age=3600', // 1 hour cache
        Connection: 'keep-alive',
      });

      // Stream in chunks to reduce memory usage
      return new StreamableFile(
        createReadStream(filePath, {
          highWaterMark: DEFAULT_CHUNK_SIZE, // Limit buffer size
        }),
      );
    }

    // Parse "bytes=start-end" and clamp to file size
    const match = /bytes=(\d*)-(\d*)/.exec(range);
    const start = match && match[1] ? parseInt(match[1], 10) : 0;
    let end = match && match[2] ? parseInt(match[2], 10) : size - 1;

    // Memory optimization: Limit chunk size to prevent memory spikes
    const MAX_CHUNK_SIZE = 2 * 1024 * 1024; // 2MB max per request
    if (end - start > MAX_CHUNK_SIZE) {
      end = start + MAX_CHUNK_SIZE - 1;
    }

    const safeStart = Math.max(0, Math.min(start, size - 1));
    const safeEnd = Math.max(safeStart, Math.min(end, size - 1));
    const chunkSize = safeEnd - safeStart + 1;

    res.status(206);
    res.set({
      'Content-Range': `bytes ${safeStart}-${safeEnd}/${size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize.toString(),
      'Content-Type': mimeType,
      'Content-Disposition': `inline; filename="${fileName}"`,
      'Cache-Control': 'public, max-age=3600', // Cache video chunks
      Connection: 'keep-alive',
    });

    return new StreamableFile(
      createReadStream(filePath, {
        start: safeStart,
        end: safeEnd,
        highWaterMark: Math.min(chunkSize, DEFAULT_CHUNK_SIZE), // Efficient buffering
      }),
    );
  }

  @Get('sheets/:fileName')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.STUDENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Download sheet file' })
  @ApiParam({ name: 'fileName', description: 'Sheet file name' })
  @ApiResponse({
    status: 200,
    description: 'Sheet file downloaded successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - token required' })
  @ApiResponse({ status: 404, description: 'Sheet not found' })
  @ApiResponse({
    status: 403,
    description: 'Download not allowed or not enrolled',
  })
  async downloadSheet(
    @Param('fileName') fileName: string,
    @CurrentUser() user: User,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { filePath, mimeType } = await this.modulesService.getSheet(
      fileName,
      user,
    );

    const file = createReadStream(filePath);
    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${fileName}"`,
    });

    return new StreamableFile(file);
  }
}
