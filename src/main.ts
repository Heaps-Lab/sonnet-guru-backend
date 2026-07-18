/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global prefix for API versioning
  const apiPrefix = configService.get('API_PREFIX') || 'api/v1';
  app.setGlobalPrefix(apiPrefix);

  // Enable CORS
  app.enableCors({
    origin: configService.get('CORS_ORIGIN') || '*',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger/OpenAPI Configuration
  const config = new DocumentBuilder()
    .setTitle('LMS Platform API')
    .setDescription(
      'Complete API documentation for the Learning Management System Platform. ' +
        'This API provides endpoints for user authentication, course management, ' +
        'module content delivery, quiz assessments, and payment processing.',
    )
    .setVersion('1.0.0')
    .addTag(
      'Authentication',
      'User authentication and device session management',
    )
    .addTag('Users', 'User management endpoints')
    .addTag('Courses', 'Course creation and management')
    .addTag('Modules', 'Course module and content management')
    .addTag('Quizzes', 'Quiz and assessment management')
    .addTag('Payments', 'Payment claims and enrollment processing')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addServer(
      `http://localhost:${configService.get('PORT') || 3000}`,
      'Local Development',
    )
    .addServer('https://api.yourdomain.com', 'Production Server')
    .setContact(
      'LMS Platform Support',
      'https://yourdomain.com',
      'admin@lmsplatform.com',
    )
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
    customSiteTitle: 'LMS Platform API Docs',
    customfavIcon: 'https://nestjs.com/img/logo-small.svg',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  const port = configService.get('PORT') || 3000;
  await app.listen(port);

  console.log(
    `🚀 LMS Platform API running on: http://localhost:${port}/${apiPrefix}`,
  );
  console.log(
    `📚 API Documentation available at: http://localhost:${port}/${apiPrefix}/docs`,
  );
}
bootstrap();
