import { Controller, Get, Post, Patch, Param, Body, UseGuards, Request, Inject } from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { CreateThreadDto, SendMessageDto } from './dto';
import { BearerAuthGuard } from '../seller/bearer-auth.guard';

@Controller('messages')
@UseGuards(BearerAuthGuard)
export class MessagingController {
  constructor(
    @Inject(MessagingService)
    private readonly messagingService: MessagingService,
  ) {}

  @Post('threads')
  async createThread(@Body() dto: CreateThreadDto, @Request() req: any) {
    return this.messagingService.createThread(dto, req.user.id);
  }

  @Get('threads')
  async getMyThreads(@Request() req: any) {
    return this.messagingService.getMyThreads(req.user.id);
  }

  @Get('threads/:id')
  async getThreadDetails(@Param('id') id: string, @Request() req: any) {
    return this.messagingService.getThreadDetails(id, req.user.id);
  }

  @Post('threads/:id/messages')
  async sendMessage(@Param('id') id: string, @Body() dto: SendMessageDto, @Request() req: any) {
    return this.messagingService.sendMessage(id, req.user.id, dto.body);
  }

  @Patch('threads/:id/close')
  async closeThread(@Param('id') id: string, @Request() req: any) {
    return this.messagingService.closeThread(id, req.user.id);
  }
}
