import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global prefix for API versioning
  app.setGlobalPrefix(configService.get('API_PREFIX') || 'api/v1');

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

  const port = configService.get('PORT') || 3000;
  await app.listen(port);

  console.log(
    `🚀 LMS Platform API running on: http://localhost:${port}/${configService.get('API_PREFIX') || 'api/v1'}`,
  );
}
bootstrap();
