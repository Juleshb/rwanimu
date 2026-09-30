import { Module } from '@nestjs/common';
import { MessagingController } from './messaging.controller';
import { MessagingService } from './messaging.service';
import { MessagingProviderService } from './messaging-provider.service';
@Module({controllers:[MessagingController],providers:[MessagingService,MessagingProviderService]}) export class MessagingModule {}
