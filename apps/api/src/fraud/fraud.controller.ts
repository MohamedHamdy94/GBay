import { Controller, Get, Post, Patch, Body, Param, UseGuards, Query, Request, Inject } from '@nestjs/common';
import { AdminGuard } from '../admin/admin.guard';
import { BearerAuthGuard } from '../seller/bearer-auth.guard';
import { FraudService } from './fraud.service';
import { CreateFraudRuleDto, ResolveFraudSignalDto } from './dto';

@Controller('admin/fraud')
@UseGuards(BearerAuthGuard, AdminGuard)
export class FraudController {
  constructor(@Inject(FraudService) private readonly fraudService: FraudService) {
    console.log('FraudController initialized, service:', !!this.fraudService);
  }

  @Get('signals')
  async getSignals(@Query() query: any) {
    return this.fraudService.getSignals(query);
  }

  @Patch('signals/:id/resolve')
  async resolveSignal(
    @Param('id') id: string,
    @Body() body: ResolveFraudSignalDto,
    @Request() req: any
  ) {
    const userId = req.user.id;
    return this.fraudService.resolveSignal(id, userId, body);
  }

  @Get('rules')
  async getRules() {
    return this.fraudService.getRules();
  }

  @Post('rules')
  async createRule(@Body() body: CreateFraudRuleDto) {
    return this.fraudService.createRule(body);
  }

  @Patch('rules/:id')
  async updateRule(@Param('id') id: string, @Body() body: any) {
    return this.fraudService.updateRule(id, body);
  }
}
