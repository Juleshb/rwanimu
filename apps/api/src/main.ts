import './load-env';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
async function bootstrap(){const app=await NestFactory.create(AppModule);app.enableCors({origin:true,credentials:true});app.setGlobalPrefix('api');const port=Number(process.env.PORT||3000);if(process.env.NODE_ENV==='production')await app.listen(port,'127.0.0.1');else await app.listen(port);} bootstrap();
