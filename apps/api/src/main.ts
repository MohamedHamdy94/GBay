import 'reflect-metadata';
import { otelSDK } from './tracing';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  // Start OTel SDK
  await otelSDK.start();

  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  app.use(cookieParser());
  app.setGlobalPrefix('v1');
  app.useGlobalPipes(new ValidationPipe({ 
    whitelist: true, 
    forbidNonWhitelisted: true, 
    transform: true,
    transformOptions: { enableImplicitConversion: true }
  }));
  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  console.log(`GBay API listening on http://localhost:${port}/v1`);
}

void bootstrap();
